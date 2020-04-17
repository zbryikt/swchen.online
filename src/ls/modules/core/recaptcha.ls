(->
  ldc.register "recaptcha", [], ->
    lc = ready: false, queue: []
    if !(grecaptcha?) => return get: -> Promise.resolve('')
    grecaptcha.ready ->
      lc.ready = true
      lc.queue.map -> it.res!
      lc.queue = []
    return do
      get: (action = \generic) ->
        p = new Promise (res, rej) -> if !lc.ready => return lc.queue.push {res, rej} else res!
        p
          .then -> grecaptcha.execute('6LcdYOoUAAAAACmrOiNaMvaV2XPVWA1ZuN-x6LvS', {action})
          .then (token) -> return token
)!
