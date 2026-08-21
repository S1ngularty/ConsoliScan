import cloudinary from "../configs/cloudinary.js";

type FileType = Express.Multer.File[];
type Path = string;

interface IUploadedImageFields {
  public_id: string;
  url: string;
}

type IDeleteAsset = string[];

interface IDeleteResourcesResponse {
  deleted: Record<string, string>;
  deleted_counts?: Record<
    string,
    {
      original: number;
      derived: number;
    }
  >;
}

export const uploadImage = async (
  images: FileType,
  path: Path,
): Promise<IUploadedImageFields[]> => {
  const imagePromises = images.map((image) => {
    return new Promise<IUploadedImageFields>((resolve, reject) => {
      const stream = cloudinary.v2.uploader.upload_stream(
        {
          folder: `ConsoliScan/${path}/`,
        },
        (err, result) => {
          if (err instanceof Error) return reject(err);

          if (!result?.public_id || !result?.url) {
            return reject(
              new Error("Cloudinary upload returned an invalid result"),
            );
          }
          resolve({ public_id: result?.public_id, url: result?.url });
        },
      );
      stream.end(image.buffer);
    });
  });

  const uploadedImages: IUploadedImageFields[] =
    await Promise.all(imagePromises);
  //   const result = uploadImage.length > 1 ? uploadedImages : uploadedImages[0];

  return uploadedImages; // this return an Array of files uploaded
};

export const deleteAssets = async (publicIds: IDeleteAsset) => {
  if (!Array.isArray(publicIds) || publicIds.length === 0) {
    throw new Error("publicIds must be array list");
  }

  const result = (await cloudinary.v2.api.delete_resources(
    publicIds,
  )) as IDeleteResourcesResponse;
  
  return result;
};
