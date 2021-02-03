<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:tei="http://www.tei-c.org/ns/1.0" xmlns:cb="http://www.cbeta.org/ns/1.0">
    <xsl:output method="html" encoding="utf-8" indent="yes" />

    <xsl:template match="/">
        <html>
            <head>
                <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            </head>
            <body>
                <div id='body' data-punc="CBETA">
                    <xsl:apply-templates select="/tei:TEI/tei:text" />
                </div>
            </body>
        </html>
    </xsl:template>

    <xsl:template match="/tei:TEI/tei:teiHeader" />
    <xsl:template match="/tei:TEI/tei:text/tei:back" />

    <!-- <anchor> -->
    <xsl:template match="tei:anchor[substring(@xml:id, 1, 2)='fx']">
        <span class='note_star'>[＊]</span>
    </xsl:template>
    <xsl:template match="tei:anchor[@type='circle']">
        ◎
    </xsl:template>

    <!-- <app><lem> -->
    <xsl:template match="tei:lem">
        <span>
            <xsl:apply-templates />
        </span>
    </xsl:template>

    <!-- biblScope (ignored) -->

    <!-- <byline> -->

    <!-- <caesura> -->

    <!-- <div> -->

    <!-- <cb:docNumber> -->
    <xsl:template match="cb:docNumber">
        <p class='juannum' data-tagname='p'>
            <xsl:apply-templates />
        </p>
    </xsl:template>

    <!-- <entry> -->

    <!-- <figDesc> -->
    <xsl:template match="tei:figDesc">
        <span class='figdesc'>
            （
            <xsl:apply-templates />
            ）
        </span>
    </xsl:template>

    <!-- <foreign> -->
    <xsl:template match="tei:foreign">
        <xsl:if test="boolean(@cb:place)=false or @cb:place!='foot'">
            <span class='foreign'>
                <xsl:apply-templates />
            </span>
        </xsl:if>
    </xsl:template>

    <!-- <form> -->
    <xsl:template match="tei:form">
        <p data-tagname='p'>
            <xsl:apply-templates />
        </p>
    </xsl:template>

    <!-- <formula> and <hi> -->
    <xsl:template match="tei:formula">
        <span>
            <xsl:apply-templates />
        </span>
    </xsl:template>
    <xsl:template match="tei:hi">
        <span style="{@style}">
            <xsl:apply-templates />
        </span>
    </xsl:template>

    <!-- <g> TODO -->
    <xsl:template match="tei:g">
    </xsl:template>

    <!-- <graphic> -->
    <xsl:template match="tei:graphic">
        <xsl:if test="boolean(@url)">
            <img src="{@url}" />
        </xsl:if>
    </xsl:template>

    <!-- <head> TODO
    <xsl:template match="tei:head">
    </xsl:template> -->

    <xsl:template match="tei:note" />
    <xsl:template match="cb:t[not(@xml:lang='zh-Hant')]" />

    <xsl:template match="tei:lb">
        <span class="lb">
            <xsl:attribute name="id">
                <xsl:value-of select="@n" />
            </xsl:attribute>
        </span>
    </xsl:template>

    <xsl:template match="text()[preceding-sibling::tei:lb]">
        <span class="t" l="{preceding-sibling::tei:lb[@n]}">
            <xsl:copy />
        </span>
    </xsl:template>

    <xsl:template match="tei:p">
        <p>
            <xsl:if test="@xml:id">
                <xsl:attribute name="id">
                    <xsl:value-of select="@xml:id" />
                </xsl:attribute>
            </xsl:if>
            <xsl:apply-templates />
        </p>
    </xsl:template>

    <xsl:template match="tei:rdg" />

</xsl:stylesheet>
