#!/bin/sh
# Update packages.
./flatpak-node-generator.py --electron-node-headers --xdg-layout -o flatpak/generated-sources.json npm package-lock.json

# Verify metainfo.
flatpak run org.freedesktop.appstream-glib validate ./buildElectron/io.github.mrmyhuang.cbetar2.metainfo.xml
