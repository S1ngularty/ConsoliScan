import {
  setLastError,
  setServerDown,
} from "../features/slices/network/networkSlice";

let dispatchRef = null;

export const setNetworkDispatch = (dispatch) => {
  dispatchRef = dispatch;
};

const safeDispatch = (action) => {
  if (dispatchRef) {
    dispatchRef(action);
  }
};

const isNetworkFailure = (error) => {
  if (!error) return true;
  if (error.name === "AbortError") return true;
  if (error.code === "ECONNABORTED") return true;
  if (error.code === "ERR_NETWORK") return true;
  if (error.message === "Network Error") return true;
  if (!error.response && !error.status) return true;
  return false;
};

const getStatus = (error) => {
  if (error?.response?.status) return error.response.status;
  if (error?.status) return error.status;
  return null;
};

export const markServerUp = () => {
  safeDispatch(setServerDown(false));
};

export const handleApiError = (error) => {
  const status = getStatus(error);
  const isNetwork = isNetworkFailure(error);
  const isServerError = status && status >= 500;

  if (isNetwork || isServerError) {
    safeDispatch(setServerDown(true));
  } else {
    safeDispatch(setServerDown(false));
  }

  let message = error?.message || "Request failed";
  if (error?.code === "ECONNABORTED") {
    message = "Request timeout - server is taking too long to respond";
  } else if (isNetwork) {
    message = "Cannot reach server - please check your connection";
  } else if (error?.response?.data?.message) {
    message = error.response.data.message;
  }

  safeDispatch(setLastError(message));
  return new Error(message);
};

export const apiFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      const err = new Error(
        errorText || `Request failed with status ${response.status}`,
      );
      err.status = response.status;
      throw err;
    }
    markServerUp();
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};
