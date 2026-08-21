import type { Document, Mixed, ObjectId } from "mongoose";
import type { ICategory } from "../category/category.types.js";
import type { Units } from "../product/product.types.js";

export type UserType = "user" | "guest";

type VerificationType = "regular" | "senior" | "pwd" | null;

type VerificationSource = "app" | "system" | "manual" | null;

type PromoType = "percentage" | "fixed";

type PromoScope = "cart" | "category" | "product";

type QueueStatusTypes =
  | "PENDING"
  | "SCANNED"
  | "LOCKED"
  | "PAID"
  | "CANCELLED"
  | "EXPIRED";

type PaymentMethod = "cash" | "card" | "mobile";

export interface ICashier {
  cashierId: ObjectId | null;
  name: string | null;
}

export interface IVerifiedBy {
  cashierId: ObjectId;
  name: string;
}

export interface IItemCategory extends Required<Pick<ICategory, "isBNPC">> {
  id: ObjectId;
  name: string;
}

export interface ICustomerVerification {
  type: VerificationType;
  verified: boolean;
  verifiedBy: IVerifiedBy;
  verificationSource: VerificationSource;
  verificationDate: Date;
}

export interface IItemSnapShot {
  product: ObjectId;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  salePrice: number;
  saleActive: boolean;
  isBNPCEligible: boolean;
  isBNPCProduct: boolean;
  excludedFromDiscount: boolean;
  category: IItemCategory;
  unit: Units;
  itemTotal: number;
}

export interface IBNPCProducts extends Omit<
  IItemSnapShot,
  | "category"
  | "excludedFromDiscount"
  | "isBNPCProduct"
  | "product"
  | "unitPrice"
> {
  productId: ObjectId;
  price: number;
  requiresVerification: boolean;
  category: ObjectId;
  categoryName: string;
}

export interface ITotal {
  subtotal: number;
  afterOtherDiscounts: number;
  bnpcEligibleSubtotal: number;
  bnpcDiscount: number;
  promoDiscount: number;
  loyaltyDiscount: number;
  discountTotal: number;
  finalTotal: number;
}

export interface IDiscountBreakdown extends Pick<
  ITotal,
  "bnpcDiscount" | "promoDiscount" | "loyaltyDiscount"
> {
  totalDiscount: number;
}

export interface IDiscountSnapShot {
  eligible: boolean;
  eligibleItemsCount: number;
  bnpcEligibleSubtotal: number;
  cappedBNPCAmount: number;
  discountApplied: number;
  remainingPurchaseCap: number;
  remainingDiscountCap: number;
  weeklyPurchaseUsed: number;
  weeklyDiscountUsed: number;
  weekStart: Date;
  weekEnd: Date;
  reason: string | null;
}

export interface IWeeklyUsageSnapshot {
  bnpcAmountUsed: number;
  discountUsed: number;
  weekStart: Date;
  weekEnd: Date;
  remainingPurchaseCap: number;
  remainingDiscountCap: number;
  purchaseCap: number;
  discountCap: number;
}

export interface ICurrentUsage {
  purchasedUsed: number;
  discountUsed: number;
  weekStart: Date;
  weekEnd: Date;
}

export interface IUserEligibility {
  isPWD: boolean;
  isSenior: boolean;
  verified: boolean;
  verificationIdType: string;
  weeklyCaps: Pick<IWeeklyUsageSnapshot, "purchaseCap" | "discountCap">;
  currentUsage: ICurrentUsage;
}

export interface IQueuePromo {
  promoId: ObjectId;
  code: string;
  name: string;
  type: PromoType;
  value: number;
  scope: PromoScope;
  targetIds: ObjectId[];
  minPurchase: number;
  discountAmount: number;
  serverValidated: boolean;
  appliedPromoData: Mixed;
}

export interface ILoyaltyPointsConfig {
  pointsToCurrencyRate: number;
  maxRedeemPercent: number;
  earnRate: number;
}

export interface ILoyaltyPoints {
  pointsUsed: number;
  pointsValue: number; // ₱ per point
  discountAmount: number;
  maxAllowedDiscount: number;
  maxRedeemPercent: number;
  percentageUsed: string;
  config: ILoyaltyPointsConfig;
}

export interface ICartSnapshot {
  itemCount: number;
  totalValue: number;
  items: Pick<IItemSnapShot, "name" | "quantity"> &
    {
      productId: string | ObjectId;
    }[];
}

export interface IQueuePayment {
  cashReceived: number;
  changeDue: number;
  paymentMethod: PaymentMethod;
  bookletUsed: number;
  transactionId: string;
}

export interface IQueue {
  checkoutCode: string;
  user: ObjectId | null;
  userType: UserType;
  userEmail?: string | null;
  userName?: string | null;
  cashier: ICashier;
  customerVerification: ICustomerVerification;
  items: IItemSnapShot[];
  bnpcProducts: IBNPCProducts[];
  hasBNPCItems: boolean;
  totals: ITotal;
  discountBreakdown: IDiscountBreakdown;
  discountSnapShot: IDiscountSnapShot;
  weeklyUsageSnapshot: IWeeklyUsageSnapshot;
  userEligibility: IUserEligibility;
  promo: IQueuePromo;
  loyaltyPoints: ILoyaltyPoints;
  pointsEarned: number;
  cartSnapshot: ICartSnapshot;
  status: QueueStatusTypes;
  scannedAt: Date;
  lockedAt: Date;
  paidAt: Date;
  payment: IQueuePayment;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IQueueVirtuals {
  totalItems: number;
}

export interface IDiscountSummary {
  bnpc: number;
  promo: number;
  loyalty: number;
  total: number;
}

export interface IQueueMethods {
  // isExpired(): boolean;
  hasBNPCDiscount(): boolean;
  getDiscountSummary(): IDiscountSummary;
}
