#!/bin/bash
if [[ "${TARGETARCH}" = "amd64"  ]] ; then
    ARCH="x64"
 else
    ARCH="arm64"
 fi

DEBIAN_FRONTEND=noninteractive
NODE_VERSION=16.14.2
NODE_FILENAME="node-v${NODE_VERSION}-linux-${ARCH}"

sed -i s/ports.ubuntu.com/free.nchc.org.tw/g /etc/apt/sources.list
sed -i s/security.ubuntu.com/free.nchc.org.tw/g /etc/apt/sources.list
apt update
apt install -y git curl build-essential xz-utils python3
curl https://nodejs.org/dist/v${NODE_VERSION}/${NODE_FILENAME}.tar.gz | tar zx
cp -r ${NODE_FILENAME}/* /usr/local
rm -rf ${NODE_FILENAME}
