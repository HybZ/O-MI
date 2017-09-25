// Generated by CoffeeScript 2.0.0
(function() {
  //######################################################################
  //  Copyright (c) 2015 Aalto University.

  //  Licensed under the 4-clause BSD (the "License");
  //  you may not use this file except in compliance with the License.
  //  You may obtain a copy of the License at top most directory of project.

  //  Unless required by applicable law or agreed to in writing, software
  //  distributed under the License is distributed on an "AS IS" BASIS,
  //  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  //  See the License for the specific language governing permissions and
  //  limitations under the License.
  //#####################################################################

  // import WebOmi, add submodule
  var requestsExt,
    hasProp = {}.hasOwnProperty;

  requestsExt = function(WebOmi) {
    var addValueToAll, addValueWhenWrite, currentParams, maybeInsertBefore, my, removeValueFromAll, updateSetterForAttr;
    // Sub module for containing all request type templates
    my = WebOmi.requests = {};
    // These are loaded if theres no request yet,
    // otherwise the current request is just modified, never loaded again if it exists.
    // So in practice the only the omiEnvelope comes from one of these,
    // others can be created from updaters
    my.xmls = {
      readAll: "<omiEnvelope xmlns=\"http://www.opengroup.org/xsd/omi/1.0/\" version=\"1.0\" ttl=\"0\">\n  <read msgformat=\"odf\">\n    <msg>\n      <Objects xmlns=\"http://www.opengroup.org/xsd/odf/1.0/\"></Objects>\n    </msg>\n  </read>\n</omiEnvelope>",
      template: "<omiEnvelope xmlns=\"http://www.opengroup.org/xsd/omi/1.0/\" \n    version=\"1.0\" ttl=\"0\">\n  <read msgformat=\"odf\">\n    <msg>\n    </msg>\n  </read>\n</omiEnvelope>\n"
    };
    // Usage of these defaults is a bit sparse,
    // they are used when the first request is selected
    // and can be used to check some parameter like request tag name
    my.defaults = {};
    my.defaults.empty = function() {
      return {
        name: "empty",
        request: null, // Maybe string (request tag name)
        ttl: 0, // double
        callback: null, // Maybe string
        requestID: null, // Maybe int
        odf: null, // Maybe Array String paths
        interval: null, // Maybe number
        newest: null, // Maybe int
        oldest: null, // Maybe int
        begin: null, // Maybe Date
        end: null, // Maybe Date
        requestDoc: null, // Maybe xml dom document
        msg: true // Boolean Is message included
      };
    };
    my.defaults.readAll = function() {
      return $.extend({}, my.defaults.empty(), {
        name: "readAll",
        request: "read",
        odf: ["Objects"]
      });
    };
    my.defaults.read = function() {
      return $.extend({}, my.defaults.empty(), {
        name: "readOnce",
        request: "read",
        odf: ["Objects"]
      });
    };
    //my.defaults.readOnce = -> my.defaults.read()
    // rather force selection to readOnce
    my.defaults.subscription = function() {
      return $.extend({}, my.defaults.empty(), {
        name: "subscription",
        request: "read",
        interval: 5,
        ttl: 60,
        odf: ["Objects"]
      });
    };
    my.defaults.poll = function() {
      return $.extend({}, my.defaults.empty(), {
        name: "poll",
        request: "read",
        requestID: 1,
        msg: false
      });
    };
    my.defaults.write = function() {
      return $.extend({}, my.defaults.empty(), {
        name: "write",
        request: "write",
        odf: ["Objects"]
      });
    };
    my.defaults.cancel = function() {
      return $.extend({}, my.defaults.empty(), {
        name: "cancel",
        request: "cancel",
        requestID: 1,
        odf: null,
        msg: false
      });
    };
    // private; holds current params that should be also set in resulting CodeMirror
    // This is used to check if the parameter exists or not and is it the same as new
    currentParams = my.defaults.empty();
    my.getCurrentParams = function() {
      return $.extend({}, currentParams);
    };
    // TODO: not used
    my.confirmOverwrite = function(oldVal, newVal) {
      return confirm(`You have edited the request manually.\n Do you want to overwrite ${oldVal.toString} with ${newVal.toString}`);
    };
    //private; Used to add value tag when in write request
    // "0" placeholder, otherwise xml is formatted to <value />
    // values have structure [{ value:String, valuetime:String unix-time, valuetype:String }]
    addValueWhenWrite = function(odfInfoItem, values = [
        {
          value: "0"
        }
      ]) {
      var doc, i, len, results, val, value;
      if (currentParams.request === 'write') {
        doc = odfInfoItem.ownerDocument;
        results = [];
        for (i = 0, len = values.length; i < len; i++) {
          value = values[i];
          val = WebOmi.omi.createOdfValue(doc, value.value, value.valuetype, value.valuetime);
          results.push(odfInfoItem.appendChild(val));
        }
        return results;
      }
    };
    //private; Used to add value tags to all info items when in write request
    addValueToAll = function(doc) {
      var i, info, infos, len, results;
      infos = WebOmi.omi.evaluateXPath(doc, "//odf:InfoItem");
      results = [];
      for (i = 0, len = infos.length; i < len; i++) {
        info = infos[i];
        results.push(addValueWhenWrite(info));
      }
      return results;
    };
    //private; Used to remove value tags when not in write request
    removeValueFromAll = function(doc) {
      var i, len, results, val, vals;
      vals = WebOmi.omi.evaluateXPath(doc, "//odf:value");
      results = [];
      for (i = 0, len = vals.length; i < len; i++) {
        val = vals[i];
        results.push(val.parentNode.removeChild(val));
      }
      return results;
    };
    // removes the given path from odf xml,
    // removes also parents if there is no other children
    my.removePathFromOdf = function(odfTreeNode, odfObjects) {
      var allOdfElems, elem, i, id, lastOdfElem, len, maybeChild, node, nodeElems, o;
      // imports
      o = WebOmi.omi;
      // get ancestors
      nodeElems = $.makeArray(odfTreeNode.parentsUntil("#Objects", "li"));
      nodeElems.reverse();
      nodeElems.push(odfTreeNode);
      lastOdfElem = odfObjects;
      allOdfElems = (function() {
        var i, len, results;
        results = [];
        for (i = 0, len = nodeElems.length; i < len; i++) {
          node = nodeElems[i];
          id = $(node).children("a").text();
          maybeChild = o.getOdfChild(id, lastOdfElem);
          if (maybeChild != null) {
            lastOdfElem = maybeChild;
          }
          results.push(maybeChild);
        }
        return results;
      })();
      // remove requested
      lastOdfElem.parentNode.removeChild(lastOdfElem);
      allOdfElems.pop();
      // remove empty parents
      allOdfElems.reverse();
      for (i = 0, len = allOdfElems.length; i < len; i++) {
        elem = allOdfElems[i];
        if (elem != null) {
          if (!o.hasOdfChildren(elem)) {
            elem.parentNode.removeChild(elem);
          } else {
            break;
          }
        }
      }
      return odfObjects;
    };
    // TODO: better place for this, e.g. WebOmi.util?
    maybeInsertBefore = function(parent, beforeTarget, insertElem) {
      if (beforeTarget != null) {
        return parent.insertBefore(insertElem, beforeTarget);
      } else {
        return parent.appendChild(insertElem);
      }
    };
    // Adds odf elems to given Objects node from the path using the odfTree, creating parents also
    // odfTreeNode: jquery object; some li object from the tree containing the path in the id
    // odfObjects: XML Dom; the odf Objects node, will be updated in-place accordingly
    my.addPathToOdf = function(odfTreeNode, odfObjects) {
      var beforInfos, beforMetas, beforObjects, beforValues, currentOdfNode, dVal, description, i, id, info, len, maybeChild, maybeDesc, maybeValues, meta, metadata, metainfo, metas, node, nodeElems, o, object, odfDoc, odfElem, siblingObject, siblingValue;
      o = WebOmi.omi;
      odfDoc = odfObjects.ownerDocument || odfObjects;
      if ((odfTreeNode[0] == null) || odfTreeNode[0].id === "Objects") {
        return odfObjects;
      }
      nodeElems = $.makeArray(odfTreeNode.parentsUntil("#Objects", "li"));
      nodeElems.reverse();
      nodeElems.push(odfTreeNode);
      currentOdfNode = odfObjects;
      for (i = 0, len = nodeElems.length; i < len; i++) {
        node = nodeElems[i];
        id = $(node).children("a").text();
        maybeChild = o.getOdfChild(id, currentOdfNode);
        if (maybeChild != null) {
          // object exists: TODO: what happens now, murder the children or no-op
          currentOdfNode = maybeChild; // no-op
        } else {
          // create new info or object, infos must be before objects but after <id>s
          odfElem = (function() {
            var j, len1;
            switch (WebOmi.consts.odfTree.get_type(node)) {
              case "object":
                object = o.createOdfObject(odfDoc, id);
                return currentOdfNode.appendChild(object);
              case "description":
                dVal = $(node).data("description");
                if (currentParams.request === "write" && dVal !== "") {
                  description = o.createOdfDescription(odfDoc, dVal);
                } else if (currentParams.request !== "write") {
                  description = o.createOdfDescription(odfDoc);
                }
                // find the first value and insert before it (schema restriction)
                beforInfos = o.evaluateXPath(currentOdfNode, "odf:InfoItem[1]")[0];
                beforObjects = o.evaluateXPath(currentOdfNode, "odf:Object[1]")[0];
                beforMetas = o.evaluateXPath(currentOdfNode, "odf:MetaData[1]")[0];
                beforValues = o.evaluateXPath(currentOdfNode, "odf:value[1]")[0];
                if (beforInfos != null) {
                  siblingValue = beforInfos;
                } else if (beforObjects != null) {
                  siblingValue = beforObjects;
                } else if (beforMetas != null) {
                  siblingValue = beforMetas;
                } else {
                  siblingValue = beforValues;
                }
                if (description != null) {
                  return maybeInsertBefore(currentOdfNode, siblingValue, description);
                }
                break;
              case "metadata":
                meta = o.createOdfMetaData(odfDoc);
                metas = $(node).data("metadatas");
                if ((metas != null) && currentParams.request === "write") {
                  for (j = 0, len1 = metas.length; j < len1; j++) {
                    metadata = metas[j];
                    metainfo = o.createOdfInfoItem(odfDoc, metadata.name, [
                      {
                        value: metadata.value,
                        vAluetype: metadata.type
                      }
                    ], metadata.description);
                    meta.appendChild(metainfo);
                  }
                }
                // find the first value and insert before it (schema restriction)
                siblingValue = o.evaluateXPath(currentOdfNode, "odf:value[1]")[0];
                return maybeInsertBefore(currentOdfNode, siblingValue, meta);
              case "infoitem":
                // when request is write
                info = currentParams.request === "write" ? (maybeValues = $(node).data("values"), maybeDesc = $(node).data("description"), !(maybeValues != null) ? (maybeValues = [
                  {
                    value: "VALUE_PLACEHOLDER"
                  }
                ], o.createOdfInfoItem(odfDoc, id, maybeValues, maybeDesc)) : o.createOdfInfoItem(odfDoc, id, maybeValues, maybeDesc)) : o.createOdfInfoItem(odfDoc, id);
                // find the first Object and insert before it (schema restriction)
                siblingObject = o.evaluateXPath(currentOdfNode, "odf:Object[1]")[0];
                return maybeInsertBefore(currentOdfNode, siblingObject, info);
            }
          })();
          currentOdfNode = odfElem;
        }
      }
      return odfObjects;
    };
    // private; Creates update setter for simple omi xml attributes
    // name:            String; Attribute name
    // attrParentXPath: String(Xpath); Selector for the parent of the attribute
    updateSetterForAttr = function(name, attrParentXPath) {
      return {
        update: function(newVal) {
          var attrParents, doc, i, len, o, parent;
          o = WebOmi.omi;
          doc = currentParams.requestDoc;
          if (currentParams[name] !== newVal) {
            attrParents = o.evaluateXPath(doc, attrParentXPath);
            if (attrParents == null) {
              WebOmi.error(`Tried to update ${name}, but ${attrParentXPath} was not found in`, doc);
            } else {
              for (i = 0, len = attrParents.length; i < len; i++) {
                parent = attrParents[i];
                if (newVal != null) {
                  parent.setAttribute(name, newVal);
                } else {
                  parent.removeAttribute(name);
                }
              }
            }
            currentParams[name] = newVal;
            return newVal;
          }
        }
      };
    };
    // Req generation setters that check if user has written some own value
    // Modify request checking if its a new value, set internal
    // Saves the result in currentParams.requestDoc
    my.params = {
      name: {
        update: function(name) {
          var requestTag;
          if (currentParams.name !== name) {
            currentParams.name = name;
            requestTag = (function() {
              switch (name) {
                case "poll":
                case "subscription":
                case "readAll":
                case "readReq":
                case "readOnce":
                case "template":
                  return "read";
                case "empty":
                  return null;
                default:
                  return name;
              }
            })();
            return my.params.request.update(requestTag);
          }
        }
      },
      request: {
        // selector: ()
        update: function(reqName) { // Maybe string (request tag name)
          var attr, child, currentReq, doc, i, len, newReq, oldReqName, ref;
          oldReqName = currentParams.request;
          if (currentParams.requestDoc == null) {
            return my.forceLoadParams(my.defaults[reqName]());
          } else if (reqName !== oldReqName) {
            doc = currentParams.requestDoc;
            currentReq = WebOmi.omi.evaluateXPath(doc, "omi:omiEnvelope/*")[0];
            newReq = WebOmi.omi.createOmi(reqName, doc);
            ref = currentReq.attributes;
            for (i = 0, len = ref.length; i < len; i++) {
              attr = ref[i];
              // copy attrs
              newReq.setAttribute(attr.name, attr.value);
            }
            
            // copy childs
            while (child = currentReq.firstChild) {
              newReq.appendChild(child);
              // firefox seems to remove the child from currentReq above,
              // but for compatibility
              if (child === currentReq.firstChild) {
                currentReq.removeChild(child);
              }
            }
            // replace
            currentReq.parentNode.replaceChild(newReq, currentReq);
            // update internal state
            currentParams.request = reqName;
            // special functionality for write request
            if (reqName === "write") {
              my.params.odf.update(currentParams.odf);
            //addValueToAll doc

            // disable callback as it's often left after sub and not needed anymore
            //my.ui.callback.set("") 
            } else if (oldReqName === "write") { // change from write
              //removeValueFromAll doc
              my.params.odf.update(currentParams.odf);
            }
            return reqName;
          }
        }
      },
      ttl: updateSetterForAttr("ttl", "omi:omiEnvelope"),
      callback: updateSetterForAttr("callback", "omi:omiEnvelope/*"),
      requestID: {
        update: function(newVal) {
          var doc, existingIDs, i, id, idTxt, j, k, len, len1, len2, newId, o, parent, parentXPath, parents;
          o = WebOmi.omi;
          doc = currentParams.requestDoc;
          parentXPath = "omi:omiEnvelope/*";
          if (currentParams.requestID !== newVal) {
            parents = o.evaluateXPath(doc, parentXPath);
            if (parents == null) {
              WebOmi.error(`Tried to update requestID, but ${parentXPath} not found in`, doc);
            } else {
              existingIDs = o.evaluateXPath(doc, "//omi:requestID");
              if (newVal != null) {
                if (existingIDs.some(function(elem) {
                  return elem.textContent.trim() === newVal.toString(); // exists
// add
                })) {
                  return;
                } else {
                  // TODO multiple requestIDs
                  for (i = 0, len = parents.length; i < len; i++) {
                    parent = parents[i];
                    for (j = 0, len1 = existingIDs.length; j < len1; j++) {
                      id = existingIDs[j];
                      id.parentNode.removeChild(id);
                    }
                    newId = o.createOmi("requestID", doc);
                    idTxt = doc.createTextNode(newVal.toString());
                    newId.appendChild(idTxt);
                    parent.appendChild(newId);
                  }
                }
              } else {
                for (k = 0, len2 = existingIDs.length; k < len2; k++) {
                  id = existingIDs[k];
                  // remove
                  id.parentNode.removeChild(id);
                }
              }
            }
            currentParams.requestID = newVal;
          }
          return newVal;
        }
      },
      odf: {
        update: function(paths) {
          var doc, i, j, len, len1, msg, o, obs, obss, odfTreeNode, path;
          o = WebOmi.omi;
          doc = currentParams.requestDoc;
          if ((paths != null) && paths.length > 0) {
            obs = o.createOdfObjects(doc);
            // add
            for (i = 0, len = paths.length; i < len; i++) {
              path = paths[i];
              odfTreeNode = $(jqesc(path));
              my.addPathToOdf(odfTreeNode, obs);
            }
            if (currentParams.msg) {
              msg = o.evaluateXPath(currentParams.requestDoc, "//omi:msg")[0];
              if (msg == null) {
                my.params.msg.update(currentParams.msg); // calls odf update again
                return;
              }
              
              // remove old (safeguard)
              // NOTE: dependency?, msg.update calls odf update
              while (msg.firstChild) {
                msg.removeChild(msg.firstChild);
              }
              msg.appendChild(obs);
            }
          } else {
            obss = WebOmi.omi.evaluateXPath(doc, "//odf:Objects");
            for (j = 0, len1 = obss.length; j < len1; j++) {
              obs = obss[j];
              obs.parentNode.removeChild(obs);
            }
          }
          currentParams.odf = paths;
          return paths;
        },
        // path: String "Objects/path/to/node"
        add: function(path) {
          var currentObjectsHead, msg, o, objects, odfTreeNode, req;
          // imports
          o = WebOmi.omi;
          odfTreeNode = $(jqesc(path));
          req = currentParams.requestDoc;
          if (req != null) {
            currentObjectsHead = o.evaluateXPath(req, '//odf:Objects')[0];
            if (currentObjectsHead != null) {
              // TODO: user edit conflict check
              my.addPathToOdf(odfTreeNode, currentObjectsHead);
            } else if (currentParams.msg) {
              objects = o.createOdfObjects(req);
              my.addPathToOdf(odfTreeNode, objects);
              msg = o.evaluateXPath(req, "//omi:msg")[0];
              if (msg != null) {
                msg.appendChild(objects);
              } else {
                WebOmi.error(`error, msg not found: ${msg}`);
              }
            }
          }
          // update currentparams
          if (currentParams.odf != null) {
            currentParams.odf.push(path);
          } else {
            currentParams.odf = [path];
          }
          return path;
        },
        // path: String "Objects/path/to/node"
        remove: function(path) {
          var o, odfObjects, odfTreeNode, req;
          // imports
          o = WebOmi.omi;
          req = currentParams.requestDoc;
          if (currentParams.msg && (req != null)) {
            odfTreeNode = $(jqesc(path));
            odfObjects = o.evaluateXPath(req, '//odf:Objects')[0];
            if (odfObjects != null) {
              my.removePathFromOdf(odfTreeNode, odfObjects);
            }
          }
          // update currentparams
          if (currentParams.odf != null) {
            currentParams.odf = currentParams.odf.filter(function(p) {
              return p !== path;
            });
          } else {
            currentParams.odf = [];
          }
          return path;
        }
      },
      interval: updateSetterForAttr("interval", "omi:omiEnvelope/*"),
      newest: updateSetterForAttr("newest", "omi:omiEnvelope/*"),
      oldest: updateSetterForAttr("oldest", "omi:omiEnvelope/*"),
      begin: updateSetterForAttr("begin", "omi:omiEnvelope/*"),
      end: updateSetterForAttr("end", "omi:omiEnvelope/*"),
      msg: {
        update: function(hasMsg) {
          var doc, i, len, m, msg, o, requestElem;
          o = WebOmi.omi;
          doc = currentParams.requestDoc;
          if (hasMsg === currentParams.msg) {
            return;
          }
          if (hasMsg) { // add
            //msgExists = o.evaluateXPath(currentParams.requestDoc, "")
            msg = o.createOmi("msg", doc);
            // namespaces already set by createOmi and createOdf
            // msg.setAttribute "xmlns", "odf.xsd"
            requestElem = o.evaluateXPath(doc, "/omi:omiEnvelope/*")[0];
            if (requestElem != null) {
              requestElem.appendChild(msg);
              requestElem.setAttribute("msgformat", "odf");
              currentParams.msg = hasMsg;
              my.params.odf.update(currentParams.odf);
            } else {
              // FIXME dependency
              WebOmi.error("ERROR: No request found"); // TODO: what
              // remove
              return;
            }
          } else {
            msg = o.evaluateXPath(doc, "/omi:omiEnvelope/*/omi:msg");
            for (i = 0, len = msg.length; i < len; i++) {
              m = msg[i];
              // extra safe: remove all msgs
              m.parentNode.removeChild(m);
            }
            requestElem = o.evaluateXPath(doc, "/omi:omiEnvelope/*")[0];
            if (requestElem != null) {
              requestElem.removeAttribute("msgformat");
            }
          }
          currentParams.msg = hasMsg;
          return hasMsg;
        }
      }
    };
    // wrapper to update the ui with generated request
    my.generate = function() {
      return WebOmi.formLogic.setRequest(currentParams.requestDoc);
    };
    // force load all parameters in the omiRequestObject and
    // set them in corresponding UI elements
    my.forceLoadParams = function(omiRequestObject, useOldDoc = false) {
      var cp, key, newParams, newVal, o, ref, thing, uiWidget;
      o = WebOmi.omi;
      cp = currentParams;
      for (key in omiRequestObject) {
        if (!hasProp.call(omiRequestObject, key)) continue;
        newVal = omiRequestObject[key];
        uiWidget = WebOmi.consts.ui[key];
        if (uiWidget != null) {
          uiWidget.set(newVal);
        }
      }
      // generate
      if (!useOldDoc || (cp.requestDoc == null)) {
        cp.requestDoc = o.parseXml(my.xmls.template);
      }
      newParams = $.extend({}, cp, omiRequestObject);
      //currentParams = my.defaults.empty()

      // essential parameters
      if ((newParams.request != null) && newParams.request.length > 0 && (newParams.ttl != null)) {
        ref = my.params;
        for (key in ref) {
          if (!hasProp.call(ref, key)) continue;
          thing = ref[key];
          thing.update(newParams[key]);
          WebOmi.debug(`updated ${key}:`, currentParams[key]);
        }
        my.generate();
      } else if (newParams.name === "empty") {
        currentParams = omiRequestObject;
        my.generate();
      } else {
        WebOmi.error("tried to generate request, but missing a required parameter (name, ttl)", newParams);
      }
      return null;
    };
    // @param fastforward: Boolean Whether to also send the request and update odfTree also
    my.readAll = function(fastForward) {
      my.forceLoadParams(my.defaults.readAll());
      if (fastForward) {
        return WebOmi.formLogic.send(WebOmi.formLogic.buildOdfTreeStr);
      }
    };
    return WebOmi; // export module
  };

  
  // extend WebOmi
  window.WebOmi = requestsExt(window.WebOmi || {});

  window.requests = "ready";

}).call(this);
