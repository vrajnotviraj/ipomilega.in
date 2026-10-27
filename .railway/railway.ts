import { defineRailway, project, service } from "railway/iac";

// The site's part of the ipomilega Railway project; the engine repo declares its own part.
export const partial = "ipomilega.in";

export default defineRailway(() => {
  // next build runs at start because Railway builds cannot reach MongoDB on the private network.
  const site = service("ipomilega.in", {
    build: { buildCommand: "echo next build runs at start", buildEnvironment: "V3", builder: "RAILPACK" },
    start: "npm run build && npm start",
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
