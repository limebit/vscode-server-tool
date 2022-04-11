import * as React from "react";
import { Box, Button, Checkbox, Flex } from "@chakra-ui/react";
import { ActionFunction, Form, LoaderFunction, useLoaderData } from "remix";
import { requireAdminId } from "../../utils/session.server";
import { db } from "~/utils/prisma.server";

type LoaderData = {
  enableRegister: boolean;
} | null;

export const action: ActionFunction = async ({ request }) => {
  await requireAdminId(request);

  const formData = await request.formData();

  await db.meta.update({
    where: {
      key: "enable_register",
    },
    data: {
      value: formData.get("register") == "register" ? "true" : "false",
    },
  });

  return null;
};

export const loader: LoaderFunction = async ({ request }) => {
  await requireAdminId(request);

  const enableRegister = await db.meta.findFirst({
    where: { key: "enable_register" },
  });

  return { enableRegister: enableRegister?.value == "true" };
};

export default function AccountSettings() {
  const data = useLoaderData<LoaderData>();

  return (
    <Box
      boxShadow="rgba(100, 100, 111, 0.2) 0px 7px 29px 0px"
      borderRadius="10px"
      padding="10px"
    >
      <Form method="post">
        {data ? (
          <Checkbox
            defaultChecked={data.enableRegister}
            name="register"
            value="register"
          >
            Enable Register
          </Checkbox>
        ) : null}
        <Flex justifyContent="flex-end" marginTop="50px">
          <Button type="submit">Save</Button>
        </Flex>
      </Form>
    </Box>
  );
}
