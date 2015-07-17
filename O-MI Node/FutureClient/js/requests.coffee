# import WebOmi, add submodule
requestsExt = (WebOmi) ->
  # Sub module for containing all request type templates
  my = WebOmi.requests = {}

  my.xmls =
    readAll :
      """
      <?xml version="1.0"?>
      <omi:omiEnvelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:omi="omi.xsd"
          version="1.0" ttl="0">
        <omi:read msgformat="odf">
          <omi:msg xmlns="odf.xsd" xsi:schemaLocation="odf.xsd odf.xsd">
            <Objects></Objects>
          </omi:msg>
        </omi:read>
      </omi:omiEnvelope>
      """
    templateMsg :
      """
      <?xml version="1.0"?>
      <omi:omiEnvelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:omi="omi.xsd"
          version="1.0" ttl="0">
        <omi:read msgformat="odf">
          <omi:msg xmlns="odf.xsd" xsi:schemaLocation="odf.xsd odf.xsd">
          </omi:msg>
        </omi:read>
      </omi:omiEnvelope>

      """
    template :
      """
      <?xml version="1.0"?>
      <omi:omiEnvelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:omi="omi.xsd"
          version="1.0" ttl="0">
        <omi:read msgformat="odf">
          <omi:msg xmlns="odf.xsd" xsi:schemaLocation="odf.xsd odf.xsd">
          </omi:msg>
        </omi:read>
      </omi:omiEnvelope>

      """

  my.defaults = {}
  my.defaults.empty = ->
    name     : "empty"
    request  : null  # Maybe string (request tag name)
    ttl      : 0     # double
    callback : null  # Maybe string
    requestID: null  # Maybe int
    odf      : null  # Maybe xml
    interval : null  # Maybe number
    newest   : null  # Maybe int
    oldest   : null  # Maybe int
    begin    : null  # Maybe Date
    end      : null  # Maybe Date
    requestDoc: null  # Maybe xml dom document
    msg      : true  # Boolean Is message included

  my.defaults.readAll = ->
    $.extend {}, my.defaults.empty(),
      name    : "readAll"
      request : "read"
      odf     : ["Objects"]
      requestDoc: WebOmi.omi.parseXml(my.xmls.readAll)

  my.defaults.read = ->
    $.extend {}, my.defaults.empty(),
      request : "readOnce"
      odf     : ["Objects"]

  #my.defaults.readOnce = -> my.defaults.read()
  # rather force selection to readOnce

  my.defaults.subscription = ->
    $.extend {}, my.defaults.empty(),
      name    : "subscription"
      request : "read"
      interval: 5
      ttl     : 60
      odf     : ["Objects"]

  my.defaults.poll = ->
    $.extend {}, my.defaults.empty(),
      name    : "poll"
      request : "read"
      requestID : 1
      msg     : false

  my.defaults.write = ->
    $.extend {}, my.defaults.empty(),
      name    : "write"
      request : "write"
      odf     : ["Objects"]

  my.defaults.cancel = ->
    $.extend {}, my.defaults.empty(),
      name    : "cancel"
      request : "cancel"
      requestID : 1
      odf     : null
      msg     : false


  # private
  currentParams = my.defaults.empty()

  # true
  my.confirmOverwrite = (oldVal, newVal) ->
    confirm "You have edited the request manually.\n
      Do you want to overwrite #{oldVal.toString} with #{newVal.toString}"



  my.removePathFromOdf = (odfTreeNode, odfObjects) ->
    # imports
    o = WebOmi.omi

    nodeElems = $.makeArray odfTreeNode.parentsUntil "#Objects", "li"
    nodeElems.reverse()
    nodeElems.push odfTreeNode

    lastOdfElem = odfObjects
    allOdfElems = for node in nodeElems

      id = $(node).children("a").text()

      maybeChild = o.getOdfChild(id, lastOdfElem)
      if maybeChild?
        lastOdfElem = maybeChild
      maybeChild

    # remove requested
    lastOdfElem.parentElement.removeChild lastOdfElem
    allOdfElems.pop()

    # remove empty parents
    allOdfElems.reverse()
    for elem in allOdfElems
      if not o.hasOdfChildren elem
        elem.parentElement.removeChild elem

    odfObjects




  # Adds odf elems to given Objects node from the path using the odfTree
  # odfTreeNode: jquery object; some li object from the tree containing the path in the id
  # odfObjects: XML Dom; the odf Objects node, will be updated in-place accordingly
  my.addPathToOdf = (odfTreeNode, odfObjects) ->
    o = WebOmi.omi
    odfDoc = odfObjects.ownerDocument || odfObjects

    nodeElems = $.makeArray odfTreeNode.parentsUntil "#Objects", "li"
    nodeElems.reverse()
    nodeElems.push odfTreeNode

    currentOdfNode = odfObjects

    for node in nodeElems

      id = $(node).children("a").text()

      maybeChild = o.getOdfChild(id, currentOdfNode)
      if maybeChild?
        # object exists: TODO: what happens now, murder the children or no-op
        currentOdfNode = maybeChild

      else
        obj = switch WebOmi.consts.odfTree.get_type(node)
          when "object"   then o.createOdfObject odfDoc, id
          when "infoitem" then o.createOdfInfoItem odfDoc, id

        currentOdfNode.appendChild obj
        currentOdfNode = obj

    odfObjects

  # Req generation setters that check if user has written some own value
  # Modify request checking the current vs internal, if disagree ask user, set internal
  # Saves the result in currentParams.requestDoc
  my.params =
    request  :
      # selector: ()
      update  : (reqName) -> # Maybe string (request tag name)
        if not currentParams.request?
          my.forceLoadParams my.defaults[reqName]()

        else if reqName != currentParams.request
          doc = currentParams.requestDoc
          currentReq = WebOmi.omi.evaluateXPath(
            doc, "omi:omiEnvelope/*")[0] # FIXME: head

          newReq = WebOmi.omi.createOmi reqName, doc
          newReq.setAttribute attr.name,attr.value for attr in currentReq.attributes
          newReq.appendChild child for child in currentReq.childNodes

          currentReq.parentNode.replaceChild newReq, currentReq

          # update internal state
          currentParams.request = reqName



    ttl      : # double
      update : -> # TODO
    callback : # Maybe String
      update : -> # TODO
    requestID: # Maybe Int
      update : -> # TODO
    odf      :
      update : (paths) ->
        o = WebOmi.omi
        doc = currentParams.requestDoc
        if paths? && paths.length > 0
          obs = o.createOdfObjects doc

          for path in paths  # add
            odfTreeNode = $ jqesc path
            my.addPathToOdf odfTreeNode, obs

          if currentParams.msg
            msg = o.evaluateXPath(currentParams.requestDoc, "//omi:msg")[0]
            msg.appendChild objects

        else
          obss = WebOmi.omi.evaluateXPath(doc, "//odf:Objects")
          obs.parentElement.removeChild obs for obs in obss

        currentParams.omi = paths

      # path: String "Objects/path/to/node"
      add : (path) ->
        # imports
        o = WebOmi.omi
        fl = WebOmi.formLogic

        odfTreeNode = $ jqesc path
        req = currentParams.requestDoc

        if req?
          currentObjectsHead = o.evaluateXPath(req, '//odf:Objects')[0]
          if currentObjectsHead?
            # TODO: user edit conflict check
            my.addPathToOdf odfTreeNode, currentObjectsHead
          else if currentParams.msg
            objects = o.createOdfObjects xmlTree
            my.addPathToOdf odfTreeNode, objects
            msg = o.evaluateXPath(req, "//omi:msg")[0]
            if msg?
              msg.appendChild objects
            else
              console.log "error msg = #{msg}"

        # update currentparams
        if currentParams.odf?
          currentParams.odf.push path
        else currentParams.odf = [path]

      # path: String "Objects/path/to/node"
      remove : (path) ->
        # imports
        o = WebOmi.omi
        fl = WebOmi.formLogic

        req = currentParams.requestDoc
        if currentParams.msg and req?
          odfTreeNode = $ jqesc path

          odfObjects = o.evaluateXPath(req, '//odf:Objects')[0]
          if odfObjects?
            my.removePathFromOdf odfTreeNode, odfObjects

        # update currentparams
        if currentParams.odf?
          currentParams.odf.filter (p) -> p != path
        else currentParams.odf = []

    interval : # Maybe Number
      update : -> # TODO
    newest   : # Maybe Int
      update : -> # TODO
    oldest   : # Maybe Int
      update : -> # TODO
    begin    : # Maybe Date
      update : -> # TODO
    end      : # Maybe Date
      update : -> # TODO
    msg      : # Boolean whether message is included
      update : (hasMsg) ->
        o = WebOmi.omi
        doc = currentParams.requestDoc

        if hasMsg == currentParams.msg then return

        if hasMsg  # add
          #msgExists = o.evaluateXPath(currentParams.requestDoc, "")
          msg = o.createOmi "msg", doc
          msg.setAttribute "xmlns", "odf.xsd"
          requestElem = o.evaluateXPath(doc, "/omi:omiEnvelope/*")[0]
          if requestElem?
            requestElem.appendChild msg
            my.params.odf.update currentParams.odf
          else
            console.log "ERROR: No request found"
            return # TODO: what

        else  # remove
          msg = o.evaluateXPath(doc, "/omi:omiEnvelope/*/omi:msg")
          # extra safe: remove all msgs
          m.parentElement.removeChild m for m in msg

        currentParams.msg = hasMsg

  # wrapper to update the ui with generated request
  my.generate = ->
    WebOmi.formLogic.setRequest currentParams.requestDoc


  # generate a new request from currentParams
  my.forceGenerate = (useOldDoc=false) ->
    o = WebOmi.omi
    cp = currentParams

    if not useOldDoc || not cp.requestDoc?
      cp.requestDoc = o.parseXml my.xmls.template
      cp.request = "empty" # just for params.request.update check

    # essential parameters
    if cp.request? && cp.request.length > 0 && cp.ttl?
      for key, updateFn of my.update
        updateFn cp[key]
        
        my.generate()

    else return

  # force load all parameters in the omiRequestObject and
  # set them in corresponding UI elements
  my.forceLoadParams = (omiRequestObject, useOldDoc=false) ->
    for key, newVal of omiRequestObject
      #currentParams[key] = newVal # confuses the update logic
      uiWidget = WebOmi.consts.ui[key]
      if uiWidget?
        uiWidget.set newVal

    my.forceGenerate useOldDoc


  # @param fastforward: Boolean Whether to also send the request and update odfTree also
  my.readAll = (fastForward) ->
    # my.forceLoadParams defaults.readAll()
    WebOmi.formLogic.setRequest my.xmls.readAll

    if fastForward
      WebOmi.formLogic.send(WebOmi.formLogic.buildOdfTreeStr)





  WebOmi # export module

# extend WebOmi
window.WebOmi = requestsExt(window.WebOmi || {})
