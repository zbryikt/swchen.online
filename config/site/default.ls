(->
  config = do
    debug: false
    is-production: false
    domain: \swchen.local
    facebook:
      clientID: \1234
    google:
      clientID: \1234
  if module? => module.exports = config
)!

