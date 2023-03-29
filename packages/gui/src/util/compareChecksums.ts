export default function compareChecksums(checksum1: string, checksum2: string) {
  // Remove the "0x" prefix from the checksums
  const strippedChecksum1 = checksum1.replace(/^0x/, '');
  const strippedChecksum2 = checksum2.replace(/^0x/, '');

  // Compare the stripped checksums and return the result
  return strippedChecksum1 === strippedChecksum2;
}
