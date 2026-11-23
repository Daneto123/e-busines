export type Role = 'buyer' | 'seller';

export interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
  companyName: string | null;
}

export interface Product {
  id: number;
  phoneModel: string;
  heightMm: number;
  widthMm: number;
  thicknessMm: number;
  color: string;
  material: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  seller: { id: number; companyName: string | null };
  createdAt: string;
  /** Present when searching by size: how far the case is from the phone, in mm. */
  sizeDifferenceMm?: number;
}

export interface ProductSearch {
  q?: string;
  height?: number | null;
  width?: number | null;
  thickness?: number | null;
  tolerance?: number | null;
  color?: string;
  maxPrice?: number | null;
  inStock?: boolean;
  sort?: string;
}

export interface Filters {
  colors: string[];
  minPrice: number;
  maxPrice: number;
}

export interface CartItem {
  productId: number;
  phoneModel: string;
  color: string;
  price: number;
  quantity: number;
  stock: number;
  lineTotal: number;
  imageUrl: string | null;
  problem: string | null;
}

export interface Cart {
  items: CartItem[];
  count: number;
  total: number;
}

export interface Order {
  id: number;
  total: number;
  createdAt: string;
  items: { productId: number | null; phoneModel: string; color: string; price: number; quantity: number }[];
}

export interface CaseRequest {
  id: number;
  phoneModel: string;
  heightMm: number | null;
  widthMm: number | null;
  thicknessMm: number | null;
  color: string;
  email: string;
  details: string;
  createdAt: string;
}

/** Error answer from the API: a message and, for forms, one per field. */
export interface ApiErrorBody {
  error: string;
  fields?: Record<string, string>;
}
