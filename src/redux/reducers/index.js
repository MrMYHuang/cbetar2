import { combineReducers } from "redux"

import settings from "./setReducer"
import tmpSettings from "./tmpSetReducer"

export default combineReducers({
  settings, tmpSettings
})
