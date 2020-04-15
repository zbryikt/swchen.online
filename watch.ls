require! <[express path]>
require! <[./engine/aux ./engine/watch ./secret ./engine/watch/build/mod]>
config = require "./config/site/#{secret.config}"
colors = require \colors/safe
mod-builder = require "./engine/watch/build/mod"
custom-builder = require "./engine/watch/custom/"

watch.init config.build
watch.on \build, -> mod-builder.build it
watch.on \unlink, -> mod-builder.unlink it
watch.on \build, -> custom-builder.build it
watch.on \unlink, -> custom-builder.unlink it

app = express!
app.use \/, express.static(path.join(__dirname, 'static'))
server = app.listen config.port, -> console.log "[SERVER] listening on port #{server.address!port}".cyan
