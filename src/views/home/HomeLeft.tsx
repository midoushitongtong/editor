import React from 'react';
import FileSearch from '../../components/file-search/FileSearch';
import FileList from '../../components/file-list/FileList';
import { FileListItem } from '../../apis/file/types';
import './HomeLeft.scss';
import FileBottomButton from '../../components/file-bottom-button/FileBottomButton';
import { faPlus, faFileImport } from '@fortawesome/free-solid-svg-icons';
import {
  saveFileToStore,
  renameFileToStore,
  saveFileListToStore,
  deleteFileToStore,
  getFileFromStore,
  checkFileExistsFromStore,
  readFile,
  getQinNiuConfig,
  getFilePathFromStore,
} from '../../utils/file';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { notification } from 'antd';
import useWebContentsListener from '../../hooks/useWebContentsListener';
import { createQinNiuManageWithStore } from '../../utils/qin-niu';
import electron from 'electron';

const remote = window.require('@electron/remote');

// components props
type Props = {
  fileList: FileListItem[];
  openFileIdList: string[];
  closeTab: (id: string) => void;
  onChangeFileList: (fileList: FileListItem[]) => void;
  onChangeActiveFileId: (activeFileId: string) => void;
  onChangeOpenFileIdList: (openFileIdList: string[]) => void;
  createNewFile: () => void;
  uploadFileToQinNiu: (fileListItem: FileListItem) => void;
  deleteFileToQinNiu: (fileListItem: FileListItem) => void;
};

const HomeLeft = (props: Props) => {
  const {
    fileList,
    openFileIdList,
    closeTab,
    onChangeFileList,
    onChangeActiveFileId,
    onChangeOpenFileIdList,
    createNewFile,
    uploadFileToQinNiu,
    deleteFileToQinNiu,
  } = props;

  // search keyword
  const [searchKeyword, setSearchKeyword] = React.useState('');

  // search file list
  const searchFileList = React.useMemo(() => {
    if (searchKeyword) {
      return fileList.filter((item) => item.title.includes(searchKeyword));
    }
    return fileList;
  }, [fileList, searchKeyword]);

  // handle file click
  const handleFileClick = React.useCallback(
    async (id: string) => {
      onChangeActiveFileId(id);

      if (!openFileIdList.includes(id)) {
        onChangeOpenFileIdList([...openFileIdList, id]);
      }

      // 获取文件内容 (只获取一次, 已经获取过了就不需要再次获取)
      const fileListItem = fileList.find((item) => item.id === id);
      if (fileListItem && !fileListItem.isLoaded) {
        // 显示 loading
        electron.ipcRenderer.emit('toggle-loading', true);

        // 新的文件列表项 (临时的对象, 对象中的内容会被修改)
        const newFileListiItem: FileListItem = {
          ...fileListItem,
          isLoaded: true,
        };

        // 七牛云配置
        const qinNiuConfig = await getQinNiuConfig();
        if (qinNiuConfig.qinNiuIsAutoSync && qinNiuConfig.qinNiuIsConfig && fileListItem.fileKey) {
          // 已开启同步, 读取服务器文件
          const qinNiuManage = await createQinNiuManageWithStore();
          try {
            const result = await qinNiuManage.getFileStat(fileListItem.fileKey);
            const serverUpdatedTime = Math.round(result.putTime / 10000);
            const localUpdatedTime = fileListItem.lastSyncedAt;
            if (!localUpdatedTime || serverUpdatedTime > localUpdatedTime) {
              // 服务器文件比本地的文件要新, 下载服务器文件到本地
              await qinNiuManage.downloadFile(
                fileListItem.fileKey,
                await getFilePathFromStore(fileListItem.title)
              );
              // 更新文件为已同步
              newFileListiItem.isSynced = true;
              // 更新文件最新同步时间
              newFileListiItem.lastSyncedAt = new Date().getTime();
              console.log(`云同步 - 文件下载完成: ${fileListItem.title}.md`);
            } else {
              console.log(`云同步 - 服务器文件比本地文件旧无需更新: ${fileListItem.title}.md`);
            }
          } catch (error) {
            console.log(`云同步 - 此文件暂未同步到七牛云: ${fileListItem.title}`);
          }
        }

        // 更新文件内容
        newFileListiItem.body = await getFileFromStore(fileListItem);

        // 新的文件列表
        const newFileList = fileList.map((item) => {
          if (item.id === id) {
            return {
              ...newFileListiItem,
            };
          }
          return item;
        });
        onChangeFileList(newFileList);
        await saveFileListToStore(newFileList);

        // 隐藏 loading
        electron.ipcRenderer.emit('toggle-loading', false);
      }
    },
    [fileList, onChangeActiveFileId, onChangeFileList, onChangeOpenFileIdList, openFileIdList]
  );

  // handle file save edit
  const handleFileSaveEdit = React.useCallback(
    async (fileListItem: FileListItem, isNew: boolean) => {
      try {
        const newFileList = fileList.map((item) => {
          if (item.id === fileListItem.id) {
            return {
              ...fileListItem,
            };
          }
          return item;
        });

        if (isNew) {
          // 创建新文件
          await saveFileToStore(fileListItem);
          // 保存文件列表
          await saveFileListToStore(newFileList);
          onChangeFileList(newFileList);
        } else {
          // 重命名文件
          // 先拿到旧文件
          const oldFileListItem = fileList.find((item) => item.id === fileListItem.id);
          if (oldFileListItem) {
            // 重命名文件
            await renameFileToStore(oldFileListItem, fileListItem);
            // 保存文件列表
            await saveFileListToStore(newFileList);
            onChangeFileList(newFileList);
            // 云同步
            // 七牛云配置
            const qinNiuConfig = await getQinNiuConfig();
            if (qinNiuConfig.qinNiuIsAutoSync) {
              await uploadFileToQinNiu(fileListItem);
            }
          } else {
            console.log(`未找到旧文件, id: ${fileListItem.id}`);
          }
        }
      } catch (error) {
        console.log(error);
      }
    },
    [fileList, onChangeFileList, uploadFileToQinNiu]
  );

  // handle file delete
  const handleFileDelete = React.useCallback(
    async (id: string) => {
      const fileListItem = fileList.find((item) => item.id === id);
      const newFileList = fileList.filter((item) => item.id !== id);

      if (fileListItem) {
        // 加 isNew 判断, 不是新文件才进行 store 操作
        if (!fileListItem.isNew) {
          // 删除文件
          await deleteFileToStore(fileListItem);
          // 保存文件列表
          await saveFileListToStore(newFileList);
          // 云同步
          // 七牛云配置
          const qinNiuConfig = await getQinNiuConfig();
          if (qinNiuConfig.qinNiuIsAutoSync) {
            await deleteFileToQinNiu(fileListItem);
          }
        }

        onChangeFileList(newFileList);
        closeTab(id);
      }
    },
    [closeTab, deleteFileToQinNiu, fileList, onChangeFileList]
  );

  // 导入文件
  const handleImportFile = React.useCallback(async () => {
    try {
      const result = await remote.dialog.showOpenDialog({
        title: '请选择需要导入的 markdown 文件',
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Markdown files', extensions: ['md'] }],
      });

      if (!result.canceled) {
        // 过滤 path 已经存在的文件不能在导入
        const filterFilePaths: string[] = [];
        for await (const item of result.filePaths) {
          const fileName = path.basename(item, path.extname(item));
          const exists = await checkFileExistsFromStore(fileName);
          if (exists) {
            notification.error({
              message: `此文件已存在: ${fileName}`,
              description: '请更换其他文件名称',
              duration: 3,
            });
          } else {
            filterFilePaths.push(item);
          }
        }

        // 为什么要加 > 0 判断
        // 假如一次打开 2 个文件选择 modal 后者可能会覆盖前者 (第 1 个 modal 保存后的 fileList 第 2 个 modal 无法获取最新的 fileList)
        if (filterFilePaths.length > 0) {
          // 组成需要导入的文件信息
          const importFileList: FileListItem[] = [];
          for await (const item of filterFilePaths) {
            const importFileListItem: FileListItem = {
              id: uuidv4(),
              title: path.basename(item, path.extname(item)),
              body: await readFile(item),
              createdAt: new Date().getTime(),
            };
            importFileList.push(importFileListItem);
          }

          // 创建新文件
          for await (const item of importFileList) {
            await saveFileToStore(item);
          }

          const newFileList = [...fileList, ...importFileList];

          // 保存文件列表
          await saveFileListToStore(newFileList);
          onChangeFileList(newFileList);

          remote.dialog.showMessageBox({
            type: 'info',
            title: '我的云文档',
            message: `成功导入 ${importFileList.length} 个文件`,
          });
        }
      }
    } catch (error) {
      console.log(error);
    }
  }, [fileList, onChangeFileList]);

  useWebContentsListener({
    'import-file': handleImportFile,
  });

  return (
    <nav className="home-left">
      <div className="home-left-content">
        {/* file search */}
        <FileSearch
          title="我的云文档"
          onFileSearch={(keyword: string) => {
            setSearchKeyword(() => keyword);
          }}
        />

        {/* file list */}
        <FileList
          fileList={searchFileList}
          onFileClick={handleFileClick}
          onFileSaveEdit={handleFileSaveEdit}
          onFileDelete={handleFileDelete}
        />
      </div>

      {/* file bottom button */}
      <div className="home-left-bottom">
        <FileBottomButton icon={faPlus} text="新建" variant="primary" onClick={createNewFile} />
        <FileBottomButton
          icon={faFileImport}
          text="导入"
          variant="success"
          onClick={handleImportFile}
        />
      </div>
    </nav>
  );
};

export default HomeLeft;
