import { describe, expect, it } from "vitest";
import { calculateCosts, defaultFees, type CostInput } from "./listing-costs";

// Rupee-scale sample order: ₹800 sale plus ₹100 shipping.
const input: CostInput = { salePrice: 800, shippingCharged: 100, productCost: 300, shippingCost: 150, packagingCost: 40, buyerTax: 90, otherCosts: 0, advertisingPercent: 0 };

describe("marketplace profit estimates", () => {
  it("uses Etsy rupee flat-fee, transaction and processing defaults", () => {
    expect(defaultFees("etsy", 990)).toEqual({ listing: 18, transactionPercent: 6.5, processingPercent: 3, orderFee: 22 });
    const result = calculateCosts("etsy", input, defaultFees("etsy", 990));
    expect(result.revenue).toBe(900);
    expect(result.transactionFee).toBe(58.5);
    expect(result.processingFee).toBe(51.7);
    expect(result.totalFees).toBe(128.2);
    expect(result.profit).toBe(281.8);
    expect(result.margin).toBeCloseTo(31.31);
  });
  it("includes buyer tax in eBay fees but not seller revenue", () => {
    const result = calculateCosts("ebay", input, defaultFees("ebay", 990));
    expect(result.revenue).toBe(900);
    expect(result.transactionFee).toBe(134.64);
    expect(result.totalFees).toBe(170.64);
    expect(result.profit).toBe(239.36);
  });
  it("uses the eBay per-order threshold including shipping and tax", () => {
    expect(defaultFees("ebay", 900).orderFee).toBe(27);
    expect(defaultFees("ebay", 900.01).orderFee).toBe(36);
  });
  it("deducts custom fees, advertising, packaging and other costs", () => {
    const result = calculateCosts("etsy", { ...input, advertisingPercent: 10, otherCosts: 200 }, { listing: 100, transactionPercent: 10, processingPercent: 0, orderFee: 0 });
    expect(result.totalFees).toBe(280);
    expect(result.profit).toBe(-70);
    expect(result.shippingBalance).toBe(-90);
  });
  it("returns no margin for zero revenue and preserves a loss", () => {
    const result = calculateCosts("etsy", { ...input, salePrice: 0, shippingCharged: 0, buyerTax: 0 }, defaultFees("etsy", 0));
    expect(result.margin).toBeNull();
    expect(result.profit).toBe(-530);
  });
});
