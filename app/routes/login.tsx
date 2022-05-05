import { Box, Button, Flex, Heading, Input, Link } from "@chakra-ui/react";
import * as React from "react";
import {
  ActionFunction,
  Link as ReachLink,
  LoaderFunction,
  redirect,
  useLoaderData,
} from "remix";
import { createUserSession, login } from "../utils/session.server";
import { db } from "~/utils/prisma.server";

type LoaderData = {
  enableRegister: boolean;
} | null;

export const action: ActionFunction = async ({ request }) => {
  const { username, password } = Object.fromEntries(await request.formData());

  if (typeof username !== "string" || typeof password !== "string") {
    return { formError: `Form not submitted correctly.` };
  }

  const user = await login({ username, password });

  const enableRegister = await db.meta.findFirst({
    where: { key: "enable_register" },
  });

  if (!user) {
    return enableRegister?.value == "true" ? redirect("/register") : null;
  }

  return createUserSession(user.id, "/");
};

export const loader: LoaderFunction = async () => {
  const enableRegister = await db.meta.findFirst({
    where: { key: "enable_register" },
  });

  return { enableRegister: enableRegister?.value == "true" };
};

export default function Login() {
  const data = useLoaderData<LoaderData>();

  return (
    <Box display="grid" justifyContent="center">
      <Box width="1200px" display="grid" justifyContent="center">
        <Box marginTop="30px" display="grid" justifyContent="center">
          <Heading>VS Code Server Tool</Heading>
        </Box>
        <form method="post">
          <Flex
            marginTop="30px"
            borderRadius="10px"
            paddingY="10px"
            boxShadow="rgba(100, 100, 111, 0.2) 0px 7px 29px 0px"
            paddingX="10px"
            width="400px"
            flexDirection="column"
          >
            <Input placeholder="GitHub Username" name="username" />
            <Input
              marginTop="10px"
              type="password"
              placeholder="Password"
              name="password"
            />
            <Button marginTop="10px" type="submit">
              Login
            </Button>
            {data?.enableRegister ? (
              <Link as={ReachLink} to="/register">
                <Button marginTop="10px" width="100%">
                  I am a new User
                </Button>
              </Link>
            ) : null}
          </Flex>
        </form>
      </Box>
    </Box>
  );
}
