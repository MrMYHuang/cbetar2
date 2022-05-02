#!/bin/sh

# Update manifest.
version=$(jq -r .version package.json)
flatpakFile=flatpak/io.github.mrmyhuang.cbetar2.yml
sed "s/tag: .*$/tag: ${version}/" ${flatpakFile} -i

# Update offline packages.
# From node folder of https://github.com/flatpak/flatpak-builder-tools.git
./flatpak-node-generator.py --electron-node-headers --xdg-layout -o flatpak/generated-sources.json npm package-lock.json

# Verify metainfo.
flatpak run org.freedesktop.appstream-glib validate ./buildElectron/io.github.mrmyhuang.cbetar2.metainfo.xml
