module.exports = {
  apps: [
    {
      name: 'bittrade-server',
      script: './server/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        DB_HOST: '127.0.0.1',
        DB_USER: 'bittrade',
        DB_PASSWORD: 'bittrade123',
        DB_NAME: 'bittrade',
        REDIS_HOST: '127.0.0.1',
        REDIS_PORT: '6379',
        JWT_SECRET: 'bittrade_secret_key_2024_production',
        PORT: 3001,
      },
      output: './logs/server-out.log',
      error: './logs/server-error.log',
      log: './logs/server-combined.log',
    },
    {
      name: 'bittrade-client',
      script: './client/static-server.js',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
      output: './logs/client-out.log',
      error: './logs/client-error.log',
      log: './logs/client-combined.log',
    },
  ],
};
