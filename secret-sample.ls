module.exports = do
  config: \default
  port: \7001 # backend port
  limit: '5mb'
  watch: true
  sharedb: enabled: false
  build:
    watcher: do
      ignores: ['\/\..*\.swp$', '^static/s', '^static/assets/img']
    assets: []
