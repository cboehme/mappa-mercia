var mapnik = new OpenLayers.Layer.OSM.Mapnik("OpenStreetMap", {
	'isBaseLayer': true,
	'transitionEffect': 'resize',
	'displayOutsideMaxExtent': true,
	'wrapDateLine': true
});

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
map.addLayers([mapnik]);

load_location(52.477, -1.902, 11);

map.events.register('moveend', map, save_location);
