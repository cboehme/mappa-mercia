/*
 * IE 7 does not provide correct width/height values if they were not set explicitly.
 * Since OpenLayers requires these values we set them here.
 */
function correct_dimensions()
{
	var body = document.getElementById("body");
	var map = document.getElementById("map");

	map.style.width = body.offsetWidth -
		parseInt(body.currentStyle.borderLeftWidth) -
		parseInt(body.currentStyle.borderRightWidth) -
		parseInt(map.currentStyle.left) + "px";
	map.style.height = body.offsetHeight -
		parseInt(body.currentStyle.borderTopWidth) -
		parseInt(body.currentStyle.borderBottomWidth) + "px";
}

window.attachEvent("onload", correct_dimensions);
window.attachEvent("onresize", correct_dimensions);
