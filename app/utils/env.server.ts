function getEnv() {
  return {
    NODE_ENV: process.env.NODE_ENV,
    HOST: process.env.HOST,
  };
}

type ENV = ReturnType<typeof getEnv>;

declare global {
  // eslint-disable-next-line
  var ENV: ENV;
  interface Window {
    ENV: ENV;
  }
}

export { getEnv };
