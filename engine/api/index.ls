require! <[fs path]>
require! <[./user ./auth/reset ./auth/verify]>
module.exports = (engine, io) ->
  user engine, io
  reset engine, io
  verify engine, io
