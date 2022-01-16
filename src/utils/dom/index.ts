// 获取父节点
export const getParentNode = (node: any, parentClassName: string) => {
  let current = node;

  while (current !== null) {
    if (current.classList.contains(parentClassName)) {
      return current;
    }
    current = current.parentNode;
  }

  return null;
};
