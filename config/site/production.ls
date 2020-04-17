(->
  config = do
    debug: false
    is-production: true
    domain: \swchen.org
    facebook:
      clientID: \1234
    google:
      clientID: \1234
    grecaptcha:
      siteKey: \6LcdYOoUAAAAACmrOiNaMvaV2XPVWA1ZuN-x6LvS
  if module? => module.exports = config
)!

