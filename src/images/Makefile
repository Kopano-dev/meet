# Tools

INKSCAPE   ?= inkscape
CONVERT    ?= convert

# Settings

TARGET ?= ../../public/static
ICON   ?= kopano-meet-icon.svg

# Build

.PHONY: all
all: icons

.PHONY: icons
icons: $(TARGET)/favicon.ico $(TARGET)/app-icon-rounded-192x192.png $(TARGET)/app-icon-rounded-512x512.png $(TARGET)/apple-touch-icon-120x120.png $(TARGET)/apple-touch-icon-152x152.png $(TARGET)/apple-touch-icon-167x167.png $(TARGET)/apple-touch-icon-180x180.png

$(TARGET)/favicon.ico: app-icon-rounded-256x256.png
	$(CONVERT) -background transparent $< -define icon:auto-resize=16,32,48,64,128,256 $@

$(TARGET)/app-icon-rounded-192x192.png: app-icon-rounded-192x192.png
	cp -avf $< $@

$(TARGET)/app-icon-rounded-512x512.png: app-icon-rounded-512x512.png
	cp -avf $< $@

$(TARGET)/apple-touch-icon-120x120.png: app-icon-whitebox-120x120.png
	cp -avf $< $@

$(TARGET)/apple-touch-icon-152x152.png: app-icon-whitebox-152x152.png
	cp -avf $< $@

$(TARGET)/apple-touch-icon-167x167.png: app-icon-whitebox-167x167.png
	cp -avf $< $@

$(TARGET)/apple-touch-icon-180x180.png: app-icon-whitebox-180x180.png
	cp -avf $< $@

app-icon.svg: $(ICON)
	cp -vafL $< $@

app-icon-16x16.png: app-icon.svg
	$(INKSCAPE) -z -e $@ -w 16 -h 16 $<

app-icon-32x32.png: app-icon.svg
	$(INKSCAPE) -z -e $@ -w 32 -h 32 $<

app-icon-64x64.png: app-icon.svg
	$(INKSCAPE) -z -e $@ -w 64 -h 64 $<

app-icon-128x128.png: app-icon.svg
	$(INKSCAPE) -z -e $@ -w 128 -h 128 $<

app-icon-256x256.png: app-icon.svg
	$(INKSCAPE) -z -e $@ -w 256 -h 256 $<

app-icon-144x144.png: app-icon.svg
	$(INKSCAPE) -z -e $@ -w 144 -h 144 $<

app-icon-512x512.png: app-icon.svg
	$(INKSCAPE) -z -e $@ -w 512 -h 512 $<

app-icon-whitebox-16x16.png: app-icon.svg
	$(INKSCAPE) -z -e $@.tmp -w 12.8 -h 12.8 -b white -y 1.0 $<
	$(CONVERT) $@.tmp -background white -gravity center -extent 16x16 $@
	@$(RM) $@.tmp

app-icon-whitebox-64x64.png: app-icon.svg
	$(INKSCAPE) -z -e $@.tmp -w 51.2 -h 51.2 -b white -y 1.0 $<
	$(CONVERT) $@.tmp -background white -gravity center -extent 64x64 $@
	@$(RM) $@.tmp

app-icon-whitebox-120x120.png: app-icon.svg
	$(INKSCAPE) -z -e $@.tmp -w 96 -h 96 -b white -y 1.0 $<
	$(CONVERT) $@.tmp -background white -gravity center -extent 120x120 $@
	@$(RM) $@.tmp

app-icon-whitebox-128x128.png: app-icon.svg
	$(INKSCAPE) -z -e $@.tmp -w 102.4 -h 102.4 -b white -y 1.0 $<
	$(CONVERT) $@.tmp -background white -gravity center -extent 128x128 $@
	@$(RM) $@.tmp

app-icon-whitebox-144x144.png: app-icon.svg
	$(INKSCAPE) -z -e $@.tmp -w 115.2 -h 115.2 -b white -y 1.0 $<
	$(CONVERT) $@.tmp -background white -gravity center -extent 144x144 $@
	@$(RM) $@.tmp

app-icon-whitebox-152x152.png: app-icon.svg
	$(INKSCAPE) -z -e $@.tmp -w 121.6 -h 121.6 -b white -y 1.0 $<
	$(CONVERT) $@.tmp -background white -gravity center -extent 152x152 $@
	@$(RM) $@.tmp

app-icon-whitebox-167x167.png: app-icon.svg
	$(INKSCAPE) -z -e $@.tmp -w 133.6 -h 133.6 -b white -y 1.0 $<
	$(CONVERT) $@.tmp -background white -gravity center -extent 167x167 $@
	@$(RM) $@.tmp

app-icon-whitebox-180x180.png: app-icon.svg
	$(INKSCAPE) -z -e $@.tmp -w 144 -h 144 -b white -y 1.0 $<
	$(CONVERT) $@.tmp -background white -gravity center -extent 180x180 $@
	@$(RM) $@.tmp

app-icon-whitebox-192x192.png: app-icon.svg
	$(INKSCAPE) -z -e $@.tmp -w 153.6 -h 153.6 -b white -y 1.0 $<
	$(CONVERT) $@.tmp -background white -gravity center -extent 192x192 $@
	@$(RM) $@.tmp

app-icon-whitebox-256x256.png: app-icon.svg
	$(INKSCAPE) -z -e $@.tmp -w 204.8 -h 204.8 -b white -y 1.0 $<
	$(CONVERT) $@.tmp -background white -gravity center -extent 256x256 $@
	@$(RM) $@.tmp

app-icon-whitebox-512x512.png: app-icon.svg
	$(INKSCAPE) -z -e $@.tmp -w 409.6 -h 409.6 -b white -y 1.0 $<
	$(CONVERT) $@.tmp -background white -gravity center -extent 512x512 $@
	@$(RM) $@.tmp

app-icon-rounded-16x16.png: app-icon-whitebox-16x16.png
	$(CONVERT) -size 16x16 xc:none -draw "roundrectangle 1,1,14,14,8,8" $@.tmp.png
	$(CONVERT) $< -matte $@.tmp.png -compose DstIn -composite $@
	@$(RM) $@.tmp.png

app-icon-rounded-64x64.png: app-icon-whitebox-64x64.png
	$(CONVERT) -size 64x64 xc:none -draw "roundrectangle 2,2,60,60,30,30" $@.tmp.png
	$(CONVERT) $< -matte $@.tmp.png -compose DstIn -composite $@
	@$(RM) $@.tmp.png

app-icon-rounded-128x128.png: app-icon-whitebox-128x128.png
	$(CONVERT) -size 128x128 xc:none -draw "roundrectangle 2,2,124,124,62,62" $@.tmp.png
	$(CONVERT) $< -matte $@.tmp.png -compose DstIn -composite $@
	@$(RM) $@.tmp.png

app-icon-rounded-192x192.png: app-icon-whitebox-192x192.png
	$(CONVERT) -size 192x192 xc:none -draw "roundrectangle 2,2,188,188,94,94" $@.tmp.png
	$(CONVERT) $< -matte $@.tmp.png -compose DstIn -composite $@
	@$(RM) $@.tmp.png

app-icon-rounded-256x256.png: app-icon-whitebox-256x256.png
	$(CONVERT) -size 256x256 xc:none -draw "roundrectangle 2,2,252,252,126,126" $@.tmp.png
	$(CONVERT) $< -matte $@.tmp.png -compose DstIn -composite $@
	@$(RM) $@.tmp.png

app-icon-rounded-512x512.png: app-icon-whitebox-512x512.png
	$(CONVERT) -size 512x512 xc:none -draw "roundrectangle 2,2,508,508,254,254" $@.tmp.png
	$(CONVERT) $< -matte $@.tmp.png -compose DstIn -composite $@
	@$(RM) $@.tmp.png

.PHONY: clean
clean:
	$(RM) $(TARGET)/app-icon-*.png $(TARGET)/favicon.ico $(TARGET)/apple-touch-icon-*.png || true
	$(RM) app-icon-*.png || true
	$(RM) app-icon.svg || true
