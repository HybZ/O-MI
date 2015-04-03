/* Generate the O-DF request */
function generateRequest(){
	var operation = $("#icons").find(".selected").attr("alt"); //Get the selected operation from the IconSelect object
	var ttl = $("#ttl").val(); 
	if(ttl){
		ttl = ttl.replace(/\s/g, '');
	}
	var interval = $("#interval").val();
	var begin = $("#begin").val();
	var end = $("#end").val();
	var newest = $("#newest").val();
	var oldest = $("#oldest").val();
	var callback = $("#callback").val();
	var requestIds = [];
	
	$(".requestId").each(function(){
		requestIds.push($(this).val());
	});
	
	if(!omi){
		omi = new Omi();
	} 
	if(omi.operation && omi.operation != operation){
		omi.saveOptions();
	}
	
	omi.update(operation, ttl, interval, begin, end, newest, oldest, callback, requestIds);
	
	var request = omi.getRequest(checkedObjects());
	
	console.log("Generated the O-DF request");
	
	$("#editRequest").html(request);
}

/* Returns all checkboxes that are checked */
function checkedObjects() {
	return $("#objectList").find("input").filter(":checked"); //Filter the selected objects (checkboxes that are checked)
}