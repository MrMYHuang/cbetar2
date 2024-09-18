import glob
import os
import fontforge

# Up to Chrome 99, the max uncompressed size (e.g. ttf) of a font file is 30 MB.
# Please tune this value to split a font file to multiple files with size <= 30 MB.
maxGlyphsPerFile = 15000
# The glob expression of all font files.
fontFilesFolder = "./fonts"
excludeList = [0x3008, 0x3009, 0x300a, 0x300b, 0x300c, 0x300d, 0x300e, 0x300f, 0x3010, 0x3011, 0x3014, 0x3015, 0x3016, 0x3017, 0x3018, 0x3019, 0x301a, 0x301b, 0x301d, 0x301e, 0xff08, 0xff09, 0xff3b, 0xff3d, 0xff, 0xff5b, 0xff5d, 0xff1c, 0xff1e, 0xff5f, 0xf560]

def splitFontFile(originalFile):
    filename = os.path.basename(file)
    filename = filename.split('.')[0]
    font = fontforge.open(originalFile)
    font.selection.all()
    glyphs = font.selection.byGlyphs
    totalGlyphs = len(list(glyphs))
    totalFiles = int(totalGlyphs / maxGlyphsPerFile + 0.5)
    print(f'Process {file}, total output files: {totalFiles}')

    for f in range(totalFiles):
        g = 0
        gMin = f * maxGlyphsPerFile
        gMax = (f + 1) * maxGlyphsPerFile
        for glyph in glyphs:
            # Clear glyph out of range.
            if not(gMin <= g and g < gMax) or glyph.unicode in excludeList:
                glyph.clear()
            g = g + 1
        # Use this to check uncompressed font file sizes.
        #font.generate(f'{filename}-{f+1}.ttf')
        # Use this for compressed outputs.
        font.generate(f'{fontFilesFolder}/{filename}-{f+1}.woff2')
        font.close()
        font = fontforge.open(originalFile)
        font.selection.all()
        glyphs = font.selection.byGlyphs
    font.close()
    
for file in glob.glob(f'{fontFilesFolder}/*.ttf'):
    splitFontFile(file)
    print('Done!')
