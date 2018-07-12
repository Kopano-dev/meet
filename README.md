# Kopano Meet

## Build Dependencies

Building meet requires the following dependencies:

* make
* sox
* libav (or using fmpeg AVCONV=ffmpeg)
* yarn
* python3

## Development

Run make to install dependencies and to generate audio/json assets. Then copy
Caddyfile.dev to Caddyfile run `yarn start` and `caddy`.
