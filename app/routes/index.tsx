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
import type { Repository } from "@prisma/client";
import {
  ActionFunction,
  json,
  LoaderFunction,
  useLoaderData,
  Link as RemixLink,
  Form,
  useTransition,
} from "remix";
import { FaPlus } from "react-icons/fa";
import { createContainer, stopContainer } from "../utils/docker.server";
import { deleteRepository, cloneRepository } from "../utils/git.server";
import { db } from "../utils/prisma.server";
import { requireUser, requireUserId } from "../utils/session.server";
import { RepositoryTable } from "../components/repositoryTable";

type LoaderData = {
  repositories: Repository[];
  containerBaseUrl: string;
};

export const action: ActionFunction = async ({ request }) => {
  const user = await requireUser(request);

  const formData = await request.formData();

  const repositoryName = formData.get("repositoryName") as string;

  switch (formData.get("action")) {
    case "start": {
      const repository = await db.repository.findFirst({
        where: { user, repositoryName },
      });
      if (!repository) {
        break;
      }
      if (repository.runState == "started") {
        break;
      }

      const containerId = await createContainer(
        repository,
        user,
        request.headers.get("host")
      );

      await db.repository.update({
        where: { id: repository.id },
        data: { runState: "started", containerId },
      });

      break;
    }
    case "stop": {
      const repository = await db.repository.findFirst({
        where: { user, repositoryName },
      });
      if (
        !repository ||
        !repository.containerId ||
        repository.runState == "stopped"
      ) {
        break;
      }

      await stopContainer(repository.containerId);

      await db.repository.update({
        where: { id: repository.id },
        data: { runState: "stopped", containerId: null },
      });
      break;
    }
    case "create": {
      const repositoryMatch = repositoryName.match(/(?<=\/)[^/]*(?=\.git$)/);

      if (!repositoryMatch) {
        break;
      }
      const repositoryNameCleaned = repositoryMatch[0];

      const repository = await db.repository.findFirst({
        where: { user, repositoryName: repositoryNameCleaned },
      });

      if (repository != null || !repositoryNameCleaned) {
        break;
      }

      await cloneRepository(repositoryName, user);

      await db.repository.create({
        data: { repositoryName: repositoryNameCleaned, userId: user.id },
      });

      break;
    }
    case "delete": {
      const repository = await db.repository.findFirst({
        where: { user, repositoryName },
      });

      if (repository?.containerId) {
        await stopContainer(repository.containerId);
      }

      await db.repository.delete({ where: { id: repository?.id } });

      await deleteRepository(repositoryName, user.id);

      break;
    }
    default:
      return null;
  }
  return null;
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);

  return json({
    containerBaseUrl:
      process.env.NODE_ENV === "production"
        ? request.headers.get("host")
        : "localhost:3030",
    repositories: await db.repository.findMany({ where: { userId } }),
  });
};

export default function Index() {
  const data = useLoaderData<LoaderData>();
  const transition = useTransition();

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
              isLoading={
                transition.submission?.formData.get("action") === "create"
              }
            />
          </Flex>
        </Form>
        <RepositoryTable
          repositories={data.repositories}
          containerBaseUrl={data.containerBaseUrl}
        />
      </Box>
    </Box>
  );
}
