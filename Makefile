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

electronPackagePath = $(shell ls -d ./dist/linux*unpacked)

all:
	HOME=`pwd`; \
	npm i --ignore-scripts; \
	npm run build-electron; \
	npm x -- electron-builder -l dir -c electronBuilderConfigs/flatpak.json

clean:
	rm -rf ${electronPackagePath} node_modules

install: all
	install -d ${DESTDIR}/${OPT}/${NAME} ${DESTDIR}/${BIN} ${DESTDIR}/${METAINFO} ${DESTDIR}/${DATA}/applications ${DESTDIR}/${DATA}/icons ${DESTDIR}/${MANPREFIX}/man1
	cp -a ${electronPackagePath}/. ${DESTDIR}/${OPT}/${NAME}
	ln -s ${OPT}/${NAME}/${NAME} ${DESTDIR}/${BIN}

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
