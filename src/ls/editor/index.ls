(->
  ldc.register \editor, <[loader]>, ({loader}) ->
    /*view2 = new ldView do
      root: document.body
      action: click: do
        reconnect: ({node, evt}) ->
          ldld.on!
          sdb.reconnect!
            .then -> debounce 1000
            .then ->
              lda.ldcvmgr.toggle \disconnected, false
              ldld.off!
            .then -> init!
    */

    lc = {name: 'biography'}
    ldld = new ldLoader root: '.ldld.full'
    ldld.on!
    el = do
      editor: ld$.find "[ld=editor]", 0
      viewer: ld$.find "[ld=viewer]", 0
    cm = CodeMirror(
      el.editor, ({
        mode: \yaml
        lineNumbers: true
        theme: \ayu-mirage
        lineWrapping: true
        keyMap: "default" # or, vim
        showCursorWhenSelecting: true
        viewportMargin: Infinity
      } <<< {})
    )

    bbox = el.editor.getBoundingClientRect!
    cm.setSize bbox.width, bbox.height
    cm.setValue ''
    cm.on \change, ~> update!

    sdb = new sharedb-wrapper url: {scheme: window.location.protocol.replace(':',''), domain: window.location.host}
    sdb.on \close, -> lda.ldcvmgr.toggle \disconnected

    view = new ldView do
      root: el.viewer
      handler: do
        "timeline-item": do
          list: -> lc.parsed-data or []
          handler: ({node, data}) ->
            ld$.find(node, '[ld=year]', 0).innerText = data.year
            ld$.find(node, '[ld=title]', 0).innerText = data.title
            ld$.find(node, '[ld=content]', 0).innerHTML = DOMPurify.sanitize(marked(data.content))

    render = debounce ->
      lc.parsed-data = ret = jsyaml.load(lc.cur.biography)
      view.render!
      #el.viewer.innerText = lc.cur

    watch = (ops, self) ->
      if self => return
      cval = cm.getValue!
      rval = (lc.doc.data or {})[lc.name]
      if cval != rval =>
        lc.{}old[lc.name] = lc.{}cur[lc.name] = rval
        cm.setValue(rval or '')
        render!

    init = ->
      sdb.get {id: 'biography', watch}
        .then (doc) ->
          lc.doc = doc
          lc.old = JSON.parse(JSON.stringify(doc.data))
          lc.cur = JSON.parse(JSON.stringify(doc.data))
          cm.setValue (lc.{}cur[lc.name] or '')
          ldld.off!
          render!
        .catch -> console.log 'document open failed: ', it

    update = ->
      val = cm.getValue!
      if lc.{}cur[lc.name] == val => return
      lc.{}cur[lc.name] = val
      if lc.doc => lc.doc.submitOp(sdb.json.diff(lc.old, lc.cur))
      lc.{}old[lc.name] = val
      render!

    init!
  ldc.app \editor
)!
