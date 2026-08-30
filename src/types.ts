export type Currency = 'INR' | 'USD' | 'OMR' | 'JPY' | 'LKR' | 'SGD' | 'MYR' | 'IDR';

export interface Product {
  id: string;
  name: string;
  category: 'God Sculptures' | 'Wall Mounts' | 'Square Panels' | 'Grand Sculptures' | 'Temple Doors' | 'Custom Commissions' | 'Baskets & Bottles' | 'Mirrors & Decor';
  priceINR: number;
  priceUSD: number;
  image: string;
  galleryImages: string[];
  description: string;
  shortDescription?: string;
  dimensions: string;
  material: string;
  style: string;
  authenticity: string;
  isNewArrival?: boolean;
  isLimitedEdition?: boolean;
  isBestSeller?: boolean;
  timberOptions: string[];
  weight?: string;
  rating: number;
  reviewCount: number;
  featuredInSpotlight?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedTimber: string;
  customNotes?: string;
  isGift?: boolean;
}

export interface FilterState {
  categories: string[];
  minPrice: number;
  maxPrice: number;
  timberSelection: string[];
  sortBy: 'popularity' | 'price-low' | 'price-high' | 'newest';
  searchQuery: string;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  userLocation: string;
  rating: number;
  comment: string;
  date: string;
  verifiedPurchase: boolean;
  userPhoto?: string;
}

export type ActiveTab = 'home' | 'shop' | 'product-detail' | 'temple-projects' | 'about' | 'wholesale-export' | 'care-guide' | 'checkout' | 'terms' | 'privacy' | 'refund' | 'shipping' | 'contact' | 'account' | 'track';


export interface BespokeInquiry {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  details: string;
  date: string;
  status?: 'pending' | 'reviewed' | 'responded';
}

export interface PageContent {
  section: string;
  content: any; // jsonb data
}

export interface Customer {
  id?: string;
  full_name: string;
  email: string;
  phone?: string;
  country_code?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  password?: string;
  saved_addresses?: SavedAddress[];
  created_at?: string;
}

export interface Order {
  id?: string;
  order_number: string;
  customer_id: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  status?: string;
  payment_status?: string;
  payment_info?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  shipping_address?: any;
  shipping_charge?: number;
  gst_rate?: number;
  gst_amount?: number;
  payment_method?: 'prepaid' | 'cod';
  webhook_verified?: boolean;
  created_at?: string;
  updated_at?: string;
  customers?: Customer;
}

export interface ShippingRule {
  id: string;
  rule_type: 'pincode' | 'state' | 'default';
  rule_value: string;
  prepaid_charge: number;
  cod_charge: number;
  is_cod_allowed: boolean;
  min_order_value?: number;
  free_shipping_threshold?: number;
  priority: number;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  id?: string;
  order_id: string;
  product_id: string;
  product_name: string;
  selected_timber?: string;
  quantity: number;
  unit_price: number;
  created_at?: string;
}

export interface ShippingZoneProfile {
  id: string;
  name: string;
  isDefault: boolean;
  courierNotes: string;
  isEnabled: boolean;
  baseCharge: number;
  freeShippingThreshold: number;
  deliveryTimeline: string;
  isAllIndia: boolean;
  applicableStates: string[];
  pincodeWildcards: string;
}

export interface CODSettings {
  isEnabled: boolean;
  handlingCharge: number;
  minOrder: number;
  maxOrder: number;
  customerNote: string;
  restrictedPincodes: string;
}

export interface PrepaidSettings {
  isEnabled: boolean;
  title: string;
  trustBadge: string;
  instantDiscountPercent: number;
  flatDiscount: number;
}

export interface ShippingAndPaymentSettings {
  isShippingEngineActive: boolean;
  profiles: ShippingZoneProfile[];
  cod: CODSettings;
  prepaid: PrepaidSettings;
  updated_at?: string;
}

export interface StoreSettings {
  id: number;
  minimum_order_amount: number;
  gift_product_ids: string[];
  is_minimum_order_rule_active?: boolean;
  minimum_order_for_checkout?: number;
  free_shipping_threshold?: number;
  is_free_gift_active?: boolean;
  promotion_title?: string;
  promotion_teaser?: string;
  allow_customer_gift_selection?: boolean;
  updated_at?: string;
}

export type CustomerOrderEligibility = 'all' | 'first_order_only' | 'repeat_orders_only' | 'custom_range';

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed' | 'free_shipping';
  discount_value: number;
  max_discount_amount?: number | null;
  min_cart_amount: number;
  min_usage_count: number;
  max_usage_count?: number | null;
  max_usage_per_customer: number;
  current_usage_count: number;
  customer_order_eligibility: CustomerOrderEligibility;
  min_previous_orders?: number;
  max_previous_orders?: number;
  start_date: string;
  expiry_date: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  coupon_code?: string;
  customer_email: string;
  order_id?: string;
  discount_applied: number;
  used_at: string;
}

export interface CouponValidationParams {
  code: string;
  cartSubtotal: number;
  customerEmail?: string;
  customerOrderCount?: number;
  shippingFee?: number;
  currentDateTime?: string; // For test bench / preview simulations
}

export interface CouponValidationResult {
  isValid: boolean;
  coupon?: Coupon;
  discountAmount: number;
  message: string;
  errorReason?: string;
}

export type PromoBannerStylePreset = 
  | 'royal_gold' 
  | 'dark_luxury' 
  | 'emerald_mint' 
  | 'sunset_glow' 
  | 'glassmorphism' 
  | 'neon_cyber' 
  | 'minimal_clean' 
  | 'coral_blush' 
  | 'wooden_classic' 
  | 'gradient_ocean';

export type PromoBannerAnimation = 
  | 'pulse_glow' 
  | 'slide_in_left' 
  | 'fade_zoom' 
  | 'shimmer_shine' 
  | 'bounce_gentle' 
  | 'marquee_scroll' 
  | 'floating_3d' 
  | 'none';

export type PromoBannerTargetPage = 'all' | 'home_hero' | 'header_marquee' | 'checkout_top' | 'cart_drawer';

export interface PromoBanner {
  id: string;
  title: string;
  subtitle?: string;
  badge_text?: string;
  cta_text?: string;
  cta_link?: string;
  image_url?: string;
  style_preset: PromoBannerStylePreset;
  animation_type: PromoBannerAnimation;
  target_page: PromoBannerTargetPage;
  is_active: boolean;
  start_date?: string;
  expiry_date?: string;
  created_at?: string;
  updated_at?: string;
}

export type HeroLayout = 'classic_split' | 'fullscreen_bg' | 'centered_minimal' | 'floating_card' | 'dual_sculpture_grid';
export type HeroFontStyle = 'serif_heritage' | 'classic_roman' | 'modern_luxury' | 'bold_minimal';
export type HeroBgTheme = 'royal_ebony' | 'sandalwood_woodgrain' | 'imperial_emerald' | 'midnight_velvet' | 'warm_amber';

export interface HeroSettings {
  headline: string;
  description: string;
  badge: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  layout: HeroLayout;
  heroImageUrl: string;
  featuredProductId?: string;
  fontStyle: HeroFontStyle;
  bgTheme: HeroBgTheme;
  overlayOpacity: number; // 0 to 90
  textAlign?: 'left' | 'center' | 'right';
  secondaryImageUrl?: string;
}

export type ShippingLabelPaperSize = 'A4' | 'A5' | 'Thermal_4x6' | 'Letter';
export type ShippingLabelSlipsPerSheet = 1 | 2 | 4 | 6;

export interface ShippingLabelSettings {
  id?: number;
  paper_size: ShippingLabelPaperSize;
  slips_per_sheet: ShippingLabelSlipsPerSheet;
  show_barcode: boolean;
  show_qr_code: boolean;
  show_fragile_warning: boolean;
  show_return_address: boolean;
  show_order_items: boolean;
  show_cod_badge: boolean;
  custom_declaration_note: string;
  brand_logo_url: string;
  dispatch_hub_name: string;
  dispatch_hub_address: string;
  dispatch_hub_phone: string;
}

export interface SavedAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketCategory = 
  | 'Order & Shipment'
  | 'Product & Craftsmanship'
  | 'Bespoke Custom Commission'
  | 'Returns & Replacement'
  | 'Payment & Billing'
  | 'General Inquiry';

export interface TicketMessage {
  id: string;
  sender: 'customer' | 'admin';
  sender_name: string;
  message: string;
  created_at: string;
}

export interface SupportTicket {
  id?: string;
  ticket_number: string;
  customer_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  order_id?: string;
  order_number?: string;
  category: TicketCategory;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  admin_response?: string;
  admin_responded_at?: string;
  admin_responder_name?: string;
  internal_notes?: string;
  messages?: TicketMessage[];
  created_at?: string;
  updated_at?: string;
}

export interface OutgoingWebhook {
  id?: string;
  name: string;
  url: string;
  secret_key?: string;
  events: string[];
  is_active: boolean;
  headers?: Record<string, string>;
  created_at?: string;
  updated_at?: string;
}

export interface WebhookDelivery {
  id?: string;
  webhook_id?: string;
  event_name: string;
  target_url: string;
  payload: any;
  response_status?: number;
  response_body?: string;
  duration_ms?: number;
  status: 'success' | 'failed';
  created_at?: string;
}


