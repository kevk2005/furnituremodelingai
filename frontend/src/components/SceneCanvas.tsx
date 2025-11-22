import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { FurniturePlacement, CatalogItem } from '../types';

interface Props {
  roomImage?: string;
  placements: FurniturePlacement[];
  onUpdate: (p: FurniturePlacement[]) => void;
  catalogIndex: Record<string, CatalogItem>;
}

enum Mode { NONE, DRAG, ORBIT }

export const SceneCanvas: React.FC<Props> = ({ roomImage, placements, onUpdate, catalogIndex }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    backdrop?: THREE.Mesh;
    items: Map<string, THREE.Mesh>;
  } | null>(null);
  
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const [mode, setMode] = useState(Mode.NONE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const orbitState = useRef({ isDragging: false, prevX: 0, prevY: 0 });
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  // Initialize Three.js scene once
  useEffect(() => {
    if (!mountRef.current || threeRef.current) return;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#1a1a1a');

    const camera = new THREE.PerspectiveCamera(
      50,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      100
    );
    camera.position.set(8, 6, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 10, 7);
    dir.castShadow = true;
    scene.add(dir);

    // Grid floor (3D printer style)
    const grid = new THREE.GridHelper(20, 40, 0x555555, 0x333333);
    grid.position.y = 0;
    scene.add(grid);

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

  // Photo backdrop
  useEffect(() => {
    if (!threeRef.current) return;
    const { scene } = threeRef.current;

    // Remove old backdrop
    if (threeRef.current.backdrop) {
      scene.remove(threeRef.current.backdrop);
      threeRef.current.backdrop.geometry.dispose();
      (threeRef.current.backdrop.material as THREE.Material).dispose();
      threeRef.current.backdrop = undefined;
    }

    if (!roomImage) return;

    console.log('[SceneCanvas] Loading backdrop image...');
    const texLoader = new THREE.TextureLoader();
    texLoader.load(
      roomImage, 
      (texture: THREE.Texture) => {
        if (!threeRef.current) return;
        const img = texture.image as HTMLImageElement;
        console.log('[SceneCanvas] Backdrop loaded, size:', img.width, 'x', img.height);
        const aspect = img.width / img.height;
        const HEIGHT = 8;
        const WIDTH = HEIGHT * aspect;

        const geo = new THREE.PlaneGeometry(WIDTH, HEIGHT);
        const mat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
        const plane = new THREE.Mesh(geo, mat);

        // Position backdrop behind grid
        plane.position.set(0, HEIGHT / 2, -6);
        threeRef.current.scene.add(plane);
        threeRef.current.backdrop = plane;
        console.log('[SceneCanvas] Backdrop added to scene at position', plane.position);
      },
      undefined,
      (error) => {
        console.error('[SceneCanvas] Failed to load backdrop:', error);
      }
    );
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
        const color = item?.color || '#6699ff';
        const geo = new THREE.BoxGeometry(1, 1, 1);
        const mat = new THREE.MeshStandardMaterial({ color });
        mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.placementId = pl.id;
        scene.add(mesh);
        items.set(pl.id, mesh);
      }
      mesh.position.set(pl.position[0], pl.position[1], pl.position[2]);
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
    } else if (e.button === 0) {
      // Start orbit on empty space
      setMode(Mode.ORBIT);
      orbitState.current = { isDragging: true, prevX: e.clientX, prevY: e.clientY };
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!threeRef.current || !mountRef.current) return;

    if (mode === Mode.DRAG && selectedId) {
      const rect = mountRef.current.getBoundingClientRect();
      mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.current.setFromCamera(mouse.current, threeRef.current.camera);
      const intersect = raycaster.current.ray.intersectPlane(plane.current, new THREE.Vector3());
      if (intersect) {
        updatePlacement(selectedId, { position: [intersect.x, 0.5, intersect.z] });
      }
    } else if (mode === Mode.ORBIT && orbitState.current.isDragging) {
      const deltaX = e.clientX - orbitState.current.prevX;
      const deltaY = e.clientY - orbitState.current.prevY;
      orbitState.current.prevX = e.clientX;
      orbitState.current.prevY = e.clientY;

      const camera = threeRef.current.camera;
      const pivot = new THREE.Vector3(0, 2, 0);
      
      // Horizontal orbit
      const angle = -deltaX * 0.005;
      const offset = camera.position.clone().sub(pivot);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      camera.position.copy(pivot.clone().add(offset));
      camera.lookAt(pivot);
    }
  }

  function onPointerUp() {
    setMode(Mode.NONE);
    orbitState.current.isDragging = false;
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
          cursor: mode === Mode.DRAG ? 'grabbing' : mode === Mode.ORBIT ? 'move' : 'default'
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
          background: '#222', 
          color: '#fff', 
          padding: '8px 12px', 
          borderRadius: 6, 
          fontSize: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          <div style={{ marginBottom: 6, fontWeight: 600 }}>Selected: {selectedId.split('-')[0]}</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <button onClick={() => handleRotate(0.2)}>↻ +</button>
            <button onClick={() => handleRotate(-0.2)}>↺ -</button>
            <button onClick={() => handleScale(1.1)}>+ Scale</button>
            <button onClick={() => handleScale(0.9)}>- Scale</button>
            <button onClick={() => { onUpdate(placements.filter((p: FurniturePlacement) => p.id !== selectedId)); setSelectedId(null); }}>✕ Remove</button>
          </div>
        </div>
      )}
    </div>
  );
};
