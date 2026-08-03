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

export type ActiveTab = 'home' | 'shop' | 'product-detail' | 'temple-projects' | 'about' | 'wholesale-export' | 'care-guide';

export interface BespokeInquiry {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  details: string;
  date: string;
  status: 'pending' | 'reviewed' | 'responded';
}
