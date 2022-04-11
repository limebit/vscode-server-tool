import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function seed() {
  const username = process.env.ADMIN_USER ?? "admin";
  const passwordHash = await bcrypt.hash(
    process.env.ADMIN_PASSWORD ?? "admin",
    10
  );

  await prisma.user.upsert({
    where: {
      username,
    },
    update: {},
    create: {
      username,
      passwordHash,
      githubToken: "",
      status: "admin",
    },
  });

  await prisma.meta.upsert({
    where: {
      key: "enable_register",
    },
    update: {},
    create: {
      key: "enable_register",
      value: "true",
    },
  });
}

void seed();
