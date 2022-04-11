import * as React from "react";
import { Box } from "@chakra-ui/react";
import type { LoaderFunction } from "remix";
import { requireUserId } from "../../utils/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  await requireUserId(request);

  return null;
};

export default function RepositorySettings() {
  return (
    <Box
      boxShadow="rgba(100, 100, 111, 0.2) 0px 7px 29px 0px"
      borderRadius="10px"
      padding="10px"
    >
      Hallo
    </Box>
  );
}
