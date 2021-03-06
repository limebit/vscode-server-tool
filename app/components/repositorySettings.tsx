import * as React from "react";
import {
  Collapse,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tooltip,
  Text,
  Link,
  Flex,
  Icon,
  Button,
  Input,
  IconButton,
} from "@chakra-ui/react";
import { useState } from "react";
import type { Repository } from "@prisma/client";
import { FaMinus, FaPlus, FaTrash } from "react-icons/fa";
import { useTransition } from "remix";
import { LogTerminal } from "./logTerminal";

interface RepositorySettingsProps {
  repository: Repository;
  gitUserBasePath: string;
  open: boolean;
  link: string;
  last?: boolean;
}

export const RepositorySettings = ({
  repository,
  gitUserBasePath,
  open,
  link,
  last,
}: RepositorySettingsProps) => {
  const [tabIndex, setTabIndex] = useState(0);
  const transition = useTransition();

  const started = repository.runState == "started";

  return (
    <Collapse in={open} animate>
      <Tabs
        paddingTop="10px"
        borderBottomRadius={last ? "10px" : undefined}
        backgroundColor="gray.50"
        boxShadow={
          last
            ? "inset 0 7px 9px -7px rgba(100, 100, 111, 0.2)"
            : "inset 0 7px 9px -7px rgba(100, 100, 111, 0.2), inset 0 -7px 9px -7px rgba(100, 100, 111, 0.2)"
        }
        onChange={(index: number) => setTabIndex(index)}
        variant="enclosed"
      >
        <Text margin="10px" fontWeight="bold">
          Repository Url:{" "}
          <Link
            as="a"
            href={started ? link : undefined}
            isExternal
            opacity={started ? 1 : 0.6}
            cursor={started ? "pointer" : "not-allowed"}
          >
            {started ? (
              link
            ) : (
              <Tooltip label="Start the Container to connect">{link}</Tooltip>
            )}
          </Link>
        </Text>
        <TabList paddingX="10px">
          <Tab>Info</Tab>
          <Tab>Settings</Tab>
          <Tab>Volumes</Tab>
          <Tab
            isDisabled={!started}
            opacity={started ? 1 : 0.4}
            cursor={started ? "pointer" : "not-allowed"}
          >
            {started ? (
              "Logs"
            ) : (
              <Tooltip label="Start the Container to see logs">Logs</Tooltip>
            )}
          </Tab>
        </TabList>
        <TabPanels paddingX="10px">
          <TabPanel paddingX="0px">
            Path: {`${gitUserBasePath}${repository.repositoryName}`}
          </TabPanel>
          <TabPanel paddingX="0px" paddingY="10px">
            <Flex justifyContent="flex-end">
              <Button
                type="submit"
                name="action"
                value="delete"
                backgroundColor="red.400"
                color="white"
                _hover={{ background: "red.500" }}
                _active={{
                  background: "red.500",
                }}
                rightIcon={<Icon as={FaTrash} />}
                isLoading={
                  transition.submission?.formData.get("action") === "delete" &&
                  transition.submission.formData.get("repositoryName") ===
                    repository.repositoryName
                }
              >
                Delete
              </Button>
            </Flex>
          </TabPanel>
          <TabPanel paddingX="0px">
            {repository.volumes.map((volume, i) => (
              <Flex key={i}>
                <Input
                  name="volume"
                  value={volume}
                  marginBottom="10px"
                  readOnly
                />
                <IconButton
                  type="submit"
                  name="action"
                  value="deleteVolume"
                  marginLeft="10px"
                  aria-label="Remove Volume"
                  icon={<Icon as={FaMinus} />}
                  background="red.100"
                  color="red.500"
                  _hover={{ background: "red.200" }}
                  _active={{
                    background: "red.200",
                  }}
                />
              </Flex>
            ))}
            <Flex>
              <Input name="volume" />
              <IconButton
                type="submit"
                name="action"
                value="createVolume"
                marginLeft="10px"
                aria-label="Add Volume"
                icon={<Icon as={FaPlus} />}
                background="green.100"
                color="green.500"
                _hover={{ background: "green.200" }}
                _active={{
                  background: "green.200",
                }}
              />
            </Flex>
          </TabPanel>
          <TabPanel paddingX="0px">
            <Collapse in={tabIndex == 1} animate>
              {started && repository.containerId ? (
                <LogTerminal containerId={repository.containerId} />
              ) : null}
            </Collapse>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Collapse>
  );
};
