import { getAudioContext } from '../base';

import VolumeMeterProcessor from 'file-loader?name=static/js/[name].[hash:8].[ext]!./volume-meter-processor'; // eslint-disable-line import/no-webpack-loader-syntax

const register = async () => {
  const promises = [];
  const audioContext = getAudioContext();

  if (audioContext && audioContext.audioWorklet) {
    promises.push(audioContext.audioWorklet.addModule(VolumeMeterProcessor));
  }

  return Promise.all(promises);
};

export default register;
