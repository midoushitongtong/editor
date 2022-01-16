import React from 'react';

const remote = window.require('@electron/remote');

/**
 * context menu
 */
const useContextMenu = (menuTemplate: any[], targetSelector: string) => {
  // 当前右键点击的 html element
  const currentClickedElement = React.useRef<EventTarget | null>(null);

  React.useEffect(() => {
    const menu = remote.Menu.buildFromTemplate(menuTemplate);

    // 鼠标右键打开 menu
    const handleContextMenu = (e: MouseEvent) => {
      if (document.querySelector(targetSelector)?.contains(e.target as Node)) {
        currentClickedElement.current = e.target;
        menu.popup({
          window: remote.getCurrentWindow(),
        });
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [menuTemplate, targetSelector]);

  return {
    currentClickedElement,
  };
};

export default useContextMenu;
