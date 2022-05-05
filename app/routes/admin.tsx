import * as React from "react";
import { Box, Flex, Heading } from "@chakra-ui/react";
import { LoaderFunction, Outlet, NavLink } from "remix";
import { requireAdminId } from "../utils/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  await requireAdminId(request);

  return null;
};

export default function Index() {
  return (
    <Box display="grid" justifyContent="center">
      <Box width="1200px">
        <Box marginTop="30px" display="grid" justifyContent="center">
          <Heading>Admin</Heading>
        </Box>
        <Flex marginTop="30px">
          <Box
            width="25%"
            boxShadow="rgba(100, 100, 111, 0.2) 0px 7px 29px 0px"
            borderRadius="10px"
            marginRight="20px"
            overflow="hidden"
            height="fit-content"
          >
            <NavLink
              to="/settings/globalSettings"
              children={({ isActive }) => (
                <Flex
                  justifyContent="space-between"
                  alignItems="center"
                  paddingY="10px"
                  paddingX="10px"
                  backgroundColor={isActive ? "gray.50" : undefined}
                >
                  Global Settings
                </Flex>
              )}
            />
          </Box>
          <Box width="75%">
            <Outlet />
          </Box>
        </Flex>
      </Box>
    </Box>
  );
}
