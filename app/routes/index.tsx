import * as React from "react";
import {
  Box,
  Flex,
  Heading,
  Icon,
  IconButton,
  Input,
  Link,
} from "@chakra-ui/react";
import { Repository } from "@prisma/client";
import {
  ActionFunction,
  json,
  LoaderFunction,
  redirect,
  useLoaderData,
  Link as RemixLink,
  Form,
} from "remix";
import { docker } from "~/utils/docker.server";
import {
  deleteRepository,
  cloneRepository,
  gitFolder,
} from "~/utils/git.server";
import { db } from "~/utils/prisma.server";
import { getUser, requireUserId } from "~/utils/session.server";
import { RepositoryTable } from "~/components/repositoryTable";
import { FaPlus } from "react-icons/fa";

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
                ? `http://${process.env.HOST}/${repository.id}/`
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
          [`traefik.http.routers.${repository.id}.priority`, `2`],
          [`traefik.http.routers.${repository.id}.entrypoints`, "web"],
          [
            `traefik.http.middlewares.${repository.id}-stripprefix.stripprefix.prefixes`,
            `/${repository.id}`,
          ],
          [
            `traefik.http.middlewares.${repository.id}-auth.forwardauth.address`,
            process.env.NODE_ENV == "production"
              ? `http://${process.env.HOST}/auth`
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
            `${
              process.env.GIT_FOLDER_MOUNT ?? gitFolder
            }/${userId}/${repositoryName}:/root/${repositoryName}`,
          ],
        },
        Env: [`GIT_NAME=${user?.username}`, `REPOSITORY=${repositoryName}`],
      });

      const network = docker.getNetwork("vscode-server-tool_traefik_default");
      await network.connect({ Container: container.id });
      await container.start();

      await db.repository.update({
        where: { id: repository.id },
        data: { runState: "started", containerId: container.id },
      });

      break;
    }
    case "stop": {
      const repository = await db.repository.findFirst({
        where: { userId, repositoryName },
      });
      if (!repository || repository.runState == "stopped") {
        break;
      }

      const containers = (await docker.listContainers()).filter(
        (container) => container.Id == (repository.containerId as string)
      );

      if (containers.length > 0) {
        await Promise.all(
          containers.map((container) =>
            docker.getContainer(container.Id).stop()
          )
        );
      }

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

      const containers = (await docker.listContainers()).filter(
        (container) => container.Id == (repository?.containerId as string)
      );

      if (containers.length > 0) {
        containers.map((container) => docker.getContainer(container.Id).stop());
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
      <Link
        position="absolute"
        top="20px"
        right="30px"
        as={RemixLink}
        to="/logout"
        color="gray.500"
        marginLeft="10px"
      >
        Logout
      </Link>
      <Box width="1200px">
        <Box marginTop="30px" display="grid" justifyContent="center">
          <Heading>VS Code Server Tool</Heading>
        </Box>
        <Form method="post">
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
              icon={<Icon as={FaPlus} />}
            />
          </Flex>
        </Form>
        <RepositoryTable repositories={repositories} />
      </Box>
    </Box>
  );
}
