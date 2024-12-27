module.exports = {
  apps: [
    {
      name: "nwed-nyin",
      script: "node .output/server/index.mjs",
      port: 4000,
      cwd: "./",

      env: {
        NODE_ENV: "production",
      },

      // Process management
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,

      // Logging
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",

      max_memory_restart: "1G", // Restart if memory usage exceeds 1GB
    },
  ],
};
