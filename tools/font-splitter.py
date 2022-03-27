import glob
import os
import fontforge

# Up to Chrome 99, the max uncompressed size (e.g. ttf) of a font file is 30 MB.
# Please tune this value to split a font file to multiple files with size <= 30 MB.
maxGlyphsPerFile = 15000
# The glob expression of all font files.
fontFilesPath = "../fonts/*.ttf"

def splitFontFile(originalFile):
    filename = os.path.basename(file)
    filename = filename.split('.')[0]
    font = fontforge.open(originalFile)
    font.selection.all()
    glyphs = font.selection.byGlyphs
    totalGlyphs = len(list(glyphs))
    totalFiles = int(totalGlyphs / maxGlyphsPerFile + 0.5)
    print(f'{file} totalFiles: {totalFiles}')

    for f in range(totalFiles):
        g = 0
        gMin = f * maxGlyphsPerFile
        gMax = (f + 1) * maxGlyphsPerFile
        for glyph in glyphs:
            # Clear glyph out of range.
            if not(gMin <= g and g < gMax):
                glyph.clear()
            g = g + 1
        # Use this to check generated ttf sizes.
        #font.generate(f'{filename}-{f+1}.ttf')
        # Use this for compressed outputs.
        font.generate(f'{filename}-{f+1}.woff2')
        font.close()
        font = fontforge.open(originalFile)
        font.selection.all()
        glyphs = font.selection.byGlyphs
    font.close()
    
for file in glob.glob(fontFilesPath):
    splitFontFile(file)
    print('Done!')
