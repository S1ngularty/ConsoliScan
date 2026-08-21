import type { IQueueCreate } from "./queue.dto.js";
import { Queue } from "./queue.model.js";
import type { QueueDocument } from "./queue.model.js";

export const createQueue = async (
  payload: IQueueCreate,
  userId: string,
): Promise<QueueDocument> => {
  const result = await Queue.findOneAndUpdate(
    { userId: userId, status: { $eq: "PENDING" } },
    payload,
    {
      new: true,
      upsert: true,
    },
  );

  return result;
};
