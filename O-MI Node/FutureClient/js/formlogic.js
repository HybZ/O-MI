// Generated by CoffeeScript 1.9.3
(function() {
  var formLogicExt;

  formLogicExt = function($, WebOmi) {
    var my;
    my = WebOmi.formLogic = {};
    my.setRequest = function(xmlString) {
      var mirror;
      mirror = WebOmi.consts.requestCodeMirror;
      mirror.setValue(xmlString);
      return mirror.autoFormatAll();
    };
    my.setResponse = function(xmlString) {
      var mirror;
      mirror = WebOmi.consts.responseCodeMirror;
      mirror.setValue(xmlString);
      return mirror.autoFormatAll();
    };
    my.send = function(callback) {
      var request, server;
      server = WebOmi.consts.serverUrl.val();
      request = WebOmi.consts.requestCodeMirror.getValue();
      return $.ajax({
        type: "POST",
        url: server,
        data: request,
        contentType: "text/xml",
        processData: false,
        dataType: "text",
        error: my.setResponse,
        success: function(response) {
          my.setResponse(response);
          if ((callback != null)) {
            return callback(response);
          }
        }
      });
    };
    my.buildOdfTree = function(objectsNode) {
      var evaluateXPath, genData, objChildren, tree, treeData;
      tree = WebOmi.consts.odfTree;
      evaluateXPath = WebOmi.omi.evaluateXPath;
      objChildren = function(xmlNode) {
        return evaluateXPath(xmlNode, './odf:InfoItem | ./odf:Object');
      };
      genData = function(xmlNode, parentPath) {
        var child, name, path;
        switch (xmlNode.nodeName) {
          case "Objects":
            name = xmlNode.nodeName;
            return {
              id: name,
              text: name,
              state: {
                opened: true
              },
              type: "objects",
              children: (function() {
                var i, len, ref, results;
                ref = objChildren(xmlNode);
                results = [];
                for (i = 0, len = ref.length; i < len; i++) {
                  child = ref[i];
                  results.push(genData(child, name));
                }
                return results;
              })()
            };
          case "Object":
            name = evaluateXPath(xmlNode, './odf:id')[0].textContent.trim();
            path = parentPath + "/" + name;
            return {
              id: path,
              text: name,
              type: "object",
              children: (function() {
                var i, len, ref, results;
                ref = objChildren(xmlNode);
                results = [];
                for (i = 0, len = ref.length; i < len; i++) {
                  child = ref[i];
                  results.push(genData(child, path));
                }
                return results;
              })()
            };
          case "InfoItem":
            name = xmlNode.attributes.name.value;
            path = parentPath + "/" + name;
            return {
              id: path,
              text: name,
              type: "infoitem",
              children: []
            };
        }
      };
      treeData = genData(objectsNode);
      console.log(treeData);
      tree.settings.core.data = [treeData];
      return tree.refresh();
    };
    my.buildOdfTreeStr = function(responseString) {
      var objectsArr, omi, parsed;
      omi = WebOmi.omi;
      parsed = omi.parseXml(responseString);
      objectsArr = omi.evaluateXPath(parsed, "//odf:Objects");
      if (objectsArr.length !== 1) {
        alert("failed to get single Objects odf root");
      }
      return my.buildOdfTree(objectsArr[0]);
    };
    return WebOmi;
  };

  window.WebOmi = formLogicExt($, window.WebOmi || {});

  (function(consts, requests, formLogic) {
    return consts.afterJquery(function() {
      consts.readAllBtn.on('click', function() {
        return requests.readAll(true);
      });
      return consts.sendBtn.on('click', function() {
        return formLogic.send();
      });
    });
  })(window.WebOmi.consts, window.WebOmi.requests, window.WebOmi.formLogic);

  $(function() {
    return $('.optional-parameters .panel-heading a').on('click', function() {
      var glyph;
      glyph = $(this).children('span');
      if (glyph.hasClass('glyphicon-menu-right')) {
        glyph.removeClass('glyphicon-menu-right');
        return glyph.addClass('glyphicon-menu-down');
      } else {
        glyph.removeClass('glyphicon-menu-down');
        return glyph.addClass('glyphicon-menu-right');
      }
    });
  });

}).call(this);