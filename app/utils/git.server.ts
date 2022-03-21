import shell from "shelljs";

shell.cd(__dirname);

const cloneRepository = (repositoryName: string) => {
  shell.exec(`git clone ${repositoryName}`);
};

const deleteRepository = (repositoryName: string) => {
  shell.rm("rf", repositoryName);
};

export { cloneRepository, deleteRepository };
