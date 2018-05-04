PACKAGE_NAME = kopano-meet

# Tools

YARN ?= yarn

# Variables

VERSION ?= $(shell git describe --tags --always --dirty --match=v* 2>/dev/null | sed 's/^v//' || \
			cat $(CURDIR)/.version 2> /dev/null || echo 0.0.0-unreleased)

# Build

.PHONY: all
all: build

.PHONY: build
build:  vendor | src ; $(info building ...)	@
	@rm -rf build

	REACT_APP_KOPANO_BUILD="${VERSION}" $(YARN) run build

.PHONY: src
src:
	@$(MAKE) -C src

.PHONY: lint
lint: vendor ; $(info running eslint ...)	@
	$(YARN) eslint .

.PHONY: lint-checkstyle
lint-checkstyle: vendor ; $(info running eslint checkstyle ...)	@
	@mkdir -p ../test
	$(YARN) eslint -f checkstyle -o ./test/tests.eslint.xml . || true

# Yarn

.PHONY: vendor
vendor: .yarninstall

.yarninstall: package.json ; $(info getting depdencies with yarn ...)   @
	@$(YARN) install --silent
	@touch $@

# Dist

.PHONY: dist
dist: ; $(info building dist tarball ...)
	@mkdir -p "dist/${PACKAGE_NAME}-${VERSION}"
	@cd dist && \
	cp -avf ../LICENSE.txt "${PACKAGE_NAME}-${VERSION}" && \
	cp -avf ../README.md "${PACKAGE_NAME}-${VERSION}" && \
	cp -avf ../config.json.in "${PACKAGE_NAME}-${VERSION}" && \
	cp -avf ../Caddyfile.example "${PACKAGE_NAME}-${VERSION}" && \
	cp -avr ../build "${PACKAGE_NAME}-${VERSION}/meet-webapp" && \
	tar --owner=0 --group=0 -czvf ${PACKAGE_NAME}-${VERSION}.tar.gz "${PACKAGE_NAME}-${VERSION}" && \
	cd ..

.PHONY: clean ; $(info cleaning ...)	@
clean:
	$(YARN) cache clean
	@rm -rf build
	@rm -rf node_modules
	@rm -f .yarninstall

	@$(MAKE) -C src clean

.PHONY: version
version:
	@echo $(VERSION)
