(->
  lc = {list: []}
  view = new ldView do
    init-render: false
    root: '[ld-scope=admin]'
    handler:
      item: do
        list: -> lc.list
        handler: ({node,data}) ->
          ld$.find('[ld=source]', 0).innerText = data.source
          ld$.find('[ld=content]', 0).innerText = data.content
          ld$.find('[ld=contact]', 0).innerText = data.contact
          ld$.find('[ld=publish]', 0).innerText = data.publish
  ld$.fetch '/d/condolence', {method: \GET}, {type: \json, params: {offset: 0}}
    .then -> view.render!
)!
