import * as React from "react";
import { Box } from "@chakra-ui/react";
import type { LoaderFunction } from "remix";
import { requireAdminId } from "~/utils/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  await requireAdminId(request);

  return null;
};

export default function Index() {
  return (
    <Box display="grid" justifyContent="center">
      Hallo
    </Box>
  );
}
