import axios from "axios";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_APP_API;

export const fetchHomeData = async () => {
  try {
    const response = await axios.get(`api/v1/customer/home`);
    return response.data?.result;
  } catch (error) {
    console.error("Failed to fetch home data:", error);
    throw error;
  }
};

export const fetchOrders = async () => {
  try {
    const response = await axios.get("api/v1/orders");
    return response.data.result;
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    throw error;
  }
};

export const downloadReceipt = async (orderId, checkoutCode) => {
  try {
    const response = await axios.get(`api/v1/receipts/generate/${orderId}`, {
      responseType: 'blob', // Important for file download
    });

    // Create a blob URL and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    const timestamp = Date.now();
    const fileName = `receipt-${checkoutCode}-${timestamp}.pdf`;
    
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error("Failed to download receipt:", error);
    throw error;
  }
};

export const fetchSavedItems = async () => {
    try {
        const response = await axios.get("api/v1/saved-items"); // Assuming endpoint exists based on mobile naming convention
        return response.data.result || [];
    } catch (error) {
        console.error("Failed to fetch saved items:", error);
        return [];
    }
}
