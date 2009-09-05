<?xml version="1.0" encoding="UTF-8"?>

<xsl:stylesheet  version="1.0" 
xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:output method="text" />
<xsl:strip-space elements="*" />

<!-- These two templates ensure that only nodes 
	 tagged as historic=memorial are processed -->
<xsl:template match="/|osm">
	<xsl:text>lat&#x9;lon&#x9;title&#x9;description</xsl:text>
	<xsl:apply-templates />
</xsl:template>

<xsl:template match="*|text()|@*" />

<xsl:template match="node[tag[@k = 'historic' and @v = 'memorial']]">
	<!-- xsl:value-of select="@id" /><xsl:text>&#x9;</xsl:text -->
	<xsl:value-of select="@lat" /><xsl:text>&#x9;</xsl:text>
	<xsl:value-of select="@lon" />
	<xsl:apply-templates select="tag[@k = 'name']" />
	<xsl:text>&#xa;</xsl:text>
</xsl:template>

<xsl:template match="tag">
	<xsl:text>&#x9;</xsl:text><xsl:value-of select="@v" /><xsl:text />
</xsl:template>

</xsl:stylesheet>
