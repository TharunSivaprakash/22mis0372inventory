export type Warehouse = {
  inventoryId: number;
  warehouseId: number;
  warehouseName: string;
  warehouseLocation: string;
  availableStock: number;
  reservedStock: number;
};

export type Product = {
  id: number;
  name: string;
  description: string;
  warehouses: Warehouse[];
};

export type Reservation = {
  id: number;
  productId: number;
  productName: string;
  productDescription: string | null;
  warehouseId: number;
  warehouseName: string;
  warehouseLocation: string;
  quantity: number;
  status: "PENDING" | "CONFIRMED" | "RELEASED";
  expiresAt: string;
  createdAt: string;
};
