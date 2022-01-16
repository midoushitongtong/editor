import axios from '../axios';
import fs from 'fs';
import { getAppConfigFromStore } from '../file';

const qiniu = window.require('qiniu');

export const createQinNiuManage = ({
  accessKey,
  secretKey,
  bucketName,
}: {
  accessKey: string;
  secretKey: string;
  bucketName: string;
}) => {
  // 生成 mac
  const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
  // 生成配置类
  const config = new qiniu.conf.Config();
  // 空间对应的机房
  config.zone = qiniu.zone.Zone_z2;
  // 生成 bucket manager
  const bucketManager = new qiniu.rs.BucketManager(mac, config);
  // cdn 域名
  let publicBucketDomain: any = null;

  // 处理 qin niu sdk 返回的结果
  const handleCallback = (resolve: Function, reject: Function) => {
    return (error: any, respBody: any, respInfo: any) => {
      if (error) {
        reject(error);
      } else {
        if (respInfo.statusCode === 200) {
          resolve(respBody);
        } else {
          reject({
            respInfo,
            respBody,
          });
        }
      }
    };
  };

  // 获取 bucket 域名
  const getBucketDomain = () => {
    const requestURL = `http://uc.qbox.me/v2/domains?tbl=${bucketName}`;
    const digest = qiniu.util.generateAccessToken(mac, requestURL);
    return new Promise((resolve, reject) => {
      qiniu.rpc.postWithoutForm(requestURL, digest, handleCallback(resolve, reject));
    });
  };

  // 文件上传
  const uploadFile = (key: string, localFilePath: string) => {
    // 生成 uploadToken
    const options = {
      scope: bucketName + ':' + key,
    };
    const putPolicy = new qiniu.rs.PutPolicy(options);
    const uploadToken = putPolicy.uploadToken(mac);
    // 生成 putExtra
    const formUploader = new qiniu.form_up.FormUploader(config);
    const putExtra = new qiniu.form_up.PutExtra();

    return new Promise<any>(async (resolve, reject) => {
      // 执行文件上传
      formUploader.putFile(
        uploadToken,
        key,
        localFilePath,
        putExtra,
        handleCallback(resolve, reject)
      );
    });
  };

  // 文件下载
  const generateDownloadLink = async (key: string) => {
    const domainList: any = await (publicBucketDomain
      ? Promise.resolve([publicBucketDomain])
      : getBucketDomain());

    return new Promise(async (resolve, reject) => {
      if (Array.isArray(domainList) && domainList.length > 0) {
        const partten = /^https?/;
        publicBucketDomain = partten.test(domainList[0])
          ? domainList[0]
          : `http://${domainList[0]}`;
        // 公开空间访问链接
        let publicDownloadUrl = bucketManager.publicDownloadUrl(publicBucketDomain, key);
        publicDownloadUrl = `${publicDownloadUrl}?t=${Math.random()}`;
        resolve(publicDownloadUrl);
      } else {
        reject('域名未找到, 请检查存储空间是否已经过去');
      }
    });
  };

  // 删除文件
  const deleteFile = (key: string) => {
    return new Promise<any>((resolve, reject) => {
      // 执行文件删除
      bucketManager.delete(bucketName, key, handleCallback(resolve, reject));
    });
  };

  // 下载文件
  const downloadFile = async (key: string, downloadPath: string) => {
    // 生成下载链接
    const downloadLink = await generateDownloadLink(key);
    const timeStamp = new Date().getTime();
    const url = `${downloadLink}?r=${timeStamp}`;

    const result = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    const writer = fs.createWriteStream(downloadPath);
    result.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('close', reject);
    });
  };

  // 获取文件信息
  const getFileStat = async (key: string) => {
    return new Promise<any>((resolve, reject) => {
      bucketManager.stat(bucketName, key, handleCallback(resolve, reject));
    });
  };

  // 获取文件列表
  const getFileList = async () => {
    return new Promise<any>((resolve, reject) => {
      bucketManager.listPrefix(bucketName, {}, handleCallback(resolve, reject));
    });
  };

  return {
    uploadFile,
    generateDownloadLink,
    deleteFile,
    getBucketDomain,
    downloadFile,
    getFileStat,
    getFileList,
  };
};

export const createQinNiuManageWithStore = async () => {
  const appConfig = await getAppConfigFromStore();
  const qiniuManage = createQinNiuManage({
    accessKey: appConfig.qinNiu?.accessKey as string,
    secretKey: appConfig.qinNiu?.secretKey as string,
    bucketName: appConfig.qinNiu?.bucketName as string,
  });

  return qiniuManage;
};
