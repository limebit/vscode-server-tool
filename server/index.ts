import express from "express";
import compression from "compression";
import morgan from "morgan";
import { createRequestHandler } from "@remix-run/express";
import { WebSocketServer } from "ws";
import Dockerode from "dockerode";
import path from "path";

const BUILD_DIR = path.join(process.cwd(), "build");

const purgeRequireCache = () => {
  for (const key in require.cache) {
    if (key.startsWith(BUILD_DIR)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete require.cache[key];
    }
  }
};

const app = express();

app.use(compression());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable("x-powered-by");

// Remix fingerprints its assets so we can cache forever.
app.use(
  "/build",
  express.static("public/build", { immutable: true, maxAge: "1y" })
);

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static("public", { maxAge: "1h" }));

app.use(morgan("tiny"));

app.all(
  "*",
  process.env.NODE_ENV === "production"
    ? createRequestHandler({ build: require("../build") })
    : (req, res, next) => {
        purgeRequireCache();
        return createRequestHandler({
          build: require("../build"),
          mode: process.env.NODE_ENV,
        })(req, res, next);
      }
);

const docker = new Dockerode();

const port = process.env.PORT ?? 3000;

const server = app.listen(port, () => {
  require("../build");
  console.log(`Express server listening on port ${port}`);
});

const wsServer = new WebSocketServer({ server, path: "/api/ws" });
wsServer.on("connection", (socket) => {
  socket.once("message", async (message) => {
    const containers = (await docker.listContainers()).filter(
      // TODO
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      (container) => container.Id == message.toString()
    );

    if (containers.length > 0 && containers[0]) {
      const container = docker.getContainer(containers[0].Id);

      const stream = await container.attach({
        stream: true,
        stdout: true,
        stderr: true,
      });

      const listener = (chunk: string) => {
        socket.send(chunk);
      };

      stream.addListener("data", listener);

      socket.once("close", () => {
        stream.removeListener("data", listener);
      });
    }
  });
});
