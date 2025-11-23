import { CatalogItem } from '../types';

export const MOCK_CATALOG: CatalogItem[] = [
  { 
    id: 'chair-basic', 
    name: 'Basic Chair', 
    width: 80, 
    height: 120, 
    color: '#c58f54',
    imageUrl: 'https://via.placeholder.com/80x120/c58f54/fff?text=Chair'
  },
  { 
    id: 'sofa-2seat', 
    name: '2-Seat Sofa', 
    width: 200, 
    height: 120, 
    color: '#556b7d',
    imageUrl: 'https://via.placeholder.com/200x120/556b7d/fff?text=Sofa'
  },
  { 
    id: 'table-coffee', 
    name: 'Coffee Table', 
    width: 150, 
    height: 80, 
    color: '#8d6e63',
    imageUrl: 'https://via.placeholder.com/150x80/8d6e63/fff?text=Table'
  },
  { 
    id: 'lamp-floor', 
    name: 'Floor Lamp', 
    width: 50, 
    height: 200, 
    color: '#ddd',
    imageUrl: 'https://via.placeholder.com/50x200/ddd/333?text=Lamp'
  }
];
