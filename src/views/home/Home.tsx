import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { FileListItem } from '../../apis/file/types';
import useEffectOnce from '../../hooks/useEffectOnce';
import './Home.scss';
import HomeLeft from './HomeLeft';
import HomeRight from './HomeRight';
import { v4 as uuidv4 } from 'uuid';
import {
  getFileFromStore,
  getFileListFromStore,
  getFilePathFromStore,
  getQinNiuConfig,
  saveFileListToStore,
  saveFileToStore,
} from '../../utils/file';
import useWebContentsListener from '../../hooks/useWebContentsListener';
import { createQinNiuManageWithStore } from '../../utils/qin-niu';
import { notification } from 'antd';
import electron from 'electron';

const Home = () => {
  const [initDataLoading, setInitDataLoading] = React.useState(true);
  // 文件列表
  const [fileList, setFileList] = React.useState<FileListItem[]>([]);
  // 已打开的文件列表 id
  const [openFileIdList, setOpenFileIdList] = React.useState<string[]>([]);
  // 正在编辑的文件 id
  const [activeFileId, setActiveFileId] = React.useState('');
  // 未保存的文件列表 id
  const [unsaveFileIdList, setUnsaveFileIdList] = React.useState<string[]>([]);
  // 正在编辑的文件
  const activeFile = React.useMemo(() => {
    return fileList.find((item) => item.id === activeFileId);
  }, [activeFileId, fileList]);

  useWebContentsListener({
    'qin-niu-upload-all-file': async () => {
      // 显示 loading
      electron.ipcRenderer.emit('toggle-loading', true);

      try {
        const uploadPromiseArr: Promise<void>[] = [];

        setFileList((previous) => {
          previous.forEach((item) => {
            uploadPromiseArr.push(uploadFileToQinNiu(item));
          });
          return previous;
        });

        await Promise.all(uploadPromiseArr);

        notification.success({
          message: '云同步 - 文件已同步完成',
          duration: 3,
        });
      } catch (error) {
        console.log(error);

        notification.error({
          message: '云同步 - 文件同步失败, 请检查七牛云参数是否正确!',
          description: JSON.stringify(error),
          // 永久显示不会自动关闭
          duration: 0,
        });
      } finally {
        // 隐藏 loading
        electron.ipcRenderer.emit('toggle-loading', false);
      }
    },
    'qin-niu-download-all-file': async () => {
      // 显示 loading
      electron.ipcRenderer.emit('toggle-loading', true);

      try {
        await dwonloadFileFromQinNiu();

        notification.success({
          message: '云同步 - 文件已下载完成',
          duration: 3,
        });
      } catch (error) {
        console.log(error);

        notification.error({
          message: '云同步 - 文件下载失败, 请检查七牛云参数是否正确!',
          description: JSON.stringify(error),
          // 永久显示不会自动关闭
          duration: 0,
        });
      } finally {
        // 隐藏 loading
        electron.ipcRenderer.emit('toggle-loading', false);
      }
    },
  });

  // init data
  const initData = React.useCallback(async () => {
    const fileList = await getFileListFromStore();

    setFileList(() => fileList);
    setInitDataLoading(false);
  }, []);

  // close tab
  const closeTab = React.useCallback(
    (id: string) => {
      const newOpenFileIdList = openFileIdList.filter((item) => item !== id);
      setOpenFileIdList(newOpenFileIdList);

      // 如果关闭的是当前正在编辑的文件
      // 将正在编辑的文件切换到第 0 个
      if (activeFileId === id) {
        setActiveFileId(newOpenFileIdList[0]);
      }
    },
    [activeFileId, openFileIdList]
  );

  // create new file
  const createNewFile = React.useCallback(() => {
    const newId = uuidv4();

    const newFileList = [
      // 过滤新文件
      ...fileList.filter((item) => !item.isNew),
      {
        id: newId,
        title: '',
        body: '# 请输出 Markdown',
        createdAt: new Date().getTime(),
        isNew: true,
      },
    ];

    setFileList(() => newFileList);
  }, [fileList]);

  // 同步文件到云端
  const uploadFileToQinNiu = React.useCallback(async (fileListItem: FileListItem) => {
    // 七牛云配置
    const qinNiuConfig = await getQinNiuConfig();
    if (qinNiuConfig.qinNiuIsConfig) {
      // 显示 loading
      electron.ipcRenderer.emit('toggle-loading', true);

      // 同步文件到七牛云
      const qinNiuManage = await createQinNiuManageWithStore();
      try {
        // 删除旧文件
        if (fileListItem.fileKey) {
          try {
            await qinNiuManage.deleteFile(fileListItem.fileKey);
          } catch (error) {
            // 文件删除失败, 不需要处理
          }
        }
        // 上传新文件
        const fileKey = `${fileListItem.title}_${new Date().getTime()}.md`;
        await qinNiuManage.uploadFile(fileKey, await getFilePathFromStore(fileListItem.title));

        // 新的文件列表
        let newFileList: FileListItem[] = [];

        setFileList((previous) => {
          const newFileListTemp = previous.map((item) => {
            if (item.id === fileListItem.id) {
              return {
                ...item,
                fileKey,
                isSynced: true,
                lastSyncedAt: new Date().getTime(),
              };
            }

            return item;
          });
          newFileList = newFileListTemp;
          return newFileListTemp;
        });
        await saveFileListToStore(newFileList);

        console.log(`云同步 - 已上传文件: ${fileListItem.title}.md`);
      } catch (error) {
        console.log(error);

        notification.error({
          message: '云同步 - 上传文件失败, 请检查七牛云参数是否正确!',
          description: JSON.stringify(error),
          // 永久显示不会自动关闭
          duration: 0,
        });
      } finally {
        // 隐藏 loading
        electron.ipcRenderer.emit('toggle-loading', false);
      }
    }
  }, []);

  // 删除到云端
  const deleteFileToQinNiu = React.useCallback(async (fileListItem: FileListItem) => {
    // 七牛云配置
    const qinNiuConfig = await getQinNiuConfig();
    if (qinNiuConfig.qinNiuIsConfig) {
      // 显示 loading
      electron.ipcRenderer.emit('toggle-loading', true);

      // 删除文件到七牛云
      const qinNiuManage = await createQinNiuManageWithStore();
      try {
        // 删除文件
        if (fileListItem.fileKey) {
          await qinNiuManage.deleteFile(fileListItem.fileKey).catch(() => {
            // 文件删除失败, 不需要处理
          });
        }

        console.log(`云同步 - 已删除文件: ${fileListItem.title}.md`);
      } catch (error) {
        console.log(error);

        notification.error({
          message: '云同步 - 删除文件失败, 请检查七牛云参数是否正确!',
          description: JSON.stringify(error),
          // 永久显示不会自动关闭
          duration: 0,
        });
      } finally {
        // 隐藏 loading
        electron.ipcRenderer.emit('toggle-loading', false);
      }
    }
  }, []);

  // 从云端下载文件
  const dwonloadFileFromQinNiu = React.useCallback(async () => {
    // 七牛云配置
    const qinNiuConfig = await getQinNiuConfig();
    if (qinNiuConfig.qinNiuIsConfig) {
      // 显示 loading
      electron.ipcRenderer.emit('toggle-loading', true);

      // 获取文件列表从七牛云
      const qinNiuManage = await createQinNiuManageWithStore();
      try {
        // 文集列表
        const qinNiuFileList = await qinNiuManage.getFileList();

        const newFileList: FileListItem[] = [];

        for await (const item of qinNiuFileList.items) {
          const title = item.key.split('_').slice(0, -1).join('_');

          await qinNiuManage.downloadFile(item.key, await getFilePathFromStore(title));

          const newFileListItem = {
            id: uuidv4(),
            title,
            body: '',
            createdAt: new Date().getTime(),
            isNew: false,
            isLoaded: true,
            fileKey: item.key,
            isSynced: true,
            lastSyncedAt: new Date().getTime(),
          };
          newFileListItem.body = await getFileFromStore(newFileListItem);

          newFileList.push(newFileListItem);
        }

        setFileList(() => newFileList);
        await saveFileListToStore(newFileList);
      } catch (error) {
        console.log(error);

        notification.error({
          message: '云同步 - 获取文件列表失败, 请检查七牛云参数是否正确!',
          description: JSON.stringify(error),
          // 永久显示不会自动关闭
          duration: 0,
        });
      } finally {
        // 隐藏 loading
        electron.ipcRenderer.emit('toggle-loading', false);
      }
    }
  }, []);

  // 保存当前文件
  const saveCurrentFile = React.useCallback(async () => {
    try {
      if (activeFile) {
        await saveFileToStore(activeFile);

        setUnsaveFileIdList((previous) => previous.filter((item) => item !== activeFile.id));

        // 云同步
        // 七牛云配置
        const qinNiuConfig = await getQinNiuConfig();
        if (qinNiuConfig.qinNiuIsAutoSync) {
          await uploadFileToQinNiu(activeFile);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }, [activeFile, uploadFileToQinNiu]);

  useEffectOnce(() => {
    initData();
  });

  useWebContentsListener({
    'create-new-file': createNewFile,
    'save-edit-file': saveCurrentFile,
  });

  return (
    <div className="home">
      <Container fluid className="container">
        {!initDataLoading && (
          <Row>
            <Col xs={12} md={4} lg={3} className="left-panel">
              <HomeLeft
                fileList={fileList}
                openFileIdList={openFileIdList}
                closeTab={closeTab}
                onChangeFileList={(newFileList) => {
                  setFileList(() => newFileList);
                }}
                onChangeOpenFileIdList={(openFileIdList) => {
                  setOpenFileIdList(() => openFileIdList);
                }}
                onChangeActiveFileId={(activeFileId) => {
                  setActiveFileId(() => activeFileId);
                }}
                createNewFile={createNewFile}
                uploadFileToQinNiu={uploadFileToQinNiu}
                deleteFileToQinNiu={deleteFileToQinNiu}
              />
            </Col>
            <Col xs={12} md={8} lg={9} className="right-panel">
              <HomeRight
                fileList={fileList}
                activeFileId={activeFileId}
                openFileIdList={openFileIdList}
                unsaveFileIdList={unsaveFileIdList}
                closeTab={closeTab}
                onChangeFileList={(newFileList) => {
                  setFileList(() => newFileList);
                }}
                onChangeActiveFileId={(activeFileId) => {
                  setActiveFileId(() => activeFileId);
                }}
                onChangeUnsaveFileIdList={(unsaveFileIdList) => {
                  setUnsaveFileIdList(() => unsaveFileIdList);
                }}
              />
            </Col>
          </Row>
        )}
      </Container>
    </div>
  );
};

export default Home;
