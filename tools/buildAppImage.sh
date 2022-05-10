#!/bin/bash
cd /cbetar2
# Working around HOME file access permissions by
# overwriting HOME to `pwd`.
# It's required for saving npm and electron-builder caches.
HOME=`pwd`
npm i --ignore-scripts
npm run dist-appImage $@
