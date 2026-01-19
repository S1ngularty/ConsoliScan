const User = require("../models/userModel");
const Beneficiary = require("../models/beneficiaryMemberModel");
const { uploadImage, deleteAssets } = require("../utils/cloundinaryUtil");
const { createLog } = require("../services/activityLogsService");

exports.create = async (request) => {
  const { userId } = request.params;
  if (!request.body) throw new Error("empty request body");
  console.log(request.body);
  console.log(request.files);
  const { idFront, idBack, userPhoto } = request.files;
  if (!idFront) throw new Error("front id image is required");
  if (!idBack) throw new Error("back id image is required");
  if (!userPhoto) throw new Error("user photo id image is required");

  let path = `beneficiaryIds/${userId}`
  let uploadedIdFront = await uploadImage(idFront,path);
  let uploadedIdBack = await uploadImage(idBack,path);
  let uploadedUserPhoto = await uploadImage(userPhoto,path);

  console.log(uploadedIdFront, uploadedIdBack, uploadedUserPhoto);

   request.body.idImage={
    front:uploadedIdFront,
    back:uploadedIdFront,
  }
  request.body.userPhoto= uploadedUserPhoto



    const created = await Beneficiary.create(request.body);

    return request.body
};
