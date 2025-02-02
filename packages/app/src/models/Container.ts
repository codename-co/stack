import type { DockerContainer } from "../types";
import { Network } from "./Network";

export const Container = (container: DockerContainer) => {
  return {
    ...container,

    get stack(): string {
      return this.Labels["com.docker.compose.project"];
    },

    get name(): string {
      return (
        this.Labels["stack.name"] ||
        this.Labels["dash.name"] ||
        this.Names[0].replace(new RegExp(`^/${this.stack}-`), "")
      );
    },

    get desc(): string | undefined {
      return this.Labels["stack.desc"] || this.Labels["dash.desc"] || undefined;
    },

    get belongsToNetworks() {
      return (networks?: Network[]) =>
        Object.keys(this.NetworkSettings.Networks).every((networkName) =>
          networks?.some((network) => network.Name === networkName)
        );
    },
  };
};

export type Container = ReturnType<typeof Container>;

export const Containers = {
  from: (containers: DockerContainer[]) => {
    return containers.map(Container);
  },
};
