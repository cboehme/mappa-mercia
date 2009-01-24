/*
 * IE 7 does not provide correct width/height values if they were not set explicitly.
 * Since OpenLayers requires these values we set them here.
 */

function correct_dimensions()
{
	var map = document.getElementById("map");
	if( map != null)
	{
		map.style.width = document.documentElement.clientWidth-32+"px";
		map.style.height =document.documentElement.clientHeight-152+"px";
	}
}


/*
 * Activate the fix:
 */

window.attachEvent("onload", correct_dimensions);
window.attachEvent("onresize", correct_dimensions);
