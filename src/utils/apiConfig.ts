export const getApiBase = () => {
  // @ts-expect-error electronAPI is injected via preload script
  if (typeof window !== 'undefined' && window.electronAPI?.isDesktop) {
    return 'http://localhost:3001';
  }
  return '';
};
