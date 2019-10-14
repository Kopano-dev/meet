# Kopano Meet

Kopano Meet is a progressive web app for video meetings for desktop and mobile
utilizing the Kopano Web Meeting client library (kwmjs).

## Technologies

- React
- Kopano Web Mettings Javascript client library

## Build Dependencies

Building meet requires the following dependencies:

* make
* sox
* libav (or using ffmpeg AVCONV=ffmpeg)
* yarn
* python3

## Quick start

Meet is a progressive web app. So to get it up and running either build it with
`make` or get a release tarball from https://download.kopano.io/community/kapp:/kopano-meet-latest.tar.gz
and put the resulting static files on a webserver and serve them with https.

Kopano also provides packages for various Linux distributions. You can download
those from https://download.kopano.io/community/meet:/ - Get a subscription from
https://kopano.com to get access to repositories and support.

## URL fragment parameters

Meet offers some user controlled behavior via parameters passed in as URL
fragments. These can be used to control the initial behavior of Meet, for example
when sharing links to a specific Meet group or conference.

`auto=` : Meet will automatically join the group/conference if one is directly
          given by URL if already signed in or signing in as guest. Values are
          `1` for auto join with audio only or `2` to auto join with video call.

`mute=` : Meet automatically disables camera and/or microphone on startup, based
          on the value of the `mute` parameter. This value is a bitmask which
          uses `1` for microphone and `2` for camera. The combined value `3` is
          therefore muting both.

`hd=`   : Selects the maximum camera resolution based on the value of the `hd`
          parameter. 0, 1, 2, 3 or repectively 360p, 720p, 1080p, 4k can be
          selected.

`stereo`: If given, the microphone is openend with 2 channels (stereo).


All URL fragment parameters need already be there when the Meet app loads. For
example see the following link:

  https://my-kopano.local/meet/r/group/super-duper#mute=1&auto=2

Automatically joins the super-duper group as a video call but with muted
microphone.

Additional fragment parameters are supported to handle additional functionality.
See the rest of this documentation for more information.

## Runtime dependencies

To operate Meet, it needs backends. Meet uses Konnect for authentication, KWM
server for signaling and Kapi for groupware and key/value storage apis. So those
are needed as well. See the links below to find instructions how to get those
running.

- https://stash.kopano.io/projects/KC/repos/konnect
- https://stash.kopano.io/projects/KC/repos/kapi
- https://stash.kopano.io/projects/KWM/repos/kwmserver

## Runtime configuration

Meet configuration is done via REST config API. An example what this API needs
to provide can be found in the `config.json.in` example which you find in the
sources or documentation. Kopano Meet loads the config endpoint on startup from
`/api/config/v1/kopano/meet/config.json`. So ensure in the web server config,
that this URL can be found since it is required and provides essential options
to meet.

Further information about Kopano Web Meetings can be found at the [kwmjs](https://stash.kopano.io/projects/KWM/repos/kwmjs/browse/README.md)
client library project.

### Configuration

The following configuration options are supported by Kopano Meet via settings in
config.json.

#### Groupware API

`apiPrefix` key defines the URL or path where Meet can access grapi via HTTPS.
The usual value in a Kopano setup is `/api/gc/v1`. This is a required setting.

#### OpenID Connect (OIDC)

`oidc` key defines a mapping for OpenID Connect specific settings. It can be
empty and Meet will try to find the OIDC issuer on the host where Meet is
accessed from. It is recommended to configure the issuer identifier (iss)
explicitly. If any of the values is empty, it will be auto detected or auto
generated.

```
"oidc": {
	"iss": "",
	"clientID: ""
}
```

#### KWM Server

`kwm` key defines a mapping for KWM server specific settings. It can be empty
and Meet will try to use KWM server API on the host where Meet is accessed from.

```
"kwm": {
	"url": ""
}
```

#### Guest support

Meet has support for guest access. This feature is disabled by default and can
be controlled via the `guests` key in config.json.

```
"guests": {
	"enabled": true,
	"default": null
}
```

If enabled, Meet can be accessed as guest if started with `#guest=` parameter,
for example by clicking on a link. The guest values and the corresponding
behavior is defined by KWM server. At the moment, Meet supports `guest=1`
together with optional`name` and `token` parameters.

`guest=` : guest mode (example `guest=1`)
`token=` : guest authentication token (example `token=token-value`)
`name=`  : guest display name value (example `name=John%20Smith`)

Please be aware that values need to be URL encoded and need to be passed in the
fragment identifier part of the URL. Moreover, these values are only checked
once while Meet startup.

In addition to the `#guest=` parameter the guest mode can be made the default
by setting a guest type with the `default` key in the `guests` key value in
config.json. The value from there will be used if the `#guest=` parameter is
not set. At the moment, Meet supports guest type `1`. So to enable that by
default, use `"default": "1"` in config.json within the `guests` key.

Example guest link:

  https://my-kopano.local/meet/r/group/public/hello-world#guest=1&name=John%20Smith

##### Setting up guest support

Aside from enabling guest support in Meet, it also needs to be enabeled in
KWM server and in Konnect. Here are quick instructions how to do that.

First, generate a new ECDSA key. In this example we use OpenSSL for that. It is
recommended to generate an EC key since those are much smaller that the also
supported RSA keys.

```
openssl ecparam -name prime256v1 -genkey -noout -out ecparam.pem
openssl ec -in ecparam.pem -out my-test-key-1.pem
```

So we have my-test-key-1.pem now which contains the pem encoded `EC PRIVATE KEY`
part. We need to convert this to a JSON Web Key. Most tools out there cannot
convert that properly, so Konnect contains a helper for this.

```
kopano-konnectd utils jwk-from-pem --yaml my-test-key-1.pem
```

Now we have the key in the correct format. It also uses the file name of the
key file as id (kid) for the key. So change as you like, just ensure you use
the same values in both KWM server and Konnect registration YAML files below.

Add the generated key as a client to the registration files on both KWM server
and Konnect. Both ship with examples (registration.yaml.in and
identifier-registration.yaml.in). Essentially the Meet client (as configured in
config.json, needs to be added to both KWM server and Konnect registrations).

In Konnect, the private part of the key is technically not required (this is
the `d` part). Additionally required in Konnect registration is the
`trusted_scopes` key to allow `konnect/guestok` and `kopano/kwm` to allow Meet
guest access. The Konnect client-registration.yaml.in has an example for this
as well. Ensure that Konnect is started with a client registration and that the
Meet client (identified by client_id) is properly registered on startup. Also do
not forget to enable general guest support in Konnect (allow-client-guests
commandline parameter).

In KWM Server, guest support is enabled by commandline parameters or configuration
file. See the guest settings section in kwmserverd.cfg. The minimal requirement
is that the guest API is turned on. Further settings and commandline parameters
control wether guests only rooms are allowed or which rooms are available for
guests without token.

## Development

Run make to install dependencies and to generate audio/json assets. Then copy
Caddyfile.dev to Caddyfile run `yarn start` and `caddy`.

## License

See `LICENSE.txt` for licensing information of this project.
