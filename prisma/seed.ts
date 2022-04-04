import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
  const username = process.env.ADMIN_USER ?? "admin";

  await prisma.user.upsert({
    where: {
      username,
    },
    update: {},
    create: {
      username,
      passwordHash:
        "$2b$10$chDkdoKB/eO5u75vXrY0yOSQ.vKEc3PnlhnM0qhwnYXaDUP82dmBW", // hash for password admin
      githubToken: "",
    },
  });
}

void seed();
