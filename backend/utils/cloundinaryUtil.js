const cloudinary = require("../configs/cloudinary");

const uploadImage = async (images = [], path = "") => {
  const imagePromises = images.map((image) => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `ConsoliScan/${path}/`,
        },
        (err, result) => {
          if (err instanceof Error) return reject(err);
          return resolve({ public_id: result.public_id, url: result.url });
        },
      );
      stream.end(image.buffer);
    });
  });
  const uploadedImages = await Promise.all(imagePromises);
  const result = uploadedImages.length > 1 ? uploadedImages : uploadedImages[0];
  return result;
};

const deleteAssets = async (publicIds = []) => {
  if (!Array.isArray(publicIds) || publicIds.length === 0) {
    return {
      deleted: {},
    };
  }

  const result = await cloudinary.api.delete_resources(publicIds);
  return result;
};

module.exports = { uploadImage, deleteAssets };
