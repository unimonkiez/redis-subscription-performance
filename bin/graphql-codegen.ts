import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "./src/schema.graphql",
  generates: {
    "./src/resolvers-generated.ts": {
      config: {
        namingConvention: {
          default: "change-case#pascalCase",
          enumValues: "change-case#upperCase"
        },
        useIndexSignature: true,
        contextType: "./context#GraphqlContext",
        scalars: {
          Timestamp: "Date"
        }
      },
      plugins: [
        "typescript",
        "typescript-resolvers",
        {
          add: {
            content: "/* eslint-disable */",
            placement: "prepend",
          },
        },
      ],
    },
  },
};

export default config;
