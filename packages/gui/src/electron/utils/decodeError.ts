export default function decodeError({ name, message, extra }: { name: string; message: string; extra: any }) {
  const error = new Error(message);
  error.name = name;
  Object.assign(error, extra);

  return error;
}
