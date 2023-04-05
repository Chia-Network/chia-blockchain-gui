import type Metadata from '../@types/Metadata';

export default function hasSensitiveContent(metadata?: Metadata) {
  if (!metadata) {
    return false;
  }

  const sensitiveContent = metadata.sensitive_content;
  if (!sensitiveContent || sensitiveContent === false || sensitiveContent === 'false') {
    return false;
  }

  return true;
}
