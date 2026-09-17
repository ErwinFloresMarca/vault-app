module.exports = {
  apps: [
    {
      name: 'vault-app',
      script: '.output/server/index.mjs',
      cwd: '/var/www/vault-app/current',
      interpreter: 'node',
      interpreter_args: '--env-file=.env',
      exec_mode: 'fork',
      instances: 1,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        // Puerto distinto al de coin-holder (3000) para convivir en la misma VPS.
        PORT: 3001,
      },
      autorestart: true,
      exp_backoff_restart_delay: 100,
    },
  ],
}
