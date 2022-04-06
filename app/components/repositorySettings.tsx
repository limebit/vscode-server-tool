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
} from "@chakra-ui/react";
import { useState } from "react";
import type { Repository } from "@prisma/client";
import { FaTrash } from "react-icons/fa";
import { LogTerminal } from "./logTerminal";

interface RepositorySettingsProps {
  repository: Repository;
  open: boolean;
  link: string;
  last?: boolean;
}

export const RepositorySettings = ({
  repository,
  open,
  link,
  last,
}: RepositorySettingsProps) => {
  const [tabIndex, setTabIndex] = useState(0);

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
        onChange={(index) => setTabIndex(index)}
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
          <Tab>Settings</Tab>
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
              >
                Delete
              </Button>
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
