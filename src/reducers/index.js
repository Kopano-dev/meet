import commonReducer from './common';
import contactsReducer from './contacts';
import kwmReducer from './kwm';
import usermediaReducer from './usermedia';
import streamsReducer from './streams';

const reducers = {
  common: commonReducer,
  contacts: contactsReducer,
  kwm: kwmReducer,
  usermedia: usermediaReducer,
  streams: streamsReducer,
};

export default reducers;
