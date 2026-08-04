export interface ICategory {
  categoryName: string;
  isBNPC?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export type CategoryListReturn = Required<
  Pick<ICategory, "categoryName" | "isBNPC"> & {
    bnpcCategory?: 1;
    applicableTo?: 1;
    count: number;
  }
>;

export type EditableCategoryFields = Partial<
  Omit<ICategory, "createdAt" | "updatedAt">
>;
