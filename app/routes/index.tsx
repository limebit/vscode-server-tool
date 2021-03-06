import * as React from "react";
import {
  Avatar,
  Box,
  Flex,
  Heading,
  Icon,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
} from "@chakra-ui/react";
import type { Repository } from "@prisma/client";
import {
  ActionFunction,
  json,
  LoaderFunction,
  useLoaderData,
  Form,
  useTransition,
  Link as RemixLink,
} from "remix";
import { FaCog, FaPlus, FaSignOutAlt, FaUsersCog } from "react-icons/fa";
import { createContainer, stopContainer } from "../utils/docker.server";
import {
  deleteRepository,
  cloneRepository,
  gitFolder,
} from "../utils/git.server";
import { db } from "../utils/prisma.server";
import { requireUser } from "../utils/session.server";
import { RepositoryTable } from "../components/repositoryTable";

type LoaderData = {
  repositories: Repository[];
  containerBaseUrl: string;
  isAdmin: string;
  gitUserBasePath: string;
};

export const action: ActionFunction = async ({ request }) => {
  const user = await requireUser(request);

  const formData = await request.formData();

  const repositoryName = formData.get("repositoryName") as string;

  switch (formData.get("action")) {
    case "start": {
      const repository = await db.repository.findFirst({
        where: { userId: user.id, repositoryName },
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
        where: { userId: user.id, repositoryName },
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
        where: { userId: user.id, repositoryName: repositoryNameCleaned },
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
        where: { userId: user.id, repositoryName },
      });

      if (repository?.containerId) {
        await stopContainer(repository.containerId);
      }

      await db.repository.delete({ where: { id: repository?.id } });

      await deleteRepository(repositoryName, user.id);

      break;
    }
    case "createVolume": {
      const repository = await db.repository.findFirst({
        where: { userId: user.id, repositoryName },
      });

      const volume = formData.get("volume");

      if (!repository || !volume) {
        break;
      }

      await db.repository.update({
        where: { id: repository.id },
        data: { volumes: [...repository.volumes, volume as string] },
      });

      break;
    }
    case "deleteVolume": {
      const repository = await db.repository.findFirst({
        where: { userId: user.id, repositoryName },
      });

      const volume = formData.get("volume");

      if (!repository || !volume) {
        break;
      }

      await db.repository.update({
        where: { id: repository.id },
        data: {
          volumes: repository.volumes.filter((element) => element != volume),
        },
      });

      break;
    }
    default:
      return null;
  }
  return null;
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireUser(request);

  return json({
    containerBaseUrl:
      process.env.NODE_ENV === "production"
        ? request.headers.get("host")
        : "localhost:3030",
    repositories: await db.repository.findMany({ where: { userId: user.id } }),
    isAdmin: user.status === "admin",
    gitUserBasePath: `${process.env.GIT_FOLDER_MOUNT ?? gitFolder}/${user.id}/`,
  });
};

export default function Index() {
  const data = useLoaderData<LoaderData>();
  const transition = useTransition();

  return (
    <Box display="grid" justifyContent="center">
      <Box position="absolute" top="20px" right="30px">
        <Menu>
          <MenuButton>
            <Avatar size="sm" />
          </MenuButton>
          <MenuList>
            <MenuItem as={RemixLink} to="/settings" icon={<Icon as={FaCog} />}>
              Settings
            </MenuItem>
            {data.isAdmin ? (
              <MenuItem
                as={RemixLink}
                to="/admin"
                icon={<Icon as={FaUsersCog} />}
              >
                Admin Panel
              </MenuItem>
            ) : null}
            <MenuDivider />
            <MenuItem
              as={RemixLink}
              to="/logout"
              icon={<Icon as={FaSignOutAlt} />}
            >
              Logout
            </MenuItem>
          </MenuList>
        </Menu>
      </Box>
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
          gitUserBasePath={data.gitUserBasePath}
        />
      </Box>
    </Box>
  );
}
