/* global sampleRate */
const avaragingFactor = 0.95;
const talkingThreshold = 0.005; // -46 dB
const modeVm = 'vm';
const modeTalking = 'talking';

class VolumeMeterProcessor extends AudioWorkletProcessor {
  volume;
  updateInterval;
  nextUpdateFrame;
  running;
  mode;

  constructor(options) {
    super();

    this.volume = 0;
    this.talking = false;
    this.updateInterval = 100;
    this.nextUpdateFrame = this.updateInterval;
    this.updateIntervalInFrames = this.updateInterval / 1000 * sampleRate; // NOTE(longsleep): sampleRate comes from AudioWorkletGlobalScope.
    this.running = true;
    this.mode = modeVm;

    this.port.onmessage = (event) => {
      // Handling data from the node.
      if (event.data.shutdown) {
        this.running = false;
      } else if (event.data.mode) {
        this.mode = event.data.mode;
      }
    };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const inputChannel = input[0];
      const inputChannelLength = inputChannel.length;

      // Calculate the square sum.
      let sum = 0;
      let i=0;
      let v;
      for (; i < inputChannelLength; i++) {
        v = inputChannel[i];
        sum += v * v;
      }
      // Calculate the root mean square (RMS).
      const rms = Math.sqrt(sum / inputChannelLength);

      // Smooth things out.
      this.volume = Math.max(rms, this.volume * avaragingFactor);

      // Trigger volume change to main thread.
      this.nextUpdateFrame -= inputChannelLength;
      if (this.nextUpdateFrame < 0) {
        this.nextUpdateFrame += this.updateIntervalInFrames;
        switch (this.mode) {
          case modeVm:
            this.port.postMessage({
              volume: this.volume,
            });
            break;
          case modeTalking: {
            const status = this.volume > talkingThreshold;
            if (status !== this.talking) {
              this.talking = status;
              this.port.postMessage({
                talking: status,
              });
            }
            break;
          }
          default:
        }
      }
    }

    return this.running;
  }
}

registerProcessor('volume-meter-processor', VolumeMeterProcessor);
