import * as React from "react";
import {
  Box,
  Button,
  Flex,
  Icon,
  IconButton,
  Input,
  useDisclosure,
} from "@chakra-ui/react";
import { FaPlay, FaStop, FaSlidersH } from "react-icons/fa";
import { useState } from "react";
import { LogTerminal } from "./logTerminal";

interface RepositoryCardProps {
  repository: {
    repositoryName: string;
    runState: "started" | "stopped";
    containerId: string | null;
  };
  last?: boolean;
}

export const RepositoryCard = ({ repository, last }: RepositoryCardProps) => {
  const [open, setOpen] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <form method="post" action="/?index">
      <Box
        paddingY="10px"
        paddingX="10px"
        borderBottom={last ? undefined : "1px"}
        borderColor="gray.200"
      >
        <Flex justifyContent="space-between" alignItems="center">
          <Box marginLeft="10px" fontWeight="bold">
            {repository.repositoryName}
          </Box>
          <Flex alignItems="center">
            <Input
              type="hidden"
              name="repositoryName"
              value={repository.repositoryName}
            />
            {repository.runState == "started" ? (
              <IconButton
                aria-label="Stop Container"
                marginLeft="10px"
                icon={<Icon as={FaStop} />}
                type="submit"
                name="action"
                value="stop"
                background="red.100"
                color="red.500"
                _hover={{ background: "red.200" }}
                _active={{
                  background: "red.200",
                }}
              />
            ) : (
              <IconButton
                aria-label="Start Container"
                icon={<Icon as={FaPlay} />}
                marginLeft="10px"
                type="submit"
                name="action"
                value="start"
                background="green.100"
                color="green.500"
                _hover={{ background: "green.200" }}
                _active={{
                  background: "green.200",
                }}
              />
            )}
            <IconButton
              marginLeft="10px"
              aria-label="Open Settings"
              icon={<Icon as={FaSlidersH} />}
              background="orange.100"
              color="orange.500"
              _hover={{ background: "orange.200" }}
              _active={{
                background: "orange.200",
              }}
              onClick={() => setOpen(!open)}
            />
          </Flex>
        </Flex>
        <Box
          display={open ? "block" : "none"}
          marginLeft="10px"
          marginRight="10px"
        >
          <Button onClick={onOpen} disabled={repository.runState != "started"}>
            Open Logs
          </Button>
          {repository.runState == "started" && repository.containerId ? (
            <LogTerminal
              isOpen={isOpen}
              onClose={onClose}
              containerId={repository.containerId}
            />
          ) : null}
        </Box>
      </Box>
    </form>
  );
};
