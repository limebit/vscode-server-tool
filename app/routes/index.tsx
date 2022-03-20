import { CheckCircleIcon, CloseIcon, DownloadIcon } from "@chakra-ui/icons";
import { Box, Flex, IconButton, Input, Tag } from "@chakra-ui/react";
import { Repository } from "@prisma/client";
import * as React from "react";
import { json, useLoaderData } from "remix";
import { db } from "~/utils/prisma.server";

export const loader = async () => {
  return json(await db.repository.findMany());
};

export default function Index() {
  const repositories = useLoaderData<Repository[]>();
  console.log(repositories);

  return (
    <Box display="grid" justifyContent="center">
      <Box width="1200px">
        <Flex
          marginTop="30px"
          borderRadius="10px"
          justifyContent="space-around"
          paddingY="10px"
          boxShadow="rgba(100, 100, 111, 0.2) 0px 7px 29px 0px"
          paddingX="20px"
        >
          <Input placeholder="git@github.com:limebit/vscode-server-tool.git" />
          <IconButton
            marginLeft="20px"
            aria-label="load git repo"
            icon={<DownloadIcon />}
          />
        </Flex>
        {repositories.length > 0 ? (
          <Box
            marginTop="30px"
            borderRadius="10px"
            boxShadow="rgba(100, 100, 111, 0.2) 0px 7px 29px 0px"
          >
            {repositories.map((repository, i) => (
              <Flex
                paddingY="10px"
                paddingX="20px"
                borderBottom={i == repositories.length - 1 ? undefined : "1px"}
                borderColor="gray.200"
                justifyContent="space-around"
                alignItems="center"
                key={i}
              >
                <Flex width="90%" justifyContent="space-between">
                  {repository.repositoryName}
                  <Tag
                    colorScheme={
                      repository.runState == "started" ? "green" : "red"
                    }
                  >
                    {repository.runState}
                  </Tag>
                </Flex>
                <IconButton
                  marginLeft="20px"
                  aria-label="Start Container"
                  icon={<CheckCircleIcon />}
                />
                <IconButton
                  marginLeft="20px"
                  aria-label="Stop Container"
                  icon={<CloseIcon />}
                />
              </Flex>
            ))}
          </Box>
        ) : undefined}
      </Box>
    </Box>
  );
}
