export default async () => {
  if (process.env.NODE_ENV !== 'development') return;

  // eslint-disable-next-line global-require -- We cannot use import since it should be only loaded in development
  const { default: installExtension, REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS } = require('electron-devtools-assembler');
  try {
    // install "browser" extensions
    await installExtension([REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS]);
  } catch (err: any) {
    console.error(err.message);
  }
};
