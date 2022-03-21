import {
  CheckCircleIcon,
  CloseIcon,
  DeleteIcon,
  DownloadIcon,
} from "@chakra-ui/icons";
import { Box, Flex, Heading, IconButton, Input, Tag } from "@chakra-ui/react";
import { Repository } from "@prisma/client";
import * as React from "react";
import { ActionFunction, json, useLoaderData } from "remix";
import { docker } from "~/utils/docker.server";
import { deleteRepository, cloneRepository } from "~/utils/git.server";
import { db } from "~/utils/prisma.server";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();

  const repositoryName = formData.get("repositoryName") as string;

  switch (formData.get("action")) {
    case "start": {
      const state = (
        await db.repository.findFirst({
          where: { repositoryName },
        })
      )?.runState;
      if (state == "started") {
        break;
      }

      const repositoryNameEncoded = btoa(repositoryName);

      console.log(repositoryNameEncoded);

      const container = await docker.createContainer({
        Image: "vscode-server-tool",
        ExposedPorts: { "8080/tcp": {} },
        Labels: Object.fromEntries([
          ["traefik.enable", "true"],
          [
            `traefik.http.routers.${repositoryNameEncoded}.rule`,
            `PathPrefix(\`/${repositoryNameEncoded}\`)`,
          ],
          [`traefik.http.routers.${repositoryNameEncoded}.entrypoints`, "web"],
          [
            `traefik.http.middlewares.${repositoryNameEncoded}-stripprefix.stripprefix.prefixes`,
            `/${repositoryNameEncoded}`,
          ],
          [
            `traefik.http.middlewares.${repositoryNameEncoded}-redirect.redirectregex.regex`,
            `^http://localhost/${repositoryNameEncoded}`,
          ],
          [
            `traefik.http.middlewares.${repositoryNameEncoded}-redirect.redirectregex.replacement`,
            `http://localhost/${repositoryNameEncoded}/`,
          ],
          [
            `traefik.http.routers.${repositoryNameEncoded}.middlewares`,
            `${repositoryNameEncoded}-stripprefix@docker,${repositoryNameEncoded}-redirect@docker`,
          ],
          [`traefik.docker.network`, "vscode-server-tool_traefik_default"],
        ]),
        HostConfig: {
          AutoRemove: true,
          Binds: [`${__dirname}/${repositoryName}:/root/repository`],
        },
      });

      const network = docker.getNetwork("vscode-server-tool_traefik_default");
      await network.connect({ Container: container.id });
      await container.start();

      await db.repository.update({
        where: { repositoryName },
        data: { runState: "started", containerId: container.id },
      });

      return null;
    }
    case "stop": {
      const repository = await db.repository.findFirst({
        where: { repositoryName },
      });
      if (!repository || repository.runState == "stopped") {
        break;
      }

      const container = docker.getContainer(repository.containerId as string);
      await container.stop();

      await db.repository.update({
        where: { repositoryName },
        data: { runState: "stopped", containerId: null },
      });
      break;
    }
    case "create": {
      const repositoryMatch = (formData.get("repositoryName") as string).match(
        /(?<=\/).*(?=\.git$)/
      );
      if (!repositoryMatch) {
        break;
      }
      const repositoryNameCleaned = repositoryMatch[0];

      const repository = await db.repository.findFirst({
        where: { repositoryName: repositoryNameCleaned },
      });

      if (repository != null) {
        break;
      }

      cloneRepository(repositoryName);

      await db.repository.create({
        data: { repositoryName: repositoryNameCleaned },
      });

      break;
    }
    case "delete": {
      const repository = await db.repository.findFirst({
        where: { repositoryName },
      });

      const container = docker.getContainer(repository?.containerId as string);

      // the container.id is null if the container doesnt exist
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (container.id != null) {
        await container.stop();
      }

      await db.repository.delete({ where: { repositoryName } });

      deleteRepository(repositoryName);

      break;
    }
    default:
      return null;
  }

  return null;
};

export const loader = async () => {
  return json(await db.repository.findMany());
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
            paddingX="20px"
          >
            <Input
              placeholder="git@github.com:limebit/vscode-server-tool.git"
              name="repositoryName"
            />
            <IconButton
              type="submit"
              name="action"
              value="create"
              marginLeft="20px"
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
                  paddingX="20px"
                  borderBottom={
                    i == repositories.length - 1 ? undefined : "1px"
                  }
                  borderColor="gray.200"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box justifyContent="space-between">
                    {repository.repositoryName}
                  </Box>
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
                      marginLeft="20px"
                      aria-label="Start Container"
                      icon={<CheckCircleIcon />}
                      type="submit"
                      name="action"
                      value="start"
                    />
                    <IconButton
                      marginLeft="20px"
                      aria-label="Stop Container"
                      icon={<CloseIcon />}
                      type="submit"
                      name="action"
                      value="stop"
                    />
                    <IconButton
                      marginLeft="20px"
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
