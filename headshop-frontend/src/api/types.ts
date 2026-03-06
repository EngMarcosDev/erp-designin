export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  isNew?: boolean;
  isActive?: boolean;
  category?: string;
  material?: string;
  brand?: string;
}

export interface ApiListResponse<T> {
  data: T[];
}
