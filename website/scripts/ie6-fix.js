/* 
 * Function to fix broken PNG transparency in Win IE 5.5 or higher. It is from
 * openstreetmap.org.
 */

function correct_png()
{
  for(var i=0; i<document.images.length; i++)
  {
    var img = document.images[i]
      var imgName = img.src.toUpperCase()
      if (imgName.indexOf('.PNG') > 0 && !img.id.match(/^OpenLayers/))
      {
        var imgID = (img.id) ? "id='" + img.id + "' " : ""
          var imgClass = (img.className) ? "class='" + img.className + "' " : ""
          var imgTitle = (img.title) ? "title='" + img.title + "' " : "title='" + img.alt + "' "
          var imgStyle = "display:inline-block;" + img.style.cssText 
          if (img.align == "left") imgStyle = "float:left;" + imgStyle
            if (img.align == "right") imgStyle = "float:right;" + imgStyle
              if (img.parentElement.href) imgStyle = "cursor:hand;" + imgStyle   
                var strNewHTML = "<span " + imgID + imgClass + imgTitle
                  + " style=\"" + "width:" + img.width + "px; height:" + img.height + "px;" + imgStyle + ";"
                  + "filter:progid:DXImageTransform.Microsoft.AlphaImageLoader"
                  + "(src=\'" + img.src + "\', sizingMethod='scale');\"></span>" 
                  img.outerHTML = strNewHTML
                  i = i-1
      }
  }
}


/*
 * Function to fix broken right/bottom css properties when using position: absolute.
 */

function correct_size()
{
	var header = document.getElementById("header");
	if(header.currentStyle.position == "absolute")
		{ header.style.width = document.documentElement.clientWidth +"px"; }

	var main_menu = document.getElementById("main_menu");
	if(main_menu.currentStyle.position == "absolute")
		{ main_menu.style.width = document.documentElement.clientWidth-20+"px"; }

	var body = document.getElementById("body");
	if(body.currentStyle.position == "absolute")
	{
		body.style.width = document.documentElement.clientWidth+"px";
		body.style.height = document.documentElement.clientHeight-130+"px";
	}

	var footer = document.getElementById("footer");
	if(footer.currentStyle.position == "absolute")
		{ footer.style.width = document.documentElement.clientWidth-30+"px"; }

	var map = document.getElementById("map");
	if(map != null)
	{
		map.style.width = parseInt(body.style.width)-32+"px";
		map.style.height = parseInt(body.style.height)-22+"px";
	}
}


/*
 * Activate the fixes:
 */

window.attachEvent("onload", correct_png);

window.attachEvent("onload", correct_size);
window.attachEvent("onresize", correct_size);
