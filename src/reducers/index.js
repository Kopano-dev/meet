import commonReducer from './common';
import contactsReducer from './contacts';
import kwmReducer from './kwm';

const reducers = {
  common: commonReducer,
  contacts: contactsReducer,
  kwm: kwmReducer,
};

export default reducers;
