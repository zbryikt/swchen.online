(->
  config = do
    debug: false
    is-production: true
    domain: \swchen.online
    facebook:
      clientID: \1234
    google:
      clientID: \1234
  if module? => module.exports = config
)!

