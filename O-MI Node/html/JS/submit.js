/* IconSelect object */
var iconSelect, objectUrl, omi, iconValue;

var page = 1; // Start at page 1

var manager;

/* Initial settings */
$(function() {
	manager = new ObjectBoxManager();
	
	loadThemes();
	loadPages(page);
	loadOptions();
	
	/* Click events for buttons */
	$(document).on('click', '#object-button', getObjects);
	$(document).on('click', '#request-send', sendRequest);
	$(document).on('click', '#resend', function(){
		console.log("Resending request.");
		
		$("#responseBox").html("");
		refreshEditor("response", "responseBox");
		
		sendRequest();
	});
	$(document).on('click', '#restart', function(){
		restart();
	});
	$(document).on("mouseenter", ".help", function(){
		$(this).children("p").show();
	});
	$(document).on("mouseleave", ".help", function(){
		$(this).children("p").hide();
	});
	
	/* event handler for drop down list */
	$(document).on('click', '.drop', function(event){
		event.stopPropagation();

		$(this).toggleClass("down");
		
		var id = $(this).attr("id").replace("drop-", "");
		
		$("#list-" + id).toggleClass("closed-list");
	});

function loadThemes(){
	iconSelect = new IconSelect("themes",{
		'selectedIconWidth':48,
        'selectedIconHeight':48,
        'selectedBoxPadding':1,
        'iconsWidth':48,
        'iconsHeight':48,
        'boxIconSpace':1,
        'vectoralIconNumber':1,
        'horizontalIconNumber':4});

	var icons = [];
    icons.push({'iconFilePath':'Resources/icons/dark.svg', 'iconValue':'dark'});
    icons.push({'iconFilePath':'Resources/icons/light.svg', 'iconValue':'light'});
    icons.push({'iconFilePath':'Resources/icons/green.svg', 'iconValue':'green'});
    icons.push({'iconFilePath':'Resources/icons/test_repeat.svg', 'iconValue':'test_repeat'});
    iconSelect.refresh(icons);

    for(var i = 0; i < iconSelect.getIcons().length; i++){
    	iconSelect.getIcons()[i].element.onclick = function(){
            iconSelect.setSelectedIndex(this.childNodes[0].getAttribute('icon-index'));

            $('body').css(getCSS(iconSelect.getSelectedValue())); 
        };
    }
}

function getCSS(value){
	if(value.split("_").indexOf("repeat") > -1){
		return {
			"background": "url('Resources/icons/" + value + ".svg')",
			"background-size": "100px 100px"
		};
	}
	return {
    	"background": "url('Resources/icons/" + value + ".svg') no-repeat center center fixed",
    	"-webkit-background-size": "cover",
		"-moz-background-size": "cover",
		"-o-background-size": "cover",
		"background-size": "cover"
    };
}
});


/* Get the objects from the server through ajax get */
function getObjects() {
	console.log("Sending AJAX GET for the objects...");
	
	objectUrl = $("#url-field").val();

	// Send ajax get-request for the objects
	ajaxGet(0, objectUrl, "");
}

/* Sends an ajax query for objects */
function ajaxGet(indent, url, listId){
	
	setInfo(0);
	
	$.ajax({
        type: "GET",
		dataType: "xml",
        url: url,
        success: function(data) {
			displayObjects(data, indent, url, listId);
		},
		error: function(a, b, c){
			alert("Error accessing data discovery");
		}, 
		complete : function(a , b){
			clearInfo();
		}
    });
}

/*
 * Display the objects as checkboxes in objectList 
 * @param {XML Object} the received XML data
 */
function displayObjects(data, indent, url, listId) {
	// Basic objects
	if(indent === 0){
		// Clear the list beforehand, in case objects is changed in between the
		// button clicks
		$("#objectList").empty();
		
		// Append objects as checkboxes to the webpage
		$(data).find('Objects').each(function(){
			$(this).find("Object").each(function(){
				var id = $(this).find("id").text();
				
				manager.addObject(id);
				
				// Get lower hierarchy values
				ajaxGet(indent + 1, url + "/" + id, "list-" + id);
			});
		});
	} else {
		// Subobjects/Infoitems
		$(data).find("Object").each(function(){
			var id = $($(this).find("id")[0]).text();
			var sub = [];
			
			$(this).find("Object").each(function(){
				var name = $(this).find("id").text();

				//ajaxGet(indent + 1, url + "/" + name);
				manager.find(id).addChild(id, name, "list-" + id);
				sub.push(name);
			});
			addInfoItems(this, id, indent);
			
			for(var i = 0; i < sub.length; i++){
				ajaxGet(indent + 1, url + "/" + sub[i], "list-" + id);
			}
		});
	}
}

/* Add infoitem-checkboxes to the DOM */
function addInfoItems(parent, id) {
	var margin = "20px";
	
	$(parent).find("InfoItem").each(function(){
		var name = $(this).attr('name');

		// Append InfoItem as checkbox
		$('<li><label>' + 
		'<input type="checkbox" class="checkbox ' + id + '" name="' + name + '"/>' + name +
		'</label></li>').appendTo("#list-" + id); 
		
		// Styling (margin)
		$("#list-" + id).last().css({ marginLeft: margin });
	});
}

/* Send the O-DF request using AJAX */
function sendRequest()
{
	if(generating){
		setTimeout(sendRequest, 500);
		return;
	}
	
	// O-MI node Server URL
	var server = getServerUrl();

    var request = requestEditor.getValue(); // Get the request string

    ajaxPost(server, request);
}

// Test
var count = 0;

function ajaxPost(server, request){
	setInfo(1);
	
	$.ajax({
		type: "POST",
		url: server,
		data: request,
		contentType: "text/xml",
		processData: false,
		dataType: "text",
		success: function(response){
			printResponse(response);
		},
		complete: function(a, b) {
			clearInfo();
		},
		error: function(a, b, c){
			handleError(a, b, c);
		},
	});
}

/* Get subscription from the server */
function getSub(){
	var response = $("#responseBox").text();
	console.log(response);
	var r1 = response.split("<omi:requestId>");
	
	if(r1.length === 2 || omi.requestId){
		if(r1.length === 2){
			r2 = r1[1].split("</omi:requestId>")[0];
			omi.requestId = r2;
		}
		var subRequest = omi.getSub(omi.requestId, checkedObjects());
		console.log("Request: " + subRequest);
		var server = getServerUrl();
		
		ajaxPost(server, subRequest);
	} else {
		alert("No request id found!");
	}
}

function getServerUrl() {
	var o = $("#url-field").val();
	if(o) {
		return o.replace("/Objects", "");
	}
	console.log("Couldn't find server url");
	return "";
}

/* Do something with the response from the server */
function printResponse(response){
	console.log("Got response!");
	
	var formattedXML = formatNoHighlight(response);
	// console.log(formattedXML);
    $("#responseBox").html(formattedXML);

    refreshEditor("response", "responseBox");
}

/* Handle the ajax errors */
function handleError(jqXHR, errortype, exc) {
	console.log(jqXHR.responseText);
	$("#responseBox").html(formatNoHighlight(jqXHR.responseText));
	refreshEditor("response", "responseBox");
	
	console.log("Error sending to server: (" + exc +")");
}

function restart() {
	$("#progressbar li").removeClass("active");
	$("#page3").empty();
	$("#page2").empty();
	$("#page1").empty();
	loadPages(1);
	page = 1;
	$("#progressbar li").eq(0).addClass("active");
}

