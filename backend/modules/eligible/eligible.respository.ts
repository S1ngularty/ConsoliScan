import type { EligibleDocument } from "./eligible.model.js";
import { Eligible } from "./eligible.model.js";
import type { IEligible } from "./eligible.types.js";

export const createEligible = async (
  data: IEligible,
): Promise<EligibleDocument> => {
  const result = await Eligible.create(data);

  return result;
};
