import type {
  EligibleFiles,
  IEligibleCreate,
  IEligibleLean,
  IEligiblePopulated,
  IEligibleUpdate,
} from "./eligible.types.js";
import * as EligibleRepository from "./eligible.respository.js";
import { uploadImage } from "../../core/utils/image.util.js";

export const create = async (
  userId: string,
  payload: Omit<IEligibleCreate, "idImage" | "userPhoto" | "user">,
  files: EligibleFiles,
) /*: Promise<IEligibleLean> */ => {
  const { idFront, idBack, userPhoto } = files;

  // Validate files existence
  if (!idFront || idFront.length === 0)
    throw new Error("Front ID image is required");
  if (!idBack || idBack.length === 0)
    throw new Error("Back ID image is required");
  if (!userPhoto || userPhoto.length === 0)
    throw new Error("User photo is required");

  let path = `EligibleIds/${userId}`;

  // upload the ID images in parallel
  const [uploadedIdFront, uploadedIdBack, uploadedUserPhoto] =
    await Promise.all([
      uploadImage(idFront, path),
      uploadImage(idBack, path),
      uploadImage(userPhoto, path),
    ]);

  if (
    !uploadedIdFront ||
    uploadedIdFront.length <= 0 ||
    typeof uploadedIdFront[0] == "undefined"
  )
    throw new Error("Failed to upload user front ID");

  if (
    !uploadedIdBack ||
    uploadedIdBack.length <= 0 ||
    typeof uploadedIdBack[0] == "undefined"
  )
    throw new Error("Failed to upload user back ID");

  if (
    !uploadedUserPhoto ||
    uploadedUserPhoto.length <= 0 ||
    typeof uploadedUserPhoto[0] == "undefined"
  )
    throw new Error("Failed to upload user photo ID");

  let eligibilityData: IEligibleCreate = {
    ...payload,
    user: userId,
    idImage: {
      front: uploadedIdFront[0],
      back: uploadedIdBack[0],
    },
    userPhoto: uploadedUserPhoto[0],
  };

  const eligibleUser = await EligibleRepository.createEligible(eligibilityData);

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

export const getAll = async (): Promise<IEligiblePopulated[]> => {
  const eligibles = await EligibleRepository.getEligibles();

  return eligibles;
};

export const updateEligibility = async (
  memberId: string,
  payload: IEligibleUpdate,
): Promise<IEligibleLean> => {
  const updatedEligible = await EligibleRepository.updateEligibility(
    memberId,
    payload,
  );

  if (!updatedEligible)
    throw new Error("failed to update the user eligibility");

  return updatedEligible;
};
