import './SettingFileStorePath.scss';
import React from 'react';
import { Button, Form, InputGroup } from 'react-bootstrap';
import {
  getAppConfigFromStore,
  getFileSaveLocation,
  moveFileToNewDirectory,
  saveAppConfigToStore,
} from '../../utils/file';
import useEffectOnce from '../../hooks/useEffectOnce';
import { notification } from 'antd';

const remote = window.require('@electron/remote');

const SettingFileStorePath = () => {
  const [initDataLoading, setInitDataLoading] = React.useState(true);
  // file store path
  const [fileStorePath, setFileStorePath] = React.useState<string>('');

  // select store path
  const selectFileStorePath = React.useCallback(async () => {
    const result = await remote.dialog.showOpenDialog({
      properties: ['openDirectory'],
      message: '选择文件的存储路径',
    });

    if (!result.canceled && result.filePaths.length > 0) {
      setFileStorePath(result.filePaths[0]);
    }
  }, []);

  // init data
  const initData = React.useCallback(async () => {
    const appConfig = await getAppConfigFromStore();

    setFileStorePath(appConfig.fileStorePath || '');
    setInitDataLoading(false);
  }, []);

  // submit
  const submit = React.useCallback(async () => {
    if (fileStorePath) {
      // 迁移文件
      await moveFileToNewDirectory(await getFileSaveLocation(), fileStorePath);
      // 保存 app 配置
      const appConfig = await getAppConfigFromStore();
      const newAppConfig = {
        ...appConfig, // 还原其他配置, 不然其他配置会被清空
        fileStorePath,
      };
      await saveAppConfigToStore(newAppConfig);
    }

    notification.success({
      message: '保存成功',
      duration: 3,
    });
  }, [fileStorePath]);

  useEffectOnce(() => {
    initData();
  });

  return (
    <div className="setting-file-store-path">
      {!initDataLoading && (
        <>
          <Form.Group className="mb-3" controlId="fileStorePath">
            {/* label */}
            <Form.Label>文件存储位置</Form.Label>
            {/* input */}
            <InputGroup>
              <Form.Control value={fileStorePath} disabled placeholder="文件存储位置" />
              <Button variant="outline-primary" onClick={selectFileStorePath}>
                选择新的位置
              </Button>
            </InputGroup>
          </Form.Group>

          {/* save */}
          <Button onClick={submit}>保存</Button>
        </>
      )}
    </div>
  );
};

export default SettingFileStorePath;
