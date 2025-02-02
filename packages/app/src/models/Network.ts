import type { DockerNetwork } from "../types";

export const Network = (network: DockerNetwork) => {
  return {
    ...network,
  };
};

export type Network = ReturnType<typeof Network>;

export const Networks = {
  from: (networks: DockerNetwork[]) => {
    return networks.map(Network);
  },
};
