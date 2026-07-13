export enum ValueForMoney {
  POPULAR = "Народный хит",
  OPTIMUM = "Оптимум",
  OVERPRICED = "Переоценен"
}

export interface PriceHistoryPoint {
  date: string;
  price: number;
  currency: string;
  source: "onliner_prices_history" | "runtime_snapshot" | "demo";
}

export interface ReviewInsight {
  label: string;
  count: number;
  examples: string[];
}

export interface ReviewEvidence {
  source: "onliner_reviews_api" | "demo" | "fallback";
  endpoint?: string;
  htmlUrl?: string;
  processedCount: number;
  totalCount: number;
  pagesProcessed: number;
  pagesAvailable: number;
  maxPages?: number;
  averageFetchedRating?: number;
  latestReviewAt?: string;
  topPros: ReviewInsight[];
  topCons: ReviewInsight[];
  warnings?: string[];
}

export interface Product {
  id: string;
  dataSource?: "demo" | "onliner_live" | "ai_generated" | "fallback";
  title: string;
  category: string;
  url: string;
  rating: number;
  ratingCount: number;
  currentPrice: number;
  originalPrice: number;    // Announced "before discount" price
  medianPrice90Days: number; // Historical median reference used by the UI copy
  advertisedDiscountPercent?: number;
  isFakeDiscount: boolean;
  honestDiscountPercent: number; // calculated relative to the historical median reference
  priceManipulationWarning?: string;
  valueForMoney: ValueForMoney;
  pros: string[];
  cons: string[];
  specs: { [key: string]: string };
  imageUrl: string;
  reviewsText: string[];
  offersCount?: number;
  lastCheckedAt?: string;
  sourceUrls?: string[];
  priceHistory?: PriceHistoryPoint[];
  reviewEvidence?: ReviewEvidence;
  priceEvidence?: {
    source: "demo" | "onliner_live" | "ai_generated" | "fallback";
    currentPriceSource: string;
    medianPriceSource: string;
    medianWindowLabel: string;
    capturedAt: string;
    offersCount?: number;
    historySource?: string;
    historyPointsCount?: number;
    historyWindowDays?: number;
    historyPeriod?: string;
    warnings?: string[];
  };
}

export interface MessageAction {
  label: string;
  action: string;
  payload?: any;
}

export interface Message {
  id: string;
  sender: "user" | "bot" | "system";
  text: string;
  timestamp: string;
  type?: "text" | "product_card" | "price_history" | "rating_summary" | "comparison" | "pulse_tracker";
  productId?: string;
  actions?: MessageAction[];
  metaData?: any; // any extra data for visual rendering
}

export interface ChannelPost {
  id: string;
  productId: string;
  title: string;
  category: string;
  advertisedDiscount: number;
  realDiscount: number;
  honestyScore: number; // 0-100
  honestyVerdict: string; // e.g. "Фейковая скидка!", "Скидка перед накруткой", "Реальная выгода!"
  currentPrice: number;
  regularPrice: number;
  pros: string;
  cons: string;
  buyerAdvocateVerdict: string;
  timestamp: string;
  views: number;
  shares: number;
  commentsCount: number;
  deliveryStatus?: "not_configured" | "dry_run" | "sent" | "failed";
  deliveryDetails?: string;
}
