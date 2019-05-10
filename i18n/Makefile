# Tools

YARN ?= yarn
MSGMERGE ?= msgmerge
MSGFMT ?= msgfmt

# Variables

POS = $(wildcard *.po)

# Translations

.PHONY: build
build: json

.PHONY: extract
extract: pot

.PHONY: i18n/src/messages.json
i18n/src/messages.json:
	$(YARN) react-intl-cra './src/**/*.{js,jsx}' -o $@

.PHONY: pot
pot: i18n/src/messages.json
	$(YARN) rip json2pot './i18n/src/**/*.json' \
		-o ./i18n/messages.pot \
		-c 'id'

.PHONY: json
json: i18n/src/messages.json
	$(YARN) rip po2json './i18n/*.po' \
		-m './i18n/src/**/*.json' \
		-o './src/locales/' \
		-c 'id' \
		 --indentation=2

.PHONY: merge
merge: $(POS)

.PHONY: stats
stats:
	$(foreach po, $(POS), $(shell $(MSGFMT) -v --statistics $(po)))
	@- true

$(POS): FORCE messages.pot
	$(MSGMERGE) -U \
		--backup=none \
		--no-wrap \
		$@ messages.pot

FORCE:
