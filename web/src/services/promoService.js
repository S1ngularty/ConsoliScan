import axios from "axios";

const API_URL = import.meta.env.VITE_APP_API;

const axiosInstance = axios.create({
  baseURL: `${API_URL}api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Add token to requests if available
// axiosInstance.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

export const promoService = {
  // Get all promos with filters
  getPromos: async (params = {}) => {
    try {
      const response = await axiosInstance.get("/promo", { params });
      return response.data?.result;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getSelections: async () => {
    const response = await axiosInstance.get("/promo/selections");
    const data = response.data?.result || null;
    if (!data) return;

    data.categories = data.categories.map((cat) => ({
      _id: cat._id,
      name: cat.categoryName,
    }));

    return data;
  },

  // Get single promo by ID
  getPromoById: async (id) => {
    try {
      const response = await axiosInstance.get(`/promo/${id}`);
      return response.data?.result;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create new promo
  createPromo: async (promoData) => {
    try {
      console.log(promoData)
      const response = await axiosInstance.post("/promo", promoData);
      return response.data?.result;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update promo
  updatePromo: async (id, promoData) => {
    try {
      const response = await axiosInstance.put(`/promo/${id}`, promoData);
      return response.data?.result;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete promo
  deletePromo: async (id) => {
    try {
      const response = await axiosInstance.delete(`/promo/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.result || error;
    }
  },

  // Toggle promo status
  togglePromoStatus: async (id, active) => {
    try {
      const response = await axiosInstance.patch(`/promo/${id}/status`, {
        active,
      });
      return response.data?.result;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Validate promo code
  validatePromoCode: async (code, cartTotal = 0) => {
    try {
      const response = await axiosInstance.post("/promo/validate", {
        code,
        cartTotal,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.result || error;
    }
  },

  // Apply promo code
  applyPromoCode: async (code, cartId) => {
    try {
      const response = await axiosInstance.post("/promo/apply", {
        code,
        cartId,
      });
      return response.data?.result;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

// For backward compatibility
export const getPromos = promoService.getPromos;
export const getPromoById = promoService.getPromoById;
export const createPromo = promoService.createPromo;
export const updatePromo = promoService.updatePromo;
export const deletePromo = promoService.deletePromo;
export const togglePromoStatus = promoService.togglePromoStatus;
export const validatePromoCode = promoService.validatePromoCode;
export const applyPromoCode = promoService.applyPromoCode;
export const getSelections = promoService.getSelections;
