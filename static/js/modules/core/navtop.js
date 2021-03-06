// Generated by LiveScript 1.3.0
(function(){
  return ldc.register('navtop', ['auth'], function(arg$){
    var auth, lc, navCheck, navbar, view, dotst, tstTgt;
    auth = arg$.auth;
    lc = {
      signed: false,
      pro: false,
      user: {}
    };
    navCheck = function(g){
      lc.signed = !!(g.user || (g.user = {})).key;
      lc.pro = (g.user || (g.user = {})).plan;
      lc.user = g.user || (g.user = {});
      return view.render();
    };
    navbar = document.querySelector('#nav-top nav');
    view = new ldView({
      root: ld$.find(navbar, '[ld-scope]', 0),
      handler: {
        displayname: function(arg$){
          var node;
          node = arg$.node;
          return node.innerText = lc.user.displayname || 'You';
        },
        login: function(arg$){
          var node;
          node = arg$.node;
          return node.classList.toggle('d-none', lc.signed);
        },
        signup: function(arg$){
          var node;
          node = arg$.node;
          return node.classList.toggle('d-none', lc.signed);
        },
        "upgrade-now": function(arg$){
          var node;
          node = arg$.node;
          return node.classList.toggle('d-none', lc.pro);
        },
        profile: function(arg$){
          var node;
          node = arg$.node;
          return node.classList.toggle('d-none', !lc.signed);
        },
        avatar: function(arg$){
          var node;
          node = arg$.node;
          if (lc.signed) {
            return node.style.backgroundImage = "url(/s/avatar/" + lc.user.key + ".png)";
          }
        },
        plan: function(arg$){
          var node;
          node = arg$.node;
          node.innerText = lc.pro ? 'PRO' : 'FREE';
          node.classList.toggle('badge-primary', lc.pro);
          return node.classList.toggle('badge-secondary', !lc.pro);
        }
      }
    });
    ldc.on('auth.change', navCheck);
    auth.get().then(navCheck);
    dotst = (navbar.getAttribute('data-transition') || "").split(';').map(function(it){
      return it.split(' ').filter(function(it){
        return it;
      });
    });
    tstTgt = ld$.find(document, navbar.getAttribute('data-transition-target'), 0);
    if (!(dotst.length && tstTgt)) {
      return;
    }
    return new IntersectionObserver(function(it){
      var n;
      if (!(n = it[0])) {
        return;
      }
      dotst[0].map(function(c){
        return navbar.classList.toggle(c, n.isIntersecting);
      });
      return dotst[1].map(function(c){
        return navbar.classList.toggle(c, !n.isIntersecting);
      });
    }, {
      threshold: 0.1
    }).observe(tstTgt);
  });
})();