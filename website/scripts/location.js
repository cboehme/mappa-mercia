var epsg4326 = new OpenLayers.Projection("EPSG:4326");

function load_location(default_lat, default_lon, default_zoom)
{
	var loc = new OpenLayers.LonLat(default_lon, default_lat);
	var zoom = default_zoom;

	if (document.cookie)
	{
		var cookies = document.cookie.split(";");
		for (var i in cookies)
		{
			kv = cookies[i].split("=");
			if (kv[0] == "map_location")
			{
				v = kv[1].split(":");
				loc.lat = v[0];
				loc.lon = v[1];
				zoom = v[2];
			}
		}
	}

	map.setCenter(loc.clone().transform(epsg4326, map.getProjectionObject()), zoom);

}

function save_location()
{
	var loc = map.getCenter().clone().transform(map.getProjectionObject(), epsg4326);
	var zoom = map.getZoom();

	var decimals = Math.pow(10, Math.floor(zoom/3));

	loc.lat = Math.round(loc.lat * decimals) / decimals;
	loc.lon = Math.round(loc.lon * decimals) / decimals;

	document.cookie = "map_location="+loc.lat+":"+loc.lon+":"+zoom+";";
}
