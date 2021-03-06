// Generated by LiveScript 1.3.0
(function(){
  var fs, fsExtra, stylus, path, uglifycss, aux, cwd, main;
  fs = require('fs');
  fsExtra = require('fs-extra');
  stylus = require('stylus');
  path = require('path');
  uglifycss = require('uglifycss');
  aux = require('./aux');
  cwd = path.resolve(process.cwd());
  main = {
    map: function(list){
      return list.filter(function(it){
        return /^src\/styl/.exec(it);
      }).map(function(src){
        var des, desMin;
        des = path.normalize(src.replace(/^src\/styl/, "static/css/").replace(/\.styl/, ".css"));
        desMin = des.replace(/\.css$/, '.min.css');
        return {
          src: src,
          des: des,
          desMin: desMin
        };
      });
    },
    build: function(list, causedBy){
      var i$, len$, ref$, src, des, desMin, t1, code, desdir, e;
      list = this.map(list);
      for (i$ = 0, len$ = list.length; i$ < len$; ++i$) {
        ref$ = list[i$], src = ref$.src, des = ref$.des, desMin = ref$.desMin;
        if (!fs.existsSync(src) || aux.newer(des, [src].concat(causedBy[src] || []))) {
          continue;
        }
        try {
          t1 = Date.now();
          code = fs.readFileSync(src).toString();
          if (/^\/\/- ?(module) ?/.exec(code)) {
            continue;
          }
          desdir = path.dirname(des);
          fsExtra.ensureDirSync(desdir);
          stylus(code).set('filename', src).render(fn$);
        } catch (e$) {
          e = e$;
          console.log(("[BUILD] " + src + " failed: ").red);
          console.log(e.message.toString().red);
        }
      }
      function fn$(e, css){
        var codeMin, t2;
        if (e) {
          throw e;
        }
        codeMin = uglifycss.processString(css, {
          uglyComments: true
        });
        fs.writeFileSync(des, css);
        fs.writeFileSync(desMin, codeMin);
        t2 = Date.now();
        return console.log("[BUILD] " + src + " --> " + des + " / " + desMin + " ( " + (t2 - t1) + "ms )");
      }
    },
    unlink: function(list){
      var i$, len$, ref$, src, des, desMin, results$ = [];
      list = this.map(list);
      for (i$ = 0, len$ = list.length; i$ < len$; ++i$) {
        ref$ = list[i$], src = ref$.src, des = ref$.des, desMin = ref$.desMin;
        if (fs.existsSync(des)) {
          fs.unlinkSync(des);
          console.log(("[BUILD] " + src + " --> " + des + " deleted.").yellow);
        }
        if (fs.existsSync(desMin)) {
          fs.unlinkSync(desMin);
          results$.push(console.log(("[BUILD] " + src + " --> " + desMin + " deleted.").yellow));
        }
      }
      return results$;
    }
  };
  module.exports = main;
}).call(this);
