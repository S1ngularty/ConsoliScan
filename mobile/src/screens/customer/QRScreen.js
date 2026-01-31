import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import QRCode from "react-native-qrcode-svg";

export default function CheckoutQRScreen({ route, navigation }) {
  const { checkoutCode, expiresAt } = route.params;
  const [timeLeft, setTimeLeft] = useState("");

  /* ======================
     COUNTDOWN TIMER
  ====================== */

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(expiresAt).getTime() - Date.now();

      if (diff <= 0) {
        clearInterval(interval);
        Alert.alert(
          "Checkout Expired",
          "Your checkout session expired. Please try again."
        );
        navigation.goBack();
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  /* ======================
     UI
  ====================== */

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Show this QR to the cashier</Text>

      <View style={styles.qrWrapper}>
        <QRCode
          value={checkoutCode}
          size={220}
          backgroundColor="white"
        />
      </View>

      <Text style={styles.codeText}>{checkoutCode}</Text>

      <Text style={styles.timer}>
        Expires in <Text style={styles.bold}>{timeLeft}</Text>
      </Text>

      <Text style={styles.note}>
        Do not close this screen until checkout is completed.
      </Text>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },

  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 24,
    textAlign: "center"
  },

  qrWrapper: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 4,
    marginBottom: 16
  },

  codeText: {
    marginTop: 8,
    fontSize: 14,
    color: "#666"
  },

  timer: {
    marginTop: 16,
    fontSize: 14,
    color: "#444"
  },

  bold: {
    fontWeight: "700"
  },

  note: {
    marginTop: 24,
    fontSize: 12,
    color: "#888",
    textAlign: "center"
  }
});
