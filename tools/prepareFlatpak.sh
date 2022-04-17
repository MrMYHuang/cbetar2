#!/bin/sh
version=$(jq -r .version package.json)

# Update flatpak source.
file=v${version}.tar.gz
flatpakFile=flatpak/io.github.mrmyhuang.cbetar2.yml

wget https://github.com/MrMYHuang/cbetar2/archive/${file}
sha256=$(sha256sum ${file} | awk '{print $1}')
rm ${file}
sed "s/sha256: .*$/sha256: ${sha256}/" ${flatpakFile} -i
sed "s/\(cbetar2\/archive\/\).*.tar.gz$/\1${file}/" ${flatpakFile} -i

# Update packages.
./flatpak-node-generator.py --xdg-layout -o flatpak/generated-sources.json npm package-lock.json

# Verify metainfo.
flatpak run org.freedesktop.appstream-glib validate ./buildElectron/io.github.mrmyhuang.cbetar2.metainfo.xml