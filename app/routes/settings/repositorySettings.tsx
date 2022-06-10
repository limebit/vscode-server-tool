import * as React from "react";
import {
  Box,
  Flex,
  FormLabel,
  Icon,
  IconButton,
  Input,
} from "@chakra-ui/react";
import { ActionFunction, Form, LoaderFunction, useLoaderData } from "remix";
import { FaMinus, FaPlus } from "react-icons/fa";
import { requireUser } from "../../utils/session.server";
import { db } from "~/utils/prisma.server";

type LoaderData = {
  extensions: string[];
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireUser(request);

  return { extensions: user.extensions };
};

export const action: ActionFunction = async ({ request }) => {
  const user = await requireUser(request);

  const formData = await request.formData();
  const extension = formData.get("extension");

  console.log(formData);

  switch (formData.get("action")) {
    case "create":
      await db.user.update({
        where: { id: user.id },
        data: {
          extensions: [...user.extensions, extension as string],
        },
      });
      break;

    case "delete":
      await db.user.update({
        where: { id: user.id },
        data: {
          extensions: user.extensions.filter((element) => element != extension),
        },
      });
      break;

    default:
      return null;
  }

  return null;
};

export default function RepositorySettings() {
  const data = useLoaderData<LoaderData>();

  return (
    <Box
      boxShadow="rgba(100, 100, 111, 0.2) 0px 7px 29px 0px"
      borderRadius="10px"
      padding="10px"
    >
      <FormLabel>Extensions</FormLabel>
      {data.extensions.map((extension, i) => (
        <Form method="post" key={i}>
          <Flex>
            <Input
              name="extension"
              value={extension}
              marginBottom="10px"
              readOnly
            />
            <IconButton
              type="submit"
              name="action"
              value="delete"
              marginLeft="10px"
              aria-label="Remove Extension"
              icon={<Icon as={FaMinus} />}
              background="red.100"
              color="red.500"
              _hover={{ background: "red.200" }}
              _active={{
                background: "red.200",
              }}
            />
          </Flex>
        </Form>
      ))}
      <Form method="post">
        <Flex>
          <Input name="extension" />
          <IconButton
            type="submit"
            name="action"
            value="create"
            marginLeft="10px"
            aria-label="Add Extension"
            icon={<Icon as={FaPlus} />}
            background="green.100"
            color="green.500"
            _hover={{ background: "green.200" }}
            _active={{
              background: "green.200",
            }}
          />
        </Flex>
      </Form>
    </Box>
  );
}
