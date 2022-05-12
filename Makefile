.POSIX:

SHELL := /bin/bash

NAME = cbetar2

# paths
PREFIX = /usr
BIN = ${PREFIX}/bin
DATA = ${PREFIX}/share
MANPREFIX = ${DATA}/man
METAINFO = ${PREFIX}/share/metainfo
DOCPREFIX = ${PREFIX}/share/doc/${NAME}
OPT = ${PREFIX}

ARCH := $(shell uname -m)
ifeq ($(ARCH), x86_64)
NODE_ARCH = x64
else
NODE_ARCH = arm64
endif
NODE_PACKAGE = node-v16.15.0-linux-${NODE_ARCH}

electronPackagePath = $(shell ls -d ./dist/linux*unpacked)

all:
	wget -nv --no-check-certificate https://nodejs.org/download/release/latest-v16.x/${NODE_PACKAGE}.tar.gz; \
	tar zxf ${NODE_PACKAGE}.tar.gz; \
	rm  ${NODE_PACKAGE}.tar.gz; \
	PATH=$$(pwd)/${NODE_PACKAGE}/bin:${PATH}; \
	HOME=`pwd`; \
	npm i --ignore-scripts; \
	npm run build-electron; \
	npm x -- electron-builder -l dir -c electronBuilderConfigs/flatpak.json

clean:
	rm -rf ${electronPackagePath} node_modules ${NODE_PACKAGE}

install: all
	install -d ${DESTDIR}/${OPT}/${NAME} ${DESTDIR}/${BIN} ${DESTDIR}/${METAINFO} ${DESTDIR}/${DATA}/applications ${DESTDIR}/${DATA}/icons ${DESTDIR}/${MANPREFIX}/man1
	cp -a ${electronPackagePath}/. ${DESTDIR}/${OPT}/${NAME}
	ln -s ${DESTDIR}/${OPT}/${NAME}/${NAME} ${DESTDIR}/${BIN}

	cp buildElectron/io.github.mrmyhuang.${NAME}.metainfo.xml ${DESTDIR}/${METAINFO}
	cp buildElectron/io.github.mrmyhuang.${NAME}.desktop ${DESTDIR}/${DATA}/applications/${NAME}.desktop
	sed -i 's#^Exec=.*$$#Exec=${BIN}/${NAME} --no-sandbox#' ${DESTDIR}/${DATA}/applications/${NAME}.desktop
	sed -i 's#^Icon=.*$$#Icon=${DATA}/icons/${NAME}.png#' ${DESTDIR}/${DATA}/applications/${NAME}.desktop
	#desktop-file-validate ${DESTDIR}/${DATA}/applications/${NAME}.desktop
	cp buildElectron/icon.png ${DESTDIR}/${DATA}/icons/${NAME}.png

uninstall:
	rm -rf ${DESTDIR}/${PREFIX}/${NAME}
	rm -f \
		"${DESTDIR}/${BIN}/${NAME}"\
		"${DESTDIR}/${METAINFO}/io.github.mrmyhuang.${NAME}.metainfo.xml"\
		"${DESTDIR}/${DATA}/applications/io.github.mrmyhuang.${NAME}.desktop"\
		"${DESTDIR}/${DATA}/icons/${NAME}.png"

.PHONY: all clean install uninstall
