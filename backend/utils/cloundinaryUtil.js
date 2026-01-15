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
        }
      );
      stream.end(image.buffer);
    });
  });
  const uploadedImages = await Promise.all(imagePromises);
  const result = uploadedImages > 1 ? uploadedImages : uploadedImages[0];
  return result;
};

const deleteAssets = async(publicIds=[])=>{
  const deletePromises = publicIds.map((publicId)=>{
    return new Promise((resolve,reject)=>{
      cloudinary.api.delete_resources(publicId,(error,result)=>{
        if(error instanceof Error) reject(error)
        if(result) resolve(result)
      })
    })
  })

  const deletedAssets = await Promise.all(deletePromises)
  return deleteAssets
}

module.exports = { uploadImage,deleteAssets };
