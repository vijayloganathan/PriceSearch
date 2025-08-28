export interface Product {
  id: string; // Firebase key
  productId: string;
  name: string;
  type: string;
  retailRate: number;
  wholesaleRate: number;
  purchaseRate: number;
  quantity: string;
}

export interface ProductType {
  id: string; // Firebase key
  name: string;
}

export interface QuantityType {
  id: string; // Firebase key
  name: string;
}
