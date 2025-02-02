export const parseDotEnv = (env?: string) => {
  if (!env) return {};

  const obj: Record<string, string> = {};
  env
    .split("\n")
    .filter(Boolean)
    .forEach((line) => {
      line = line.trim();
      const isComment = line.startsWith("#");
      const [key, value] = line.split("=");
      if (key && !isComment) {
        obj[key] = value;
      }
    });
  return obj;
};
