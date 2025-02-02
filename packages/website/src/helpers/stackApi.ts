const STACK_API_ORIGIN = "https://127.1:57404";

const fetcher = async (endpoint: string, init?: RequestInit) => {
  const response = await fetch(`${STACK_API_ORIGIN}${endpoint}`, init);
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  return response.text();
};

export const isApiAccessible = async () => {
  try {
    return (await fetcher("/health")) === "OK";
  } catch (e) {
    return false;
  }
};

export const runStack = async (slug: string) => {
  return fetcher(`/run`, {
    method: "POST",
    body: JSON.stringify({ slug }),
  });
};
