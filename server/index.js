import express from "express";
import compression from "compression";
import morgan from "morgan";
import { createRequestHandler } from "@remix-run/express";
import * as serverBuild from "@remix-run/dev/server-build";
import { createWebSocketStream, WebSocketServer } from "ws";
import Dockerode from "dockerode";

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
  createRequestHandler({
    build: serverBuild,
    mode: process.env.NODE_ENV,
  })
);

const docker = new Dockerode();

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});
const wsServer = new WebSocketServer({ server, path: "/api/ws" });
wsServer.on("connection", (socket) => {
  socket.once("message", async (message) => {
    const duplex = createWebSocketStream(socket, { encoding: "utf-8" });

    const containers = (await docker.listContainers()).filter(
      (container) => container.Id == message.toString()
    );

    if (containers.length > 0) {
      const container = docker.getContainer(containers[0].Id);

      const stream = await container.attach({
        stream: true,
        stdout: true,
        stderr: true,
      });

      stream.pipe(duplex);
    }
  });
});
