import React from 'react';

/**
 * 检测是否按下了某个按键
 */
const useKeyPress = (targetKeys: string[]) => {
  const [keyPressed, setKeyPressed] = React.useState(false);

  const handleKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (targetKeys.includes(e.key)) {
        setKeyPressed(true);
      }
    },
    [targetKeys]
  );

  const handleKeyUp = React.useCallback(
    (e: KeyboardEvent) => {
      if (targetKeys.includes(e.key)) {
        setKeyPressed(false);
      }
    },
    [targetKeys]
  );

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return keyPressed;
};

export default useKeyPress;
