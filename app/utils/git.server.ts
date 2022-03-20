import shell from "shelljs";

shell.cd(__dirname);

const clone = (repositoryName: string) => {
  shell.exec(`git clone ${repositoryName}`);
};

export { clone };
