import NetInfo from '@react-native-community/netinfo';

const netInfo = NetInfo.fetch().then(state => {
    console.log("Connection type", state.type);
    console.log("Is connected?", state.isConnected);   
})

export default netInfo;