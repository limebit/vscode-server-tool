-- CreateEnum
CREATE TYPE "RunState" AS ENUM ('started', 'stopped');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('admin', 'member');

-- CreateTable
CREATE TABLE "Repository" (
    "id" TEXT NOT NULL,
    "repositoryName" TEXT NOT NULL,
    "runState" "RunState" NOT NULL DEFAULT E'stopped',
    "userId" TEXT NOT NULL,
    "containerId" TEXT,

    CONSTRAINT "Repository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "githubToken" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT E'member',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meta" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Meta_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Repository" ADD CONSTRAINT "Repository_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
