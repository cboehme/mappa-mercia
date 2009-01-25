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

window.attachEvent("onload", correct_png);

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
	{
		main_menu.style.width = document.documentElement.clientWidth -
			parseInt(main_menu.currentStyle.marginLeft) + "px";
	}

	var body = document.getElementById("body");
	if(body.currentStyle.position == "absolute")
	{
		body.style.width = document.documentElement.clientWidth -
			parseInt(body.currentStyle.left) - 
			parseInt(body.currentStyle.right) - 
			parseInt(body.currentStyle.marginLeft) -
			parseInt(body.currentStyle.marginRight) -
			parseInt(body.currentStyle.borderLeftWidth) -
			parseInt(body.currentStyle.borderRightWidth) + "px";
		body.style.height = document.documentElement.clientHeight - 
			parseInt(body.currentStyle.top) -
			parseInt(body.currentStyle.bottom) -
			parseInt(body.currentStyle.marginTop) -
			parseInt(body.currentStyle.marginBottom) -
			parseInt(body.currentStyle.borderTopWidth) -
			parseInt(body.currentStyle.borderBottomWidth) + "px";
	}

	var footer = document.getElementById("footer");
	if(footer.currentStyle.position == "absolute")
	{
		footer.style.width = document.documentElement.clientWidth -
			parseInt(footer.currentStyle.paddingLeft) -
			parseInt(footer.currentStyle.paddingRight) + "px";
	}

	var sidebar = document.getElementById("sidebar");
	if(sidebar != null)
	{
		sidebar.style.height = parseInt(body.style.height) -
			parseInt(sidebar.currentStyle.paddingTop) -
			parseInt(sidebar.currentStyle.paddingBottom) + "px";
	}

	var map = document.getElementById("map");
	if(map != null)
	{
		map.style.width = parseInt(body.style.width) -
			parseInt(map.currentStyle.left) + "px";
		map.style.height = parseInt(body.style.height)+"px";
	}
}

window.attachEvent("onload", correct_size);
window.attachEvent("onresize", correct_size);
