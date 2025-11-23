export interface CatalogItem {
  id: string;
  name: string;
  width: number; // pixels (will scale in 2D)
  height: number; // pixels (will scale in 2D)
  color?: string;
  imageUrl?: string; // Product image URL for 2D overlay
}

export interface FurniturePlacement {
  id: string; // placement id
  itemId: string;
  position: [number, number, number]; // [x, y in pixels, z unused]
  rotationY: number; // degrees for CSS transform
  scale: number; // uniform scale factor
}

export interface SceneState {
  roomImageDataUrl?: string;
  placements: FurniturePlacement[];
}
