import commonReducer from './common';
import contactsReducer from './contacts';
import kwmReducer from './kwm';
import usermediaReducer from './usermedia';

const reducers = {
  common: commonReducer,
  contacts: contactsReducer,
  kwm: kwmReducer,
  usermedia: usermediaReducer,
};

export default reducers;
