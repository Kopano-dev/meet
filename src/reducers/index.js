import commonReducer from './common';
import contactsReducer from './contacts';
import kwmReducer from './kwm';
import mediaReducer from './media';
import streamsReducer from './streams';
import recentsReducer from './recents';

const reducers = {
  common: commonReducer,
  contacts: contactsReducer,
  kwm: kwmReducer,
  media: mediaReducer,
  streams: streamsReducer,
  recents: recentsReducer,
};

export default reducers;
