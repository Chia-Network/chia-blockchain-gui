export default async function download(url: string): Promise<void> {
  return window.appAPI.download(url);
}
