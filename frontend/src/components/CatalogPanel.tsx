import React from 'react';
import { MOCK_CATALOG } from '../mock/catalog';
import { CatalogItem } from '../types';

interface Props {
  onAdd: (item: CatalogItem) => void;
}

export const CatalogPanel: React.FC<Props> = ({ onAdd }) => {
  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Catalog</h3>
      {MOCK_CATALOG.map(item => (
        <div key={item.id} className="catalog-item">
          <h4>{item.name}</h4>
          <div style={{ fontSize: '11px', opacity: 0.8 }}>W {item.width} × D {item.depth} × H {item.height} cm</div>
          <button style={{ marginTop: 4 }} onClick={() => onAdd(item)}>Add</button>
        </div>
      ))}
    </div>
  );
};
