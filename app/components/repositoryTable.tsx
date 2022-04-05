import * as React from "react";
import { Box } from "@chakra-ui/react";
import type { Repository } from "@prisma/client";
import { RepositoryCard } from "../components/repositoryCard";

interface RepositoryTableProps {
  repositories: Repository[];
  containerBaseUrl: string;
}

export const RepositoryTable = ({
  repositories,
  containerBaseUrl,
}: RepositoryTableProps) => {
  return repositories.length > 0 ? (
    <Box
      marginTop="30px"
      borderRadius="10px"
      boxShadow="rgba(100, 100, 111, 0.2) 0px 7px 29px 0px"
      marginBottom="40px"
    >
      {repositories.map((repository, i) => (
        <RepositoryCard
          repository={repository}
          key={i}
          containerBaseUrl={containerBaseUrl}
          last={i == repositories.length - 1}
        />
      ))}
    </Box>
  ) : null;
};
