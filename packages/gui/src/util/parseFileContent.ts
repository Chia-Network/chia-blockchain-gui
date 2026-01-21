export default function parseFileContent(content: Uint8Array, headers: any) {
  let encoding = 'utf-8';
  if (headers?.['content-type']) {
    const contentType = headers['content-type'];
    const parsedEncoding = contentType?.split('charset=')[1];

    if (parsedEncoding) {
      const normalized = parsedEncoding.toLowerCase();
      encoding = normalized === 'latin1' ? 'iso-8859-1' : normalized;
    }
  }

  try {
    return new TextDecoder(encoding).decode(content);
  } catch (error) {
    console.warn(`Failed to decode content with ${encoding}, falling back to utf-8`, error);
    return new TextDecoder().decode(content);
  }
}
