// api/order.api.js
import axios from "axios";
import { API_URL } from "../constants/config";
import { getToken } from "../utils/authUtil";
import { File, Directory, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Alert, Platform } from "react-native";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(async (config) => {
  const token = await getToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const confirmOrder = async (transaction) => {
  if (!transaction) return;
  const token = await getToken();
  if (!token) throw new Error("missing token");
  const response = await fetch(`${API_URL}api/v1/confirmOrder`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ transaction }),
  });

  if (!response.ok) throw new Error("failed to complete the transaction");
  const result = await response.json();
  return result;
};

export const fetchOrders = async () => {
  const response = await axiosInstance.get("api/v1/orders");
  console.log(response.data);
  return response.data.result;
};

// FIXED VERSION - Using arrayBuffer() instead of bytes()
export const downloadReceipt = async (orderId, checkoutCode) => {
  try {
    // console.log(`Downloading receipt for order: ${orderId}, code: ${checkoutCode}`);
    
    const token = await getToken();
    if (!token) throw new Error("No authentication token found");

    // Create a directory for receipts if it doesn't exist
    const receiptsDir = new Directory(Paths.document, "receipts");
    if (!receiptsDir.exists) {
      await receiptsDir.create();
      // console.log('Created receipts directory');
    }

    // Create a unique filename with timestamp to avoid conflicts
    const timestamp = Date.now();
    const fileName = `receipt-${checkoutCode}-${timestamp}.pdf`;
    const file = new File(receiptsDir, fileName);

    // Build the URL
    const url = `${API_URL}api/v1/receipts/generate/${orderId}`;
    // console.log('Downloading from:', url);

    // Download using fetch
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/pdf",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to generate receipt: ${response.status} ${errorText}`,
      );
    }

    // Get the PDF as arrayBuffer (works in React Native)
    const arrayBuffer = await response.arrayBuffer();
    // console.log('Received array buffer size:', arrayBuffer.byteLength);
    
    // Convert ArrayBuffer to Uint8Array for File.write
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Write to file
    await file.write(uint8Array);

    // console.log('File saved at:', file.uri);
    // console.log('File exists:', file.exists);
    // console.log('File size:', file.size);

    // Share/Save the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType: "application/pdf",
        dialogTitle: "Save Receipt",
        UTI: "com.adobe.pdf",
      });
    } else {
      // console.log("Sharing not available, file saved at:", file.uri);
      Alert.alert("Success", `Receipt saved to device`);
    }

    return { success: true, fileUri: file.uri };
  } catch (error) {
    console.error("Error downloading receipt:", error);
    throw error;
  }
};

// ALTERNATIVE VERSION - Using blob and FileReader (fallback)
export const downloadReceiptWithBlob = async (orderId, checkoutCode) => {
  try {
    // console.log(`Downloading receipt for order: ${orderId}, code: ${checkoutCode}`);
    
    const token = await getToken();
    if (!token) throw new Error("No authentication token found");

    // Create a directory for receipts if it doesn't exist
    const receiptsDir = new Directory(Paths.document, "receipts");
    if (!receiptsDir.exists) {
      await receiptsDir.create();
    }

    // Create a unique filename with timestamp
    const timestamp = Date.now();
    const fileName = `receipt-${checkoutCode}-${timestamp}.pdf`;
    const file = new File(receiptsDir, fileName);

    // Build the URL
    const url = `${API_URL}api/v1/receipts/generate/${orderId}`;

    // Download using fetch
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/pdf",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to generate receipt: ${response.status}`);
    }

    // Get the PDF as blob
    const blob = await response.blob();
    
    // Convert blob to base64 using FileReader
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (result && typeof result === 'string') {
          // Extract base64 data from data URL
          if (result.includes(',')) {
            resolve(result.split(',')[1]);
          } else {
            resolve(result);
          }
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });

    // Write base64 to file
    await file.write(base64, { encoding: 'base64' });

    // console.log('File saved at:', file.uri);

    // Share/Save the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType: "application/pdf",
        dialogTitle: "Save Receipt",
        UTI: "com.adobe.pdf",
      });
    }

    return { success: true, fileUri: file.uri };
  } catch (error) {
    console.error("Error downloading receipt:", error);
    throw error;
  }
};