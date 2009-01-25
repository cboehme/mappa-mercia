/*
 * Utility functions
 */
function strip(str)
{
	return str.replace(/^\s+|\s+$/g, "");
}

function set_cookie(name, value)
{
	document.cookie = name+"="+value+";";
}

function get_cookie(name)
{
	if (document.cookie)
	{
		var cookies = document.cookie.split(";");
		for (var i in cookies)
		{
			c = cookies[i].split("=");
			if (strip(c[0]) == name) return strip(c[1]);
		}
	}
	return null;
}

/* 
 * Run on load 
 */
function run_on_load(func)
{ 
	if(run_on_load.loaded) func();
	else run_on_load.functions.push(func);
}

run_on_load.functions = [];
run_on_load.loaded = false;
run_on_load.run = function()
{
	if (run_on_load.loaded) return;
	
	for(i in run_on_load.functions)
	{
		try { run_on_load.functions[i](); }
		catch(e) {}
	}

	run_on_load.loaded = true;
	delete run_on_load.functions;
	delete run_on_load.run;
}

if (window.addEventListener)
	window.addEventListener("load", run_on_load.run, false);
else if (window.attachEvent)
	window.attachEvent("onload", run_on_load.run);
else
	window.onload = run_on_load.run;

/*
 * Sidebar
 */
function toggle_sidebar()
{
	var sidebar = document.getElementById("sidebar");
	var sidebar_toggle = document.getElementById("sidebar_toggle");
	var map = document.getElementById("map");

	if (sidebar.className == "SidebarVisible")
	{
		sidebar.className = "SidebarHidden";
		sidebar_toggle.firstChild.replaceData(0, 1, "\u00bb");
		map.style.left = "10px"; 

		set_cookie("sidebar", "hidden");
	}
	else
	{
		sidebar.className = "SidebarVisible";
		sidebar_toggle.firstChild.replaceData(0, 1, "\u00ab");
		map.style.left = "250px"; 

		set_cookie("sidebar", "visible");
	}

	// Call IE6 fix:
	if (typeof correct_size == 'function')
		correct_size();
	
	// Call IE7 fix:
	if (typeof correct_dimensions == 'function')
		correct_dimensions();
}

function init_sidebar(event)
{
	if (get_cookie("sidebar") == "hidden")
		toggle_sidebar();

	if (window.addEventListener)
		document.getElementById("sidebar_toggle").addEventListener("click", toggle_sidebar, false);
	else if (window.attachEvent)
		document.getElementById("sidebar_toggle").attachEvent("onclick", toggle_sidebar);
}

run_on_load(init_sidebar);

/*
 * Map
 */
var map = null;

function save_map_location()
{
	var loc = map.getCenter().clone().transform(map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));
	var zoom = map.getZoom();

	var decimals = Math.pow(10, Math.floor(zoom/3));

	loc.lat = Math.round(loc.lat * decimals) / decimals;
	loc.lon = Math.round(loc.lon * decimals) / decimals;

	set_cookie("map_location", loc.lat+":"+loc.lon+":"+zoom);
}

function init_map(event)
{
	var mapnik = new OpenLayers.Layer.OSM.Mapnik("OpenStreetMap", {
		'isBaseLayer': true,
		'transitionEffect': 'resize',
		'displayOutsideMaxExtent': true,
		'wrapDateLine': true
	});

	map = new OpenLayers.Map('map', {
		'controls': [
			new OpenLayers.Control.MouseDefaults(),
			new OpenLayers.Control.ScaleLine(),
			new OpenLayers.Control.PanZoomBar()
		],
		'maxResolution': 156543.0399,
		'numZoomLevels': 20,
		'units': 'm',
		'displayProjection': new OpenLayers.Projection("EPSG:4326")
	});
	map.addLayers([mapnik]);
	
	// Load previous map location:
	var loc = new OpenLayers.LonLat(-1.902, 52.477);
	var zoom = 11;
	cookie = get_cookie("map_location");
	if (cookie != null)
	{
		v = cookie.split(":");
		loc.lat = v[0];
		loc.lon = v[1];
		zoom = v[2];
	}
	map.setCenter(loc.clone().transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()), zoom);

	map.events.register('moveend', map, save_map_location);
}

run_on_load(init_map);

/*
 * Openstreetbugs
 *
 * This is a customized version of the Javascript from
 * http://openstreetbugs.appspot.com/ .
 */
var osb_layer = null;

function openstreetbugs()
{
	run_on_load(init_openstreetbugs);
}

function init_openstreetbugs(event)
{
	osb_layer = new OpenLayers.Layer.Markers("OpenStreetBugs");
	osb_layer.setOpacity(0.7);

	map.addLayers([osb_layer]);

	map.events.register('moveend', map, refresh_osb);

	var click = new OpenLayers.Control.Click();
	map.addControl(click);
	click.activate();

	refresh_osb();
}

function plusfacteur(a) { return a * (20037508.34 / 180); }
function moinsfacteur(a) { return a / (20037508.34 / 180); }
function y2lat(a) { return 180/Math.PI * (2 * Math.atan(Math.exp(moinsfacteur(a)*Math.PI/180)) - Math.PI/2); }
function lat2y(a) { return plusfacteur(180/Math.PI * Math.log(Math.tan(Math.PI/4+a*(Math.PI/180)/2))); }
function x2lon(a) { return moinsfacteur(a); }
function lon2x(a) { return plusfacteur(a); }
function lonLatToMercator(ll) { return new OpenLayers.LonLat(lon2x(ll.lon), lat2y(ll.lat)); }

function encodeMyHtml(str)
{
	if(typeof(str)!="string")
		str = str.toString();

	str = str.replace(/&/g, "&amp;") ;
	str = str.replace(/"/g, "&quot;") ;
	str = str.replace(/</g, "&lt;") ;
	str = str.replace(/>/g, "&gt;") ;
	str = str.replace(/'/g, "&#146;") ;
	return str;
}

//----------- AJAX Tools --------------

//--- Remote Javascript ---
function makeRequest(sUrl, oParams)
{
	sUrl = "http://openstreetbugs.appspot.com/"+sUrl;
	for (sName in oParams)
	{
		if (sUrl.indexOf("?") > -1)
		{
			sUrl += "&";
		}
		else
		{
			sUrl += "?";
		}
		sUrl += encodeURIComponent(sName) + "=" + encodeURIComponent(oParams[sName]);
	}

	var oScript = document.createElement("script");
	oScript.src = sUrl;
	document.body.appendChild(oScript);
}

//--- Post Form ---

function getFormValues(fobj)
{
	var str = "";
	var valueArr = null;
	var val = "";
	var cmd = "";
	for (var i = 0;i < fobj.elements.length;i++)
	{
		switch(fobj.elements[i].type)
		{
			case "text":
			case "textarea":
			case "hidden":
				str += fobj.elements[i].name + "=" + encodeURIComponent(fobj.elements[i].value) + "&";
				break;
			case "select-one":
				str += fobj.elements[i].name + "=" + fobj.elements[i].options[fobj.elements[i].selectedIndex].value + "&";
				break;
		}
	}
	str = str.substr(0,(str.length - 1));
	return str;
}

var xmlReq = null;

function submitForm(f, url)
{
	url = "http://openstreetbugs.appspot.com/"+url;
	var str = getFormValues(f);
	getXML(url,str);
}

function displayState()
{}

function getXML(url,str)
{
	var doc = null
	var xhr;
	try { xhr = new ActiveXObject('Msxml2.XMLHTTP'); }
	catch (e)
	{
		try { xhr = new ActiveXObject('Microsoft.XMLHTTP'); }
		catch (e2)
		{
			try { xhr = new XMLHttpRequest(); }
			catch (e3) { xhr = false; }
		}
	}
	xhr.onreadystatechange = function()
	{
		if(xhr.readyState == 4)
		{
			if(xhr.status == 200)
			{
				//ok
			}
			else
			{
				//error
			}
		}
	};

	xhr.open( 'POST', url, true );
	xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded; charset=UTF-8");
	xhr.send(str);
}

//==================================================================
//------------------------ Markers management ----------------------

function refresh_osb()
{
	bounds = map.getExtent().toArray();
	b = y2lat(bounds[1]);
	t = y2lat(bounds[3]);
	l = x2lon(bounds[0]);
	r = x2lon(bounds[2])
	var oParams = { "b": b, "t": t, "l": l, "r": r };
	makeRequest("/getBugs", oParams);
}

var markers = new Array();

function markerExist(id)
{
	for (var i = 0; i < markers.length; i++)
	{
		if (markers[i][0] == id) 
			return true;
	}
	return false;
}

// getMarker(id)[j] -> 1:text / 2:lat / 3:lon / 4:markertype
function getMarker(id)
{
	for (var i = 0; i < markers.length; i++)
	{
    if (markers[i][0] == id)
		return markers[i];
	}
	return '';
}

function getMarkerText(id)
{
	for (var i = 0; i < markers.length; i++)
	{
		if (markers[i][0] == id)
			return markers[i][1];
	}
	return '';
}

function getMarkerlat(id)
{
	for (var i = 0; i < markers.length; i++)
	{
    	if (markers[i][0] == id)
			return markers[i][2];
	}
	return '';
}

function getMarkerlon(id)
{
	for (var i = 0; i < markers.length; i++)
	{
		if (markers[i][0] == id)
			return markers[i][3];
	}
	return '';
}

function putAJAXMarker(id, lon, lat, markerText, marktype)
{
	if (!markerExist(id))
	{
 		markers.push(new Array(id, markerText, lat, lon, marktype));
		if (marktype == 0)
		{
			putMarker(lon2x(lon), lat2y(lat), "<div>"+markerText+"</div><div><br/><a href='#' onclick='editPopup("+id+"); return false;'>Add comment</a><br/><a href='http://www.openstreetmap.org/edit?lat="+lat+"&lon="+lon+"&zoom=17' target='_blank'>Edit in Potlatch</a><br/><a href='#' onclick='delMarker("+id+"); return false;'>Close mark</a></div>", marktype);
    	}
		else
		{
			putMarker(lon2x(lon), lat2y(lat), "<div>"+markerText+"</div><!--<div><br/><a href='#' onclick='editPopup("+id+"); return false;'>Add comment</a></div>-->", marktype);
		}
	}
}

var currentPopup;
var currentFeature;
var clicked = false;

function showPop(feature)
{
	if (currentPopup != null)
	{
		currentPopup.hide();
	}
	if (feature.popup == null)
	{
		feature.popup = feature.createPopup();
		map.addPopup(feature.popup);
	}
	else
	{
		feature.popup.toggle();
	}
	currentPopup = feature.popup;
}

var size = new OpenLayers.Size(22,22);
var offset = new OpenLayers.Pixel(-(size.w/2), -(size.h/2));
var icon_error = new OpenLayers.Icon('/style/osb_error.png',size,offset);
var icon_valid = new OpenLayers.Icon('/style/osb_fixed.png',size,offset);

function putMarker(x, y, popupContent, marktype)
{
	var iconclone;
	if (marktype == 0)
	{
		iconclone = icon_error.clone();
	}
	else if (marktype == 1)
	{
		iconclone = icon_valid.clone();
	}
	else
	{
		iconclone = icon_error.clone();
	}
	var feature = new OpenLayers.Feature(markers, new OpenLayers.LonLat(x, y), {icon:iconclone});
	feature.closeBox = false;
	feature.popupClass = OpenLayers.Class(OpenLayers.Popup.FramedCloud);
	feature.data.popupContentHTML = popupContent;
	feature.data.overflow = "hidden";
	var marker = feature.createMarker();
	var markerClick = function (evt)
	{
		currentFeature = this;
		if (clicked)
		{
			if (currentPopup == this.popup)
			{
				this.popup.hide();
				clicked = false;
			}
			else
			{
				currentPopup.hide();
				showPop(this);
			}
		}
		else
		{
			showPop(this);
			clicked = true;
		}
		OpenLayers.Event.stop(evt);
	};
	var markerOver = function (evt)
	{
		document.body.style.cursor='pointer';
		if (!clicked)
			showPop(this);
		OpenLayers.Event.stop(evt);
	};
	var markerOut = function (evt)
	{
		document.body.style.cursor='crosshair';
		if (!clicked && currentPopup != null)
			currentPopup.hide();
		OpenLayers.Event.stop(evt);
	};
	marker.events.register("mousedown", feature, markerClick);
	marker.events.register("mouseover", feature, markerOver);
	marker.events.register("mouseout", feature, markerOut);

	osb_layer.addMarker(marker);
	return feature;
}

function resetMarker(id)
{
	var mark = getMarker(id);
	var mark_text = mark[1];
	var mark_lat = mark[2];
	var mark_lon = mark[3];
	var mark_type = mark[4];
	if (mark_type == 0)
	{
		currentPopup.setContentHTML("<div>"+mark_text+"</div><div><br/><a href='#' onclick='editPopup("+id+"); return false;'>Add comment</a><br /><a href='http://www.openstreetmap.org/edit?lat="+mark_lat+"&lon="+mark_lon+"&zoom=17' target='_blank'>Edit in Potlatch</a><br /><a href='#' onclick='delMarker("+id+"); return false;'>Close mark</a></div>");
	}
	else
	{
		currentPopup.setContentHTML("<div>"+mark_text+"</div><!--<div><br/><a href='#' onclick='editPopup("+id+"); return false;'>Add comment</a></div>-->");
	}
}

//--------------- add mark ------------
//
var tempFeature;

function putNewMarker(x, y)
{
	if(tempFeature) return;
	tempFeature = putMarker(x, y, "<form><input type='hidden' name='lon' value='"+x2lon(x)+"' /><input type='hidden' name='lat' value='"+y2lat(y)+"' />Description: <input type='text' id='addTextBox"+x+":"+y+"' name='text' onKeyPress='addMarkerCheckEnter(event, this.form);' /><br/>Nickname: <input type='text' name='nickname'/><br><input type='button' value='ok' onclick='addMarkerSubmit(this.form);' /><input type='button' value='cancel' onclick='cancelAddMarker();' /></form>", 0);
	clicked = true;
	showPop(tempFeature);
	document.getElementById('addTextBox'+x+':'+y).focus();
}

function addMarkerCheckEnter(ev, form)
{
	ev=ev||event;
	if (ev)
	{
		if(ev.keyCode==13)
		{
			addMarkerSubmit(form);
			return false;
		}
	}
	return true;
}

function addMarkerSubmit(form)
{
	form.text.value = form.text.value + " ["+ document.getElementById('nickname').value + "]";
	submitForm(form, "addPOIexec");
	osb_layer.removeMarker(tempFeature.marker);
	tempFeature.popup.destroy();
	tempFeature.marker.destroy();
	tempFeature = null;
	currentPopup = null;
	clicked = false;
	setTimeout("refresh_osb()", 2000);
}

function cancelAddMarker()
{
	osb_layer.removeMarker(tempFeature.marker);
	tempFeature.popup.destroy();
	tempFeature.marker.destroy();
	tempFeature = null;
	currentPopup = null;
	clicked = false;
}

//------------ add comment ------------

function editPopup(id)
{
	currentPopup.setContentHTML("<div>"+getMarkerText(id)+"</div><form id='edit'><input type='hidden' name='id' value='"+id+"' /><input type='text' id='editBox"+id+"' name='text' onKeyPress='editPopupCheckEnter(event, "+id+", this.form);'/><br /><input type='button' value='ok' onclick='editPopupSubmit("+id+", this.form);' /><input type='button' value='cancel' onclick='editPopupCancel("+id+");' /></form>");
	document.getElementById('editBox'+id).focus();
}

function editPopupCheckEnter(ev, id, form)
{
	ev=ev||event;
	if (ev)
	{
		if(ev.keyCode==13)
		{
			editPopupSubmit(id, form);
 			return false;
		}
	}
	return true;
}

function editPopupSubmit(id, form)
{
	form.text.value = form.text.value + " ["+ document.getElementById('nickname').value +"]";
	submitForm(form, "editPOIexec");
	var str = encodeMyHtml(form.text.value);
	for (var i = 0; i < markers.length; i++)
	{
		if (markers[i][0] == id)
		{
			str = markers[i][1] + "<hr />" + str;
			markers[i][1] = str;
			break;
		}
	}
	resetMarker(id);
}

function editPopupCancel(id)
{
	resetMarker(id);
}

//----------- close mark -----------
//
function delMarker(id)
{
	currentPopup.setContentHTML("<div>"+getMarkerText(id)+"</div><br/><div class='alert'>Do you really want to close this marker ?<br/>The marker will be deleted after a week.</div><form><input type='hidden' name='id' value='"+id+"' /><input type='button' value='yes' onclick='delMarkerSubmit("+id+", this.form);' /><input type='button' value='cancel' onclick='delMarkerCancel("+id+");' /></form>");
}

function delMarkerSubmit(id, form)
{
	submitForm(form, "closePOIexec");
	osb_layer.removeMarker(currentFeature.marker);
	currentFeature.popup.destroy();
	currentFeature.marker.destroy();
	currentFeature = null;
	currentPopup = null;
	clicked = false;
	for (var i = 0; i < markers.length; i++)
	{
    	if (markers[i][0] == id)
		{
			markers[i][0] = -1;
			break;
		}
	}
	setTimeout("refresh_osb()", 2000);
}

function delMarkerCancel(id)
{
	resetMarker(id);
}

/* ------------ curseur et clic sur carte -------------- */

function mapOver()
{
	document.body.style.cursor='crosshair';
}

function mapOut()
{
	document.body.style.cursor='auto';
}

OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {
	defaultHandlerOptions: {
		'single': true,
		'double': false,
		'pixelTolerance': 0,
		'stopSingle': false,
		'stopDouble': false
	},
	initialize: function(options) {
		this.handlerOptions = OpenLayers.Util.extend(
			{}, this.defaultHandlerOptions
		);
		OpenLayers.Control.prototype.initialize.apply(
			this, arguments
		);
		this.handler = new OpenLayers.Handler.Click(
			this, {
				'click': this.trigger
			}, this.handlerOptions
		);
	},
	trigger: function(e) {
		var lonlat = map.getLonLatFromViewPortPx(e.xy);
		putNewMarker(lonlat.lon, lonlat.lat);
	}
});

/*----------------------------------- cookie for nickname ------------------------- */

function loadNickname()
{
	var nickname = "";
	var nameEQ = "name=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++)
	{
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0)
		{
			nickname = c.substring(nameEQ.length,c.length);
			break;
		}
	}
	if (nickname == "")
		nickname = "NoName";
	document.getElementById('nickname').value = nickname;
}

function saveNickname()
{
	var nickname = document.getElementById('nickname').value;
	var expires = (new Date((new Date()).getTime() + 157680000000)).toGMTString();
	document.cookie="name="+encodeURIComponent(nickname)+";expires="+expires+";path=/";
}

/*map = new OpenLayers.Map('map', {
		  maxExtent: new OpenLayers.Bounds(-20037508,-20037508,20037508,20037508),
		  numZoomLevels: 18,
		  maxResolution: 156543,
		  units: 'm',
		  projection: "EPSG:41001"
		 });
*/
