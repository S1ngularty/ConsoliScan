import debounce from "lodash.debounce";
import { syncCartToServer } from "./cartThunks";

export const debounceCartSync = debounce((dispatch) => {
  console.log("🔄 [CART DEBOUNCE] Triggering sync (2s delay completed)");
  dispatch(syncCartToServer());
}, 2000);
