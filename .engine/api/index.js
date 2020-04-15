// Generated by LiveScript 1.3.0
(function(){
  var fs, path, user, reset, verify;
  fs = require('fs');
  path = require('path');
  user = require('./user');
  reset = require('./auth/reset');
  verify = require('./auth/verify');
  module.exports = function(engine, io){
    user(engine, io);
    reset(engine, io);
    return verify(engine, io);
  };
}).call(this);