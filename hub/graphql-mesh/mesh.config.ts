import {
  defineConfig,
  loadGraphQLHTTPSubgraph,
} from "@graphql-mesh/compose-cli";

export const composeConfig = defineConfig({
  subgraphs: [
    {
      sourceHandler: loadGraphQLHTTPSubgraph("Countries", {
        source: "./sources/countries.schema.gql",
        endpoint: "https://countries.trevorblades.com",
      }),
    },
  ],
});
