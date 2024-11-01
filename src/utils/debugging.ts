export const logger = (text: string) => {
  console.log(`${new Date().toUTCString()} | ${text}`);
}

export default () => {
  process.on('unhandledRejection', (err: any) => {
    logger (`[UnhandledRejection] ${err}`);
  })

  process.on('uncaughtException', (err: any) => {
    logger (`[UncaughtException] ${err}`);
  })
}