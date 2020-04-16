require! <[fs request debounce.js progress colors]>
require! <[./engine/io/postgresql/ ./secret]>
config = require "./config/site/#{secret.config}"

io = new postgresql secret

insert = (source, content, contact) ->
  io.query """
  insert into condolence (source,content,image,contact,publish,verified) values ($1,$2,false,$3,true,true)
  """, [source,content,contact]

ps = []
for i from 0 til 500 =>
  ps.push insert "來源#i", "內容#i", "聯絡#i"
Promise.all ps
  .then -> console.log \ok
