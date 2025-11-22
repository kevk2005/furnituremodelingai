export interface CatalogItem {
  id: string;
  name: string;
  width: number; // cm
  depth: number;
  height: number;
  color?: string;
}

export interface FurniturePlacement {
  id: string; // placement id
  itemId: string;
  position: [number, number, number];
  rotationY: number; // radians about Y
  scale: number; // uniform scale factor
}

export interface SceneState {
  roomImageDataUrl?: string;
  placements: FurniturePlacement[];
}
