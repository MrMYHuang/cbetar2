#!/bin/sh

# Update manifest.
version=$(jq -r .version package.json)
commit=$(git -C /home/myh/cbetar2 rev-list -n 1 ${version})
flatpakFile=flatpak/io.github.mrmyhuang.cbetar2.yml
sed "s/tag: .*$/tag: ${version}/" ${flatpakFile} -i
sed "s/commit: .*$/commit: ${commit}/" ${flatpakFile} -i

sudo dnf install -y flatpak python3-aiohttp
sudo flatpak remote-modify --no-filter flathub
flatpak install -y --user org.freedesktop.appstream-glib/ org.flatpak.Builder

# Update offline packages.
# See node folder of https://github.com/flatpak/flatpak-builder-tools.git
flatpak-node-generator --electron-node-headers -o flatpak/generated-sources.json yarn yarn.lock

# Verify metainfo.
flatpak run org.freedesktop.appstream-glib validate ./buildElectron/io.github.mrmyhuang.cbetar2.metainfo.xml
flatpak run --command=flatpak-builder-lint org.flatpak.Builder --gha-format --exceptions manifest ${flatpakFile}
flatpak run --command=flatpak-builder-lint org.flatpak.Builder --gha-format --exceptions appstream buildElectron/io.github.mrmyhuang.cbetar2.metainfo.xml
