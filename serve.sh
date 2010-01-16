#!/bin/bash

ln -sf ../osb-proxy ./website/osb-proxy
ln  -sf ../../gritting/tiles ./website/tiles

./mongoose/mongoose -ssi_ext .shtml,.shtml.inc -cgi_ext addPOIexec,editPOIexec,closePOIexec,getBugs -root ./website

rm -f ./website/osb-proxy
rm -f ./website/tiles
