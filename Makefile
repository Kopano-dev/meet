PACKAGE_NAME = kopano-meet

# Tools

YARN ?= yarn

CHGLOG ?= git-chglog

# Variables

VERSION ?= $(shell git describe --tags --always --dirty --match=v* 2>/dev/null | sed 's/^v//' || \
			cat $(CURDIR)/.version 2> /dev/null || echo 0.0.0-unreleased)

# Build

.PHONY: all
all: build

.PHONY: build
build:  vendor | src i18n ; $(info building ...)	@
	@rm -rf build

	REACT_APP_KOPANO_BUILD="${VERSION}" $(YARN) run build

.PHONY: src
src:
	@$(MAKE) -C src

.PHONY: i18n
i18n: vendor
	@$(MAKE) -C i18n

.PHONY: lint
lint: vendor ; $(info running eslint ...)	@
	$(YARN) eslint . --cache && echo "eslint: no lint errors"

.PHONY: lint-checkstyle
lint-checkstyle: vendor ; $(info running eslint checkstyle ...)	@
	@mkdir -p ../test
	$(YARN) eslint -f checkstyle -o ./test/tests.eslint.xml . || true

# Tests

.PHONY: test
test: vendor ; $(info running jest tests ...) @
	REACT_APP_KOPANO_BUILD="${VERSION}" CI=true $(YARN) test -- --verbose

.PHONY: test-coverage
test-coverage: vendor ; $(info running jest tests ...) @
	REACT_APP_KOPANO_BUILD="${VERSION}" CI=true JEST_JUNIT_OUTPUT=./test/jest-test-results.xml $(YARN) test -- --coverage --coverageDirectory=coverage --testResultsProcessor="jest-junit"

# Yarn

.PHONY: vendor
vendor: .yarninstall

.yarninstall: package.json ; $(info getting depdencies with yarn ...)   @
	@$(YARN) install --silent
	@touch $@

# Dist

.PHONY: licenses
licenses: ; $(info building licenses files ...)
	@echo "# Kopano Meet 3rd party licenses\n\nCopyright 2019 Kopano and its licensors. See LICENSE.txt for license information. This document contains a list of open source components used in this project.\n\n## Kopano Meet webapp\n" > 3rdparty-LICENSES.md
	@$(YARN) run  -s licenses >> 3rdparty-LICENSES.md

3rdparty-LICENSES.md: licenses

.PHONY: dist
dist:  3rdparty-LICENSES.md ; $(info building dist tarball ...)
	@mkdir -p "dist/${PACKAGE_NAME}-${VERSION}"
	@cd dist && \
	cp -avf ../LICENSE.txt "${PACKAGE_NAME}-${VERSION}" && \
	cp -avf ../3rdparty-LICENSES.md "${PACKAGE_NAME}-${VERSION}" && \
	cp -avf ../README.md "${PACKAGE_NAME}-${VERSION}" && \
	cp -avf ../config.json.in "${PACKAGE_NAME}-${VERSION}" && \
	cp -avf ../Caddyfile.example "${PACKAGE_NAME}-${VERSION}" && \
	cp -avr ../build "${PACKAGE_NAME}-${VERSION}/meet-webapp" && \
	tar --owner=0 --group=0 -czvf ${PACKAGE_NAME}-${VERSION}.tar.gz "${PACKAGE_NAME}-${VERSION}" && \
	cd ..

.PHONE: changelog
changelog: ; $(info updating changelog ...)
	$(CHGLOG) --output CHANGELOG.md

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
