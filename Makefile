SHELL := /bin/bash

.POSIX:

NAME = cbetar2

# paths
PREFIX = /usr
BIN = ${PREFIX}/bin
MANPREFIX = ${PREFIX}/man
METAINFO = ${PREFIX}/share/metainfo
DATA = ${PREFIX}/share
DOCPREFIX = ${PREFIX}/share/doc/${NAME}
#MAN1 = ${BIN:=.1}

ARCH := $(shell uname -m)
ifeq ($(ARCH), x86_64)
NODE_ARCH = x64
else
NODE_ARCH = arm64
endif
NODE_PACKAGE = node-v16.15.0-linux-${NODE_ARCH}

electronPackagePath = $(shell ls -d ./dist/linux*unpacked)

all:
	wget https://nodejs.org/download/release/latest-v16.x/${NODE_PACKAGE}.tar.gz; \
	tar zxf ${NODE_PACKAGE}.tar.gz; \
	rm  ${NODE_PACKAGE}.tar.gz; \
	export PATH=./${NODE_PACKAGE}/bin:${PATH}; \
	npm i --ignore-scripts; \
	npm run build-electron; \
	npm x -- electron-builder -l dir -c electronBuilderConfigs/flatpak.json

clean:
	rm -rf ${electronPackagePath} node_modules ${NODE_PACKAGE}

install: all
	install -d ${DESTDIR}/${PREFIX}/${NAME} ${DESTDIR}/${BIN} ${DESTDIR}/${METAINFO} ${DESTDIR}/${DATA}/applications ${DESTDIR}/${DATA}/icons ${DESTDIR}/${MANPREFIX}/man1
	cp -a ${electronPackagePath}/. ${DESTDIR}/${PREFIX}/${NAME}
	ln -s ${PREFIX}/${NAME}/${NAME} ${DESTDIR}/${BIN}
	cp buildElectron/io.github.mrmyhuang.${NAME}.metainfo.xml ${DESTDIR}/${METAINFO}
	cp buildElectron/io.github.mrmyhuang.${NAME}.desktop ${DESTDIR}/${DATA}/applications

	#desktop-file-validate ${DESTDIR}/${DATA}/applications/io.github.mrmyhuang.${NAME}.desktop

	cp buildElectron/icon.png ${DESTDIR}/${DATA}/icons/${NAME}.png

	sed -i 's#^Exec=.*$$#Exec=${BIN}/${NAME} --no-sandbox#' ${DESTDIR}/${DATA}/applications/io.github.mrmyhuang.${NAME}.desktop
	sed -i 's#^Icon=.*$$#Icon=${DATA}/icons/${NAME}.png#' ${DESTDIR}/${DATA}/applications/io.github.mrmyhuang.${NAME}.desktop

	#cp -f ${MAN1} "${DESTDIR}/${MANPREFIX}/man1"
	#for m in ${MAN1}; do chmod 644 "${DESTDIR}/${MANPREFIX}/man1/$$m"; done

uninstall:
	rm -rf ${DESTDIR}/${PREFIX}/${NAME}
	rm -f \
		"${DESTDIR}/${METAINFO}/io.github.mrmyhuang.${NAME}.metainfo.xml"\
		"${DESTDIR}/${DATA}/applications/io.github.mrmyhuang.${NAME}.desktop"\
		"${DESTDIR}/${DATA}/icons/${NAME}.png"
	#for m in ${MAN1}; do rm -f "${DESTDIR}${MANPREFIX}/man1/$$m"; done

.PHONY: all clean install uninstall
