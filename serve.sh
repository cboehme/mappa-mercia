#!/bin/bash

ln -sf ../osb-proxy ./website/osb-proxy
ln  -sf ../../../gritting/tiles ./website/tiles/gritting-overlay

./mongoose/mongoose -ssi_ext .shtml,.shtml.inc -cgi_ext addPOIexec,editPOIexec,closePOIexec,getBugs -root ./website

rm -f ./website/osb-proxy
rm -f ./website/tiles/gritting-overlay
