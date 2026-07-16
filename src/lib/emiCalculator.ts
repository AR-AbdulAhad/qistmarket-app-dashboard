// Ports the exact tiered profit/advance table used by order creation
// (src/components/CreateOrder/CreateOrder.tsx calculateInstallments) so the
// standalone EMI Calculator produces numbers consistent with real orders,
// instead of inventing a new formula.

export interface EmiPlan {
  months: number;
  profit: number;
  advance: number;
  advanceAmount: number;
  monthlyAmount: number;
  totalPrice: number;
}

const roundUp = (val: number) => Math.ceil(val / 50) * 50;

export function calculateInstallmentPlans(category: string, price: number): EmiPlan[] {
  const cat = (category || "").toLowerCase().trim();
  let plans: { months: number; profit: number; advance: number }[] = [];

  if (cat === "mobiles" && price <= 60000) {
    plans = [
      { months: 3, profit: 0.2, advance: 0.35 },
      { months: 6, profit: 0.35, advance: 0.25 },
      { months: 9, profit: 0.45, advance: 0.2 },
      { months: 11, profit: 0.52, advance: 0.18 },
      { months: 12, profit: 0.55, advance: 0.15 },
    ];
  } else if (price > 50000 && price <= 100000) {
    plans = [
      { months: 3, profit: 0.2, advance: 0.4 },
      { months: 6, profit: 0.35, advance: 0.35 },
      { months: 9, profit: 0.45, advance: 0.3 },
      { months: 11, profit: 0.52, advance: 0.28 },
      { months: 12, profit: 0.55, advance: 0.25 },
      { months: 24, profit: 0.85, advance: 0.25 },
    ];
  } else if (price > 100000) {
    plans = [
      { months: 3, profit: 0.2, advance: 0.4 },
      { months: 6, profit: 0.35, advance: 0.35 },
      { months: 9, profit: 0.45, advance: 0.3 },
      { months: 11, profit: 0.52, advance: 0.28 },
      { months: 12, profit: 0.55, advance: 0.25 },
      { months: 18, profit: 0.7, advance: 0.25 },
      { months: 24, profit: 0.85, advance: 0.25 },
    ];
  } else {
    plans = [
      { months: 3, profit: 0.22, advance: 0.4 },
      { months: 6, profit: 0.38, advance: 0.35 },
      { months: 9, profit: 0.48, advance: 0.3 },
      { months: 11, profit: 0.55, advance: 0.28 },
      { months: 12, profit: 0.6, advance: 0.25 },
      { months: 18, profit: 0.75, advance: 0.25 },
      { months: 24, profit: 0.9, advance: 0.25 },
    ];
  }

  return plans.map((p) => {
    const adv = roundUp(price * p.advance);
    const rem = price - adv;
    const profit = roundUp(rem * p.profit);
    const total = rem + profit;
    const monthly = roundUp(total / p.months);
    const fullTotal = adv + monthly * p.months;
    return { ...p, advanceAmount: adv, monthlyAmount: monthly, totalPrice: fullTotal };
  });
}

export const EMI_CATEGORIES = ["Mobiles", "Electronics", "Appliances", "Other"];
