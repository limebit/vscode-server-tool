import * as React from "react";
import { Box, Flex, Icon, IconButton, Input, Link } from "@chakra-ui/react";
import { FaPlay, FaStop, FaSlidersH, FaExternalLinkAlt } from "react-icons/fa";
import { useState } from "react";
import { RepositorySettings } from "./repositorySettings";
import { Repository } from "@prisma/client";

interface RepositoryCardProps {
  repository: Repository;
  last?: boolean;
}

export const RepositoryCard = ({ repository, last }: RepositoryCardProps) => {
  const [open, setOpen] = useState(false);
  const link =
    process.env.NODE_ENV == "production"
      ? `http://${process.env.HOST}/${repository.id}/`
      : `http://localhost:3030/${repository.id}/`;

  return (
    <form method="post" action="/?index">
      <Box
        borderBottom={last || open ? undefined : "1px"}
        borderColor="gray.200"
      >
        <Flex
          justifyContent="space-between"
          alignItems="center"
          paddingY="10px"
          paddingX="10px"
        >
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
            <Link
              as="a"
              href={repository.runState == "started" ? link : undefined}
              isExternal
            >
              <IconButton
                marginLeft="10px"
                aria-label="Open Container"
                icon={<Icon as={FaExternalLinkAlt} />}
                disabled={repository.runState != "started"}
              />
            </Link>
          </Flex>
        </Flex>
        <RepositorySettings repository={repository} open={open} last={last} />
      </Box>
    </form>
  );
};
