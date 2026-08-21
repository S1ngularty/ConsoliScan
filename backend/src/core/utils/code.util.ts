import * as crypto from "crypto";

export const generate_CheckoutCode = (): string => {
  const checkoutCode = `CHK-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  return checkoutCode;
};
