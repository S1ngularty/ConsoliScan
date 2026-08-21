import { generate_CheckoutCode } from "../../core/utils/code.util.js";
import type {
  IQueueCreate,
  IQueueCreateResponse,
  QueueOrderResponse,
} from "./queue.dto.js";
import { Queue } from "./queue.model.js";
import * as QueueRepository from "./queue.repository.js";
import type { IQueue } from "./queue.types.js";

export const checkout = async (
  payload: IQueueCreate,
  userId: string,
): Promise<IQueueCreateResponse> => {
  const code = generate_CheckoutCode();

  payload.userType = !userId ? "user" : "guest";
  payload.checkoutCode = code;

  const queueOrder = QueueRepository.createQueue(payload, userId);

  return { checkoutCode: code };
};

exports.getOrder = async (
  checkoutCode: string,
  user: { userId: string; name: string },
): Promise<QueueOrderResponse | null> => {
  const queuedOrder = await QueueRepository.getQueueOrder(
    checkoutCode,
    user.userId,
    user.name,
  );

  return queuedOrder;
};
