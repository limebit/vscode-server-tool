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
} from "@chakra-ui/react";
import { useState } from "react";
import { LogTerminal } from "./logTerminal";
import { Repository } from "@prisma/client";

interface RepositorySettingsProps {
  repository: Repository;
  open: boolean;
  last?: boolean;
}

export const RepositorySettings = ({
  repository,
  open,
  last,
}: RepositorySettingsProps) => {
  const [tabIndex, setTabIndex] = useState(0);
  const link =
    process.env.NODE_ENV == "production"
      ? `http://${process.env.HOST}/${repository.id}/`
      : `http://localhost:3030/${repository.id}/`;

  return (
    <Collapse in={open} animate>
      <Tabs
        paddingTop="10px"
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
          <Link as="a" href={link} isExternal>
            {link}
          </Link>
        </Text>
        <TabList paddingX="10px">
          <Tab>One</Tab>
          <Tab
            isDisabled={repository.runState != "started"}
            opacity={repository.runState == "started" ? 1 : 0.4}
            cursor={
              repository.runState == "started" ? "pointer" : "not-allowed"
            }
          >
            {repository.runState == "started" ? (
              "Logs"
            ) : (
              <Tooltip label="Start the Container to see logs">Logs</Tooltip>
            )}
          </Tab>
        </TabList>
        <TabPanels paddingX="10px">
          <TabPanel>
            <p>one!</p>
          </TabPanel>
          <TabPanel>
            <Collapse in={tabIndex == 1} animate>
              {repository.runState == "started" && repository.containerId ? (
                <LogTerminal containerId={repository.containerId} />
              ) : null}
            </Collapse>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Collapse>
  );
};
