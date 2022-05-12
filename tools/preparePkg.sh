#!/bin/sh

# Update manifest.
cd arch
version=$(jq -r .version ../package.json)
pkgbuildFile=PKGBUILD
sed "s/^pkgver=.*$/pkgver=${version}/" ${pkgbuildFile} -i
makepkg --printsrcinfo > .SRCINFO
