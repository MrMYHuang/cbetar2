#!/bin/sh

# Update manifest.
version=$(jq -r .version package.json)
flatpakFile=flatpak/io.github.mrmyhuang.cbetar2.yml
sed "s/tag: .*$/tag: ${version}/" ${flatpakFile} -i

# Update offline packages.
# See node folder of https://github.com/flatpak/flatpak-builder-tools.git
flatpak-node-generator --electron-node-headers -o flatpak/generated-sources.json yarn yarn.lock

# Verify metainfo.
flatpak run org.freedesktop.appstream-glib validate ./buildElectron/io.github.mrmyhuang.cbetar2.metainfo.xml
