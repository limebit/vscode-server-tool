import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function seed() {
  const passwordHash = await bcrypt.hash(
    process.env.ADMIN_PASSWORD ?? "admin",
    10
  );

  await prisma.user.create({
    data: {
      username: process.env.ADMIN_USER ?? "admin",
      passwordHash,
      githubToken: "",
      status: "admin",
    },
  });
}

void seed();
