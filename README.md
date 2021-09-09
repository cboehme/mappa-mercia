# Mappa Mercia Website #

These are the sources of the first website of the [Mappa Mercia project](http://mappa-mercia.org/). 
The website has been migrated to Word Press years ago. This copy of 
the original subversion repository is only kept for historical reasons. 

Mappa Mercia is a project to grow [OpenStreetMap](http://openstreetmap.org/) in the West Midlands, UK.

## Source code organisation ##

 - _aggregation_ contains first drafts of a server-side script to integrate
   blog entries from blogger into the website
 - _design-draft_ of the layout and design of the website
 - _mongoose_ contains a copy of the [Mongoose web server](https://code.google.com/archive/p/mongoose/) 
   which can be used during development to handle the server-side includes in
   the webpages
 - _osb-proxy_ is a simple openstreetbugs implementation for testing. Requires a
   MySQL database
 - The _osm2text.xsl_ creates a list of blue plaques for the memorial map
 - _serve.sh_ starts the Mongoose webserver
 - _website_ contains html, css and javascript files of the website
 
