import electron from 'electron';
import React from 'react';

/**
 * 检测 webContent 事件
 */
const useWebContentsListener = (keyCallbackMap: {
  [key in string]: any;
}) => {
  React.useEffect(() => {
    Object.keys(keyCallbackMap).forEach((key) => {
      // 添加监听事件
      electron.ipcRenderer.on(key, keyCallbackMap[key]);
    });

    return () => {
      // 移除监听事件
      Object.keys(keyCallbackMap).forEach((key) => {
        // 添加监听事件
        electron.ipcRenderer.removeListener(key, keyCallbackMap[key]);
      });
    };
  });
};

export default useWebContentsListener;
