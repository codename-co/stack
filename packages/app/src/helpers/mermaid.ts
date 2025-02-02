import type { Container, Network } from "../models";
import type { StackName } from "../types";

export const generateStackDiagram = (
  stackName: StackName,
  containers?: Container[],
  networks?: Network[]
) => {
  containers = containers?.filter((container) => container.stack === stackName);

  if (!containers?.length || !networks?.length) {
    return undefined;
  }

  const internalNetworks = networks?.filter((network) => network.Internal);

  const internalOnlyContainers = containers?.filter((container) =>
    container.belongsToNetworks(internalNetworks)
  );

  const containersGroupedByNetwork = internalOnlyContainers?.reduce(
    (acc, container) => {
      const networkName = Object.keys(container.NetworkSettings.Networks)[0];
      if (!acc[networkName]) {
        acc[networkName] = [];
      }
      acc[networkName].push(container);
      return acc;
    },
    {} as Record<string, Container[]>
  );

  return /* mermaid */ `
C4Context
  Enterprise_Boundary(enterprise, "Company Name") {
  Person(user, "")

  System_Boundary(host, "Host") {

    System_Boundary(${stackName}, "${stackName}") {
      ${
        containers
          ?.map(
            (container) => `
      Container(${container.Id}, "${container.name}")`
          )
          .join("") ?? ""
      }
      ${
        // map over each network and create a system for each container
        Object.entries(containersGroupedByNetwork ?? {})
          .map(
            ([networkName, networkContainers]) => `
      System_Boundary(n_${networkName}, "${networkName}") {
              ${networkContainers
                .map(
                  (container) => `
        Container(${container.Id}, "${container.name}")`
                )
                .join("")}
      }
          `
          )
          .join("") ?? ""
      }
    }
  }
}
`;
};
