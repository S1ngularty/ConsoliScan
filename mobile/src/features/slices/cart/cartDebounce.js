import debounce from "lodash.debounce";
import { saveLocally } from "./cartThunks";

export const debounceCartSync = debounce((dispatch) => {
  dispatch(saveLocally());
}, 2000);
