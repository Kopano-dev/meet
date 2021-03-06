# CHANGELOG

## Unreleased

- Rebuild translations and translate to German
- Support to display KWM server status information
- Update kwmjs to v1.3.1
- Limit maximum size of chat messages
- Force minimal video height only on xs displays
- Improve UI style scrollbars and min sizes
- Generate server disconnect/reconnect system messages in chat
- Show participants count in tab label
- Improve chat ui scroll behavior styles
- Auto expand mobile bottom bar on tab change
- Keep channel chat input focus after send
- Improve join/left chat system message display
- Update kwmjs to 1.3.0
- Use top bar badge to indicate chat messages when drawer is hidden
- Update kpop to v2.6.0
- Support server generate system chat messages
- Implement chat delivery queued status
- Implement chat send status and retry
- Add chat support
- Bring back recommended linting


## v2.3.1 (2020-12-11)

- Remove svgView URL parameter for Safari
- Add workaround for Safari transform, rotate rendering issue
- Ensure the call timer always updates as needed


## v2.3.0 (2020-12-09)

- Resolve a flex issue for older browsers
- Hide mobile bottom pane if minimal height is reached
- Implement swipable bottom pane for mobile view
- Use consistent names for container components
- Split CallView component into sub components
- Visually bind call grid controls position to call grid bottom
- Prepare to split up CallView
- Reduce required width for 2 cols of videos
- Use solid icon for empty room message
- Prevent redirect to join flow on reload triggered by update
- Update kpop to v2.5.0
- Auto redirect to join flow on direct group access
- Properly format display name in join flow
- Always use next button label in join flow welcome
- Fix video overlap in join flow with Firefox
- Update kwmjs to v1.2.3
- Make call grind to require channel for novideos state
- Make talking indicator visbile in sidebar mode
- Remove incorrect folder creation in test
- Update kwmjs to v1.2.2
- Rebuild translations and translate to German
- Add text messages when no video is received in groups
- Add config option to disable remote talking detection
- Update participant list minor design inconsistencies
- Ensure talking icon is visible only when with audio
- Add local talking indicator to local floating video
- Add talking detection for local stream
- Move talking detection into its own rights
- Optimize volume meter audio worklet
- Allow license ranger to ignore worker without map
- Add global click handler to resume audio node quickly
- Add audio worklet to process stream volume threaded
- Avoid to add incomplete stream records in store
- Update webrtc-adapter to 7.7.0
- Reduce main tab visual font size to match design
- Add talking indicator for remote streams
- Add talking audio detection for remote streams
- Fix linter warnings after rule update
- Only log redux actions in development mode
- Bump copyright year to 2020
- Add indicator for audio and video status to participants
- Update kpop to v2.4.0
- Add service worker stale cache for public png file
- Use a copy instead of symlink for app icon
- Update react-scripts to 4
- Make manifest icons maskable
- Update to kpop v2.3.0 and its dependencies
- Improve Guest and Me in display name
- Fix linter issue for a very long line
- Fix break points for sidebar changes
- Update browserlist rules
- Improve and unify connecting animation status
- Hide peers without video in call grid for groups
- Add i18n support to label prefixes
- Ensure to show invite button when group but not dialed in
- Cleanup and prepare for roles and permissions
- Add participants list to left drawer in groups
- Clone local stream for fake stream debug helper
- Improve visibility and styles for call grid
- Refactor channel control
- Keep left pane open when joining group calls
- Bump CI environment to Node 14
- Add clean check to CI pipeline
- Use warningsng plugin as checkstyle is deprecated
- Pull in translation from Weblate


## v2.2.3 (2020-07-02)

- Update kpop to v2.2.4


## v2.2.2 (2020-06-22)

- Cleanup dependencies lock file
- Update kpop to v2.2.3


## v2.2.1 (2020-06-03)

- Update third party dependencies
- Add configuration for public group prefix and regexp
- Improve default guest behavior


## v2.2.0 (2020-05-26)

- Ignore incoming screen sharing streams for main user stream reduce
- Update kwmjs to 1.2.1
- Fix dev example web server sockjs-node location
- Update 3rd party depdencies
- Update kwmjs to 1.2.0
- Add first class transceiver control based on mode


## v2.1.1 (2020-03-30)

- Add debug helper to destroy all peer connections
- Update kwmjs to v1.1.4
- Update kwmks to v1.1.3
- Ignore special peer connections in stream reducer
- Remove iOS standalone gUM access warning


## v2.1.0 (2020-03-13)

- Bump version to v2.1.0, no software changes


## v2.0.3 (2020-03-12)

- Migrate meet to newly introduced theme.spacing api
- Handle the case when selected media device is not available
- Handle error when volume meter receives no audio stream
- Fix linter warnings
- Add unit test for main component


## v2.0.2 (2020-01-31)

- Move action to its proper place
- Auto unmute audio playback when possible
- Exist join screen only when with channel
- Update join background to new artwork


## v2.0.1 (2020-01-27)

- Force guest users to oidc implicit flow


## v2.0.0 (2020-01-24)

- Avoid accidential remove of public prefix
- Update translations and translate to German
- Disable microphone input selection on Android
- Offer audio unmute when auto play policy prevents play
- Update kpop to 2.2.0
- Provide version to allow future forced app updates
- Trim whitespace of group name before creating ID
- Use filled settins icon instead of outlined one
- Bring back proper working catch all route
- Make guests key optional in config
- Use dedicated audio extra element for remote streams on mobile Safari
- Further improve overlay video ui sizing
- Ensure streams are always getting started
- Improve settings menu
- Allow buttons with popover use active style when popover is open
- Update translations and translate to German
- Add i18n for join screen
- Use more-vert icon for settings menu
- Add settings to join flow
- Allow opening of settings dialog when not in call view
- Improve video grid css for better video visibility
- Update kwmjs to 1.1.2
- Pin guest mode in URL when using join flow
- Avoid setting audioSink when none is available
- Ensure screen sharing is visible on iOS
- Fix refactoring typo
- Allow auto join to work even if gum gets cancelled
- Improve mute/unmute stream handling
- Ensure to trigger user required error when user is required
- Avoid vertical scroll in join flow on large screens
- Update kpop to 2.1.0
- Create links to group meetings with join flow prefix
- Add cam/mic mute toggle to join flow
- Move floating cam and mic mute buttons to own components
- Disable session monitor for guest users
- Improve join flow dialog height and button consistency
- Avoid kwm reconnect when credentials changed and already connected
- Properly forward ref for posed component
- Fix translation typo
- Ignore esm modules which are sub modules of others
- Add join background header artwork
- Update kpop to 2.0.0
- Move cover flag into redux to prepare for global dialogs
- Implement Join flow and its UI
- Reorganize app structure with routes
- Format JSON files like Javascript
- Update to latest react linter, to support forwardRef properly
- Properly forward ref for all functional components
- Update to Material-UI 4
- Log some errors as warning to avoid to fail build in develop mode
- Reorganize main component into sub folder
- Add basic text that is picked when parsing Meet for plain text
- Update translations and translate to German
- Add defines for translatable error messages and snacks
- Update kpop to 1.2.1
- Use v4 typography variants
- Allow development service worker to replace production service worker
- Add snacks related to KWM server connection
- Add check for browser support with corresponding error messages
- Fix linter warnings in helper scripts
- Improve audioSink apply logic
- Use notifications from kpop
- Update kpop to 1.2.0 and dependencies
- Refactor callview actions


## v1.2.1 (2019-12-10)

- Ensure to activate new service worker on update


## v1.2.0 (2019-12-10)

- Update kwmjs to 1.1.1
- Make dev serviceworker actually work in exampe dev Caddyfile
- Ignore esm modules when creating 3rd party licenses
- Use spaces for indentation
- Update kpop to 1.1.4
- Add bundle size analyze target
- Update c-r-a
- Udpate kpop to 1.1.3
- Imrpove word break for very long room names
- Improve visual padding of contact search search bar
- Use correct color for FullscreenDialog title
- Update kpop and glue build dependencies
- Make linter happy
- Move visibility and offline control to BaseContainer
- Add event support for Glue
- Use reset service worker in dev mode
- Update kpop to 1.1.0
- Avoid adding intl property to dom node
- Use correct API prefix default for grapi API
- Add padding to ContactSearch search field even when embedded
- Unify MasterButton top and bottom padding
- Avoid triggering undefind guest when guests are configured without default
- Improve auto fit styles for floating self video
- Update to kwmjs 1.1.0
- Remove obsolete RTCPeerConnection constraints
- Update to kwmjs 1.0.1
- Add a settings toggle wether videos cover the available space or not


## v1.1.3 (2019-11-28)

- Use correct API prefix default for grapi API


## v1.1.2 (2019-11-11)

- Avoid triggering undefind guest when guests are configured without default


## v1.1.1 (2019-10-29)

- Update to kwmjs 1.0.1


## v1.1.0 (2019-10-14)

- Translated using Weblate (Portuguese (Portugal))
- Translated using Weblate (Portuguese (Portugal))
- Translated using Weblate (Portuguese (Portugal))
- Translated using Weblate (Icelandic)
- Translated using Weblate (Icelandic)
- Translated using Weblate (Hindi)
- Update German translation
- Update translation catalog
- Add setting to use guest mode by default
- Descripe hd and stereo fragment parameters
- Update kwmjs to 0.21.0
- Improve Opus codec send and receive settings
- Set bitrate preference for all m= lines, not only the first
- Allow override of webrtc config by config.json
- Prevent possibility of multiple added streams on parallel unmute
- More ui for syninc user media state with browser
- Add detection for browser triggered uM stream end
- Add after uM sync to audio video mute state
- Use event handler function for add/remove stream
- Add reference to kwmjs
- Add list of uses technologies
- Avoid hydrating device IDs when using Safari
- Do not try to use non-active streams with audio context
- Add feature detection for navigator.mediaDevices
- Clarify error message for public rooms


## v1.0.1 (2019-09-24)

- Avoid hydrating device IDs when using Safari
- Do not try to use non-active streams with audio context
- Add feature detection for navigator.mediaDevices


## v1.0.0 (2019-09-04)

- Update README to include information about supported packages


## v0.23.3 (2019-09-04)

- Translated using Weblate (German)
- Translated using Weblate (German)
- Translated using Weblate (German)
- Translated using Weblate (French)
- Translated using Weblate (Dutch)
- Translated using Weblate (Russian)
- Translated using Weblate (Portuguese (Portugal))
- Translated using Weblate (Norwegian Bokmål)
- Translated using Weblate (Icelandic)
- Translated using Weblate (Hindi)
- Make untranslated Devices tab label translateable
- Update kpop to 0.24.5
- Enable Icelandic translation
- Translated using Weblate (Icelandic)


## v0.23.2 (2019-09-03)

- Update translation catalog
- Ensure proper imcoming screen sharing visuals on mobile
- Improve text for "Join or create group"
- Improve invite to message
- Translated using Weblate (German)


## v0.23.1 (2019-09-02)

- Only set device ids if form is dirty
- Disable device settings dropdown if it is empty
- Only mirror video when set and video facing mode is user or unknown
- Match audio and video source exactly to avoid getting wrong device
- Only set howler device when actually setting a sink is supported
- Enable Hindi translations
- Update to kpop 0.20.4


## v0.23.0 (2019-08-30)

- Enable more translations
- Auto stop to screen share after hang up
- Show all peers when in audio only mode conference
- Disable name on remote video streams when receiving a screen
- Pass along device settings properly on mute/unmute
- Remove global redux persistency for recents data
- Reformat translation files
- Update dutch
- Add Hindi
- Translated using Weblate (Dutch)
- Translated using Weblate (Russian)
- Translated using Weblate (Portuguese (Portugal))
- Translated using Weblate (Norwegian Bokmål)
- Translated using Weblate (German)
- Translated using Weblate (French)
- Translated using Weblate (Dutch)
- rename language
- Use deviceId constraint as detector wether its possible to set devices
- Update translations
- Make media settings persistent
- Add device settings
- Fix invalid profile access for mail attribute
- Add forwardRef support to howling provider
- Modernize howling with stable Rect context implementation
- Add support to set audio/video options and constraints
- Avoid unhandled exception if there is no contact for incoming call
- Translated using Weblate (Russian)
- Translated using Weblate (Norwegian Bokmål)
- Translated using Weblate (Norwegian Bokmål)
- Translated using Weblate (Russian)
- Translated using Weblate (Norwegian Bokmål)
- Translated using Weblate (French)
- Translated using Weblate (Portuguese (Portugal))
- Translated using Weblate (Russian)
- Translated using Weblate (French)
- Translated using Weblate (Norwegian Bokmål)
- Translated using Weblate (Norwegian Bokmål)
- Translated using Weblate (French)
- Translated using Weblate (Portuguese (Portugal))
- Translated using Weblate (Portuguese (Portugal))
- Correctly use setError from props
- Detect all Androids as mobile devices
- Update invitation text
- Increase mobile drawer width, so stuff fits
- Decode URL paths for guest access
- Use semicolon in mailto to field
- Update translations and translate to German
- Build public group ui guest enabled configuration
- Update kpop to 0.20.3
- Reset meet URL hash before sign out to avoid retaining guest logon
- Improve ui to create public groups
- Set some properties to input fields on mobile
- Properly open mailto links on mobile
- Improve controls position in mobile view
- Update translations and translate to German
- Use translated scope label
- Adapt styles so that things fit and wrap properly
- Use same styles for all dialogs
- Improve dialogs
- Use share API for sharing Meet links if its available
- Update kwmjs to 0.20.0
- Add invite by email for groups
- Update webrtc-adapter to 7.3.0


## v0.22.1 (2019-07-31)

- Get rid of yellow background left over


## v0.22.0 (2019-07-25)

- Update kwmjs to 0.19.0
- Enable add/remove of tracks for Firefox and Safari
- Disable auto focus of search field on mobile
- Add playsinline attribute to all audio and video elements
- Enable track remove/add on Safari
- Get rid of grizzly styles
- Use unified plan with Chromium
- Remove depcreated inactive event in favour of onended
- Use full screen incoming call dialog on mobile
- Rebuild and update translations
- Simplify call flow options
- Update kpop to 0.20.2
- Optimize embedded styles
- Update kpop to 0.20.1
- Replace fab button variant with fab component
- Update webrtc-adapter to 7.2.8
- Always stop old gUM and gDM streams when they are replaced
- Reset element src on unmount to prevent potential leaks
- Update material typography variants
- Update kpop to 0.20.0
- Use snackbar from kpop
- Use more from kpop
- Update translations
- Add more snack messages
- Move main notification snacks to notistack
- Increase drawer width
- Rebuild translations
- Remove unused import


## v0.21.1 (2019-07-11)

- Update webrtc-adapter to 7.2.7
- Improve new call and new group dialogs
- Fixup typography variants
- Move settings to a popover menu
- Make new call and group create dialogs responsive
- Fix minor size issues after drawer move to the left


## v0.21.0 (2019-07-04)

- Update translations and translate to German
- Update contact control to new design
- Replace deprecated fab button variant with Fab component
- Update style of group control
- Fixup linter errors
- Move right bar to left drawer
- Deduplicate yarn.lock
- Bump handlebars from 4.0.12 to 4.1.2


## v0.20.0 (2019-05-16)

- Update kpop to 0.19.0
- Bring back iOS Safari compatibility
- Update webrtc-adapter to latest release
- Use Meet colors in theme
- Enable Dutch translation in production build
- Only enable i18n for languages which are complete
- Ensure proper i18n build
- Fixup minor style issues after MUI update
- Update more dependencies
- Update kpop and dependencies to latest
- Translated using Weblate (Dutch)
- Make linter happy
- Ensure to build i18n as dependency for build
- Build with node:10
- Update kpop and import its translatiosn too
- Add translations and translate to German
- Add translation checks to linter
- add translation framework
- Deduplicate external dependencies
- fix ordering of arguments


## v0.19.1 (2019-03-08)

- Fix up unclickable fab icon by increasing its z-index


## v0.19.0 (2019-03-07)

- Remove opacity from overlay buttons
- Use color on screen share button to indicate its on
- Update kpop to 0.15.1
- Ensure proper load even with empty config
- Add control offset on mobile when not in a call
- Move peer text labels to top left of each video
- Move cam/mic controls to the middle
- Update kwmjs to 0.17.1
- Set track contentHint when supported to optimize encoding
- Use dedicated SDP params for screen share connections
- Set screen share frame rate constraint correctly
- Cleanup obsolete code
- Improve screenshare styles
- Update debug with option to add screen share streams
- Implement screen sharing receive via kwmjs stream and announce
- Always show top bar
- Hide screen share button on mobile for now
- Add gum and gdm feature detection to media state
- Add screen sharing support
- Do not break if ABEID detection gets no id
- Use default snack color for info snacks instead of blue
- Add hd= hash parameter for easy camera testing
- Compute TIAS with better overhead formula
- Move SDP params to default object
- Add settings to gUM requests for client provided constraints
- Add Firefox gesStats compatibility with webrtc-adapter and kwmjs
- Update webrtc-adapter.js to 7.2.0
- Reorganize constraints and make them browser dependent
- Add bandwidth and framerate restrictions
- Disable keep old streams on gUM updates
- Fixup comparison
- Update kwmjs to 0.16.0
- Add support to use identified user instead of id for kwm signalling


## v0.18.1 (2019-02-12)

- Catch unhandled errors in kwm destroy
- Catch guest logon errors for wrong guest links
- Always request all scopes, even for guests
- Use Kopano controlled STUN server by default


## v0.18.0 (2019-02-08)

- Describe supported URL fragment parameters
- Add configuration to disable full GAB sync
- Add support for &auto= URL fragment parameter for groups
- Fixup linting errors
- Unset local stream early on mode change
- Prevent division by zero and NaN in RTCStats
- Fetch guest logon oidc settings from user manager
- Update README with confiugration instructions
- Add support for mute hash parameter to set default mute state
- Show a snack message when joining a call with muted mic
- Use pc connect event to update streams calling state
- Avoid trying to add recents to kvs when not having that scope
- Add dedicated warning messages for restriction errors
- Disable guests by default
- Update kwmjs to 0.15.0
- Use kwm profile displayName as stream displayName
- Strip client specific route from guest path
- Allow passing of display name for guest
- Hide app switcher for guests
- Pass OIDC parameters properly for guest mode sessions
- Add configuration to enable guest mode
- Add more flexibility to guest mode
- Use numbered names with prefix for users in call without a name
- Use scopes and scope checks from kpop
- Move scope checks to actions
- Avoid unhandled error when contact cannot be loaded via grapi
- Use kpop API to handle guests via OIDC
- Update kpop to 0.15.0
- Update react to 16.7.0
- Add guest flag to store and hide group close button if guest
- Add guest support via kwm guest API


## v0.17.0 (2019-01-23)

- Update js license ranger to include NOTICES from 3rd parties
- Update to kpop 0.14.0
- Add meet specific suffix to group guid
- Add OIDC claims parameter to request name claim in ID Token
- Decode entry IDs of contacts as ABEID and compare exid part only
- Bump base copyright years to 2019
- Update kwmjs to 0.14.0
- Use Plan B SDP with Chrome >= 72
- Update webrtc adapter to 7.1.1
- Require pc renegotiation after kwm connect


## v0.16.2 (2018-12-10)

- Also request kopano/kvs scope
- Update kpop to 0.13.4
- Fix Groupcontrol join buttons to join all group scopes
- Update oidc-client-js to 1.5.4 for EC signature support


## v0.16.1 (2018-12-06)

- Update kpop to 0.13.3
- Improve how default config settings are applied


## v0.16.0 (2018-12-06)

- Update stream unknown display names from remote contacts
- Add simple rejected call snacks for visual feedback
- Correct eslint errors and warnings to make checkstyle happy
- Add non-fatal error handling for user media
- Make contact search more robust with non-grapi users
- Use linear progress while loading contact results
- Use a single event handler for contact search results
- Improve embedded contact search styles
- Show no message when contacts are empty and nothing was searched
- Update kwmjs to 0.13.1
- Fetch missing contact information on incoming calls
- Avoid breaking on incoming calls from unknown contacts
- Use server side contacts search if more than 100 contacts
- Identify to kwm with ID token
- Add tab labels
- Update local-workbox.js to 20181125-1
- Fixup linting errors and make use of scripts folder
- Use local workbox
- Inject create-react-app again


## v0.15.0 (2018-11-21)

- Use batch mode for kvs import
- Bind recents to user
- Store recents in kvs
- Do not break when error is reset
- Ensure that icons stay visible in minimal height views


## v0.14.0 (2018-11-14)

- Update to kwmjs 0.13.0
- Add more menu to recents
- Reset height in desktop mode
- Move date stamp into subline for recents and contacts
- Add scroll list bottom padding to avoid overlap with fab
- Add desktop mode using flexbox breakpoint above 1024px width
- Reset UI channel if kwm has no channel and no peers
- Improve snacks implementation and error snacks
- Improve non fatal KWM error display
- Only set active streams to element
- Add DataChannel fake for Edge support


## v0.13.0 (2018-11-07)

- Update kwmjs to 0.12.1
- Add tracks to state bindings
- Switch view on incoming call from known contacts as well
- Always switch to entry view when calling
- Align entry height of recents and contacts
- Do not break group view load if location state is empty
- Improve video ready state detection
- Add swipe to delete to recents entries
- Also look in licenses key of package json if license is not found
- Implement contact view and group view identical behavior
- Ignore eslint errors in c-r-a development build


## v0.12.1 (2018-11-05)

- Update to kpop 0.13.2
- Generate 3rd party license overview


## v0.12.0 (2018-10-26)

- Update kpop to 0.13.1
- Add bunch of Firefox scroll fixes
- Implement main view contacts list
- Add call button when recents list is empty
- Better call control and display name information
- Implement per call call/videocall mode switching
- Update to kpop 0.13.0
- Get rid of some padding
- Use Join as group call button
- Improve Caddy configuration examples
- Update to kpop 0.12.0
- Use phone-plus icon for call view fab button
- Remove paper from group control
- Properly close search screen when calling from it
- Set app logo in top bar
- Use correct app title 'Meet'
- Provide config to base container


## v0.11.0 (2018-10-12)

- Ignore c-r-a ejected folders for eslint
- Skip waiting for service worker
- Backport c-r-a use local workbox
- Backport c-r-a disable of inlining chunks
- Add stuff missing after c-r-a eject
- Eject from c-r-a
- Update to cra 2 and fix kpop so the app actually works
- Update to kpop 0.11.2 and dependencies


## v0.10.1 (2018-10-05)

- Update kpop to 0.11.1


## v0.10.0 (2018-09-26)

- Update kpop to 0.11.0
- Support add to homescreen
- Add caching for static files in example Caddyfile


## v0.9.1 (2018-09-24)

- Add Jenkinsfile
- Update dependencies.
- Fixup eslint error


## v0.9.0 (2018-09-07)

- Implement error handling for contacts
- Implement error handling for kwm and grapi
- Use correct selector scope
- Use debounce from kpop
- Update kpop to 0.10.0
- Cleanup user media on unmount of callview
- Use grapi ID to connect to KWM
- Use grapi scope and claims for contact id filtering
- Use base64 helpers from kpop
- Fetch up to 1000 contacts from users endpoint


## v0.8.0 (2018-08-29)

- Update to kpop 0.9.2
- Add clean target to src Makefile
- Update to kpop 0.9.1
- Update group create labels
- Update config endpoint in Caddyfile examples
- Add missing profile default value
- Remove clientID default since kpop has a better one
- Add apps switcher
- Simplify config loading and initialization
- Remove obsolete example fron config template
- Add offline icon when not connected to KWM server
- Move KWM connection control into own component
- Use offline and visibility actions fro kpop
- Handle 403 error in KWM
- Disconnect from KWM when user is lost
- Use flex to get 100% height layout
- Update kpop to 0.8.1 including 3rd party deps
- Generate manifest icons from app icon
- Use white pwa theme color to best match overall color theme
- Use new meet icon as app background icon


## v0.7.0 (2018-08-13)

- Update to kwmjs 0.12 for better call control
- Do not break when getStats fails
- Avoid to break for unknown users
- Add transport send and receive bytes via stats
- Use correct constraint data types
- Add TODO about user not found
- Create a theme for Meet
- Update Call color to linear-gradient
- Update text shadow according to the design.
- Change background to a grey linear gradient
- Upgrade to kwmjs 0.11.0
- Disallow user text selection of shown username


## v0.6.0 (2018-07-19)

- Update webrtc-adapter to 6.3.0
- Update oidc-client to non beta
- Switch Kopano GC REST API to v1


## v0.5.1 (2018-07-17)

- Improve video text label styles
- Show the name of the person on the video


## v0.5.0 (2018-07-13)

- Update new material-ui imports
- Describe setting up a development env
- Add example Caddyfile.dev
- Mention dependencies in the readme
- src: make 'make clean' work
- Update to Material-UI 1 final
- Use helper utils from kpop
- Only use extra audio element when not muted
- Add drag support to floating local video
- Add container around video elements


## v0.4.1 (2018-07-04)

- Add support for video conferences for mobile Safari
- Switch to audio when more than 20 streams
- Unify base path support
- Add component to display contact labels


## v0.4.0 (2018-07-03)

- Add incoming calls to recents
- Make sure background logo is visible while loading
- Update to kwmjs 0.9.0
- Add helper to toggle simple-peer debug
- Switch to group view before join / after create
- Fixup: remove debug
- Remove guid from group persona
- Add group join ui
- Fixup start route trigger from oidc state
- Remove trimmer, stemmer and stopworkds from contact search
- Add 5 seconds delay on calling before controls get hidden
- Add limit of recents entries
- Show outbound group calls in recents
- Use direct kpop oidc import
- Always add a dummy stream for peers
- Keep location when authenticating
- Use Persona for group avatar
- Add group support
- Update kwmjs to 0.8.0
- Update kpop to 0.4.0


## v0.3.0 (2018-06-11)

- Add clipbloard copy/paste support for group urls
- Add group call control view
- Add side bar with back drop and menu
- Fixup: Improve text
- Fixup: Scrolling of recents
- Add ToolTips to recents date
- Fixup: Recents top padding
- Fixup recents click handler
- Add expiremental redux persistency
- Add recents, appbar and dialogs


## v0.2.0 (2018-06-05)

- Auto hide overlay actions
- Auto enable/disable standby mode
- Debounce gUM calls with 500ms delay
- Improve gUM constraints
- Update to kwmjs 0.7.0 for TURN servers
- Simplify DOM
- Use Persona from kpop to display contacts
- Simplify standby behavior
- Get rid of room icon
- Update React to 16.4 and kwmjs to 0.3.0
- Bind gUM to call accept ui flow


## v0.1.0 (2018-05-07)

- Improve constraints for Chrome and fix deprecation
- More responsive for landscape mode on mobile
- Add visibility event support
- Enlarge mute/unmute buttons on mobile
- Disable width/height gUM constraints on safari
- Bump kwmjs to 0.6.0
- Show proper error if initialization has failed
- Add online/offline initialization
- Add standby mode on non-mobile
- Add unit test which uses kpop
- Add unit testing support
- Make sure sounds are built
- Fixup linter warnings
- Add options for WebRTC and kwm to loaded config
- Enable track add/remove mute only on Chrome
- Implement local contact search
- Move contacts list and search to own component
- More stream/remove add reference cleanup
- Not every error is fatal
- Bind offer/answer constraints to video/audio mode
- Implement stream playback reset after track add
- Remove debug
- Prefer VP9 video and Opus DTX by default
- Adds dial and call sounds
- Fixup: FF styling flexbox height/min-height
- Fixup: typo in event name
- Add floating audio video component
- Add support to add/remove tracks on the fly
- Filter constraints to available devices
- Bump to kwmjs 0.5.0
- Add source-map-explorer for checks
- Reduce size by defining explicit resolutions
- Update and use kpop 0.2.0
- Make eslint run faster


## v0.0.1 (2018-04-13)

- Update to kpop 0.0.5
- Use kwmjs as umd release
- Add mute/unmute for cam and mic
- Add error handling for gUM
- Update gUM constraints to standard syntax
- This is meet
- Add Caddyfile example
- Remove obsolete targets
- This is the meet app
- Use non-fatal error when no session for user
- Do not use mobile dialog for incoming call control
- Implement call control
- Add streams both ways
- Add userMedia support
- Fixup README
- Add KWM js
- Implement callview
- Initial commit

