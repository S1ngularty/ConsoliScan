import axios from "axios";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_APP_API;

export const fetchProducts = async () => {
  const result = await axios.get(`api/v1/product`);
  if (!result) throw new Error("failed to fetch the products");
  const data = result.data.result;
  return data;
};

export const createProduct = async (data,files) => {
  if (!data) throw new Error("data is undefined");
  const formData = new FormData()
  console.log(data,files)
  for(let pair of Object.entries(data)){
    if(pair[0] === "images") break
    formData.append(pair[0],pair[1])
  }
  if(files.fileArray){
    for(let file of files.fileArray){
      formData.append("images",file)
    }
  }

  for(let i of formData.entries()){
    console.log(`${i[0]}=>${i[1]}`)
  }

  const createdProduct = await axios.post("/api/v1/product", formData, {
    headers: {
      "Content-Type": "multipart-form/data",
    },
  });

  if (!createdProduct)
    throw new Error("failed to create the product, please try again.");
  return true;
};
