// app 配置
export type AppConfig = {
  fileStorePath?: string;
  qinNiu?: {
    accessKey?: string;
    secretKey?: string;
    bucketName?: string;
    isAutoSync?: boolean;
  };
};
