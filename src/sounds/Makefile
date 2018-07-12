# Tools

PYTHON ?= python3
SOX    ?= sox
AVCONV ?= avconv

# Variables
PWD     := $(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))
SOUNDS   = $(shell find "$(PWD)/files/" -type f -name "*.wav")

all: sprite1.mp3 sprite1.ogg

sprite1.json: $(SOUNDS)
	$(PYTHON) scripts/make-wav-sprite.py sprite1.wav $@ ./files
	touch $@

sprite1.wav: sprite1.json
	touch $@

sprite1.sox.wav: sprite1.wav
	$(SOX) -v .4 $< $@

sprite1.mp3: sprite1.sox.wav
	$(AVCONV) -y -i $< -aq 2 -acodec libmp3lame $@

sprite1.ogg: sprite1.sox.wav
	$(AVCONV) -y -i $< -aq 2 -acodec libvorbis $@

clean:
	@rm -rf sprite1.ogg sprite1.mp3 sprite1.wav sprite1.sox.wav sprite1.json
