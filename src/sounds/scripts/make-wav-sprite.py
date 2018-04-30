#!/usr/bin/python
#
# Generator for wav sprites from a source directory. Python 2 is dead. so this
# script requires Python 3.

import glob
import json
import math
import os
import sys
import wave


def main():
    args = sys.argv[1:]

    if len(args) != 3:
        print('Usage: %s <target.wav> <target.json> <source-folder>' %
              sys.argv[0], file=sys.stderr)
        sys.exit(1)

    genAudioSprite(args[0], args[1], args[2])


def genAudioSprite(targetSprite, targetJSON, srcFolder, silence=0.05):
    ts = 0
    sprite = {}

    # Open output file
    with wave.open(targetSprite, 'w') as target:

        silenceFrames = b""
        # Loop wav files in srcFolder.
        for i, f in enumerate(glob.glob(os.path.join(srcFolder, '*.wav'))):
            fd = 0
            with wave.open(f, 'r') as w:
                fd = w.getnframes() / float(w.getframerate())
                if i == 0:
                    # Set parameters of target.
                    target.setparams(w.getparams())
                    # Compute n frames of silence frames where n s the number
                    # of samples corresponding to the duration specified in
                    # "silence".
                    silenceData = [0] * int(w.getframerate() * 2 * silence)
                    silenceFrames = b"".join(wave.struct.pack('h', item)
                                             for item in silenceData)

                # Write source samples.
                target.writeframes(w.readframes(w.getnframes()))
                # Write silence.
                target.writeframes(silenceFrames)

            # Hower.js sprite data.
            label = os.path.basename(f[:-4])
            start = int(math.floor(ts * 1000))  # milliseconds
            fds = int(math.ceil((fd) * 1000))  # milliseconds
            sprite[label] = [start, fds]
            print('%s: start:%d duration:%d' % (label, start, fds))

            # Forward timestamp.
            ts += (fd + silence)

    # Output howler sprite data.
    with open(targetJSON, 'w') as j:
        json.dump(sprite, j, sort_keys=True, indent=2, separators=(',', ': '))


if __name__ == '__main__':
    main()
