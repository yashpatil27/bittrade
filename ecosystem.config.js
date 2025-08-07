module.exports = {
  apps: [
    {
      name: 'bittrade-server',
      script: 'server/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      log_file: 'logs/bittrade-server.log',
      error_file: 'logs/bittrade-server-error.log',
      out_file: 'logs/bittrade-server-out.log',
      pid_file: 'logs/bittrade-server.pid',
      max_memory_restart: '500M',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'client/build'],
      restart_delay: 4000
    },
    {
      name: 'bittrade-client',
      script: 'client/static-server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      log_file: 'logs/bittrade-client.log',
      error_file: 'logs/bittrade-client-error.log',
      out_file: 'logs/bittrade-client-out.log',
      pid_file: 'logs/bittrade-client.pid',
      max_memory_restart: '200M',
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      restart_delay: 4000
    }
  ]
};
