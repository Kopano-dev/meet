import { getAudioContext } from './base';

export class TalkingMeter {
  audioContext;
  analyser;
  analyserArray;
  processor;
  source;

  onChange = null;

  talking = false;

  constructor({ onChange }) {
    if (onChange) {
      this.onChange = onChange;
    }
  }

  start(stream) {
    this.stop();

    if (stream) {
      if (!this.audioContext) {
        this.audioContext = getAudioContext();
      }
      if (this.audioContext) {
        // NOTE(longsleep): Audio worklet support for audio processing in extra thread.
        // Unfortunately this is not supported in Safari as of now.
        try {
          this.audioContext.resume();
        } catch(err) {};
        const source = this.audioContext.createMediaStreamSource(stream);
        if (this.audioContext.audioWorklet) {
          const node = new AudioWorkletNode(this.audioContext, 'volume-meter-processor');
          node.port.onmessage = (event) => {
            // Handling data from the processor.
            if (event.data.talking !== undefined) {
              this.handleChange(event.data.talking);
            }
          };
          node.port.postMessage({
            mode: 'talking',
          });
          this.source = source;
          this.processor = node;
          try {
            this.source.connect(this.processor);
            this.processor.connect(this.audioContext.destination);
          } catch(err) {
            console.error('failed to connect media stream to processor: ' + err);
          }
        } else {
          // Use deprecated script processor on Safari.
          const analyser = this.audioContext.createAnalyser();
          analyser.minDecibels = -46;
          analyser.smoothingTimeConstant = 0.95;
          analyser.fftSize = 256;
          const processor = this.audioContext.createScriptProcessor(512, 1, 1);
          processor.onaudioprocess = this.handleAudioProcess;
          this.source = source;
          this.analyser = analyser;
          this.analyserArray = new Uint8Array(this.analyser.frequencyBinCount);
          this.processor = processor;
          try {
            this.source.connect(this.analyser);
            this.analyser.connect(this.processor);
            this.processor.connect(this.audioContext.destination);
          } catch(err) {
            console.error('failed to connect media stream to processor: ' + err);
          }
        }
      }
    }
  }

  handleChange = status => {
    const { talking, onChange } = this;

    if (status !== talking) {
      this.talking = status;
      if (onChange) {
        onChange(status);
      }
    }
  }

  handleAudioProcess = () => {
    const { analyser, analyserArray: array } = this;
    const { talking, onChange } = this;

    if (analyser === null) {
      return;
    }

    analyser.getByteFrequencyData(array);

    let values = 0;
    const length = array.length;
    for (let i = 0; i < length; i++) {
      values += array[i];
    }

    const status = Math.floor(values / length) > 0;
    if (status !== talking) {
      this.talking = status;
      if (onChange) {
        this.onChange(status);
      }
    }
  }

  stop() {
    if (this.source) {
      if (this.analyser) {
        try {
          this.source.disconnect(this.analyser);
        } catch(err) {
          console.error('failed to disconnect source from analyser: ' + err);
        }
        try {
          this.analyser.disconnect(this.processor);
        } catch(err) {
          console.error('failed to disconnect analyser from processor: ' + err);
        }
        this.analyser = null;
      } else {
        try {
          this.source.disconnect(this.processor);
        } catch(err) {
          console.error('failed to disconnect source from processor: ' + err);
        }
      }
      this.source = null;
      if (this.processor) {
        try {
          this.processor.disconnect(this.audioContext.destination);
        } catch(err) {
          console.error('failed to disconnect processor: ' + err);
        }
        if (this.processor.port) {
          this.processor.port.postMessage({
            shutdown: true,
          });
        }
        this.processor = null;
      }
      this.audioContext = null;
    }
  }
}
