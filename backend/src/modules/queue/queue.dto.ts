import type { IQueue } from "./queue.types.js";

export interface IQueueCreate extends IQueue {}
export interface IQueueCreateResponse extends Pick<IQueue, "checkoutCode"> {}

export interface IGetQueueOrder extends Pick<IQueue, "checkoutCode"> {}
export interface QueueOrderResponse extends IQueue {}
