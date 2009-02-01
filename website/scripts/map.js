/*
 * Utility functions
 */

function strip(str)
{
	return str.replace(/^\s+|\s+$/g, "");
}

/* This function is from openstreetbugs.appspot.com.
 */
function escape_html(str)
{
	if(!(str instanceof String))
		str = str.toString();

	str = str.replace(/&/g, "&amp;");
	str = str.replace(/"/g, "&quot;");
	str = str.replace(/</g, "&lt;");
	str = str.replace(/>/g, "&gt;");
	str = str.replace(/'/g, "&#146;");
	return str;
}

function set_cookie(name, value)
{
	document.cookie = name+"="+escape(value)+";";
}

function get_cookie(name)
{
	if (document.cookie)
	{
		var cookies = document.cookie.split(";");
		for (var i in cookies)
		{
			c = cookies[i].split("=");
			if (strip(c[0]) == name) return unescape(strip(c[1]));
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
	var map_div = document.getElementById("map");

	if (sidebar.className == "SidebarVisible")
	{
		sidebar.className = "SidebarHidden";
		sidebar_toggle.firstChild.replaceData(0, 1, "\u00bb");
		map_div.style.left = "10px"; 
		if(map)
			map.pan(-120, 0, {animate: false});

		set_cookie("sidebar", "hidden");
	}
	else
	{
		sidebar.className = "SidebarVisible";
		sidebar_toggle.firstChild.replaceData(0, 1, "\u00ab");
		map_div.style.left = "250px"; 
		if(map)
			map.pan(120, 0, {animate: false});

		set_cookie("sidebar", "visible");
	}

	// Call IE6 fix:
	if (typeof correct_size == 'function')
		correct_size();
	
	// Call IE7 fix:
	if (typeof correct_dimensions == 'function')
		correct_dimensions();
}

function init_sidebar(ev)
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

function init_map(ev)
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
			new OpenLayers.Control.PanZoomBar(),
			new OpenLayers.Control.ArgParser()
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
	if(location.search == "")
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
var osb_bugs = new Array();
var state = 0;
var current_feature = null;

/* Call this method to add an openstreetbugs layer to 
 * the map.
 */
function openstreetbugs()
{
	run_on_load(init_openstreetbugs);
}

function init_openstreetbugs(ev)
{
	osb_layer = new OpenLayers.Layer.Markers("OpenStreetBugs");
	osb_layer.setOpacity(0.7);

	map.addLayer(osb_layer);

	map.events.register('moveend', map, refresh_osb);

	var click = new OpenLayers.Control.Click();
	map.addControl(click);
	click.activate();

	refresh_osb();

	/* TODO: Can't we do this with css alone? 
	 * #map { cursor: crosshair; }
	function mapOver()
	{
		document.body.style.cursor='crosshair';
	}

	function mapOut()
	{
		document.body.style.cursor='auto';
	}
	*/
}

function plusfacteur(a) { return a * (20037508.34 / 180); }
function moinsfacteur(a) { return a / (20037508.34 / 180); }
function y2lat(a) { return 180/Math.PI * (2 * Math.atan(Math.exp(moinsfacteur(a)*Math.PI/180)) - Math.PI/2); }
function lat2y(a) { return plusfacteur(180/Math.PI * Math.log(Math.tan(Math.PI/4+a*(Math.PI/180)/2))); }
function x2lon(a) { return moinsfacteur(a); }
function lon2x(a) { return plusfacteur(a); }
function lonLatToMercator(ll) { return new OpenLayers.LonLat(lon2x(ll.lon), lat2y(ll.lat)); }

/*
 * html contents of the popups
 */
function popup_open_bug(bug_or_id)
{
	bug = bug_or_id instanceof Object ? bug_or_id : get_bug(bug_or_id);

	return "<div>"+bug.text+"</div><div><br><a href='#' onclick='add_comment("+bug.id+"); return false;'>Add comment</a><br><a href='http://www.openstreetmap.org/edit?lat="+bug.lat+"&lon="+bug.lon+"&zoom=17' target='_blank'>Edit in Potlatch</a><br><a href='#' onclick='close_bug("+bug.id+"); return false;'>Close bug</a></div>";
}

function popup_closed_bug(bug_or_id)
{
	bug = bug_or_id instanceof Object ? bug_or_id : get_bug(bug_or_id);

	return "<div>"+bug.text+"</div>";
}

function popup_add_bug(x, y, nickname)
{
	return "<form><input type='hidden' name='lon' value='"+x2lon(x)+"'><input type='hidden' name='lat' value='"+y2lat(y)+"'>Description: <input type='text' id='description' name='text'><br>Nickname: <input type='text' id='nickname' value='"+(nickname ? nickname : "NoName")+"'><br><input type='button' value='OK' onclick='add_bug_submit(this.form);'><input type='button' value='Cancel' onclick='add_bug_cancel();'></form>";
}

function popup_add_bug_wait()
{
	return "<div>Please wait while your bug is submitted ...</div>";
}

function popup_add_comment(bug_or_id, nickname)
{
	bug = bug_or_id instanceof Object ? bug_or_id : get_bug(bug_or_id);

	return "<div>"+bug.text+"</div><form id='edit'><input type='hidden' name='id' value='"+bug.id+"'><input type='text' id='comment' name='text'><br>Nickname: <input type='text' id='nickname' value='"+(nickname ? nickname : "NoName")+"'><br><input type='button' value='OK' onclick='add_comment_submit("+bug.id+", this.form);'><input type='button' value='Cancel' onclick='reset_popup("+bug.id+");'></form>";
}

function popup_close_bug(bug_or_id)
{
	bug = bug_or_id instanceof Object ? bug_or_id : get_bug(bug_or_id);

	return "<div>"+bug.text+"</div><br><div class='alert'>Do you really want to close this bug?<br>The bug will be deleted after a week.</div><form><input type='hidden' name='id' value='"+bug.id+"'><input type='button' value='Yes' onclick='close_bug_submit("+bug.id+", this.form);'><input type='button' value='No' onclick='reset_popup("+bug.id+");'></form>"
}

/*
 * AJAX functions
 */
function make_request(url, params)
{
	url = "http://openstreetbugs.appspot.com/"+url;
	for (var name in params)
	{
		url += (url.indexOf("?") > -1) ? "&" : "?";
		url += encodeURIComponent(name) + "=" + encodeURIComponent(params[name]);
	}

	var script = document.createElement("script");
	script.src = url;
	document.body.appendChild(script);
}

/* This method is called from the scripts that are returned 
 * on make_request calls.
 */
function putAJAXMarker(id, lon, lat, text, type)
{
	if (!bug_exist(id))
	{
		var bug = {id: id, text: text, lat: lat, lon: lon, type: type, feature: null};

		if (bug.type == 0)
			bug.feature = create_feature(lon2x(lon), lat2y(lat), popup_open_bug(bug), type);
		else
			bug.feature = create_feature(lon2x(lon), lat2y(lat), popup_closed_bug(bug), type);
 		
		osb_bugs.push(bug);
	}
}

function get_form_values(fobj)
{
	var str = "";
	var valueArr = null;
	var val = "";
	var cmd = "";
	for (var i = 0;i < fobj.elements.length;i++)
	{
		switch (fobj.elements[i].type)
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

function submit_form(f, url, on_submitted, on_finished)
{
	url = "/osb-proxy/"+url;
	var str = get_form_values(f);
	if(on_submitted)
		on_submitted();
	get_xml(url, str, on_finished);
}

function get_xml(url, str, on_finished)
{
	var xhr;
	try  { xhr = new ActiveXObject('Msxml2.XMLHTTP'); }
	catch (e)
	{
		try  { xhr = new ActiveXObject('Microsoft.XMLHTTP'); }
		catch (e2)
		{
			try  { xhr = new XMLHttpRequest(); }
			catch (e3)  { xhr = false; }
		}
	}

	xhr.onreadystatechange = function()
	{
		if (xhr.readyState == 4)
		{
			if (on_finished)
				on_finished(xhr.status);
		}
	};

	xhr.open( 'POST', url, true );
	xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded; charset=UTF-8");
	xhr.send(str);
}

/*
 * Bug management
 */
function refresh_osb()
{
	bounds = map.getExtent().toArray();
	b = y2lat(bounds[1]);
	t = y2lat(bounds[3]);
	l = x2lon(bounds[0]);
	r = x2lon(bounds[2])
	var params = { "b": b, "t": t, "l": l, "r": r };
	make_request("/getBugs", params);
}

function bug_exist(id)
{
	for (var i in osb_bugs)
	{
		if (osb_bugs[i].id == id) 
			return true;
	}
	return false;
}

function get_bug(id)
{
	for (var i in osb_bugs)
	{
	    if (osb_bugs[i].id == id)
			return osb_bugs[i];
	}
	return '';
}

/* This function creates a feature and adds a corresponding 
 * marker to the map.
 */
function create_feature(x, y, popup_content, type)
{
	if(!create_feature.open_bug_icon)
	{
		icon_size = new OpenLayers.Size(22, 22);
		icon_offset = new OpenLayers.Pixel(-icon_size.w/2, -icon_size.h/2);
		create_feature.open_bug_icon = new OpenLayers.Icon('/style/open_bug_marker.png', icon_size, icon_offset);
		create_feature.closed_bug_icon = new OpenLayers.Icon('/style/closed_bug_marker.png', icon_size, icon_offset);
	}

	var icon = !type ? create_feature.open_bug_icon.clone() : create_feature.closed_bug_icon.clone();
	var feature = new OpenLayers.Feature(osb_layer, new OpenLayers.LonLat(x, y), {icon: icon});
	feature.popupClass = OpenLayers.Class(OpenLayers.Popup.FramedCloud);
	feature.data.popupContentHTML = popup_content;

	create_marker(feature);

	return feature;
}

function create_marker(feature)
{
	var marker = feature.createMarker();
	var marker_click = function (ev)
	{
		if(state == 0)
		{
			this.createPopup();
			map.addPopup(this.popup);
			state = 1;
			current_feature = this;
		}
		else if(state == 1 && current_feature == this)
		{
			map.removePopup(this.popup)
			state = 0;
			current_feature = null;
		}
		OpenLayers.Event.stop(ev);
	};
	var marker_mouseover = function (ev)
	{
		//TODO: Style-sheets?  document.body.style.cursor='pointer';
		if(state == 0)
		{
			this.createPopup();
			map.addPopup(this.popup)
		}
		OpenLayers.Event.stop(ev);
	};
	var marker_mouseout = function (ev)
	{
		//TODO: Style-sheets?  document.body.style.cursor='crosshair';
		if(state == 0)
			map.removePopup(this.popup);
		OpenLayers.Event.stop(ev);
	};
	/* marker_click must be registered as click and not as mousedown!
	 * Otherwise a click event will be propagated to the click control
	 * of the map under certain conditions.
	 */
	marker.events.register("click", feature, marker_click);
	marker.events.register("mouseover", feature, marker_mouseover);
	marker.events.register("mouseout", feature, marker_mouseout);

	osb_layer.addMarker(marker);
}

/*
 * Control to handle clicks on the map
 */
OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {

	initialize: function() {
		OpenLayers.Control.prototype.initialize.apply(this, arguments);
	},

	destroy: function() {
		if (this.handler)
			this.handler.destroy();
		this.handler = null;

		OpenLayers.Control.prototype.destroy.apply(this, arguments);
	},

	draw: function() {
		handlerOptions = {
		'single': true,
		'double': false,
		'pixelTolerance': 0,
		'stopSingle': false,
		'stopDouble': false
		};

		this.handler = new OpenLayers.Handler.Click(this, {'click': this.click}, handlerOptions);
	},

	click: function(ev) {
		var lonlat = map.getLonLatFromViewPortPx(ev.xy);
		add_bug(lonlat.lon, lonlat.lat);
	},

	CLASS_NAME: "OpenLayers.Control.Click"
});

/*
 * Actions
 */
function add_bug(x, y)
{
	if(state == 0)
	{
		state = 2;
		current_feature = create_feature(x, y, popup_add_bug(x, y, get_cookie("osb_nickname")), 0);

		current_feature.createPopup();
		map.addPopup(current_feature.popup);

		document.getElementById('description').focus();
	}
}

function add_bug_submit(form)
{
	set_cookie("osb_nickname", document.getElementById("nickname").value);
	description = document.getElementById("description");
	description.value += " ["+ document.getElementById("nickname").value + "]";

	submit_form(form, "addPOIexec", add_bug_submitted, add_bug_completed);
}

function add_bug_submitted()
{
	current_feature.popup.setContentHTML(popup_add_bug_wait());
}

function add_bug_completed()
{
	current_feature.destroy();
	current_feature = null;
	state = 0;
	refresh_osb();
}

function add_bug_cancel()
{
	current_feature.destroy();
	state = 0;
	current_feature = null;
}

function add_comment(id)
{
	state = 3;
	current_feature.popup.setContentHTML(popup_add_comment(id, get_cookie("osb_nickname")));
	document.getElementById("comment").focus();
}

function add_comment_submit(id, form)
{
	set_cookie("osb_nickname", document.getElementById("nickname").value);
	comment = document.getElementById("comment");
	comment.value += " ["+ document.getElementById("nickname").value +"]";
	
	submit_form(form, "editPOIexec");

	var str = escape_html(form.text.value);
	for (var i in  osb_bugs)
	{
		if (osb_bugs[i].id == id)
		{
			str = osb_bugs[i].text + "<hr />" + str;
			osb_bugs[i].text = str;
			break;
		}
	}

	reset_popup(id);
}

function close_bug(id)
{
	state = 4;
	current_feature.popup.setContentHTML(popup_close_bug(id));
}

function close_bug_submit(id, form)
{
	submit_form(form, "closePOIexec");
	
	for (var i in  osb_bugs)
	{
		if (osb_bugs[i].id == id)
		{
			// Change bug status to closed:
			osb_bugs[i].type = 1;
			osb_bugs[i].feature.data.icon = create_feature.closed_bug_icon.clone();
			osb_bugs[i].feature.destroyMarker();

			create_marker(osb_bugs[i].feature);
			break;
		}
	}

	reset_popup(id);
}

function reset_popup(id)
{
	var bug = get_bug(id);
	if (bug.type == 0)
		bug.feature.popup.setContentHTML(popup_open_bug(id));
	else
		bug.feature.popup.setContentHTML(popup_closed_bug(id));
	
	state = 1;
}
