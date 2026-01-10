const cloudinary = require("../configs/cloudinary");

const uploadImage = async (images=[]) => {
  const imagePromises = images.map((image) => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "ConsoliScan/productAssets/",
        },
        (err, result) => {
          if (err instanceof Error) return reject(err);
          return resolve({ public_id: result.public_id, url: result.url });
        }
      );
      stream.end(image.buffer);
    });
  });
  const uploadedImages = Promise.all(imagePromises);
  return uploadedImages;
};

module.exports = { uploadImage };
