#!/bin/sh
# Update packages.

# From node folder of https://github.com/flatpak/flatpak-builder-tools.git
./flatpak-node-generator.py --electron-node-headers --xdg-layout -o flatpak/generated-sources.json npm package-lock.json

# Verify metainfo.
flatpak run org.freedesktop.appstream-glib validate ./buildElectron/io.github.mrmyhuang.cbetar2.metainfo.xml
