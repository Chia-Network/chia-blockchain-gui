export default async function download(url: string): Promise<void> {
  const { ipcRenderer } = window as any;

  return ipcRenderer?.invoke('download', {
    url,
  });
}
