// Generated by LiveScript 1.3.1
var slice$ = [].slice;
(function(){
  var diff, sharedbWrapper;
  diff = function(o, n, dostr){
    dostr == null && (dostr = true);
    return json0OtDiff(o, n, dostr ? diffMatchPatch : null);
  };
  sharedbWrapper = function(arg$){
    var url;
    url = arg$.url;
    this.url = url;
    this.evtHandler = {};
    this.reconnect();
    return this;
  };
  sharedbWrapper.prototype = import$(Object.create(Object.prototype), {
    json: {
      diff: function(o, n, dostr){
        dostr == null && (dostr = true);
        return diff(o, n, dostr);
      }
    },
    get: function(arg$){
      var id, watch, create, this$ = this;
      id = arg$.id, watch = arg$.watch, create = arg$.create;
      return new Promise(function(res, rej){
        var doc;
        doc = this$.connection.get('doc', id);
        return doc.fetch(function(e){
          if (e) {
            return rej(e);
          }
          doc.subscribe(function(ops, source){
            return res(doc);
          });
          if (watch != null) {
            doc.on('op', function(ops, source){
              return watch(ops, source);
            });
          }
          if (!doc.type) {
            return doc.create((create ? create() : null) || {});
          }
        });
      });
    },
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
    disconnect: function(){
      if (!this.socket) {
        return;
      }
      this.socket.close();
      this.socket = null;
      this.connected = false;
      return this.socket = null;
    },
    reconnect: function(){
      var this$ = this;
      return new Promise(function(res, rej){
        if (this$.socket) {
          return res();
        }
        this$.socket = new WebSocket((this$.url.scheme === 'http' ? 'ws' : 'wss') + "://" + this$.url.domain + "/ws");
        this$.connection = new sharedb.Connection(this$.socket);
        this$.socket.addEventListener('close', function(){
          this$.socket = null;
          this$.connected = false;
          return this$.fire('close');
        });
        return this$.socket.addEventListener('open', function(){
          this$.connected = true;
          return res();
        });
      });
    }
  });
  if (typeof module != 'undefined' && module !== null) {
    module.exports = sharedbWrapper;
  }
  if (typeof window != 'undefined' && window !== null) {
    return window.sharedbWrapper = sharedbWrapper;
  }
})();
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}