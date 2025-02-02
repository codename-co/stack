import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { error } from "@tauri-apps/plugin-log";
import { useEffect, useState } from "react";
import type { DockerContainer, DockerNetwork, StackName } from "../types.d";
import { Containers, Networks, type Container, type Network } from "../models";

enum BackendEventsEnum {
  DockerStacks = "docker:stacks",
  DockerContainers = "docker:containers",
  DockerNetworks = "docker:networks",
}
type BackendDataStreams = {
  [BackendEventsEnum.DockerStacks]: ["docker:stacks", StackName[]];
  [BackendEventsEnum.DockerContainers]: ["docker:containers", Container[]];
  [BackendEventsEnum.DockerNetworks]: ["docker:networks", Network[]];
};

export function useDataStream(subscriptions: `${BackendEventsEnum}`[]) {
  const [isConnected, setConnected] = useState(false);
  const [stacks, setStacks] = useState<StackName[]>();
  const [containers, setContainers] = useState<Container[]>();
  const [networks, setNetworks] = useState<Network[]>();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupListener = async (event: `${BackendEventsEnum}`) => {
      try {
        unsubscribe = await listen<BackendDataStreams[typeof event]>(
          event,
          (data) => {
            setConnected(true);
            if (event === "docker:containers") {
              setContainers(
                Containers.from(data.payload[1] as DockerContainer[])
              );
              return;
            } else if (event === "docker:stacks") {
              let _stacks = data.payload[1] as StackName[];
              _stacks.sort((a, b) =>
                a.toLowerCase() > b.toLowerCase() ? 1 : -1
              );
              setStacks(_stacks);
              return;
            } else if (event === "docker:networks") {
              setNetworks(Networks.from(data.payload[1] as DockerNetwork[]));
              return;
            }
          }
        );

        await invoke("docker_events");
      } catch (err: any) {
        error(`Failed to setup listener: ${err.message}`);
        setConnected(false);
      }
    };

    for (const subscription of subscriptions) {
      setupListener(subscription);
    }

    return () => {
      unsubscribe?.();
      setConnected(false);
    };
  }, []);

  return { isConnected, containers, networks, stacks };
}
