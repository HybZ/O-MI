// Generated by CoffeeScript 1.9.3
(function() {
  var omiExt;

  omiExt = function(WebOmi) {
    var createOdf, my;
    my = WebOmi.omi = {};
    my.parseXml = function(responseString) {
      var ex, xmlTree;
      try {
        xmlTree = new DOMParser().parseFromString(responseString, 'application/xml');
      } catch (_error) {
        ex = _error;
        xmlTree = null;
      }
      if (xmlTree.firstElementChild.nodeName === "parsererror" || (xmlTree == null)) {
        console.log("PARSE ERROR:");
        console.log("in:", responseString);
        console.log("out:", xmlTree);
        xmlTree = null;
      }
      return xmlTree;
    };
    my.ns = {
      omi: "omi.xsd",
      odf: "odf.xsd",
      xsi: "http://www.w3.org/2001/XMLSchema-instance",
      xs: "http://www.w3.org/2001/XMLSchema-instance"
    };
    my.nsResolver = function(name) {
      return my.ns[name] || my.ns.odf;
    };
    my.evaluateXPath = function(elem, xpath) {
      var iter, res, results, xpe;
      xpe = elem.ownerDocument || elem;
      iter = xpe.evaluate(xpath, elem, my.nsResolver, 0, null);
      results = [];
      while (res = iter.iterateNext()) {
        results.push(res);
      }
      return results;
    };
    createOdf = function(elem, doc) {
      return doc.createElementNS(my.ns.odf, elem);
    };
    my.createOmi = function(elem, doc) {
      return doc.createElementNS(my.ns.omi, elem);
    };
    my.createOdfObjects = function(doc) {
      return createOdf("Objects", doc);
    };
    my.createOdfObject = function(doc, id) {
      var createdElem, idElem, textElem;
      createdElem = createOdf("Object", doc);
      idElem = createOdf("id", doc);
      textElem = doc.createTextNode(id);
      idElem.appendChild(textElem);
      createdElem.appendChild(idElem);
      return createdElem;
    };
    my.createOdfInfoItem = function(doc, name) {
      var createdElem;
      createdElem = createOdf("InfoItem", doc);
      createdElem.setAttribute("name", name);
      return createdElem;
    };
    my.getOdfId = function(xmlNode) {
      var head, nameAttr;
      switch (xmlNode.nodeName) {
        case "Object":
          head = my.evaluateXPath(xmlNode, './odf:id')[0];
          if (head != null) {
            return head.textContent.trim();
          } else {
            return null;
          }
          break;
        case "InfoItem":
          nameAttr = xmlNode.attributes.name;
          if (nameAttr != null) {
            return nameAttr.value;
          } else {
            return null;
          }
          break;
        default:
          return null;
      }
    };
    my.getOdfChild = function(odfId, odfNode) {
      var child, i, len, ref;
      ref = odfNode.childNodes;
      for (i = 0, len = ref.length; i < len; i++) {
        child = ref[i];
        if (my.getOdfId(child) === odfId) {
          return child;
        }
      }
      return null;
    };
    my.hasOdfChildren = function(odfNode) {
      var child, i, len, maybeId, ref;
      ref = odfNode.childNodes;
      for (i = 0, len = ref.length; i < len; i++) {
        child = ref[i];
        maybeId = my.getOdfId(child);
        if ((maybeId != null) && maybeId !== "") {
          return true;
        }
      }
      return false;
    };
    return WebOmi;
  };

  window.WebOmi = omiExt(window.WebOmi || {});

}).call(this);
