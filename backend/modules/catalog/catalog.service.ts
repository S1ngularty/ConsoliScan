import * as CategoryRepository from "./catalog.repository.js";

export const getVersion = async (): Promise<number> => {
  const version = await CategoryRepository.getCatalogVersion();

  return version;
};

export const bumpVersion = async (): Promise<number> => {
  const version = await CategoryRepository.bumpCatalog();

  return version;
};
