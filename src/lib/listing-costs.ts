import type { Platform } from "./listing-pipeline";

export interface FeeRates {
  listing: number;
  transactionPercent: number;
  processingPercent: number;
  orderFee: number;
}

export interface CostInput {
  salePrice: number;
  shippingCharged: number;
  productCost: number;
  shippingCost: number;
  packagingCost: number;
  buyerTax: number;
  otherCosts: number;
  advertisingPercent: number;
}

// Single-item order estimates; flat fees are rupee equivalents of the US dollar
// rates (~₹90 per US$) so estimates read in INR. Sellers can override every rate.
export function defaultFees(platform: Platform, orderTotal: number): FeeRates {
  return platform === "etsy"
    ? { listing: 18, transactionPercent: 6.5, processingPercent: 3, orderFee: 22 }
    : { listing: 0, transactionPercent: 13.6, processingPercent: 0, orderFee: orderTotal <= 900 ? 27 : 36 };
}

const amount = (value: number) => Number.isFinite(value) ? Math.max(0, value) : 0;
const cents = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function calculateCosts(platform: Platform, input: CostInput, fees: FeeRates) {
  const revenue = cents(amount(input.salePrice) + amount(input.shippingCharged));
  const taxableTotal = revenue + amount(input.buyerTax);
  const listingFee = cents(amount(fees.listing));
  const transactionFee = cents((platform === "ebay" ? taxableTotal : revenue) * amount(fees.transactionPercent) / 100);
  const processingFee = cents(taxableTotal * amount(fees.processingPercent) / 100 + amount(fees.orderFee));
  const advertisingFee = cents(revenue * amount(input.advertisingPercent) / 100);
  const totalFees = cents(listingFee + transactionFee + processingFee + advertisingFee);
  const fulfillment = cents(amount(input.productCost) + amount(input.shippingCost) + amount(input.packagingCost) + amount(input.otherCosts));
  const profit = cents(revenue - totalFees - fulfillment);
  return { revenue, listingFee, transactionFee, processingFee, advertisingFee, totalFees, fulfillment,
    profit, margin: revenue > 0 ? profit / revenue * 100 : null,
    shippingBalance: cents(amount(input.shippingCharged) - amount(input.shippingCost) - amount(input.packagingCost)) };
}