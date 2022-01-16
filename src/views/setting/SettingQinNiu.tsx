import './SettingQinNiu.scss';
import React from 'react';
import { Button, Form } from 'react-bootstrap';
import { getAppConfigFromStore, saveAppConfigToStore } from '../../utils/file';
import useEffectOnce from '../../hooks/useEffectOnce';
import { notification } from 'antd';
import electron from 'electron';

const SettingQinNiu = () => {
  const [initDataLoading, setInitDataLoading] = React.useState(true);
  // access key
  const [accessKey, setAccessKey] = React.useState<string>('');
  // secret key
  const [secretKey, setSecretKey] = React.useState<string>('');
  // bucket name
  const [bucketName, setBucketName] = React.useState<string>('');

  // init data
  const initData = React.useCallback(async () => {
    const appConfig = await getAppConfigFromStore();
    setAccessKey(appConfig.qinNiu?.accessKey || '');
    setSecretKey(appConfig.qinNiu?.secretKey || '');
    setBucketName(appConfig.qinNiu?.bucketName || '');
    setInitDataLoading(false);
  }, []);

  // submit
  const submit = React.useCallback(async () => {
    // 保存 app 配置
    const appConfig = await getAppConfigFromStore();
    const newAppConfig = {
      ...appConfig, // 还原其他配置, 不然其他配置会被清空
      qinNiu: {
        ...appConfig.qinNiu, // 还原其他配置, 不然其他配置会被清空
        accessKey,
        secretKey,
        bucketName,
      },
    };
    saveAppConfigToStore(newAppConfig);

    notification.success({
      message: '保存成功',
      duration: 3,
    });

    electron.ipcRenderer.invoke('qin-niu-config-updated');
  }, [accessKey, bucketName, secretKey]);

  useEffectOnce(() => {
    initData();
  });

  return (
    <div className="setting-qin-niu">
      {!initDataLoading && (
        <>
          <Form.Group className="mb-3" controlId="accessKey">
            {/* label */}
            <Form.Label>Access Key</Form.Label>
            {/* input */}
            <Form.Control
              value={accessKey}
              placeholder="Access Key"
              onChange={(e) => setAccessKey(e.target.value)}
            />
            {/* text */}
            <Form.Text className="text-muted">请在七牛云 "秘钥管理" 下查看</Form.Text>
          </Form.Group>

          <Form.Group className="mb-3" controlId="secretKey">
            {/* label */}
            <Form.Label>Secret Key</Form.Label>
            {/* input */}
            <Form.Control
              value={secretKey}
              placeholder="Access Key"
              onChange={(e) => setSecretKey(e.target.value)}
            />
            {/* text */}
            <Form.Text className="text-muted">请在七牛云 "秘钥管理" 下查看</Form.Text>
          </Form.Group>

          <Form.Group className="mb-3" controlId="bucketName">
            {/* label */}
            <Form.Label>Bucket 名称</Form.Label>
            {/* input */}
            <Form.Control
              value={bucketName}
              placeholder="Bucket 名称"
              onChange={(e) => setBucketName(e.target.value)}
            />
            {/* text */}
            <Form.Text className="text-muted">
              {'请在七牛云 "对象存储 -> 空间管理" 下查看'}
            </Form.Text>
          </Form.Group>

          {/* save */}
          <Button onClick={submit}>保存</Button>
        </>
      )}
    </div>
  );
};

export default SettingQinNiu;
