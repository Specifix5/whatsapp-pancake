export const logger = (text: string) => {
  console.log(`${new Date().toUTCString()} | ${text}`);
};

export default () => {
  process.on('unhandledRejection', (err) => {
    logger (`[UnhandledRejection] ${err}`);
  });

  process.on('uncaughtException', (err) => {
    logger (`[UncaughtException] ${err}`);
  });
};