const User = require("../models/userModel");
const Eligible = require("../models/eligibleModel");
const { uploadImage, deleteAssets } = require("../utils/cloundinaryUtil");
const { createLog } = require("./activityLogsService");

exports.create = async (request) => {
  try {
    const { userId } = request.params;
    console.log("Processing eligibility for userId:", userId);

    if (!request.body) throw new Error("Empty request body");
    if (!request.files) throw new Error("No files uploaded");

    const { idFront, idBack, userPhoto } = request.files;
    
    // Validate files existence
    if (!idFront || idFront.length === 0) throw new Error("Front ID image is required");
    if (!idBack || idBack.length === 0) throw new Error("Back ID image is required");
    if (!userPhoto || userPhoto.length === 0) throw new Error("User photo is required");

    let path = `EligibleIds/${userId}`;
    
    // Upload images
    const [uploadedIdFront, uploadedIdBack, uploadedUserPhoto] = await Promise.all([
      uploadImage(idFront, path),
      uploadImage(idBack, path),
      uploadImage(userPhoto, path)
    ]);

    // Construct the payload
    const eligibilityData = {
      ...request.body,
      user: userId,
      idImage: {
        front: uploadedIdFront,
        back: uploadedIdBack,
      },
      userPhoto: uploadedUserPhoto,
    };

    // Create record
    const created = await Eligible.create(eligibilityData);
    return created;
  } catch (error) {
    console.error("Eligibility Creation Error:", error);
    throw error;
  }
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
