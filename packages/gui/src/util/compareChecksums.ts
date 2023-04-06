import removeHexPrefix from './removeHexPrefix';

export default function compareChecksums(checksum1: string, checksum2: string) {
  // Remove the "0x" prefix from the checksums
  const strippedChecksum1 = removeHexPrefix(checksum1);
  const strippedChecksum2 = removeHexPrefix(checksum2);

  // Compare the stripped checksums and return the result
  return strippedChecksum1 === strippedChecksum2;
}
