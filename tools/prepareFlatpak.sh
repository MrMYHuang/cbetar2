#!/bin/sh

# Update manifest.
version=$(jq -r .version package.json)
flatpakFile=flatpak/io.github.mrmyhuang.cbetar2.yml
sed "s/tag: .*$/tag: ${version}/" ${flatpakFile} -i

sudo dnf install -y flatpak python3-aiohttp
sudo flatpak remote-modify --no-filter flathub
flatpak install -y org.freedesktop.appstream-glib org.flatpak.Builder

# Update offline packages.
# See node folder of https://github.com/flatpak/flatpak-builder-tools.git
flatpak-node-generator --electron-node-headers -o flatpak/generated-sources.json yarn yarn.lock

# Verify metainfo.
flatpak run org.freedesktop.appstream-glib validate ./buildElectron/io.github.mrmyhuang.cbetar2.metainfo.xml
flatpak run --command=flatpak-builder-lint org.flatpak.Builder --exceptions ${flatpakFile}