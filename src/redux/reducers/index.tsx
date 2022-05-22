import { combineReducers } from '@reduxjs/toolkit';

import settings from './setReducer';
import tmpSettings from './tmpSetReducer';

export default combineReducers({
  settings, tmpSettings
});
