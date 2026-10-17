import { useId, useState } from "react";
import { Calculator, RotateCcw, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateCosts, defaultFees, type CostInput, type FeeRates } from "@/lib/listing-costs";
import type { Platform } from "@/lib/listing-pipeline";

const INITIAL: CostInput = { salePrice: 0, shippingCharged: 0, productCost: 0, shippingCost: 0, packagingCost: 0, buyerTax: 0, otherCosts: 0, advertisingPercent: 0 };
const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

function AmountField({ label, value, onChange, percent = false }: { label: string; value: number; onChange: (value: number) => void; percent?: boolean }) {
  const id = useId();
  return <div className="min-w-0">
    <label htmlFor={id} className="text-xs text-muted-foreground">{label} {percent ? "(%)" : "(USD)"}</label>
    <Input id={id} type="number" min="0" step="0.01" max={percent ? 100 : undefined} value={value || ""} placeholder="0.00"
      onChange={(event) => onChange(Math.max(0, Math.min(percent ? 100 : Infinity, Number(event.target.value) || 0)))} className="mt-1 bg-background" />
  </div>;
}

export function ListingCostCalculator({ platform }: { platform: Platform }) {
  const [input, setInput] = useState<CostInput>(INITIAL);
  const [overrides, setOverrides] = useState<Partial<FeeRates>>({});
  const base = defaultFees(platform, input.salePrice + input.shippingCharged + input.buyerTax);
  const fees = { ...base, ...overrides };
  const costs = calculateCosts(platform, input, fees);
  const name = platform === "etsy" ? "Etsy" : "eBay";
  const update = (key: keyof CostInput, value: number) => setInput((previous) => ({ ...previous, [key]: value }));

  return <section aria-label={`${name} cost calculator`} className="rounded-lg border bg-paper p-5">
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-xl font-semibold"><Calculator className="size-5 text-primary" /> Profit estimate</h2>
      <span className="stamp text-muted-foreground">{name} · USD</span>
    </div>
    <div className="mt-5 grid grid-cols-2 gap-3">
      <AmountField label="Sale price" value={input.salePrice} onChange={(v) => update("salePrice", v)} />
      <AmountField label="Product cost" value={input.productCost} onChange={(v) => update("productCost", v)} />
      <AmountField label="Shipping charged to buyer" value={input.shippingCharged} onChange={(v) => update("shippingCharged", v)} />
      <AmountField label="Shipping label cost" value={input.shippingCost} onChange={(v) => update("shippingCost", v)} />
      <AmountField label="Packaging cost" value={input.packagingCost} onChange={(v) => update("packagingCost", v)} />
      <AmountField label="Other costs" value={input.otherCosts} onChange={(v) => update("otherCosts", v)} />
    </div>
    <details className="mt-4 border-y py-3">
      <summary className="cursor-pointer text-sm font-medium">Fee assumptions & extras</summary>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        US baseline, one item per order. {platform === "etsy" ? "Etsy Payments: 6.5% transaction + 3% processing + $0.25, with a $0.20 listing fee." : "Non-Store, most categories: 13.6% final value fee + $0.30 for orders up to $10, otherwise $0.40. Insertion fee defaults to $0 within the free allowance."}
        {" "}Rates vary by country, category and account. Adjust to your seller agreement.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <AmountField label="Listing / insertion fee" value={fees.listing} onChange={(v) => setOverrides((p) => ({ ...p, listing: v }))} />
        <AmountField label={platform === "etsy" ? "Transaction fee" : "Final value fee"} percent value={fees.transactionPercent} onChange={(v) => setOverrides((p) => ({ ...p, transactionPercent: v }))} />
        <AmountField label="Payment processing" percent value={fees.processingPercent} onChange={(v) => setOverrides((p) => ({ ...p, processingPercent: v }))} />
        <AmountField label="Fixed order fee" value={fees.orderFee} onChange={(v) => setOverrides((p) => ({ ...p, orderFee: v }))} />
        <AmountField label="Buyer tax collected" value={input.buyerTax} onChange={(v) => update("buyerTax", v)} />
        <AmountField label="Advertising fee" percent value={input.advertisingPercent} onChange={(v) => update("advertisingPercent", v)} />
      </div>
      <Button variant="ghost" size="sm" className="mt-3" onClick={() => setOverrides({})}><RotateCcw /> Reset fee rates</Button>
      <div className="mt-2 flex gap-4 text-xs text-primary">
        <a className="underline" href={platform === "etsy" ? "https://www.etsy.com/legal/fees/" : "https://www.ebay.com/help/selling/fees-credits-invoices/selling-fees?id=4822"} target="_blank" rel="noreferrer">{name} fee policy</a>
        {platform === "etsy" && <a className="underline" href="https://help.etsy.com/hc/en-us/articles/115015628847-What-are-Payment-Processing-Fees-for-Selling-on-Etsy" target="_blank" rel="noreferrer">Payment rates</a>}
      </div>
    </details>
    <dl className="mt-4 space-y-2 text-sm">
      {[
        ["Revenue incl. shipping", costs.revenue],
        ["Listing / insertion fee", costs.listingFee],
        [platform === "etsy" ? "Transaction fee" : "Final value fee", costs.transactionFee],
        ["Processing + fixed order fee", costs.processingFee],
        ["Advertising fee", costs.advertisingFee],
        ["Total marketplace fees", costs.totalFees],
        ["Product, shipping & other costs", costs.fulfillment],
      ].map(([label, value]) => <div key={label} className="flex justify-between gap-3"><dt className="text-muted-foreground">{label}</dt><dd className="shrink-0 font-mono tabular-nums">{money(Number(value))}</dd></div>)}
    </dl>
    <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4" aria-live="polite">
      <div><p className="stamp text-muted-foreground">Net profit</p><p data-testid="net-profit" className={`mt-1 font-mono text-2xl tabular-nums ${costs.profit < 0 ? "text-destructive" : "text-moss"}`}>{money(costs.profit)}</p></div>
      <div><p className="stamp text-muted-foreground">Profit margin</p><p data-testid="profit-margin" className="mt-1 font-mono text-2xl tabular-nums">{costs.margin === null ? "—" : `${costs.margin.toFixed(1)}%`}</p></div>
    </div>
    <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Truck className="size-4 shrink-0" /> Shipping balance before fees: {money(costs.shippingBalance)}</p>
    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Estimate only, not a carrier quote. Margin uses price plus shipping; buyer tax is not revenue. Shipping is included in percentage fees; tax is included in {platform === "etsy" ? "processing fees" : "final value fees"}. Excludes tax on seller fees, subscriptions, currency conversion and regulatory charges. Advertising uses revenue before buyer tax.</p>
  </section>;
}