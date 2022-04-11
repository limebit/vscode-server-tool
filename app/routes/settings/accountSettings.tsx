import * as React from "react";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
} from "@chakra-ui/react";
import { ActionFunction, Form, LoaderFunction } from "remix";
import { requireUserId, update } from "../../utils/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  await requireUserId(request);

  return null;
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);

  const formData = await request.formData();

  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const token = formData.get("token") as string;

  await update({
    userId,
    username,
    token,
    password,
  });

  return null;
};

export default function AccountSettings() {
  return (
    <Box
      boxShadow="rgba(100, 100, 111, 0.2) 0px 7px 29px 0px"
      borderRadius="10px"
      padding="10px"
    >
      <Form method="post">
        <FormControl>
          <FormLabel htmlFor="username">Username</FormLabel>
          <Input id="username" type="username" name="username" />
          <FormLabel htmlFor="password" marginTop="10px">
            Password
          </FormLabel>
          <Input id="password" type="password" name="password" />
          <FormLabel htmlFor="token" marginTop="10px">
            GitHub Token
          </FormLabel>
          <Input id="token" type="token" name="token" />
        </FormControl>
        <Flex justifyContent="flex-end" marginTop="50px">
          <Button type="submit">Save</Button>
        </Flex>
      </Form>
    </Box>
  );
}
