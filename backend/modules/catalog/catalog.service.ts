import type { ICatalog } from "./catalog.types.js";
import * as CategoryRepository from "./catalog.repository.js";

export const getVersion = async (): Promise<Number> => {
  const version = await CategoryRepository.getCatalogVersion();

  return version;
};

export const bumpVersion = async (): Promise<Number> => {
  const version = await CategoryRepository.bumpCatalog();

  return version;
};
