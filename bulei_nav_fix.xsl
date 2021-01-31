<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output method="xml" encoding="utf-8" indent="yes" />

    <xsl:template match="/">
        <xsl:apply-templates />
    </xsl:template>

    <xsl:variable name="catalog1" select="/html/body/nav/span | /html/body/nav/ol" />
    <xsl:variable name="catalogsRemaining" select="/html/body/nav/li" />

    <xsl:template match="/html/body/nav">
        <nav>
            <li><xsl:copy-of select="$catalog1" /></li>
            <xsl:copy-of select="$catalogsRemaining" />
        </nav>
    </xsl:template>

    <xsl:template match="@* | node()">
        <xsl:copy>
            <xsl:apply-templates select="@* | node()" />
        </xsl:copy>
    </xsl:template>
</xsl:stylesheet>
