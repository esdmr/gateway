export function formatSize(size: number) {
  if (size < 1024) {
    return `${size.toFixed(0)} B`;
  }

  size /= 1024;

  if (size < 1024) {
    return `${size.toFixed(1)} KiB`;
  }

  size /= 1024;

  if (size < 1024) {
    return `${size.toFixed(1)} MiB`;
  }

  size /= 1024;

  if (size < 1024) {
    return `${size.toFixed(1)} GiB`;
  }

  size /= 1024;

  return `${size.toFixed(1)} TiB`;
}
