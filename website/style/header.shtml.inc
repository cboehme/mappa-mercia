<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">

<html>
<head>
	<title>Mappa Mercia</title>

	<link rel="stylesheet" href="/style/base.css" type="text/css">
	<link rel="stylesheet" href="/style/<!--#echo var="PAGE_TYPE"-->.css" type="text/css">

	<!-- #if expr="${PAGE_TYPE} == map"-->
	<script src="http://openlayers.org/api/OpenLayers.js" type="text/javascript"></script>
	<script src="http://www.openstreetmap.org/openlayers/OpenStreetMap.js" type="text/javascript"></script>
	<script src="/scripts/map.js" type="text/javascript"></script>
	<!--[if IE 6]><style type="text/css">#sidebar  { background-image: none; }</style><![endif]-->
	<!--[if IE 7]><script src="/scripts/ie7-fix.js" type="text/javascript"></script><![endif]-->
	<!--#endif-->

	<!--[if IE 6]><script src="/scripts/ie6-fix.js" type="text/javascript"></script><![endif]-->
</head>

<body>
	<div id="header">
		<img src="/style/header_map.png" alt="Logo showing a map" id="header_map">
		<a href="/" rel="start" title="Back to homepage"><img src="/style/header_title.png" alt="Mappa Mercia" id="header_title"></a>
	</div>

	<!--#include virtual="../main_menu.html.inc"-->

	<div id="body">
