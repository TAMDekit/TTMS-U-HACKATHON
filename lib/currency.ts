export type AppLanguage = "en" | "th";

const USD_TO_THB_RATE = 35;

export function formatPriceFromCents(priceCents: number, language: AppLanguage): string {
  const isThai = language === "th";
  const amount = (priceCents / 100) * (isThai ? USD_TO_THB_RATE : 1);

  return new Intl.NumberFormat(isThai ? "th-TH" : "en-US", {
    style: "currency",
    currency: isThai ? "THB" : "USD",
    maximumFractionDigits: isThai ? 0 : 2,
    minimumFractionDigits: isThai ? 0 : 2,
  }).format(amount);
}

export function formatPriceFromThb(priceThb: number, language: AppLanguage): string {
  const isThai = language === "th";
  const amount = isThai ? priceThb : priceThb / USD_TO_THB_RATE;

  return new Intl.NumberFormat(isThai ? "th-TH" : "en-US", {
    style: "currency",
    currency: isThai ? "THB" : "USD",
    maximumFractionDigits: isThai ? 0 : 2,
    minimumFractionDigits: isThai ? 0 : 2,
  }).format(amount);
}
