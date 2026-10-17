import { describe, expect, it } from "vitest";
import { calculateCosts, defaultFees, type CostInput } from "./listing-costs";

const input: CostInput = { salePrice: 40, shippingCharged: 5, productCost: 12, shippingCost: 6, packagingCost: 1, buyerTax: 4, otherCosts: 0, advertisingPercent: 0 };

describe("marketplace profit estimates", () => {
  it("uses US Etsy listing, transaction and processing defaults", () => {
    expect(defaultFees("etsy", 49)).toEqual({ listing: 0.2, transactionPercent: 6.5, processingPercent: 3, orderFee: 0.25 });
    const result = calculateCosts("etsy", input, defaultFees("etsy", 49));
    expect(result.transactionFee).toBe(2.93);
    expect(result.processingFee).toBe(1.72);
    expect(result.totalFees).toBe(4.85);
    expect(result.profit).toBe(21.15);
    expect(result.margin).toBeCloseTo(47);
  });
  it("includes buyer tax in eBay fees but not seller revenue", () => {
    const result = calculateCosts("ebay", input, defaultFees("ebay", 49));
    expect(result.revenue).toBe(45);
    expect(result.transactionFee).toBe(6.66);
    expect(result.totalFees).toBe(7.06);
    expect(result.profit).toBe(18.94);
  });
  it("uses the eBay per-order threshold including shipping and tax", () => {
    expect(defaultFees("ebay", 10).orderFee).toBe(0.3);
    expect(defaultFees("ebay", 10.01).orderFee).toBe(0.4);
  });
  it("deducts custom fees, advertising, packaging and other costs", () => {
    const result = calculateCosts("etsy", { ...input, advertisingPercent: 10, otherCosts: 2 }, { listing: 1, transactionPercent: 10, processingPercent: 0, orderFee: 0 });
    expect(result.totalFees).toBe(10);
    expect(result.profit).toBe(14);
    expect(result.shippingBalance).toBe(-2);
  });
  it("returns no margin for zero revenue and preserves a loss", () => {
    const result = calculateCosts("etsy", { ...input, salePrice: 0, shippingCharged: 0, buyerTax: 0 }, defaultFees("etsy", 0));
    expect(result.margin).toBeNull();
    expect(result.profit).toBe(-19.45);
  });
});