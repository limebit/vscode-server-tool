import type { Repository, User } from "@prisma/client";
import Dockerode from "dockerode";
import { gitFolder } from "./git.server";

const docker = new Dockerode();

export const createContainer = async (
  repository: Repository,
  user: User,
  forwardUrl: string | null
) => {
  const container = await docker.createContainer({
    Image: "vscode-server-tool",
    ExposedPorts: { "8080/tcp": {} },
    Labels: Object.fromEntries([
      ["traefik.enable", "true"],
      [
        `traefik.http.routers.${repository.id}.rule`,
        `${
          process.env.NODE_ENV === "production"
            ? `Host(${process.env.HOSTS}) && `
            : ``
        }PathPrefix(\`/${repository.id}\`)`,
      ],
      [`traefik.http.routers.${repository.id}.priority`, `2`],
      process.env.NODE_ENV === "production" && process.env.ENABLE_TLS === "true"
        ? [`traefik.http.routers.${repository.id}.entrypoints`, "websecure"]
        : [`traefik.http.routers.${repository.id}.entrypoints`, "web"],
      ...(process.env.NODE_ENV === "production" &&
      process.env.ENABLE_TLS === "true"
        ? [[`traefik.http.routers.${repository.id}.tls`, "true"]]
        : []),
      [
        `traefik.http.middlewares.${repository.id}-stripprefix.stripprefix.prefixes`,
        `/${repository.id}`,
      ],
      [
        `traefik.http.middlewares.${repository.id}-auth.forwardauth.address`,
        process.env.NODE_ENV === "production"
          ? `http://${forwardUrl}/auth`
          : "http://host.docker.internal:3000/auth",
      ],
      [
        `traefik.http.routers.${repository.id}.middlewares`,
        `${repository.id}-stripprefix@docker,${repository.id}-auth@docker`,
      ],
      ["traefik.docker.network", "vscode-server-tool_traefik_default"],
    ]),
    HostConfig: {
      AutoRemove: true,
      Binds: [
        `${process.env.GIT_FOLDER_MOUNT ?? gitFolder}/${user.id}/${
          repository.repositoryName
        }:/root/${repository.repositoryName}`,
      ],
      DeviceRequests:
        process.env.ENABLE_GPU_PASSTHROUGH == "true"
          ? [{ Count: -1, Capabilities: [["gpu"]] }]
          : undefined,
    },
    Tty: true,
    Env: [
      `GIT_NAME=${user.username}`,
      `REPOSITORY=${repository.repositoryName}`,
    ],
  });

  const network = docker.getNetwork("vscode-server-tool_traefik_default");
  await network.connect({ Container: container.id });
  await container.start();

  return container.id;
};

export const stopContainer = async (containerId: string) => {
  const containers = (await docker.listContainers()).filter(
    (container) => container.Id == containerId
  );

  if (containers.length > 0) {
    await Promise.all(
      containers.map((container) => docker.getContainer(container.Id).stop())
    );
  }
};

export { docker };
