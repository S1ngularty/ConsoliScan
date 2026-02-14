import axios from "axios";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_APP_API;

export const fetchProducts = async () => {
  const result = await axios.get(`api/v1/product`, {
    headers: {
      "Cache-Control": "no-cache",
    },
  });
  if (!result) throw new Error("failed to fetch the products");
  const data = result.data.result;
  
  return data;
};

export const handleProductRequest = async (data, files, requestMethod) => {
  if (!data) throw new Error("data is undefined");
  // console.log(data)
  const formData = new FormData();
  for (let pair of Object.entries(data)) {
    if (pair[0] === "images") continue;
    // console.log(pair)
    formData.append(pair[0], pair[1]);
  }
  if (files) {
    for (let file of files) {
      formData.append("images", file);
    }
  }

  const createdProduct = await axios[requestMethod](
    `/api/v1/product${requestMethod === "put" ? `/${data._id}` : ""}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart-form/data",
      },
    },
  );

  if (!createdProduct)
    throw new Error("failed to create the product, please try again.");
  return true;
};

export const removeImageRequest = async (productId, publicId) => {
  const isDeleted = await axios.post(
    `api/v1/product/removeImg/${productId}?publicId=${publicId}`,
    {},
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!isDeleted) throw new Error("failed to delete the image");
};

export const temporaryDelete = async (productId) => {
  if (!productId) throw new Error(" missing product Id");
  const isDeleted = await axios.post(`api/v1/product/${productId}`);
  if (!isDeleted) throw new Error("failed to delete the product");
  return true;
};

export const updateStock = async(stockQuantity,productId)=>{
  const result = await axios.put(`api/v1/product/stocks/${productId}`,{stockQuantity})
  return result.data.result
}

export const getCategories = async () => {
  const result = await axios.get("/api/v1/category");
  const categories = result.data.result;
  return categories;
};