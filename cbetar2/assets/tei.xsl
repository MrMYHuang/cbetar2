<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:tei="http://www.tei-c.org/ns/1.0" xmlns:cb="http://www.cbeta.org/ns/1.0">
    <xsl:output method="xml" encoding="utf-8" indent="no" />

    <xsl:variable name="spaces50" select="'　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　'" />
    <xsl:variable name="BookId" select="/tei:TEI/tei:teiHeader/tei:fileDesc/tei:publicationStmt/tei:idno/tei:idno[@type='canon']/text()" />
    <xsl:variable name="TeiId" select="/tei:TEI/@xml:id" />

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
    <xsl:template match="tei:byline">
        <p class="{concat(@byline, '', @rend)}">
            <xsl:apply-templates />
            <xsl:text>&#xd;&#xa;</xsl:text>
        </p>
    </xsl:template>

    <!-- <caesura> -->

    <xsl:template match="cb:div">
        <xsl:choose>
            <xsl:when test="boolean(@type) or boolean(@rend)">
                <div class="{concat(@type, ' ', @rend)}" >
                    <xsl:apply-templates />
                </div>
            </xsl:when>
            <xsl:otherwise>
                <xsl:apply-templates />
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <xsl:template match="cb:docNumber">
        <p class='juannum' data-tagname='p'>
            <xsl:apply-templates />
        </p>
    </xsl:template>

    <!-- <entry> -->

    <xsl:template match="tei:figDesc">
        <span class='figdesc'>
            （
            <xsl:apply-templates />
            ）
        </span>
    </xsl:template>

    <xsl:template match="tei:foreign">
        <xsl:if test="boolean(@cb:place)=false or @cb:place!='foot'">
            <span class='foreign'>
                <xsl:apply-templates />
            </span>
        </xsl:if>
    </xsl:template>

    <xsl:template match="tei:form">
        <p data-tagname='p'>
            <xsl:apply-templates />
        </p>
    </xsl:template>

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

    <!-- TODO -->
    <xsl:template match="tei:g">
        <g ref="{@ref}" />
    </xsl:template>

    <xsl:template match="tei:graphic">
        <xsl:if test="boolean(@url)">
            <img src="{@url}" />
        </xsl:if>
    </xsl:template>

    <xsl:template match="tei:item">
        <li data-tagname="li">
            <span style="{concat(@rend, ';', @style)}">
                <xsl:if test="boolean(@n)">
                    <xsl:value-of select="@n" />
                </xsl:if>
                <xsl:apply-templates />
            </span>
        </li>
    </xsl:template>

    <xsl:template match="cb:juan">
        <p class='juan'>
            <xsl:apply-templates />
        </p>
    </xsl:template>

    <!-- TODO -->
    <xsl:template match="tei:head">
        <p class='head'>
            <xsl:apply-templates />
        </p>
    </xsl:template>

    <!-- TODO -->
    <xsl:template match="tei:l">
        <div class='lg-row'>
            <xsl:apply-templates />
        </div>
    </xsl:template>

    <!-- TODO -->
    <xsl:template match="tei:lb">
        <xsl:choose>
            <xsl:when test="@type='old'" />
            <xsl:when test="@ed!=$BookId" />
            <xsl:otherwise>
                <span class="lb">
                    <xsl:attribute name="id">
                        <xsl:value-of select="concat($TeiId, '_p', @n)" />
                    </xsl:attribute>
                    <xsl:attribute name="l">
                        <xsl:value-of select="@n" />
                    </xsl:attribute>
                </span>
                <xsl:apply-templates>
                    <xsl:with-param name="lb" select="@n" />
                </xsl:apply-templates>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <xsl:template match="text()">
        <span class="t">
            <xsl:value-of select="normalize-space()" />
        </span>
    </xsl:template>

    <!-- <lem> TODO -->
    <!-- <lg> TODO -->

    <xsl:template match="tei:list">
        <xsl:choose>
            <xsl:when test="boolean(descendant::item/@n)">
                <ul class="{@rend}" style="list-style-type:none;margin-left:0;padding-left:0">
                    <xsl:apply-templates />
                </ul>
            </xsl:when>
            <xsl:otherwise>
                <ul class="{@rend}">
                    <xsl:apply-templates />
                </ul>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <!-- TODO -->
    <xsl:template match="cb:mulu"></xsl:template>

    <xsl:template match="tei:note">
        <xsl:choose>
            <xsl:when test="boolean(@place)">
                <xsl:choose>
                    <xsl:when test="@place='interlinear'">
                        <span class='interlinear'>
                            <xsl:apply-templates />
                        </span>
                    </xsl:when>
                    <xsl:when test="@place='inline' or @place='inline2'">
                        <span class='doube-line-note'>
                            <xsl:apply-templates />
                        </span>
                    </xsl:when>
                    <xsl:otherwise></xsl:otherwise>
                </xsl:choose>
            </xsl:when>
        </xsl:choose>
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

    <xsl:template match="tei:t">
        <xsl:choose>
            <xsl:when test="boolean(@place) and contains(@place, 'foot')"></xsl:when>
            <xsl:otherwise>
                <xsl:variable name="tt" select="ancestor::tei:tt" />
                <xsl:choose>
                    <xsl:when test="boolean($tt)">
                        <xsl:apply-templates />
                    </xsl:when>
                    <xsl:otherwise>
                        <span style='{@style}'>
                            <xsl:apply-templates />
                        </span>
                    </xsl:otherwise>
                </xsl:choose>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <xsl:template match="tei:pb">
        <xsl:apply-templates />
    </xsl:template>

    <!-- TODO -->
    <xsl:template match="tei:rdg" />

    <!-- <ref> TODO -->

    <xsl:template match="tei:table">
        <div class="{concat(@rend, '; bip-table')}" style="{@style}">
            <xsl:apply-templates />
        </div>
    </xsl:template>

    <xsl:template match="tei:row">
        <div class='bip-table-row'>
            <xsl:apply-templates />
        </div>
    </xsl:template>

    <xsl:template match="tei:cell">
        <div class="{concat(@rend, '; bip-table-cell')}" style="{@style}" rowspan="{@rows}" colspan="{@cols}">
            <xsl:apply-templates />
        </div>
    </xsl:template>

    <xsl:template match="tei:seg">
        <span style="{concat(@rend, ';', @style)}">
            <xsl:apply-templates />
        </span>
    </xsl:template>

    <xsl:template match="cb:sg">
        (
        <xsl:apply-templates />
        )
    </xsl:template>

    <!-- TODO -->
    <xsl:template match="tei:space">
        <xsl:choose>
            <xsl:when test="boolean(@unit)">
                <xsl:if test="@unit='chars'">
                    <xsl:value-of select="ssubstring($spaces50, 1, @quantity)" />
                </xsl:if>
            </xsl:when>
            <xsl:otherwise></xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <!-- <text> or <term> TODO -->

    <xsl:template match="tei:trailer">
        <p data-tagname='p'>
            <xsl:apply-templates />
        </p>
    </xsl:template>

    <xsl:template match="cb:tt">
        <xsl:apply-templates />
    </xsl:template>

    <xsl:template match="cb:t[not(@xml:lang='zh-Hant')]" />

    <xsl:template match="cb:t[(@xml:lang='zh-Hant')]">
        <xsl:apply-templates />
    </xsl:template>

    <!-- TODO -->
    <xsl:template match="tei:unclear">
        <xsl:variable name="guess">
            <xsl:choose>
                <xsl:when test="@cert='high'">
                    <xsl:text disable-output-escaping="yes">&lt;span class='guess1' title='本字為推測字，信心程度：高'&gt;</xsl:text>
                </xsl:when>
                <xsl:when test="@cert='above_medium'">
                    <xsl:text disable-output-escaping="yes">&lt;span class='guess2' title='本字為推測字，信心程度：中高'&gt;</xsl:text>
                </xsl:when>
                <xsl:when test="@cert='medium'">
                    <xsl:text disable-output-escaping="yes">&lt;span class='guess3' title='本字為推測字，信心程度：中'&gt;</xsl:text>
                </xsl:when>
                <xsl:when test="@cert='low'">
                    <xsl:text disable-output-escaping="yes">&lt;span class='guess4' title='本字為推測字，信心程度：低'&gt;</xsl:text>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:text disable-output-escaping="yes">&lt;span title='未知的文字'&gt;</xsl:text>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:variable>

        <xsl:value-of select="$guess" disable-output-escaping="yes" />
        <xsl:choose>
            <xsl:when test="boolean(./*)">
                <xsl:apply-templates />
            </xsl:when>
            <xsl:otherwise>▆</xsl:otherwise>
        </xsl:choose>
        <xsl:text disable-output-escaping="yes">
            &lt;/span&gt;
        </xsl:text>
    </xsl:template>

</xsl:stylesheet>
