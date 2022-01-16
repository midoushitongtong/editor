// 文件列表项
export type FileListItem = {
  id: string;
  title: string;
  body?: string;
  createdAt: number;

  isNew?: boolean; // 是否是新文件
  isLoaded?: boolean; // 文件内容是否已经加载完成 (从本地)
  fileKey?: string; // 七牛云文件 key
  isSynced?: boolean; // 是否同步完成
  lastSyncedAt?: number; // 最后一次同步时间
};
