import React from 'react';
import './UpdateCheck.scss';
import useEffectOnce from '../../hooks/useEffectOnce';
import { Modal, notification } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
const remote = window.require('@electron/remote');
const { autoUpdater } = remote.require('electron-updater');

const UpdateCheck = () => {
  useEffectOnce(() => {
    checkAppUpdate();
  });

  // 检查 app 更新
  const checkAppUpdate = React.useCallback(async () => {
    autoUpdater.on('update-available', () => {
      Modal.confirm({
        title: '有新版本',
        icon: <ExclamationCircleOutlined />,
        content: '是否在后台进行下载?',
        okText: '是',
        cancelText: '否',
        onOk: () => {
          autoUpdater.downloadUpdate();
        },
      });
    });

    autoUpdater.on('checking-for-update', () => {
      console.log('检查更新中...');
    });

    autoUpdater.on('download-progress', (props: any) => {
      console.log(`正在下载更新，速度：${props.bytesPerSecond}, 进度: ${props.percent}%`);
    });

    autoUpdater.on('update-downloaded', () => {
      Modal.confirm({
        icon: <ExclamationCircleOutlined />,
        title: '新版本下载完毕',
        content: '是否现在重启进行更新',
        okText: '是',
        cancelText: '否',
        onOk: () => {
          setImmediate(() => autoUpdater.quitAndInstall());
        },
      });
    });

    autoUpdater.on('update-not-available', (props: any) => {
      notification.info({
        message: '没有新版本',
        description: '当前已经是最新版本',
        duration: 3,
      });
      console.log(props);
    });

    if (remote.app.isPackaged) {
      // 生产环境检查
      await autoUpdater.checkForUpdatesAndNotify();
    } else {
      // 开发环境检查
      await autoUpdater.checkForUpdates();
    }
  }, []);

  return null;
};

export default UpdateCheck;
