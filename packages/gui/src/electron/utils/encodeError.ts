export default function encodeError(error: Error) {
  return {
    name: error.name,
    message: error.message,
    extra: { ...error },
  };
}
