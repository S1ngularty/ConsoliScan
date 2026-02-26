import debounce from "lodash.debounce";
import { saveLocally } from "./cartThunks";

export const debounceCartSync = debounce((dispatch) => {
  console.log("💾 [CART DEBOUNCE] Saving cart locally (2s delay completed)");
  dispatch(saveLocally());
}, 2000);
