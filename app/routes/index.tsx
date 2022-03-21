import {
  CheckCircleIcon,
  CloseIcon,
  DeleteIcon,
  DownloadIcon,
} from "@chakra-ui/icons";
import { Box, Flex, Heading, IconButton, Input, Tag } from "@chakra-ui/react";
import { Repository } from "@prisma/client";
import * as React from "react";
import {
  ActionFunction,
  json,
  LoaderFunction,
  redirect,
  useLoaderData,
} from "remix";
import { docker } from "~/utils/docker.server";
import {
  deleteRepository,
  cloneRepository,
  gitFolder,
} from "~/utils/git.server";
import { db } from "~/utils/prisma.server";
import { getUser, requireUserId } from "~/utils/session.server";

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);

  const formData = await request.formData();

  const repositoryName = formData.get("repositoryName") as string;

  switch (formData.get("action")) {
    case "start": {
      const repository = await db.repository.findFirst({
        where: { userId, repositoryName },
      });
      if (!repository) {
        break;
      }
      if (repository.runState == "started") {
        return repository.containerId
          ? redirect(
              process.env.NODE_ENV == "production"
                ? `http://${process.env.HOST}:80085/${repository.id}/`
                : `http://localhost:3030/${repository.id}/`
            )
          : null;
      }

      const user = await getUser(request);

      const container = await docker.createContainer({
        Image: "vscode-server-tool",
        ExposedPorts: { "8080/tcp": {} },
        Labels: Object.fromEntries([
          ["traefik.enable", "true"],
          [
            `traefik.http.routers.${repository.id}.rule`,
            `${
              process.env.NODE_ENV == "production"
                ? `Host(\`${process.env.HOST}\`) && `
                : ``
            }PathPrefix(\`/${repository.id}\`)`,
          ],
          [`traefik.http.routers.${repository.id}.entrypoints`, "servers"],
          [
            `traefik.http.middlewares.${repository.id}-stripprefix.stripprefix.prefixes`,
            `/${repository.id}`,
          ],
          [
            `traefik.http.middlewares.${repository.id}-redirect.redirectregex.regex`,
            `^http://localhost/${repository.id}`,
          ],
          [
            `traefik.http.middlewares.${repository.id}-redirect.redirectregex.replacement`,
            `http://localhost/${repository.id}/`,
          ],
          [
            `traefik.http.routers.${repository.id}.middlewares`,
            `${repository.id}-stripprefix@docker,${repository.id}-redirect@docker`,
          ],
          [`traefik.docker.network`, "vscode-server-tool_traefik_default"],
        ]),
        HostConfig: {
          AutoRemove: true,
          Binds: [`${gitFolder}/${userId}/${repositoryName}:/root/repository`],
        },
        Env: [`GIT_NAME=${user?.username}`],
      });

      const network = docker.getNetwork("vscode-server-tool_traefik_default");
      await network.connect({ Container: container.id });
      await container.start();

      await db.repository.update({
        where: { id: repository.id },
        data: { runState: "started", containerId: container.id },
      });

      // wait for 1 second to let docker container start
      await new Promise((res) => setTimeout(res, 1000));

      return redirect(
        process.env.NODE_ENV == "production"
          ? `http://${process.env.HOST}:80085/${repository.id}/`
          : `http://localhost:3030/${repository.id}/`
      );
    }
    case "stop": {
      const repository = await db.repository.findFirst({
        where: { userId, repositoryName },
      });
      if (!repository || repository.runState == "stopped") {
        break;
      }

      const container = docker.getContainer(repository.containerId as string);
      await container.stop();

      await db.repository.update({
        where: { id: repository.id },
        data: { runState: "stopped", containerId: null },
      });
      break;
    }
    case "create": {
      const repositoryMatch = (formData.get("repositoryName") as string).match(
        /(?<=\/)[^/]*(?=\.git$)/
      );
      if (!repositoryMatch) {
        break;
      }
      const repositoryNameCleaned = repositoryMatch[0];

      const repository = await db.repository.findFirst({
        where: { userId, repositoryName: repositoryNameCleaned },
      });

      if (repository != null) {
        break;
      }

      const user = await getUser(request);

      if (!user) {
        break;
      }

      await cloneRepository(repositoryName, user);

      await db.repository.create({
        data: { repositoryName: repositoryNameCleaned, userId },
      });

      break;
    }
    case "delete": {
      const repository = await db.repository.findFirst({
        where: { userId, repositoryName },
      });

      const container = docker.getContainer(repository?.containerId as string);

      // the container.id is null if the container doesnt exist
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (container.id != null) {
        await container.stop();
      }

      await db.repository.delete({ where: { id: repository?.id } });

      await deleteRepository(repositoryName, userId);

      break;
    }
    default:
      return null;
  }
  return null;
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);

  return json(await db.repository.findMany({ where: { userId } }));
};

export default function Index() {
  const repositories = useLoaderData<Repository[]>();

  return (
    <Box display="grid" justifyContent="center">
      <Box width="1200px">
        <Box marginTop="30px" display="grid" justifyContent="center">
          <Heading>VS Code Server Tool</Heading>
        </Box>
        <form method="post" action="/?index">
          <Flex
            marginTop="30px"
            borderRadius="10px"
            paddingY="10px"
            boxShadow="rgba(100, 100, 111, 0.2) 0px 7px 29px 0px"
            paddingX="10px"
          >
            <Input
              placeholder="https://github.com/limebit/vscode-server-tool.git"
              name="repositoryName"
            />
            <IconButton
              type="submit"
              name="action"
              value="create"
              marginLeft="10px"
              aria-label="load git repo"
              icon={<DownloadIcon />}
            />
          </Flex>
        </form>
        {repositories.length > 0 ? (
          <Box
            marginTop="30px"
            borderRadius="10px"
            boxShadow="rgba(100, 100, 111, 0.2) 0px 7px 29px 0px"
          >
            {repositories.map((repository, i) => (
              <form key={i} method="post" action="/?index">
                <Flex
                  paddingY="10px"
                  paddingX="10px"
                  borderBottom={
                    i == repositories.length - 1 ? undefined : "1px"
                  }
                  borderColor="gray.200"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box marginLeft="10px">{repository.repositoryName}</Box>
                  <Flex alignItems="center">
                    <Tag
                      colorScheme={
                        repository.runState == "started" ? "green" : "red"
                      }
                      size="md"
                    >
                      {repository.runState}
                    </Tag>
                    <Input
                      type="hidden"
                      name="repositoryName"
                      value={repository.repositoryName}
                    />
                    <IconButton
                      marginLeft="10px"
                      aria-label="Start Container"
                      icon={<CheckCircleIcon />}
                      type="submit"
                      name="action"
                      value="start"
                    />
                    <IconButton
                      marginLeft="10px"
                      aria-label="Stop Container"
                      icon={<CloseIcon />}
                      type="submit"
                      name="action"
                      value="stop"
                    />
                    <IconButton
                      marginLeft="10px"
                      aria-label="Delete Container"
                      icon={<DeleteIcon />}
                      type="submit"
                      name="action"
                      value="delete"
                    />
                  </Flex>
                </Flex>
              </form>
            ))}
          </Box>
        ) : undefined}
      </Box>
    </Box>
  );
}
