import { rm, mkdir } from "fs/promises";
import path from "path";
import simpleGit from "simple-git";
import type { User } from "@prisma/client";
import { decrypt } from "./encryption.server";

const gitFolder = path.resolve(process.cwd(), "git-repos");

const cloneRepository = async (repository: string, user: User) => {
  const userPath = path.resolve(gitFolder, user.id);
  await mkdir(userPath, { recursive: true });

  const git = simpleGit({
    baseDir: userPath,
  });

  await git.clone(
    repository.replace(
      "github.com",
      `${user.username}:${
        user.githubToken ? decrypt(user.githubToken) : ""
      }@github.com`
    )
  );
};

const deleteRepository = async (repository: string, userId: string) => {
  await rm(path.resolve(gitFolder, userId, repository), {
    recursive: true,
    force: true,
  });
};

export { gitFolder, cloneRepository, deleteRepository };
