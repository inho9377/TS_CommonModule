module.exports = {
  apps: [
    {
      script: "./src/api.ts",
      instances: 1,
      exec_mode: "cluster",
      watch: ".",
      env_development: {
        NODE_ENV: "Development",
      },
      env_production: {
        NODE_ENV: "Production",
      },
    },
  ]
};
