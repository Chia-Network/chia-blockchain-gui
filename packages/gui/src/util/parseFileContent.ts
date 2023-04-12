export default function parseFileContent(content: Buffer, headers: any) {
  let encoding: BufferEncoding = 'utf8';
  if (headers?.['content-type']) {
    const contentType = headers['content-type'];
    const parsedEncoding = contentType?.split('charset=')[1];

    if (parsedEncoding) {
      encoding = parsedEncoding.toLowerCase() === 'iso-8859-1' ? 'latin1' : parsedEncoding;
    }
  }

  return Buffer.from(content).toString(encoding);
}
