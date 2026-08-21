import { generate_CheckoutCode } from "../../core/utils/code.util.js";
import type { IQueueCreate, IQueueCreateResponse } from "./queue.dto.js";
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
