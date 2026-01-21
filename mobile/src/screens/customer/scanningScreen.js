import { View, Text } from 'react-native'
import React from 'react'
import BarcodeScanner from '../../components/BarcodeScanner'

const ScanningScreen = () => {
  return (
    <View style={{
        flex:1
    }}>
      <BarcodeScanner
      onDetect={(data,type)=>{
        console.log("data: ",data)
        console.log("type: ",type)
      }}
      />
    </View>
  )
}

export default ScanningScreen