<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:cb="http://www.cbeta.org/ns/1.0">
    <xsl:output method="html" encoding="utf-8" indent="yes"/>

    <xsl:template match="/">
        <html>
            <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            <title>長阿含經</title>
            </head>
            <body>
                <div id='body' data-punc="CBETA">
                    <xsl:apply-templates select="/tei:TEI/tei:text" />
                </div>
            </body>
        </html>
    </xsl:template>

    <xsl:template match="/tei:TEI/tei:teiHeader"/>

    <xsl:template match="/tei:TEI/tei:text/tei:back"/>

    <xsl:template match="tei:note"/>
    <xsl:template match="cb:t[not(@xml:lang='zh-Hant')]"/>

    <xsl:template match="tei:lb">
        <span class="lb">
            <xsl:attribute name="id">
                <xsl:value-of select="@n" />
            </xsl:attribute>
        </span>
    </xsl:template>

    <xsl:template match="text()[preceding-sibling::tei:lb]">
        <span class="t" l="{preceding-sibling::tei:lb[@n]}"><xsl:copy /></span>
    </xsl:template>

    <xsl:template match="tei:lem">
        <span><xsl:copy-of select="text()"/></span>
    </xsl:template>

    <xsl:template match="tei:p">
        <p>
            <xsl:if test="@xml:id">
                <xsl:attribute name="id">
                    <xsl:value-of select="@xml:id"/>
                </xsl:attribute>
            </xsl:if>
            <xsl:apply-templates/>
        </p>
    </xsl:template>

    <xsl:template match="tei:rdg" />

</xsl:stylesheet>
