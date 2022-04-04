const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function seed() {
  const username = process.env.ADMIN_USER || "admin";
  const passwordHash = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || "admin",
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
    },
  });
}

void seed();
