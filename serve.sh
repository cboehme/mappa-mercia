#!/bin/bash

ln -sf ../osb-proxy ./website/osb-proxy
./mongoose/mongoose -ssi_ext .shtml,.shtml.inc -cgi_ext addPOIexec,editPOIexec,closePOIexec -root ./website
rm -f ./website/osb-proxy
