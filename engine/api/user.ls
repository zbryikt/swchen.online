require! <[fs fs-extra path crypto read-chunk sharp express-formidable uploadr express-rate-limit]>
require! <[../aux ./util/grecaptcha]>
(engine,io) <- (->module.exports = it)  _

api = engine.router.api
app = engine.app


throttling = thr = do
  base: express-rate-limit do
    windowMs: 24 * 60 * 60 * 1000
    max: 5
    keyGenerator: (req) -> "#{aux.ip(req)}:#{req.baseUrl}#{req.path}"

# - clear cookie -
# sometimes for some unknown reason, users' cookie might corrupted.
# these two routes help users reset their cookie, and redirect to original page.

clear-user-cookie = (req, res) ->
  res.clearCookie \connect.sid, {path:'/', domain: ".#{engine.config.domain}" }
  # clear all possible cookies that might be used in the past.
  res.clearCookie \connect.sid, {path:'/'}
  <[localhost loading.io .loading.io]>.map ->
    res.clearCookie \connect.sid, {path:'/', domain: it}
  res.clearCookie \global, {path:'/', domain: ".#{engine.config.domain}"}

api.get "/me/reauth/", (req, res) ->
  clear-user-cookie req, res
  res.send!

app.get "/me/reauth/", (req, res) ->
  clear-user-cookie req, res
  res.redirect """/auth/#{if req.query.nexturl => ("?nexturl=" + that) else ''}"""

api.delete \/me/, (req, res) ->
  if !(req.user and req.user.key) => return aux.r400 res
  key = req.user.key
  req.logout!
  io.query "delete from users where key = $1", [key]
    .catch ->
      # delete user failed. there might be some additional rows in other table owned by this user.
      # just remove the username, displayname and mark the account as deleted.
      io.query """
      update users
      set (username,displayname,deleted)
      = (('deleted-' || key),('user ' || key),true)
      where key = $1
      """, [key]
    .then -> res.send!
    .catch aux.error-handler res

api.get \/me/, (req, res) ->
  ret = {}
  if !req.user => return res.json '{}'
  id = req.user.key
  io.query "select key,displayname,description from users where key = $1", [id]
    .then (r={}) ->
      if !r.rows or !r.rows.length => return aux.reject 404
      ret.user = r.rows.0
    .then (r={}) ->
      res.send ret
      return null
    .catch aux.error-handler res

render-profile = (req, res, id) ->
  ret = {}
  io.query "select key,displayname, description from users where key = $1", [id]
    .then (r={}) ->
      if !r.rows or !r.rows.length => return aux.reject 404
      ret.user = r.rows.0
  #    io.query "select * from file where owner = $1", [id]
  #  .then (r={}) ->
  #    ret.files = r.rows or []
  #    io.query "select * from doc where owner = $1 order by accesstime desc", [id]
  #  .then (r={}) ->
  #    ret.docs = r.rows or []
      res.render \me/profile.pug, ret
      return null
    .catch aux.error-handler res

app.get \/me/, aux.needlogin (req, res) ->
  render-profile req, res, req.user.key

app.get \/user/:id, aux.numid true, (req, res) ->
  io.query """
  select key,displayname,description,createdtime,plan from users where key = $1 and deleted is not true
  """, [req.params.id]
    .then (r={}) ->
      if !r.rows or !r.rows.length => return aux.reject 404
      res.render \me/user.pug, {user: r.rows.0}
    .catch aux.error-handler res

app.get \/me/settings/, aux.needlogin (req, res) ->
  res.render \me/settings.pug, {user: req.user}

api.put \/user/:id, aux.numid false, (req, res) ->
  if !req.user or req.user.key != +req.params.id => return aux.r403 res
  {displayname, description, public_email} = req.body{displayname, description, public_email}
  displayname = "#displayname".trim!
  description = "#description".trim!
  public_email = !!!public_email
  if displayname.length > 30 or displayname.length < 1 => return aux.r400 res, ("profile.displayname.length")
  if description.length > 200 => return aux.r400 res, ("profile.description.toolong")
  io.query "update users set (displayname,description,public_email) = ($1,$2,$3) where key = $4",
  [displayname, description, public_email, req.user.key]
    .then ->
      req.user <<< {displayname, description, public_email}
      req.login req.user, -> res.send!
      return null

app.put \/me/avatar, engine.multi.parser, (req, res) ->
  if !req.user => return aux.r403 res
  if !req.files.image => return aux.r400 res
  fs-extra.ensure-dir "static/s/avatar/" 
    .then ->
      sharp req.files.image.path
        .resize 200,200
        .toFile "static/s/avatar/#{req.user.key}.png", (err, info) ->
          if err => return aux.r500 res, "#{err}"
          res.send!
    .catch -> aux.r500 res

api.post \/me/sync/, (req, res) ->
  if !req.user or !req.user.key => return aux.r400 res
  res.send req.user

api.put \/me/passwd/, (req, res) ->
  {n,o} = req.body{n,o}
  if !req.user or !req.user.usepasswd => return aux.r400 res
  if n.length < 4 => return aux.r400 res, ("profile.newPassword.length")
  io.query "select password from users where key = $1", [req.user.key]
    .then ({rows}) ->
      if !rows or !rows.0 => return aux.reject 403
      io.authio.user.compare o, rows.0.password
        .catch -> return aux.reject 403, ("profile.oldPassword.mismatch")
    .then -> io.authio.user.hashing n, true, true
    .then (pw-hashed) ->
      req.user <<< {password: pw-hashed}
      io.query "update users set password = $1 where key = $2", [pw-hashed, req.user.key]
    .then -> req.login(req.user, -> res.send!); return null
    .catch aux.error-handler res

api.put \/me/su/:id, (req, res) ->
  if !req.user or req.user.username != \tkirby@gmail.com => return aux.r403 res
  io.query "select * from users where key = $1", [+req.params.id]
    .then (r={})->
      if !r.rows or !r.rows.0 => return aux.reject 404
      req.user <<< r.rows.0
      req.logIn r.rows.0, -> res.send!
      return null
    .catch aux.error-handler res

# should be replaced by /me/config/
api.post \/me/legal/, (req, res) ->
  if !(req.user and req.user.key) => return aux.r400 res
  req.user.{}config.legal = new Date!getTime!
  io.query "update users set config = $2 where key = $1", [req.user.key, req.user.config]
    .then -> res.send!
    .catch aux.error-handler res

api.post \/me/config/, (req, res) ->
  if !(req.user and req.user.key) => return aux.r400 res
  if !req.body or typeof(req.body) != \object => return aux.r400 res
  req.user.{}config <<< (req.body{legal})
  io.query "update users set config = $2 where key = $1", [req.user.key, req.user.config]
    .then -> res.send!
    .catch aux.error-handler res

api.get \/me/condolence, (req, res) ->
  if !(req.user and req.user.key) => return res.send({})
  io.query "select * from condolence where owner = $1", [req.user.key]
    .then (r={}) -> ((res.send r.rows or []).0 or {})
    .catch aux.error-handler res

api.post \/condolence, thr.base, express-formidable(), grecaptcha, (req, res) ->
  try
    {content, source, contact, publish, social} = req.fields
  catch e
    return aux.r400 res
  if !(content and source and contact and publish) => return aux.r400 res
  ip = aux.ip(req)
  file = (req.files["file"] or {}).path
  publish = (publish == "1")
  (
    if req.user and req.user.key => io.query "select key,image from condolence where owner = $1", [req.user.key]
    else Promise.resolve({rows: []})
  )
    .then (r={}) ->
      if r.rows.length =>
        io.query """
        update condolence
        set (content,source,contact,publish,image,social,verified,ip)
        = ($2,$3,$4,$5,$6,$7,null,$8) where owner = $1
        returning key
        """, [req.user.key, content, source, contact, publish, (r.rows.0.image or !!file), social, ip]
      else
        io.query """
        insert into condolence
        (owner,content,source,contact,publish,image,social,verified,ip)
        values ($1,$2,$3,$4,$5,$6,$7,null,$8)
        returning key
        """, [(if req.user => req.user.key else null), content, source, contact, publish, !!file, social, ip]
    .then (r={}) -> 
      if file and r.[]rows.length =>
        new Promise (res, rej) ->
          key = r.rows.0.key
          root = "static/assets/uploads"
          (e) <- fs-extra.ensure-dir root, _
          if e => return rej(e)
          (e,i) <- sharp(file).resize(800,600,{fit: 'outside'}).toFile path.join(root, "#key.png"), _
          if e => rej(e) else res!
      else Promise.resolve!
    .then -> res.send {}
    .catch aux.error-handler res

api.get \/condolence, (req, res) ->
  offset = req.query.offset or 0
  latest = req.query.rev != "false"
  io.query """
  select key,source,content,image,social,publish,createdtime,verified from condolence
  where verified = true and publish = true
  order by createdtime #{if !latest => 'desc' else ''}
  offset $1 limit 300
  """, [offset]
    .then (r = {}) -> res.send(r.rows or [])
    .catch aux.error-handler res

api.get \/condolence/admin, aux.authorized-api, (req, res) ->
  {offset,source,verified} = req.query
  verify = if verified == \accept => "= true" else if verified == \reject => "= false" else "is null" 
  io.query """
  select * from condolence
  where verified #{verify}
  offset $1 limit 100
  """, [offset]
    .then (r = {}) -> res.send(r.rows or [])
    .catch aux.error-handler res

app.get \/condolence/admin, aux.authorized (req, res) ->
  res.render 'admin/review.pug'

api.post \/condolence/:key/verify, aux.authorized-api, (req, res) ->
  io.query "update condolence set verified = $1 where key = $2", [req.body.verified, req.params.key]
    .then -> res.send {}
    .catch aux.error-handler res
