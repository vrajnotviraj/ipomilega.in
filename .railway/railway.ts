import { defineRailway, github, project, service } from "railway/iac";

// The site's part of the ipomilega Railway project; the engine repo declares its own part.
export const partial = "ipomilega.in";

export default defineRailway(() => {
  // next build runs at start because Railway builds cannot reach MongoDB on the private network.
  const site = service("ipomilega.in", {
    source: github("vrajnotviraj/ipomilega.in"),
    build: { buildCommand: "echo next build runs at start", buildEnvironment: "V3", builder: "RAILPACK" },
    // next runs without npm in front, so it gets Railway's SIGTERM directly and npm holds no memory.
    start: "npm run build && exec node_modules/.bin/next start",
    healthcheck: "/robots.txt",
    healthcheckTimeout: 300,
    replicas: { "asia-southeast1-eqsg3a": 1 },
  });

  // Variables, secrets included, are set in Railway and not managed here.
  return project("ipomilega", {
    variables: { managed: false },
    resources: [site],
  });
});
