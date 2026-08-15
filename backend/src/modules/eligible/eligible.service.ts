import type { EligibleFiles, IEligibleCreate } from "./eligible.types.js";
import * as EligibleRepository from "./eligible.respository.js";

export const create = async (
  userId: string,
  payload: Omit<IEligibleCreate, "idImage" | "userPhoto">,
  files: EligibleFiles,
) => {
  const { idFront, idBack, userPhoto } = files;

  // Validate files existence
  if (!idFront || idFront.length === 0)
    throw new Error("Front ID image is required");
  if (!idBack || idBack.length === 0)
    throw new Error("Back ID image is required");
  if (!userPhoto || userPhoto.length === 0)
    throw new Error("User photo is required");

  let path = `EligibleIds/${userId}`;

  //Note: All the rest of the statements will only be available once the object storate is enabled

  //TODO:Upload Image utility is still not migrated
  //    const [uploadedIdFront, uploadedIdBack, uploadedUserPhoto] = await Promise.all([
  //       uploadImage(idFront, path),
  //       uploadImage(idBack, path),
  //       uploadImage(userPhoto, path)
  //     ]);

  // TODO: Construct the payload (will only be available once the the utility for object storage is enabled)
  //     const eligibilityData = {
  //       ...request.body,
  //       user: userId,
  //       idImage: {
  //         front: uploadedIdFront,
  //         back: uploadedIdBack,
  //       },
  //       userPhoto: uploadedUserPhoto,

  //   const eligibleUser = await EligibleRepository.createEligible(payload);

  // return eligibleUser
};
