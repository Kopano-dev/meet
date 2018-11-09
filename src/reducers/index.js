import commonReducer from './common';
import contactsReducer from './contacts';
import kwmReducer from './kwm';
import usermediaReducer from './usermedia';
import streamsReducer from './streams';
import recentsReducer from './recents';
import oidcReducer from './oidc';
import snacksReducer from './snacks';

const reducers = {
  common: commonReducer,
  contacts: contactsReducer,
  kwm: kwmReducer,
  usermedia: usermediaReducer,
  streams: streamsReducer,
  recents: recentsReducer,
  oidc: oidcReducer,
  snacks: snacksReducer,
};

export default reducers;
