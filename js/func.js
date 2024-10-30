/*
Open.js
Auteur : Nicolas Desmarets
Copyright (c) 2020 Lockee.fr
*/
function openLock(idlock){
	if(jQuery("#lock-"+idlock+" #inputcode").val() != ""){
		jQuery.ajax({
			type: 'GET',  
			url: ajaxurl,
			dataType: "html",
			contentType: 'application/html; charset=utf-8',
			data: {action : "verifcode", id : idlock, code : jQuery("#lock-"+idlock+" #inputcode").val()},
			timeout: 3000,
			success: function(data){
				if(data == "[[LOCKEE_ERROR]]"){
					alert(errorOpenLock);
				} else if(data == "[[LOCKEE_BADCODE]]"){
					jQuery("#lock-"+idlock+" #wrongcode").fadeIn(0).delay(1500).fadeOut(0);
				} else {
					jQuery("#lock-"+idlock+" #contentlock").html(data);
					jQuery("#lock-"+idlock+" #isclose").hide();
					jQuery("#lock-"+idlock+" #isopen").show();
					jQuery("#lock-"+idlock+" #report").show();
				}
			}
		});
	}
}
function closeLock(idlock, lock){
	lock.clearCode();
	jQuery("#lock-"+idlock+" #contentlock").html("");
	jQuery("#lock-"+idlock+" #isopen").hide();
	jQuery("#lock-"+idlock+" #report").hide();
	jQuery("#lock-"+idlock+" #isclose").show();
}