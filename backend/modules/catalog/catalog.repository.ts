import { Catalog, type CatalogDocument } from "./catalog.model.js";
import type { ICatalog } from "./catalog.types.js";

export const bumpCatalog = async (): Promise<number> => {
  const updated = await Catalog.findOneAndUpdate(
    {},
    {
      $inc: { version: 1 },
    },
    {
      new: true,
      upsert: true,
    },
  );

  return updated.version;
};

export const getCatalogVersion = async (): Promise<number> => {
  const current = await Catalog.findOne({});
  if (current) return current.version;

  const created = await Catalog.create({ version: 1 });
  return created.version;
};


