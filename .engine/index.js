// Generated by LiveScript 1.3.0
(function(){
  var startTime, fs, fsExtra, path, crypto, LiveScript, chokidar, moment, lderror, express, bodyParser, expressSession, connectMultiparty, csurf, expressRateLimit, passport, passportLocal, passportFacebook, passportGoogleOauth20, nodemailer, sharedbWrapper, postgresql, api, ext, view, aux, watch, secret, mod, uglifyJs, lsc, config, colors, modBuilder, customBuilder, backend;
  startTime = Date.now();
  fs = require('fs');
  fsExtra = require('fs-extra');
  path = require('path');
  crypto = require('crypto');
  LiveScript = require('LiveScript');
  chokidar = require('chokidar');
  moment = require('moment');
  lderror = require('lderror');
  express = require('express');
  bodyParser = require('body-parser');
  expressSession = require('express-session');
  connectMultiparty = require('connect-multiparty');
  csurf = require('csurf');
  expressRateLimit = require('express-rate-limit');
  passport = require('passport');
  passportLocal = require('passport-local');
  passportFacebook = require('passport-facebook');
  passportGoogleOauth20 = require('passport-google-oauth20');
  nodemailer = require('nodemailer');
  sharedbWrapper = require('sharedb-wrapper');
  postgresql = require('./io/postgresql');
  api = require('./api');
  ext = require('./ext');
  view = require('./view');
  aux = require('./aux');
  watch = require('./watch');
  secret = require('../secret');
  mod = require('./watch/build/mod');
  uglifyJs = require('uglify-js');
  lsc = require('LiveScript');
  config = require("../config/site/" + secret.config);
  colors = require('colors/safe');
  modBuilder = require("./watch/build/mod");
  customBuilder = require("./watch/custom/");
  backend = {
    updateUser: function(req){
      return req.logIn(req.user, function(){});
    },
    init: function(){
      var this$ = this;
      return new Promise(function(res, rej){
        var pgsql, authio, ref$, csp, cors, enable, throttling, ip, app, getUser, sessionStore, session, access, server, sdb, connect, wss, router, x$, y$, multi, initedTime;
        config = aux.mergeConfig(config, secret);
        pgsql = new postgresql(config);
        authio = pgsql.authio;
        ref$ = [config.csp || [], config.cors, config.enable || {}], csp = ref$[0], cors = ref$[1], enable = ref$[2];
        throttling = {
          route: {
            external: expressRateLimit({
              windowMs: 1 * 60 * 1000,
              max: 30,
              keyGenerator: aux.throttling.key
            }),
            user: expressRateLimit({
              windowMs: 1 * 60 * 1000,
              max: 60,
              keyGenerator: aux.throttling.key
            }),
            api: expressRateLimit({
              windowMs: 1 * 60 * 1000,
              max: 120,
              keyGenerator: aux.throttling.key
            })
          },
          auth: {
            signup: expressRateLimit({
              windowMs: 120 * 60 * 1000,
              max: 10,
              keyGenerator: aux.throttling.key
            }),
            login: expressRateLimit({
              windowMs: 1 * 60 * 1000,
              max: 30,
              keyGenerator: aux.throttling.key
            })
          }
        };
        if (enable.weinre) {
          ip = aux.getIp()[0] || "127.0.0.1";
          csp.map(function(list){
            if (['connect-src', 'script-src'].indexOf(list[0]) < 0) {
              return;
            }
            list.push("http://" + ip + ":8080");
            return list.push("https://" + config.domain);
          });
        }
        app = express();
        console.log(("[Server] Express Initialized in " + app.get('env') + " Mode").green);
        app.disable('x-powered-by');
        app.set('trust proxy', '127.0.0.1');
        if (config.cors) {
          cors = config.cors;
          app.use(function(req, res, next){
            if (cors.route && req.originalUrl.startsWith(cors.route)) {
              res.header("Access-Control-Allow-Origin", cors.domain);
              res.header("Access-Control-Allow-Headers", cors.headers || "Origin, X-Requested-With, Content-Type, Accept");
              res.header("Access-Control-Allow-Methods", cors.methods || "PUT");
            }
            return next();
          });
        }
        csp = csp.map(function(it){
          return it.join(" ");
        }).join("; ");
        app.use(function(req, res, next){
          res.setHeader('Content-Security-Policy', csp);
          res.setHeader('X-Content-Security-Policy', csp);
          return next();
        });
        app.use(bodyParser.json({
          limit: config.limit
        }));
        app.use(bodyParser.urlencoded({
          extended: true,
          limit: config.limit
        }));
        if (app.get('env') !== 'development') {
          app.enable('view cache');
        }
        app.engine('pug', view);
        app.set('view engine', 'pug');
        app.set('views', path.join(__dirname, '../src/pug/'));
        app.locals.viewdir = path.join(__dirname, '../.view/');
        app.locals.basedir = app.get('views');
        getUser = function(u, p, usep, detail, doCreate, done){
          doCreate == null && (doCreate = false);
          return authio.user.get(u, p, usep, detail, doCreate).then(function(it){
            done(null, it);
            return null;
          })['catch'](function(){
            var msg;
            msg = usep ? "incorrect email or password" : "did you login with social account?";
            done(null, false, {
              message: msg
            });
            return null;
          });
        };
        passport.use(new passportLocal.Strategy({
          usernameField: 'email',
          passwordField: 'passwd'
        }, function(u, p, done){
          return getUser(u, p, true, null, false, done);
        }));
        passport.use(new passportGoogleOauth20.Strategy({
          clientID: config.google.clientID,
          clientSecret: config.google.clientSecret,
          callbackURL: "/u/auth/google/callback",
          passReqToCallback: true,
          userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
          profileFields: ['id', 'displayName', 'link', 'emails']
        }, function(request, accessToken, refreshToken, profile, done){
          if (!profile.emails) {
            done(null, false, {
              message: "We can't get email address from your Google account. Please try signing up with email."
            });
            return null;
          }
          return getUser(profile.emails[0].value, null, false, profile, true, done);
        }));
        passport.use(new passportFacebook.Strategy({
          clientID: config.facebook.clientID,
          clientSecret: config.facebook.clientSecret,
          callbackURL: "/u/auth/facebook/callback",
          profileFields: ['id', 'displayName', 'link', 'emails']
        }, function(accessToken, refreshToken, profile, done){
          if (!profile.emails) {
            done(null, false, {
              message: "We can't get email address from your Facebook account. Please try signing up with email."
            });
            return null;
          }
          return getUser(profile.emails[0].value, null, false, profile, true, done);
        }));
        sessionStore = function(){
          return import$(this, authio.session);
        };
        sessionStore.prototype = expressSession.Store.prototype;
        app.use(session = expressSession({
          secret: config.session.secret,
          resave: true,
          saveUninitialized: true,
          store: new sessionStore(),
          proxy: true,
          cookie: {
            path: '/',
            httpOnly: true,
            maxAge: 86400000 * 30 * 12,
            domain: "." + config.domain
          }
        }));
        app.use(passport.initialize());
        app.use(passport.session());
        if ((config.sharedb || (config.sharedb = {})).enabled) {
          access = function(arg$){
            var user, id, data, type;
            user = arg$.user, id = arg$.id, data = arg$.data, type = arg$.type;
            return new Promise(function(res, rej){
              return res();
            });
          };
          this$.sharedb = (ref$ = sharedbWrapper({
            app: app,
            io: config.ioPg,
            session: session,
            access: access
          }), server = ref$.server, sdb = ref$.sdb, connect = ref$.connect, wss = ref$.wss, ref$);
        }
        passport.serializeUser(function(u, done){
          authio.user.serialize(u).then(function(v){
            done(null, v);
            return null;
          });
          return null;
        });
        passport.deserializeUser(function(v, done){
          authio.user.deserialize(v).then(function(u){
            done(null, u) || {};
            return null;
          });
          return null;
        });
        backend.csrfProtection = csurf();
        app.use(backend.csrfProtection);
        router = {
          user: express.Router(),
          api: express.Router()
        };
        app.use('/u', throttling.route.user, router.user);
        x$ = router.user;
        x$.post('/signup', throttling.auth.signup, function(req, res){
          var ref$, email, displayname, passwd, config;
          ref$ = {
            email: (ref$ = req.body).email,
            displayname: ref$.displayname,
            passwd: ref$.passwd,
            config: ref$.config
          }, email = ref$.email, displayname = ref$.displayname, passwd = ref$.passwd, config = ref$.config;
          if (!email || !displayname || passwd.length < 8) {
            return aux.r400(res);
          }
          return authio.user.create(email, passwd, true, {
            displayname: displayname
          }, config || {}).then(function(user){
            req.logIn(user, function(){
              res.redirect('/u/200');
              return null;
            });
            return null;
          })['catch'](function(){
            res.redirect('/u/403');
            return null;
          });
        });
        x$.post('/login', throttling.auth.login, passport.authenticate('local', {
          successRedirect: '/u/200',
          failureRedirect: '/u/403'
        }));
        app.get('/js/global', backend.csrfProtection, function(req, res){
          var payload, ref$;
          res.setHeader('content-type', 'application/json');
          payload = JSON.stringify({
            global: true,
            csrfToken: req.csrfToken(),
            production: config.isProduction,
            ip: aux.ip(req),
            user: req.user
              ? {
                key: (ref$ = req.user).key,
                plan: ref$.plan,
                config: ref$.config,
                displayname: ref$.displayname,
                verified: ref$.verified,
                username: ref$.username
              }
              : {}
          });
          res.cookie('global', payload, {
            path: '/',
            secure: true,
            domain: "." + config.domain
          });
          return res.send(payload);
        });
        app.use('/', express['static'](path.join(__dirname, '../static')));
        app.use('/d', throttling.route.api, router.api);
        app.get("/d/health", function(req, res){
          return res.json({});
        });
        y$ = router.user;
        y$.get('/null', function(req, res){
          return res.json({});
        });
        y$.get('/200', function(req, res){
          return res.json(req.user);
        });
        y$.get('/403', function(req, res){
          return res.status(403).send();
        });
        y$.get('/login', function(req, res){
          return res.redirect('/auth/');
        });
        y$.post('/logout', function(req, res){
          req.logout();
          return res.redirect('/');
        });
        y$.post('/auth/google', passport.authenticate('google', {
          scope: ['email']
        }));
        y$.get('/auth/google/callback', passport.authenticate('google', {
          successRedirect: '/auth/done/',
          failureRedirect: '/auth/failed/social.html'
        }));
        y$.post('/auth/facebook', passport.authenticate('facebook', {
          scope: ['email']
        }));
        y$.get('/auth/facebook/callback', passport.authenticate('facebook', {
          successRedirect: '/auth/done/',
          failureRedirect: '/auth/failed/social.html'
        }));
        multi = {
          parser: connectMultiparty({
            limit: config.limit
          }),
          clean: function(req, res, next){
            var k, ref$, v, results$ = [];
            for (k in ref$ = req.files) {
              v = ref$[k];
              if (fs.existsSync(v.path)) {
                results$.push(fs.unlink(v.path));
              }
            }
            return results$;
          },
          cleaner: function(cb){
            var this$ = this;
            return function(req, res, next){
              if (cb) {
                cb(req, res, next);
              }
              return this$.clean(req, res, next);
            };
          }
        };
        this$.config = config;
        this$.app = app;
        this$.express = express;
        this$.router = router;
        this$.multi = multi;
        this$.pgsql = pgsql;
        api(this$, pgsql);
        app.use(function(req, res, next){
          return aux.r404(res, "", true);
        });
        if (!config.debug) {
          this$.app.use(function(err, req, res, next){
            if (!err) {
              return next();
            }
            if (err.code === 'EBADCSRFTOKEN') {
              res.status(403);
              if (/^\/d\//.exec(req.originalUrl)) {
                return res.send({
                  id: 1005,
                  name: 'ldError'
                });
              } else {
                return res.redirect("/auth/?nexturl=" + req.originalUrl);
              }
            } else {
              if (err instanceof URIError && (err.stack + "").startsWith('URIError: Failed to decode param')) {
                return res.status(400).send();
              } else if (err instanceof lderror && err.id === 1009) {
                return res.status(200).send();
              } else if (err.message.startsWith('TokenError')) {
                console.error(colors.red.underline("[" + moment().format('YY/MM/DD HH:mm:ss') + "]"), colors.yellow(err.message), "[", color.yellow(req.originalUrl.substring(0, 15)), "]");
              } else if (err.message.startsWith('Failed to lookup view')) {
                console.error(colors.red.underline("[" + moment().format('YY/MM/DD HH:mm:ss') + "]"), colors.yellow(err.message));
              } else {
                console.error(colors.red.underline("[" + moment().format('YY/MM/DD HH:mm:ss') + "]"), colors.yellow(err.toString()), "[", colors.yellow(err.path || ''), "][", colors.yellow(req.originalUrl), "]");
                console.error(colors.grey(err.stack));
              }
              return res.status(500).send();
            }
          });
        }
        if (config.build && config.watch) {
          watch.init(config.build);
          watch.on('build', function(it){
            return modBuilder.build(it);
          });
          watch.on('unlink', function(it){
            return modBuilder.unlink(it);
          });
          watch.on('build', function(it){
            return customBuilder.build(it);
          });
          watch.on('unlink', function(it){
            return customBuilder.unlink(it);
          });
        }
        if (config.sharedb.enabled) {
          server.listen(config.port, function(){
            return console.log(("[SERVER] listening on port " + server.address().port).cyan);
          });
        } else {
          server = app.listen(config.port, function(){
            return console.log(("[SERVER] listening on port " + server.address().port).cyan);
          });
        }
        initedTime = Date.now();
        console.log(("[SERVER] Initialization: " + (initedTime - startTime) / 1000 + "s elapsed.").yellow);
        return res();
      });
    }
  };
  module.exports = backend;
  backend.init();
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
}).call(this);
