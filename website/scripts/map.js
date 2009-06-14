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

function init_map(base_map)
{
	map = new OpenLayers.Map('map', {
		controls: [
			new OpenLayers.Control.ArgParser(),
			new OpenLayers.Control.Navigation(),
			new OpenLayers.Control.PanZoomBar(),
			new OpenLayers.Control.ScaleLine()
		],
		maxResolution: 156543.0339,
		numZoomLevels: 20,
		units: 'm',
		projection: new OpenLayers.Projection("EPSG:900913"),
		displayProjection: new OpenLayers.Projection("EPSG:4326")
	});

	map.addLayer(base_map);
	
	// Load previous map location:
	var loc = new OpenLayers.LonLat(-1.902, 52.477);
	var zoom = 11;
	cookie = get_cookie("map_location");
	if (cookie != null)
	{
		v = cookie.split(":");
		loc.lat = Number(v[0]);
		loc.lon = Number(v[1]);
		zoom = Number(v[2]);
	}
	// Only set the location if no position provided in 
	// the url (which is handled by the ArgParser control:
	if(location.search == "")
		map.setCenter(loc.clone().transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()), zoom);

	map.events.register('moveend', map, save_map_location);
}

/*
 * Standard Map
 */
function init_standard_map(ev)
{
	var standard_map = new OpenLayers.Layer.OSM.Mapnik("OpenStreetMap (Mapnik)", {
		displayOutsideMaxExtent: true,
		wrapDateLine: true
	});

	init_map(standard_map);
}

/* Call this method to add a standard map
 */
function standard_map()
{
	run_on_load(init_standard_map);
}

/*
 * Cycle Map
 */
function init_cycle_map(ev)
{
	var cycle_map = new OpenLayers.Layer.OSM.CycleMap("OpenStreetMap (Cyclemap)", {
		displayOutsideMaxExtent: true,
		wrapDateLine: true
	});

	init_map(cycle_map);
}

/* Call this method to add a cycle map
 */
function cycle_map()
{
	run_on_load(init_cycle_map);
}

/*
 * Public Transport Map
 */
function init_public_transport_map(ev)
{
	var public_transport_map = new OpenLayers.Layer.OSM("&Ouml;PNV-Karte (Public Transport Map)", "http://tile.xn--pnvkarte-m4a.de/tilegen/", {
		numZoomLevels: 19,
		buffer: 0
	});

	init_map(public_transport_map);
}

/* Call this method to add a public transport map
 */
function public_transport_map()
{
	run_on_load(init_public_transport_map);
}

/*
 * Openstreetbugs
 *
 * This is a customized version of the Javascript from
 * http://openstreetbugs.appspot.com/ .
 */

var osb_projection = new OpenLayers.Projection("EPSG:4326");
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
	document.getElementById("map_OpenLayers_Container").style.cursor = "crosshair";

	osb_layer = new OpenLayers.Layer.Markers("OpenStreetBugs");
	osb_layer.setOpacity(0.7);

	map.addLayer(osb_layer);

	map.events.register('moveend', map, refresh_osb);

	var click = new OpenLayers.Control.Click();
	map.addControl(click);
	click.activate();

	refresh_osb();
}

/*
 * html contents of the popups
 */

/* Changes all occurences of "<hr />" to </p><p class="Comment"> for proper markup of comments.
 */
function fix_markup(str)
{
	return str.replace(/<hr \/>/g, '</p><p class="Comment"><b>Comment:</b> ');
}

function popup_open_bug(bug_or_id)
{
	bug = bug_or_id instanceof Object ? bug_or_id : get_bug(bug_or_id);
	
	var description = '<h1>Unresolved Error</h1><p><b>Description:</b> '+fix_markup(bug.text)+'</p>';
	var action_comment = '<ul><li><a href="#" onclick="add_comment('+bug.id+'); return false;">Add comment</a></li>';
	var action_edit = '<li><a href="http://www.openstreetmap.org/edit?lat='+bug.lat+'&amp;lon='+bug.lon+'&amp;zoom=17" target="_blank">Edit in Potlatch</a></li>';
	var action_close = '<li><a href="#" onclick="close_bug('+bug.id+'); return false;">Mark as Fixed</a></div></li></ul>';

	return description+action_comment+action_edit+action_close;
}

function popup_closed_bug(bug_or_id)
{
	bug = bug_or_id instanceof Object ? bug_or_id : get_bug(bug_or_id);

	var description = '<h1>Fixed Error</h1><p><b>Description:</b> '+fix_markup(bug.text)+'</p>';
	var note = '<p class="Note">This error has been fixed already. However, it might take a couple of days before the map image is updated.</p>';

	return description+note;
}

function popup_add_bug(position, nickname)
{
	var intro_text = '<h1>Create an Error Report</h1><p>Please provide a short description of what\'s wrong here. You can also enter your nickname to show that you found the error.</p>';
	var form_header = '<form><div><input type="hidden" name="lon" value="'+position.lon+'"><input type="hidden" name="lat" value="'+position.lat+'"></div>';
	var description = '<div><span class="InputLabel">Description:</span><input type="text" id="description" name="text"></div>';
	var nickname = '<div><span class="InputLabel">Your Nickname:</span><input type="text" id="nickname" value="'+(nickname ? nickname : 'NoName')+'"></div>';
	var form_footer = '<div class="FormFooter"><input type="button" value="OK" onclick="add_bug_submit(this.form);"><input type="button" value="Cancel" onclick="add_bug_cancel();"></div></form>';

	return intro_text+form_header+description+nickname+form_footer;
}

function popup_add_bug_wait()
{
	return '<h1>Create an Error Report</h1><p>Please wait while your error is submitted ...</p>';
}

function popup_add_comment(bug_or_id, nickname)
{
	bug = bug_or_id instanceof Object ? bug_or_id : get_bug(bug_or_id);

	var description = '<h1>Add a Comment</h1><p><b>Description:</b> '+fix_markup(bug.text)+'</p>';
	var form_header = '<form class="NewComment"><div><input type="hidden" name="id" value="'+bug.id+'"></div>';
	var comment = '<div><span class="InputLabel">Your Comment:</span><input type="text" id="comment" name="text"></div>';
	var nickname = '<div><span class="InputLabel">Your Nickname:</span><input type="text" id="nickname" value="'+(nickname ? nickname : 'NoName')+'"></div>';
	var form_footer = '<div class="FormFooter"><input type="button" value="OK" onclick="add_comment_submit('+bug.id+', this.form);"><input type="button" value="Cancel" onclick="reset_popup('+bug.id+');"></div></form>';
	
	return description+form_header+comment+nickname+form_footer;
}

function popup_close_bug(bug_or_id)
{
	bug = bug_or_id instanceof Object ? bug_or_id : get_bug(bug_or_id);

	var warning = '<h1>Mark Error as Fixed</h1><p>Do you really want to mark this error as fixed? The error will be deleted after a week.</p>';
	var form_header = '<form><div><input type="hidden" name="id" value="'+bug.id+'"></div>';
	var form_footer = '<div class="FormFooter"><input type="button" value="Yes" onclick="close_bug_submit('+bug.id+', this.form);"><input type="button" value="No" onclick="reset_popup('+bug.id+');"></div></form>';
	var description = '<p><b>Description:</b> '+fix_markup(bug.text)+'</p>';

	return warning+form_header+form_footer+description;
}

/*
 * AJAX functions
 */
function make_request(url, params)
{
	url = "/osb-proxy/"+url;
	for (var name in params)
	{
		url += (url.indexOf("?") > -1) ? "&" : "?";
		url += encodeURIComponent(name) + "=" + encodeURIComponent(params[name]);
	}

	var script = document.createElement("script");
	script.src = url;
	script.type = "text/javascript";
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

		var position = new OpenLayers.LonLat(lon, lat);

		if (bug.type == 0)
			bug.feature = create_feature(position, popup_open_bug(bug), type);
		else
			bug.feature = create_feature(position, popup_closed_bug(bug), type);
 		
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
	if (refresh_osb.call_count === undefined)
		refresh_osb.call_count = 0;
	else
		++refresh_osb.call_count;
	
	var bounds = map.getExtent().clone();
	bounds = bounds.transform(map.getProjectionObject(), osb_projection);
	bounds = bounds.toArray();
	b = bounds[1];
	t = bounds[3];
	l = bounds[0];
	r = bounds[2];
	var params = { "b": b, "t": t, "l": l, "r": r, "ucid": refresh_osb.call_count };
	make_request("getBugs", params);
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
function create_feature(position, popup_content, type)
{
	if(!create_feature.open_bug_icon)
	{
		icon_size = new OpenLayers.Size(22, 22);
		icon_offset = new OpenLayers.Pixel(-icon_size.w/2, -icon_size.h/2);
		create_feature.open_bug_icon = new OpenLayers.Icon('/style/open_bug_marker.png', icon_size, icon_offset);
		create_feature.closed_bug_icon = new OpenLayers.Icon('/style/closed_bug_marker.png', icon_size, icon_offset);
	}

	var icon = !type ? create_feature.open_bug_icon.clone() : create_feature.closed_bug_icon.clone();
	var feature = new OpenLayers.Feature(osb_layer, position.transform(osb_projection, map.getProjectionObject()), {icon: icon});
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
		if (state == 0)
		{
			this.createPopup();
			map.addPopup(this.popup);
			state = 1;
			current_feature = this;
		}
		else if (state == 1 && current_feature == this)
		{
			map.removePopup(this.popup)
			state = 0;
			current_feature = null;
		}
		OpenLayers.Event.stop(ev);
	};
	var marker_mouseover = function (ev)
	{
		if (state == 0)
		{
			document.getElementById("map_OpenLayers_Container").style.cursor = "pointer";
			this.createPopup();
			map.addPopup(this.popup)
		}
		else if (state != 2 && this == current_feature) /* If not adding a new bug show pointer over current feature */
			document.getElementById("map_OpenLayers_Container").style.cursor = "pointer";

		OpenLayers.Event.stop(ev);
	};
	var marker_mouseout = function (ev)
	{
		if (state == 0)
		{
			document.getElementById("map_OpenLayers_Container").style.cursor = "crosshair";
			map.removePopup(this.popup);
		}
		else
			document.getElementById("map_OpenLayers_Container").style.cursor = "default";
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
		var position = map.getLonLatFromViewPortPx(ev.xy);
		add_bug(position.transform(map.getProjectionObject(), osb_projection));
	},

	CLASS_NAME: "OpenLayers.Control.Click"
});

/*
 * Actions
 */
function add_bug(position)
{
	if(state == 0)
	{
		document.getElementById("map_OpenLayers_Container").style.cursor = "default";

		state = 2;
		current_feature = create_feature(position, popup_add_bug(position, get_cookie("osb_nickname")), 0);

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
	document.getElementById("map_OpenLayers_Container").style.cursor = "crosshair";

	current_feature.destroy();
	current_feature = null;
	state = 0;
	refresh_osb();
}

function add_bug_cancel()
{
	document.getElementById("map_OpenLayers_Container").style.cursor = "crosshair";

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
	document.getElementById("map_OpenLayers_Container").style.cursor = "default";

	var bug = get_bug(id);
	if (bug.type == 0)
		bug.feature.popup.setContentHTML(popup_open_bug(id));
	else
		bug.feature.popup.setContentHTML(popup_closed_bug(id));
	
	state = 1;
}
