import fs from 'fs';
import path from 'path';
import { FileListItem } from '../../apis/file/types';
import { AppConfig } from './types';

const remote = window.require('@electron/remote');

/**
 * 本文件导出应用中所有对文件操作的 api
 * 备注: 有些 api 可能是原封不动的调用 node.js 的 api, 例如 renameFile() 这个方法, 初期可能没用, 方便后续可扩展性
 */

// 读文件
export const readFile = (path: string) => {
  return fs.promises.readFile(path, {
    encoding: 'utf8',
  });
};

// 写文件
export const writeFile = (path: string, content: string) => {
  return fs.promises.writeFile(path, content, {
    encoding: 'utf8',
  });
};

// 重命名文件
export const renameFile = (path: string, newPath: string) => {
  return fs.promises.rename(path, newPath);
};

// 删除文件
export const deleteFile = (path: string) => {
  return fs.promises.unlink(path);
};

// userData 保存的路径
const getUserDataSaveLocation = async () => {
  const dir = path.join(remote.app.getPath('userData'), 'editor');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  return dir;
};

// file 保存的路径
export const getFileSaveLocation = async () => {
  // app config
  const appConfig = await getAppConfigFromStore();

  // user data save location
  const userDataSaveLocation = await getUserDataSaveLocation();

  const dir = appConfig.fileStorePath
    ? path.join(appConfig.fileStorePath)
    : path.join(userDataSaveLocation, 'file-list');

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  return dir;
};

// 从 store 获取文件列表
export const getFileListFromStore = async (): Promise<FileListItem[]> => {
  // user data save location
  const userDataSaveLocation = await getUserDataSaveLocation();
  // 文件列表保存路径
  const filePath = path.join(userDataSaveLocation, 'fileList.json');
  // 没有文件返回空数组
  if (!fs.existsSync(filePath)) {
    return [];
  }
  // 读取文件
  let result: any = await readFile(filePath);
  if (result) {
    try {
      result = JSON.parse(result);
    } catch (error) {
      result = [];
      console.log('文件列表数据解析失败');
    }
  } else {
    result = [];
  }
  return result as FileListItem[];
};

// 从 store 获取文件
export const getFileFromStore = async (fileListItem: FileListItem) => {
  // 文件路径
  const filePath = await getFilePathFromStore(fileListItem.title);

  if (!fs.existsSync(filePath)) {
    console.log(`未找到文件: ${filePath}`);
    return '';
  } else {
    const result = await readFile(filePath);

    return result;
  }
};

// 返回 store 中的 path
export const getFilePathFromStore = async (title: string) => {
  // file save location
  const fileSaveLocation = await getFileSaveLocation();
  // 文件路径
  const filePath = path.join(fileSaveLocation, `${title}.md`);

  return filePath;
};

// 从 store 判断文件是否已经存在
export const checkFileExistsFromStore = async (title: string) => {
  // 文件路径
  const filePath = await getFilePathFromStore(title);

  return fs.existsSync(filePath);
};

// 保存文件列表到 store
export const saveFileListToStore = async (fileList: FileListItem[]) => {
  // user data save location
  const userDataSaveLocation = await getUserDataSaveLocation();
  // 文件列表保存路径
  const filePath = path.join(userDataSaveLocation, 'fileList.json');
  const fileListWithStore = fileList.map((item) => ({
    id: item.id,
    title: item.title,
    createdAt: item.createdAt,
    fileKey: item.fileKey,
    isSynced: item.isSynced,
    lastSyncedAt: item.lastSyncedAt,
  }));
  // 保存文件
  await writeFile(filePath, JSON.stringify(fileListWithStore));

  console.log(`文件列表已保存: ${filePath}`);
};

// 保存文件到 store
export const saveFileToStore = async (fileListItem: FileListItem) => {
  // 文件路径
  const filePath = await getFilePathFromStore(fileListItem.title);
  // 保存文件
  await writeFile(filePath, fileListItem.body || '');

  console.log(`已保存文件: ${filePath}`);
};

// 重命名文件到 store
export const renameFileToStore = async (
  oldFileListItem: FileListItem,
  newFileListItem: FileListItem
) => {
  // 旧文件路径
  const oldFilePath = await getFilePathFromStore(oldFileListItem.title);
  // 新文件路径
  const newFilePath = await getFilePathFromStore(newFileListItem.title);

  if (!fs.existsSync(oldFilePath)) {
    console.log(`未找到旧文件: ${oldFilePath}`);
  } else {
    // 重命名文件
    await renameFile(oldFilePath, newFilePath);

    console.log(`已重命名文件: ${newFilePath}`);
  }
};

// 删除文件到 store
export const deleteFileToStore = async (fileListItem: FileListItem) => {
  // 文件路径
  const filePath = await getFilePathFromStore(fileListItem.title);

  if (!fs.existsSync(filePath)) {
    console.log(`未找到需要删除的文件: ${filePath}`);
  } else {
    // 删除文件
    await deleteFile(filePath);

    console.log(`已删除文件: ${filePath}`);
  }
};

// 将 store 中的文件移动到新目录
export const moveFileToNewDirectory = async (oldDirectory: string, newDirectory: string) => {
  const fileList = await getFileListFromStore();

  for await (const item of fileList) {
    if (await checkFileExistsFromStore(item.title)) {
      if (!fs.existsSync(newDirectory)) {
        fs.mkdirSync(newDirectory);
      }

      await fs.promises
        .rename(
          path.join(oldDirectory, `${item.title}.md`),
          path.join(newDirectory, `${item.title}.md`)
        )
        .catch((result) => {
          console.log(`文件移动失败: ${item.title}`);
        });
    }
  }

  console.log(`文件已移动到新目录: ${newDirectory}`);
};

// 从 store 获取 app 配置
export const getAppConfigFromStore = async (): Promise<AppConfig> => {
  // user data save location
  const userDataSaveLocation = await getUserDataSaveLocation();
  // 文件列表保存路径
  const filePath = path.join(userDataSaveLocation, 'appConfig.json');
  // 没有文件返回空对象
  if (!fs.existsSync(filePath)) {
    return {};
  }
  // 读取文件
  let result: any = await readFile(filePath);
  if (result) {
    try {
      result = JSON.parse(result);
    } catch (error) {
      result = {};
      console.log('app 配置数据解析失败');
    }
  } else {
    result = {};
  }
  return result as object;
};

// 保存 app 配置到 store
export const saveAppConfigToStore = async (appConfig: Partial<AppConfig>) => {
  // user data save location
  const userDataSaveLocation = await getUserDataSaveLocation();
  // 文件列表保存路径
  const filePath = path.join(userDataSaveLocation, 'appConfig.json');
  // 保存文件
  await writeFile(filePath, JSON.stringify(appConfig));

  console.log(`app 配置已保存: ${filePath}`);
};

// 是否自动同步到七牛云
export const getQinNiuConfig = async () => {
  // app 配置
  const appConfig = await getAppConfigFromStore();
  // 是否配置了七牛云相关参数
  const qinNiuIsConfig =
    !!appConfig.qinNiu?.accessKey && appConfig.qinNiu?.secretKey && appConfig.qinNiu?.bucketName;
  // 是否开启了七牛云自动同步
  const qinNiuIsAutoSync = appConfig.qinNiu?.isAutoSync;

  return {
    qinNiuIsConfig,
    qinNiuIsAutoSync,
  };
};
