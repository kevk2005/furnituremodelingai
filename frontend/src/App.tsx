import React, { useEffect, useMemo, useState } from 'react';
import { ImageUpload } from './components/ImageUpload';
import { CatalogPanel } from './components/CatalogPanel';
import { SceneCanvas } from './components/SceneCanvas';
import { CatalogItem, FurniturePlacement, SceneState } from './types';
import { MOCK_CATALOG } from './mock/catalog';

const STORAGE_KEY = 'ai-furniture-scene';

function loadState(): SceneState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { placements: [] };
    return JSON.parse(raw);
  } catch {
    return { placements: [] };
  }
}

function saveState(state: SceneState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const App: React.FC = () => {
  const [scene, setScene] = useState<SceneState>(() => loadState());
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    saveState(scene);
  }, [scene]);

  function handleImage(dataUrl: string) {
    setScene((s: SceneState) => ({ ...s, roomImageDataUrl: dataUrl }));
    setIsRendered(false); // Reset render state when new image uploaded
    console.log('[analytics] upload');
  }

  function handleAdd(item: CatalogItem) {
    const placement: FurniturePlacement = {
      id: `${item.id}-${Date.now()}`,
      itemId: item.id,
      position: [0, 0.5, 0],
      rotationY: 0,
      scale: 1,
    };
    setScene((s: SceneState) => ({ ...s, placements: [...s.placements, placement] }));
    console.log('[analytics] place', item.id);
  }

  function handleUpdate(placements: FurniturePlacement[]) {
    setScene((s: SceneState) => ({ ...s, placements }));
    console.log('[analytics] update placements');
  }

  function handleRender() {
    if (!scene.roomImageDataUrl) {
      alert('Please upload a room photo first!');
      return;
    }
    if (scene.placements.length === 0) {
      alert('Please add at least one furniture item!');
      return;
    }
    setIsRendered(true);
    console.log('[analytics] render');
  }

  const catalogIndex = useMemo(() => {
    const map: Record<string, CatalogItem> = {};
    MOCK_CATALOG.forEach(i => { map[i.id] = i; });
    return map;
  }, []);

  return (
    <>
      <header>
        <strong>AI Furniture Browser-Only MVP</strong> — local mock prototype
      </header>
      <div className="layout">
        <div className="side">
          <ImageUpload onImage={handleImage} />
          <hr />
          <CatalogPanel onAdd={handleAdd} />
          <hr />
          {scene.placements.length > 0 && scene.roomImageDataUrl && !isRendered && (
            <button 
              onClick={handleRender}
              style={{ 
                width: '100%', 
                padding: '12px', 
                background: '#4CAF50', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 6, 
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: 8
              }}
            >
              🎨 Render in Room
            </button>
          )}
          {isRendered && (
            <button 
              onClick={() => setIsRendered(false)}
              style={{ 
                width: '100%', 
                padding: '10px', 
                background: '#ff9800', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 6, 
                fontSize: 13,
                cursor: 'pointer',
                marginBottom: 8
              }}
            >
              ✏️ Edit Layout
            </button>
          )}
          <p style={{ fontSize: 11, opacity: 0.7 }}>Data stored locally (no backend). Mock catalog + simple scene placement only.</p>
          <button onClick={() => { setScene({ placements: [] }); setIsRendered(false); }}>Reset Scene</button>
        </div>
        <div className="canvas-wrap">
          <SceneCanvas
            roomImage={isRendered ? scene.roomImageDataUrl : undefined}
            placements={scene.placements}
            onUpdate={handleUpdate}
            catalogIndex={catalogIndex}
          />
        </div>
      </div>
      <div className="footer">Generated prototype — depth & segmentation mocked (future backend).</div>
    </>
  );
};

export default App;
