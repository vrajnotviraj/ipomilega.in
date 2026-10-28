import { defineRailway, github, project, service } from "railway/iac";

// The site's part of the ipomilega Railway project; the engine repo declares its own part.
export const partial = "ipomilega.in";

export default defineRailway(() => {
  const site = service("ipomilega.in", {
    source: github("vrajnotviraj/ipomilega.in", { branch: "master" }),
    // The build reads no database (pages render on first visit), so it runs in Railway's build step.
    build: { buildCommand: "npm run build", buildEnvironment: "V3", builder: "RAILPACK" },
    // The standalone server runs without npm in front, so it gets Railway's SIGTERM directly. :: listens on IPv4 and IPv6.
    start: "env HOSTNAME=:: node .next/standalone/server.js",
    healthcheck: "/robots.txt",
    healthcheckTimeout: 60,
    replicas: { "asia-southeast1-eqsg3a": 1 },
  });

  // Variables, secrets included, are set in Railway and not managed here.
  return project("ipomilega", {
    variables: { managed: false },
    resources: [site],
  });
});
