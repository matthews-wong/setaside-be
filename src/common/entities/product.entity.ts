/**
 * Product entity representing a product in the database
 */
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category?: string;
  is_available: boolean;
  stock_quantity: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}
