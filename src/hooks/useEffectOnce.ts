import React from 'react';

/**
 * 整个生命周期运行一次
 */
const useEffectOnce = (effect: React.EffectCallback) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(effect, []);
};

export default useEffectOnce;
