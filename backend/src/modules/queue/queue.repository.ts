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

export const getQueueOrder = async (
  checkoutCode: string,
  userId: string,
  name: string,
): Promise<QueueDocument | null> => {
  const result = await Queue.findOneAndUpdate(
    { checkoutCode },
    {
      cashier: {
        cashierId: userId,
        name,
      },
      status: "SCANNED",
      scannedAt: Date.now(),
    },
    { new: true },
  ).populate({
    path: "items.product",
    select: "barcode barcodeType category",
  });

  return result;
};
