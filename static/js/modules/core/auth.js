// Generated by LiveScript 1.3.0
var slice$ = [].slice;
(function(){
  return ldc.register('auth', ['ldcvmgr', 'loader', 'util', 'error'], function(arg$){
    var ldcvmgr, loader, util, error, global, ref$, local, el, consent, form, ldld, submit, authpanel, acts, get, auth, action;
    ldcvmgr = arg$.ldcvmgr, loader = arg$.loader, util = arg$.util, error = arg$.error;
    global = function(){
      if (local.global) {
        return JSON.parse(JSON.stringify(local.global));
      } else {
        return null;
      }
    };
    ref$ = [{}, {}], local = ref$[0], el = ref$[1];
    consent = {
      dom: ld$.find(document, '[ld-scope=cookie-consent]', 0),
      val: util.cookie('legal'),
      clear: function(){
        if (this.dom) {
          ld$.remove(this.dom);
          return this.dom = null;
        }
      },
      check: function(){
        var this$ = this;
        return auth.get().then(function(arg$){
          var user;
          user = arg$.user;
          if ((user.config || (user.config = {})).legal && this$.dom) {
            return this$.clear();
          }
          if (!(this$.val = util.cookie('legal'))) {
            return;
          }
          if ((user.config || (user.config = {})).legal || !user.key) {
            return;
          }
          return ld$.fetch("/d/me/legal", {
            method: 'POST'
          }).then(function(){
            return (user.config || (user.config = {})).legal = this$.val;
          })['catch'](function(){});
        });
      },
      init: function(){
        var this$ = this;
        if (!this.val && this.dom) {
          this.dom.classList.remove('d-none');
        } else {
          return;
        }
        return ld$.find(this.dom, '[ld=ok]', 0).addEventListener('click', function(){
          util.cookie('legal', new Date().getTime(), new Date(Date.now() + 86400000 * 365 * 100).toGMTString());
          this$.clear();
          return this$.check();
        });
      }
    };
    consent.init();
    if (ld$.find(document, '.authpanel', 0)) {
      form = new ldForm({
        names: function(){
          return ['email', 'passwd', 'displayname'];
        },
        afterCheck: function(s, f){
          if (s.email !== 1 && !/^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.[a-z]{2,}|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i.exec(f.email.value)) {
            s.email = 2;
          }
          if (s.passwd !== 1) {
            if (auth.act === 'signup' && (f.passwd.value + "").length < 8) {
              s.passwd = 2;
            } else {
              s.passwd = !f.passwd.value ? 1 : 0;
            }
          }
          if (auth.act === 'login') {
            return s.displayname = 0;
          } else {
            return s.displayname = !f.displayname.value
              ? 1
              : !!f.displayname.value ? 0 : 2;
          }
        },
        root: '.authpanel'
      });
      el.submit = ld$.find(document, '.authpanel .btn[data-action=submit]', 0);
      ldld = new ldLoader({
        root: el.submit
      });
      form.on('readystatechange', function(it){
        return el.submit.classList.toggle('disabled', !it);
      });
      form.field('passwd').addEventListener('keyup', function(e){
        if (e.keyCode === 13) {
          return form.check({
            now: true
          }).then(function(){
            return submit();
          });
        }
      });
      el.submit.addEventListener('click', function(){
        return submit();
      });
      submit = function(){
        var val, body, ref$, ref1$;
        if (!form.ready()) {
          return;
        }
        ldld.on();
        val = form.values();
        body = (ref$ = (ref1$ = {}, ref1$.email = val.email, ref1$.passwd = val.passwd, ref1$.displayname = val.displayname, ref1$), ref$.config = {
          newsletter: val.newsletter
        }, ref$);
        return ld$.fetch(auth.act === 'login' ? '/u/login' : '/u/signup', {
          method: 'POST',
          body: JSON.stringify(body),
          headers: {
            'Content-Type': 'application/json; charset=UTF-8'
          }
        }, {
          type: 'text'
        }).then(function(){
          return auth.fetch();
        }).then(function(){
          return auth.get();
        }).then(function(g){
          action.info('default');
          if (g.user) {
            lda.auth.hide('ok');
          }
          form.reset();
          ldld.off();
          return auth.fire("auth.signin");
        })['catch'](function(){
          action.info('failed');
          form.fields.passwd.value = null;
          form.check({
            n: 'passwd',
            now: true
          });
          return ldld.off();
        });
      };
    }
    authpanel = ld$.find(document, '.authpanel', 0);
    if (authpanel) {
      acts = ld$.find(authpanel, '[data-action]');
      authpanel.addEventListener('click', function(e){
        var n, act;
        if (!e || !(n = e.target) || !e.target.getAttribute) {
          return;
        }
        act = e.target.getAttribute('data-action');
        return auth['switch'](act);
      });
    }
    get = proxise(function(){
      if (local.global) {
        return Promise.resolve(local.global);
      }
    });
    auth = {
      evtHandler: {},
      on: function(n, cb){
        var ref$;
        return ((ref$ = this.evtHandler)[n] || (ref$[n] = [])).push(cb);
      },
      fire: function(n){
        var v, i$, ref$, len$, cb, results$ = [];
        v = slice$.call(arguments, 1);
        for (i$ = 0, len$ = (ref$ = this.evtHandler[n] || []).length; i$ < len$; ++i$) {
          cb = ref$[i$];
          results$.push(cb.apply(this, v));
        }
        return results$;
      },
      'switch': function(act){
        if (!(act === 'signup' || act === 'login')) {
          return;
        }
        authpanel.classList.remove('signup', 'login');
        authpanel.classList.add(this.act = act);
        return form.check({
          now: true
        });
      },
      social: function(name){
        var des, div, this$ = this;
        des = window.open('', 'social-login', 'height=640,width=560');
        div = ld$.create({
          name: 'div'
        });
        document.body.appendChild(div);
        return this.get().then(function(arg$){
          var csrfToken, login;
          csrfToken = arg$.csrfToken;
          div.innerHTML = "<form target=\"social-login\" action=\"/u/auth/" + name + "/\" method=\"post\">\n  <input type=\"hidden\" name=\"_csrf\" value=\"" + csrfToken + "\"/>\n</form>";
          window.socialLogin = login = proxise(function(){
            return ld$.find(div, 'form', 0).submit();
          });
          return login();
        }).then(function(){
          return this$.fetch();
        }).then(function(arg$){
          var user;
          user = arg$.user;
          if (!(user && user.key)) {
            return Promise.reject(new ldError(1000));
          }
        }).then(function(){
          if (!ldcvmgr.isOn('authpanel')) {
            return window.location.reload();
          }
          lda.auth.hide();
          return auth.fire("auth.signin");
        })['finally'](function(){
          return ld$.remove(div);
        })['catch'](error({
          ignore: [999, 1000]
        }));
      },
      fb: function(){
        return this.social('facebook');
      },
      google: function(){
        return this.social('google');
      },
      logout: function(){
        loader.on();
        return ld$.fetch('/u/logout', {
          method: 'post'
        }, {}).then(function(){
          return auth.fetch({
            renew: true
          });
        }).then(function(){
          return ldcvmgr.toggle('logout');
        }).then(function(){
          return loader.off();
        })['catch'](function(){
          return ldcvmgr.toggle('error');
        });
      },
      ensure: function(opt){
        opt == null && (opt = {});
        return this.get((opt.authed = true, opt));
      },
      get: function(opt){
        opt == null && (opt = {
          authed: false
        });
        return get().then(function(g){
          var p;
          if (opt.authed) {
            p = !(g && (g.user || (g.user = {})).key)
              ? lda.auth.show(opt.tab, opt.info)
              : Promise.resolve(g);
            return p.then(function(g){
              if (!(g && (g.user || (g.user = {})).key)) {
                return Promise.reject(new ldError(1000));
              }
              lda.auth.hide();
              return g;
            });
          } else {
            return g;
          }
        });
      },
      userinfo: function(user){
        var promise, that;
        promise = (that = user)
          ? Promise.resolve(that)
          : this.get().then(function(arg$){
            var user;
            user = arg$.user;
            return user;
          });
        return promise.then(function(user){
          var plan, ref$;
          user == null && (user = {});
          plan = user.plan || {};
          return ref$ = import$({}, user), ref$.plan = plan, ref$.authed = user.key > 0, ref$.isPro = !!/pro/.exec(plan.slug || ''), ref$.isBlocked = !!(user.config || (user.config = {})).blocked, ref$;
        });
      },
      fetch: function(opt){
        var hintFail, ret, promise, this$ = this;
        opt == null && (opt = {
          renew: true
        });
        loader.onLater(1000);
        hintFail = debounce(10000, function(){
          loader.off();
          return ldcvmgr.get('connection-timeout').then(function(){
            loader.on();
            return debounce(10000);
          }).then(function(){
            return auth.fetch();
          });
        })();
        ret = !opt.renew && /global=/.exec(document.cookie) ? document.cookie.split(';').map(function(it){
          return /^global=(.+)/.exec(it.trim());
        }).filter(function(it){
          return it;
        })[0] : null;
        promise = ret
          ? Promise.resolve(JSON.parse(decodeURIComponent(ret[1])))
          : ld$.fetch('/js/global', {}, {
            type: 'json'
          });
        return promise.then(function(it){
          var ref$, ret, e;
          hintFail.cancel();
          loader.cancel();
          ((ref$ = ld$.fetch).headers || (ref$.headers = {}))['X-CSRF-Token'] = it.csrfToken;
          local.global = it;
          local.global.location = typeof ipFromTaiwan != 'undefined' && ipFromTaiwan !== null ? ipFromTaiwan(it.ip) ? 'tw' : 'other' : undefined;
          ret = global();
          get.resolve(ret);
          try {
            ldc.fire('auth.change', ret);
            consent.check();
            /* ga code { */
            if (typeof gtag != 'undefined' && gtag !== null) {
              if (!gtag.userid && ret.user && ret.user.key) {
                gtag('set', {
                  'user_id': gtag.userid = ret.user.key
                });
                gtag.inited = false;
              }
              if (!gtag.inited) {
                gtag('config', gtag.code, {
                  anonymize_ip: true
                });
                gtag.inited = true;
              }
            }
            /* } ga code */
          } catch (e$) {
            e = e$;
            ldcvmgr.toggle("error");
            console.log(e);
          }
          return ret;
        })['catch'](function(){
          hintFail.cancel();
          return loader.cancel();
        });
      }
    };
    auth.fetch({
      renew: false
    });
    action = {
      fb: function(){
        return auth.social('facebook');
      },
      google: function(){
        return auth.social('google');
      },
      logout: function(){
        return auth.logout();
      },
      isOn: function(){
        return ldcvmgr.isOn('authpanel');
      },
      show: function(n, info){
        n == null && (n = 'signup');
        info == null && (info = 'default');
        return Promise.resolve(ldcvmgr.isOn('authpanel')).then(function(it){
          if (!it) {
            return auth['switch'](n);
          }
        }).then(function(){
          if (info) {
            return action.info(info);
          }
        }).then(function(){
          return ldcvmgr.get('authpanel');
        }).then(function(it){
          if (it) {
            return auth.fetch();
          }
        });
      },
      hide: function(obj){
        obj == null && (obj = null);
        return ldcvmgr.set('authpanel', obj);
      },
      info: function(name){
        var infos, hash;
        name == null && (name = 'default');
        infos = ld$.find(authpanel, '*[data-info]');
        hash = {};
        infos.map(function(it){
          return hash[it.getAttribute('data-info')] = it;
        });
        infos.map(function(it){
          return it.classList.add('d-none');
        });
        if (!hash[name]) {
          name = 'default';
        }
        return hash[name].classList.remove('d-none');
      }
    };
    ldc.action(action);
    return auth;
  });
})();
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}