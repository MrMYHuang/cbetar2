<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:tei="http://www.tei-c.org/ns/1.0" xmlns:cb="http://www.cbeta.org/ns/1.0">
    <xsl:output method="html" encoding="utf-8" indent="yes" />

    <xsl:variable name="spaces50" select="'　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　'" />
    <xsl:variable name="BookId" select="/tei:TEI/tei:teiHeader/tei:fileDesc/tei:publicationStmt/tei:idno/tei:idno[@type='canon']/text()" />

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

    <!-- <caesura> -->

    <!-- <div> -->

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
    <xsl:template match="tei:g"></xsl:template>

    <xsl:template match="tei:graphic">
        <xsl:if test="boolean(@url)">
            <img src="{@url}" />
        </xsl:if>
    </xsl:template>

    <!-- TODO
    <xsl:template match="tei:head">
    </xsl:template> -->

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
        <span class='juanname'>
            <xsl:apply-templates />
        </span>
    </xsl:template>

    <!-- <l> TODO -->

    <!-- TODO -->
    <xsl:template match="tei:lb">
        <xsl:choose>
            <xsl:when test="@type='old'" />
            <xsl:when test="$BookId='X' and substring(@ed, 1, 1)='R'">
                <span class='xr_head' data-linehead='{concat(@ed, "p", @sn)}'></span>
            </xsl:when>
            <xsl:when test="@ed!=$BookId" />
            <xsl:otherwise>
                <span class="lb">
                    <xsl:attribute name="id">
                        <xsl:value-of select="@n" />
                    </xsl:attribute>
                    <xsl:apply-templates />
                </span>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <xsl:template match="text()[preceding-sibling::tei:lb]">
        <span class="t" l="{preceding-sibling::tei:lb[@n]}">
            <xsl:copy />
        </span>
    </xsl:template>

    <!-- <lem> TODO -->
    <!-- <lg> TODO -->

    <xsl:template match="tei:list"></xsl:template>

    <!-- TODO -->
    <xsl:template match="cb:mulu"></xsl:template>

    <xsl:template match="tei:note" />

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

    <xsl:template match="tei:pb">
        <xsl:apply-templates />
    </xsl:template>

    <!-- TODO -->
    <xsl:template match="tei:rdg" />

    <!-- <ref> TODO -->

    <xsl:template match="tei:row">
        <tr data-tagname='tr'>
            <xsl:apply-templates />
        </tr>
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

    <xsl:template match="cb:t[not(@xml:lang='zh-Hant')]" />

    <xsl:template match="tei:table">
        <table data-tagname='table' border='1' style="{concat(@rend, ';', @style)}">
            <tbody data-tagname='tbody'>
                <xsl:apply-templates />
            </tbody>
        </table>
    </xsl:template>

    <!-- <text> or <term> TODO -->

    <xsl:template match="tei:trailer">
        <p data-tagname='p'>
            <xsl:apply-templates />
        </p>
    </xsl:template>

    <xsl:template match="cb:tt" />

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
