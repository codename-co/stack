export const getRepoStars = async (repo: string) => {
  const isGithub = repo.startsWith("https://github.com/");
  if (!isGithub) {
    return undefined;
  }

  const url = new URL(repo);
  url.hostname = "api.github.com";
  url.pathname = `/repos${url.pathname}`;
  console.log(url.toString());
  try {
    const data = await (await fetch(url)).json();
    console.log(data.stargazers_count);
    return data.stargazers_count;
  } catch (error) {
    console.error(error);
    return undefined;
  }
};
