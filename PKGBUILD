# Maintainer: Meng-Yuan Huang <myh@live.com>
pkgname=cbetar2
pkgver=19.2.2
pkgrel=1
pkgdesc="A Buddhist text reader using CBETA APIs"
arch=('x86_64' 'aarch64')
url="https://github.com/MrMYHuang/cbetar2"
license=('MIT')
groups=('base-devel')
depends=('gtk3' 'libnotify' 'nss' 'at-spi2-core' 'alsa-lib' 'mesa' 'libdrm')
makedepends=('python3' 'wget')
provides=("${pkgname}")
conflicts=("${pkgname}")
options=()
install=
source=()
noextract=()

prepare() {
	ln -sf "$startdir" "$srcdir/$pkgname"
}

build() {
	cd "$srcdir/${pkgname}"
	make
}

package() {
	cd "$srcdir/${pkgname}"
	make OPT="/opt" DESTDIR="$pkgdir/" install
}
