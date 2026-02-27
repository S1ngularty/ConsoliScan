import NetInfo from "@react-native-community/netinfo";

export const checkNetworkStatus = async () => {
  try {
    const state = await NetInfo.fetch();
    return {
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
      isOnline: state.isConnected && state.isInternetReachable,
      type: state.type,
    };
  } catch (error) {
    console.error("Network check error:", error);
    return { isConnected: false, isInternetReachable: false, isOnline: false };
  }
};
