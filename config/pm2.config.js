module.exports = {
  apps: [
    {
      name: "Server",
      script: ["node", "--inspect", "./index.js"].filter(Boolean).join(" "),
      watch: ["./index.js", "./server/**/*.ts", "./.env"],
      env: {
        NODE_ENV: process.env.NODE_ENV ?? "development",
        HOST: process.env.HOST,
      },
    },
    {
      name: "Remix",
      script: "remix watch",
      ignore_watch: ["."],
      env: {
        NODE_ENV: process.env.NODE_ENV ?? "development",
      },
    },
  ],
};
