import type { EligibleDocument } from "./eligible.model.js";
import { Eligible } from "./eligible.model.js";
import type { IEligible, IEligiblePopulated } from "./eligible.types.js";

export const createEligible = async (
  data: IEligible,
): Promise<EligibleDocument> => {
  const result = await Eligible.create(data);

  return result;
};

export const getEligibles = async (): Promise<IEligiblePopulated[]> => {
  const result = await Eligible.aggregate([
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

  return result;
};
