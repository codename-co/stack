export type StackName = string;

export type DockerContainer = {
  Id: string;
  Names: string[];
  Image: string;
  Command: string;
  Created: number;
  Ports: {
    IP: string;
    PrivatePort: number;
    PublicPort: number;
    Type: string;
  }[];
  Labels: Record<string, string>;
  State: string;
  Status: string;
  HostConfig: {
    NetworkMode: string;
  };
  NetworkSettings: {
    Networks: Record<string, { IPAddress: string }>;
  };
  Mounts: {
    Type: string;
    Source: string;
    Destination: string;
    Mode: string;
    RW: boolean;
    Propagation: string;
  }[];
};

export type DockerNetwork = {
  Name: string;
  Id: string;
  Created: number;
  Scope: "local" | "global";
  Driver: string;
  EnableIPv6: boolean;
  IPAM: {
    Driver: string;
    Config?: {
      Subnet: string;
      Gateway: string;
    }[];
  };
  Internal: boolean;
  Attachable: boolean;
  Ingress: boolean;
  ConfigFrom: {
    Network: string;
  };
  ConfigOnly: boolean;
  Containers: Record<string, { Name: string; EndpointID: string }>;
  Options: Record<string, string>;
  Labels: Record<string, string>;
};
