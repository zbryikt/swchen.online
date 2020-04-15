(->
  ldc.register \admin, <[loader notify]>, ({loader, notify}) ->
    lc = {list: []}
    view = new ldView do
      init-render: false
      root: '[ld-scope=admin]'
      action: click: do
        accept: ({node}) -> fetch \accept
        reject: ({node}) -> fetch \reject
        pending: ({node}) -> fetch \pending
      handler:
        item: do
          list: -> lc.list
          action: click: ({node, data, evt}) ->
            n = evt.target
            if !n or !n.classList => return
            if !n.classList.contains \btn => return
            loader.on!
            act = n.getAttribute(\ld)
            ld$.fetch "/d/condolence/#{data.key}/verify", {method: \POST}, {type: \json, json: {verified: (act == \ok)}}
              .finally -> loader.off!
              .then ->
                notify.send \success, \saved.
                node.parentNode.removeChild node
                lc.list.splice(lc.list.indexOf(data), 1)
              .catch -> notify.send \error, "failed to save"
          handler: ({node,data}) ->
            ld$.find(node, '[ld=source]', 0).innerText = data.source or ''
            ld$.find(node, '[ld=content]', 0).innerText = data.content or ''
            ld$.find(node, '[ld=contact]', 0).innerText = data.contact or ''
            ld$.find(node, '[ld=publish]', 0).innerText = data.publish or ''
            if data.image =>
              ld$.find(node, '[ld=image]', 0).setAttribute \src, "/assets/uploads/#{data.key}.png"
    fetch = (v) ->
      offset = +(ld$.find("[ld=offset]", 0).value or 0)
      ld$.fetch '/d/condolence/admin', {method: \GET}, {type: \json, params: {offset: offset, verified: v}}
        .then ->
          lc.list = it
          view.render!
    fetch \pending

  ldc.app \admin
)!
