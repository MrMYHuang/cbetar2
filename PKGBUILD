# Maintainer: Meng-Yuan Huang <myh@live.com>
pkgname=cbetar2
pkgver=19.2.2
pkgrel=1
pkgdesc=""
arch=('x86_64' 'aarch64')
url="https://github.com/MrMYHuang/cbetar2"
license=('MIT')
groups=()
depends=()
makedepends=('git') # 'bzr', 'git', 'mercurial' or 'subversion'
provides=("${pkgname}")
conflicts=("${pkgname}")
replaces=()
backup=()
options=()
install=
source=('git+https://github.com/MrMYHuang/cbetar2.git#tag=19.2.2')
noextract=()
md5sums=('SKIP')

build() {
	cd "$srcdir/${pkgname}"
	make
}

package() {
	cd "$srcdir/${pkgname}"
	make OPT="/opt" DESTDIR="$pkgdir/" install
}
