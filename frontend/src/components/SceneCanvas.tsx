import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { FurniturePlacement, CatalogItem } from '../types';

interface Props {
  roomImage?: string;
  placements: FurniturePlacement[];
  onUpdate: (p: FurniturePlacement[]) => void;
  catalogIndex: Record<string, CatalogItem>;
}

enum Mode { NONE, DRAG }

export const SceneCanvas: React.FC<Props> = ({ roomImage, placements, onUpdate, catalogIndex }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    items: Map<string, THREE.Mesh>;
  } | null>(null);
  
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const [mode, setMode] = useState(Mode.NONE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  // Initialize Three.js scene once
  useEffect(() => {
    if (!mountRef.current || threeRef.current) return;
    
    const scene = new THREE.Scene();
    // No background color - will be handled by CSS or transparent

    const camera = new THREE.PerspectiveCamera(
      60,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      100
    );
    // Camera positioned to view scene from typical room photo perspective
    camera.position.set(0, 1.6, 5); // Eye level ~1.6m, looking forward
    camera.lookAt(0, 0.8, 0);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true // Enable transparency
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(5, 10, 7);
    dir.castShadow = true;
    scene.add(dir);

    // Invisible floor plane for raycasting (furniture placement)
    const floorGeo = new THREE.PlaneGeometry(20, 20);
    const floorMat = new THREE.MeshBasicMaterial({ 
      visible: false, // Invisible but still raycastable
      side: THREE.DoubleSide 
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotateX(-Math.PI / 2);
    floor.position.y = 0;
    floor.name = 'floor';
    scene.add(floor);

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    threeRef.current = { scene, camera, renderer, items: new Map() };

    // Animation loop
    let animId = 0;
    const animate = () => {
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement.parentElement === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Photo backdrop - render as CSS background layer behind canvas
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current.parentElement;
    if (!container) return;

    if (roomImage) {
      container.style.backgroundImage = `url(${roomImage})`;
      container.style.backgroundSize = 'cover';
      container.style.backgroundPosition = 'center';
      container.style.backgroundRepeat = 'no-repeat';
      console.log('[SceneCanvas] Room image set as background');
    } else {
      container.style.backgroundImage = 'none';
      container.style.backgroundColor = '#1a1a1a';
    }
  }, [roomImage]);

  // Furniture meshes sync
  useEffect(() => {
    if (!threeRef.current) return;
    const { scene, items } = threeRef.current;

    // Remove stale items
    for (const [id, mesh] of items) {
      if (!placements.find((p: FurniturePlacement) => p.id === id)) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        items.delete(id);
      }
    }

    // Add/update current items
    placements.forEach((pl: FurniturePlacement) => {
      let mesh = items.get(pl.id);
      if (!mesh) {
        const item = catalogIndex[pl.itemId];
        const color = item?.color || '#8b4513';
        // Use real dimensions if available (convert cm to meters)
        const w = (item?.width || 50) / 100;
        const d = (item?.depth || 50) / 100;
        const h = (item?.height || 90) / 100;
        const geo = new THREE.BoxGeometry(w, h, d);
        const mat = new THREE.MeshStandardMaterial({ 
          color,
          roughness: 0.7,
          metalness: 0.1
        });
        mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.placementId = pl.id;
        scene.add(mesh);
        items.set(pl.id, mesh);
      }
      // Position with Y offset = half height so furniture sits on floor
      const h = (mesh.geometry as THREE.BoxGeometry).parameters.height;
      mesh.position.set(pl.position[0], h / 2 * pl.scale, pl.position[2]);
      mesh.scale.setScalar(pl.scale);
      mesh.rotation.y = pl.rotationY;
    });
  }, [placements, catalogIndex]);

  const updatePlacement = useCallback((id: string, partial: Partial<FurniturePlacement>) => {
    onUpdate(placements.map((p: FurniturePlacement) => p.id === id ? { ...p, ...partial } : p));
  }, [placements, onUpdate]);

  function onPointerDown(e: React.PointerEvent) {
    if (!mountRef.current || !threeRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.current.setFromCamera(mouse.current, threeRef.current.camera);
    const furnitureObjects = Array.from(threeRef.current.items.values());
    const intersects = raycaster.current.intersectObjects(furnitureObjects);
    
    if (intersects.length > 0 && e.button === 0) {
      const hitId = intersects[0].object.userData.placementId;
      setSelectedId(hitId);
      setMode(Mode.DRAG);
    } else {
      setSelectedId(null);
      setMode(Mode.NONE);
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!threeRef.current || !mountRef.current) return;

    if (mode === Mode.DRAG && selectedId) {
      const rect = mountRef.current.getBoundingClientRect();
      mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.current.setFromCamera(mouse.current, threeRef.current.camera);
      
      // Raycast to invisible floor to get placement position
      const floor = threeRef.current.scene.getObjectByName('floor');
      if (floor) {
        const intersects = raycaster.current.intersectObject(floor);
        if (intersects.length > 0) {
          const point = intersects[0].point;
          updatePlacement(selectedId, { position: [point.x, point.y, point.z] });
        }
      }
    }
  }

  function onPointerUp() {
    setMode(Mode.NONE);
  }

  function handleRotate(delta: number) {
    if (!selectedId) return;
    const target = placements.find((p: FurniturePlacement) => p.id === selectedId);
    if (!target) return;
    updatePlacement(selectedId, { rotationY: target.rotationY + delta });
  }

  function handleScale(factor: number) {
    if (!selectedId) return;
    const target = placements.find((p: FurniturePlacement) => p.id === selectedId);
    if (!target) return;
    const newScale = Math.min(5, Math.max(0.2, target.scale * factor));
    updatePlacement(selectedId, { scale: newScale });
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        ref={mountRef}
        style={{ 
          width: '100%', 
          height: '100%', 
          cursor: mode === Mode.DRAG ? 'grabbing' : 'default'
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
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
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>
            {catalogIndex[placements.find((p: FurniturePlacement) => p.id === selectedId)?.itemId || '']?.name || 'Item'}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => handleRotate(0.2)}>↻ Rotate</button>
            <button style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => handleScale(1.15)}>+ Bigger</button>
            <button style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => handleScale(0.85)}>- Smaller</button>
            <button style={{ padding: '4px 10px', fontSize: 12, background: '#d32f2f', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => { onUpdate(placements.filter((p: FurniturePlacement) => p.id !== selectedId)); setSelectedId(null); }}>Remove</button>
          </div>
        </div>
      )}
    </div>
  );
};
