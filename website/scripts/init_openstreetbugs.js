//loadNickname();

var mapnik = new OpenLayers.Layer.OSM.Mapnik("OpenStreetMap", {
	'isBaseLayer': true,
	'transitionEffect': 'resize',
	'displayOutsideMaxExtent': true,
	'wrapDateLine': true
});

var layerMarkers = new OpenLayers.Layer.Markers("OpenStreetBugs");
layerMarkers.setOpacity(0.7);

var map = new OpenLayers.Map('map', {
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

map.addLayers([mapnik, layerMarkers]);

load_location(52.477, -1.902, 11);

function endDrag(event) 
{
	save_location();
	refreshPOIs();
}

map.events.register('moveend', map, endDrag);

var click = new OpenLayers.Control.Click();
map.addControl(click);
click.activate();

refreshPOIs();

/*map = new OpenLayers.Map('map', {
		  maxExtent: new OpenLayers.Bounds(-20037508,-20037508,20037508,20037508),
		  numZoomLevels: 18,
		  maxResolution: 156543,
		  units: 'm',
		  projection: "EPSG:41001"
		 });
*/
