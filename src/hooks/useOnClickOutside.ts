import React from 'react';

/**
 * 检测是否点击了外部元素
 */
const useOnClickOutside = (
  ref: React.MutableRefObject<HTMLElement | null>,
  handler: (e?: MouseEvent | TouchEvent) => void
) => {
  React.useEffect(() => {
    const listener = (e: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) {
        return;
      }

      handler(e);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

export default useOnClickOutside;
