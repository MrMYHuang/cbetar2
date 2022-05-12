#!/bin/sh

# Update manifest.
version=$(jq -r .version package.json)
pkgbuildFile=PKGBUILD
sed "s/^pkgver=.*$/pkgver=${version}/" ${pkgbuildFile} -i
cp PKGBUILD arch
makepkg --printsrcinfo > arch/.SRCINFO
