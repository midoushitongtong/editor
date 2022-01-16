import useWebContentsListener from '../../hooks/useWebContentsListener';
import { useLocation } from 'react-router-dom';
import { getMainWindowMenuTemplate } from '../../utils/menu';
import React from 'react';
import { getAppConfigFromStore } from '../../utils/file';

const remote = window.require('@electron/remote');

const BackendHandler = () => {
  const location = useLocation();
  const mainWindowMenuTemp = React.useRef<any>(null);

  // 设置 main window 菜单
  // 不是最优做法, 最优做法是放到 main process 中去设置菜单
  const setMainWindowMenu = React.useCallback(async () => {
    // 只有在首页才设置 app 菜单
    if (location.pathname === '/') {
      const mainWindowMenuTemplate = await getMainWindowMenuTemplate();
      const menu = remote.Menu.buildFromTemplate(mainWindowMenuTemplate);
      remote.getCurrentWindow().setMenu(menu);
      mainWindowMenuTemp.current = menu;
    }
  }, [location.pathname]);

  // 更新 main window 菜单 - 七云牛配置
  // 不是最优做法, 最优做法是放到 main process 中去设置菜单
  const updateMainWindowMenu = React.useCallback(async () => {
    // 只有在首页才设置 app 菜单
    if (location.pathname === '/') {
      if (mainWindowMenuTemp.current) {
        // 根据操作系统找到七牛云菜单 (不同操作系统菜单位置不一样)
        const qiNiuMenu =
          process.platform === 'darwin'
            ? mainWindowMenuTemp.current.items[3]
            : mainWindowMenuTemp.current.items[2];

        // app 配置
        const appConfig = await getAppConfigFromStore();
        // 是否配置了七牛云相关参数
        const qinNiuIsConfig =
          !!appConfig.qinNiu?.accessKey &&
          appConfig.qinNiu?.secretKey &&
          appConfig.qinNiu?.bucketName;

        qiNiuMenu.submenu.items[1].enabled = qinNiuIsConfig;
        qiNiuMenu.submenu.items[2].enabled = qinNiuIsConfig;
        qiNiuMenu.submenu.items[3].enabled = qinNiuIsConfig;
      }
    }
  }, [location.pathname]);

  useWebContentsListener({
    'browser-window-close': () => {
      // 每当 brwoser window 关闭的时候, 重新设置 main window 菜单
      // 为什么:
      //  - 因为每打开一个新的 browser window 都会重新设置一次 main window 菜单, 关闭 browser window 后, 菜单点击事件就会被销毁
      //  - 所以每次关闭 browser window 重新设置一次 main window 菜单, 确保事件正常运行
      setMainWindowMenu();
    },
    'qin-niu-config-updated': () => {
      // 当七牛云配置更新的时候, 更新 main window 菜单
      // 为什么:
      //  - 因为部分菜单状态(启用/禁用)是根据七牛云配置走的
      updateMainWindowMenu();
    },
  });

  React.useEffect(() => {
    setMainWindowMenu();
  }, [setMainWindowMenu]);

  return null;
};

export default BackendHandler;
