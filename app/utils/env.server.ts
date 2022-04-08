function getEnv() {
  return {
    NODE_ENV: process.env.NODE_ENV,
    HOSTS: process.env.HOSTS,
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
