import debounce from "lodash.debounce";
import { syncCartToServer } from "./cartThunks";

export const debounceCartSync = debounce((dispatch) => {
  dispatch(syncCartToServer());
},2000);
