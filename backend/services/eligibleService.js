const User = require("../models/userModel");
const Eligible = require("../models/eligibleModel");
const { uploadImage, deleteAssets } = require("../utils/cloundinaryUtil");
const { createLog } = require("./activityLogsService");

exports.create = async (request) => {
  const { userId } = request.params;
  if (!request.body) throw new Error("empty request body");
  console.log(request.body);
  console.log(request.files);
  const { idFront, idBack, userPhoto } = request.files;
  if (!idFront) throw new Error("front id image is required");
  if (!idBack) throw new Error("back id image is required");
  if (!userPhoto) throw new Error("user photo id image is required");

  let path = `EligibleIds/${userId}`;
  let uploadedIdFront = await uploadImage(idFront, path);
  let uploadedIdBack = await uploadImage(idBack, path);
  let uploadedUserPhoto = await uploadImage(userPhoto, path);

  console.log(uploadedIdFront, uploadedIdBack, uploadedUserPhoto);

  request.body.idImage = {
    front: uploadedIdFront,
    back: uploadedIdBack,
  };
  request.body.userPhoto = uploadedUserPhoto;

  const created = await Eligible.create(request.body);

  return request.body;
};

exports.getAll = async (request) => {
  const data = await Eligible.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $project: {
        "user.__v": 0,
        __v: 0,
        "user.createdAt": 0,
        "user.updatedAt": 0,
        "user._id": 0,
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ["$$ROOT", "$user"],
        },
      },
    },
    {
      $unset: "user",
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);
  return data;
};

exports.updateVerification = async (request) => {
  const { memberId } = request.params;
  if (!request.body) throw new Error("undefined body");
  request.body.verifiedAt =new Date()
  const isUpdate = await Eligible.findByIdAndUpdate(memberId, request.body, {
    new: true,
  });
  return isUpdate;
};
