import React, { useState, useCallback, useRef } from 'react';
import { FurniturePlacement, CatalogItem } from '../types';

interface Props {
  roomImage?: string;
  placements: FurniturePlacement[];
  onUpdate: (p: FurniturePlacement[]) => void;
  catalogIndex: Record<string, CatalogItem>;
}

export const SceneCanvas: React.FC<Props> = ({ roomImage, placements, onUpdate, catalogIndex }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, itemX: 0, itemY: 0 });

  // Helper to update one placement
  const updatePlacement = useCallback((id: string, partial: Partial<FurniturePlacement>) => {
    onUpdate(placements.map((p: FurniturePlacement) => p.id === id ? { ...p, ...partial } : p));
  }, [placements, onUpdate]);

  // Drag handlers for furniture items
  function handleItemMouseDown(e: React.MouseEvent, id: string, item: FurniturePlacement) {
    e.stopPropagation();
    setSelectedId(id);
    setDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      itemX: item.position[0],
      itemY: item.position[1]
    };
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging || !selectedId) return;
    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;
    updatePlacement(selectedId, {
      position: [
        dragStart.current.itemX + deltaX,
        dragStart.current.itemY + deltaY,
        0
      ]
    });
  }

  function handleMouseUp() {
    setDragging(false);
  }

  function handleRotate(delta: number) {
    if (!selectedId) return;
    const target = placements.find((p: FurniturePlacement) => p.id === selectedId);
    if (!target) return;
    // Rotation in degrees for CSS transform
    const newRotation = (target.rotationY + delta * (180 / Math.PI)) % 360;
    updatePlacement(selectedId, { rotationY: newRotation });
  }

  function handleScale(factor: number) {
    if (!selectedId) return;
    const target = placements.find((p: FurniturePlacement) => p.id === selectedId);
    if (!target) return;
    const newScale = Math.min(3, Math.max(0.3, target.scale * factor));
    updatePlacement(selectedId, { scale: newScale });
  }

  return (
    <div 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        backgroundImage: roomImage ? `url(${roomImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: roomImage ? 'transparent' : '#1a1a1a',
        overflow: 'hidden',
        cursor: dragging ? 'grabbing' : 'default'
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Furniture items as 2D overlays */}
      {placements.map((item) => {
        const catalogItem = catalogIndex[item.itemId];
        const isSelected = selectedId === item.id;
        
        return (
          <div
            key={item.id}
            onMouseDown={(e) => handleItemMouseDown(e, item.id, item)}
            style={{
              position: 'absolute',
              left: item.position[0],
              top: item.position[1],
              width: (catalogItem?.width || 100) * item.scale,
              height: (catalogItem?.height || 100) * item.scale,
              transform: `translate(-50%, -50%) rotate(${item.rotationY}deg)`,
              cursor: 'move',
              border: isSelected ? '2px solid #4CAF50' : '2px solid transparent',
              boxShadow: isSelected ? '0 0 20px rgba(76, 175, 80, 0.5)' : '0 4px 12px rgba(0,0,0,0.3)',
              background: catalogItem?.color || '#8b4513',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              color: '#fff',
              userSelect: 'none',
              transition: isSelected ? 'none' : 'box-shadow 0.2s',
              opacity: 0.9
            }}
          >
            {catalogItem?.name || 'Furniture'}
          </div>
        );
      })}

      {/* Control panel for selected item */}
      {selectedId && (
        <div style={{ 
          position: 'absolute', 
          top: 10, 
          right: 10, 
          background: 'rgba(0,0,0,0.85)', 
          color: '#fff', 
          padding: '12px 16px', 
          borderRadius: 8, 
          fontSize: 13,
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000
        }}>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>
            {catalogIndex[placements.find((p: FurniturePlacement) => p.id === selectedId)?.itemId || '']?.name || 'Item'}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => handleRotate(0.2)}>↻ Rotate</button>
            <button style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => handleScale(1.15)}>+ Bigger</button>
            <button style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => handleScale(0.85)}>- Smaller</button>
            <button 
              style={{ padding: '4px 10px', fontSize: 12, background: '#d32f2f', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: 4 }} 
              onClick={() => { 
                onUpdate(placements.filter((p: FurniturePlacement) => p.id !== selectedId)); 
                setSelectedId(null); 
              }}
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
