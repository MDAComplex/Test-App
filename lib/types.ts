// Client-safe product shape served by the feed/admin APIs.
// `affiliateUrl` is intentionally NOT exposed here: the client only ever
// needs the productId to build a `/go/[productId]` link, and the redirect
// route resolves the real affiliate URL server-side. This keeps the
// affiliate link out of page source / devtools network responses.
export type ProductDTO = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  videoUrl: string | null;
  posterUrl: string | null;
  mediaType: "image" | "video";
  mediaFit: "cover" | "hybrid" | "contain" | "auto";
  shopName: string;
  tags: string[];
  viralScore: number;
  isActive: boolean;
  isWishlisted: boolean;
  // Cosmetic "social proof" (star rating + review count), deterministically
  // derived from viralScore/id. There is no real review/comment system in
  // this MVP (out of scope), this just gives the feed the TikTok-shop look.
  rating: number;
  ratingCount: number;
  // Real social-proof counts derived from logged events/comments.
  likeCount: number;
  viewCount: number;
  commentCount: number;
  deliveryTime: string | null;
};

// Client-safe shape for a single shop offer on the product detail page.
// `affiliateUrl` is intentionally NOT included: the client only needs the
// offer id to build a `/go/[productId]?offerId=` link (same reasoning as
// ProductDTO above).
export type OfferDTO = {
  id: string;
  shopName: string;
  price: number;
  deliveryText: string | null;
  isPrimary: boolean;
};

export type EventType =
  | "product_view"
  | "product_visible_2s"
  | "product_visible_5s"
  | "product_like"
  | "product_unlike"
  | "product_wishlist_add"
  | "product_wishlist_remove"
  | "product_affiliate_click"
  | "product_share"
  | "product_scroll_next"
  | "product_scroll_previous";
