import cloudinary from "cloudinary";

cloudinary.v2.config({
  api_key: String(process.env.CLOUDINARY_KEY),
  api_secret: String(process.env.CLOUDINARY_SECRET),
  cloud_name: String(process.env.CLOUDINARY_NAME),
});

export default cloudinary;
