import { View, Text } from 'react-native'
import React from 'react'
import BarcodeScanner from '../../components/BarcodeScanner'
import { scanProduct } from '../../api/product.api'

const ScanningScreen = () => {
  return (
    <View style={{
        flex:1
    }}>
      <BarcodeScanner
      onDetect={async(data,type)=>{
        console.log("data: ",data)
        console.log("type: ",type)
        await scanProduct(type,data)
      }}
      />
    </View>
  )
}

export default ScanningScreen