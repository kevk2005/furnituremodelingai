# Migration from Three.js 3D to 2D Overlay

## Summary
Converted the furniture visualization from a complex Three.js 3D scene to a simple 2D overlay approach using positioned div elements and CSS transforms.

## Why the Change?
- **Simpler Implementation**: 2D overlay is ~10x simpler than 3D WebGL rendering
- **Faster Performance**: No WebGL overhead, just DOM manipulation
- **Smaller Bundle**: Removed ~600KB of Three.js dependencies
- **Better Mobile Support**: CSS transforms are hardware-accelerated and work great on mobile
- **Easier to Iterate**: Plain HTML/CSS/React is more accessible than 3D graphics programming

## What Changed

### 1. SceneCanvas.tsx (Complete Rewrite)
**Before**: 270 lines of Three.js code with WebGL renderer, raycasting, scene graph management
**After**: 158 lines of React using simple mouse events and CSS positioning

**Key Differences**:
- Removed: Three.js scene, camera, renderer, lighting, raycasting, invisible floor plane
- Added: Simple mouse drag handlers using clientX/Y coordinates
- Background: CSS `backgroundImage` instead of Three.js texture
- Furniture: Positioned `<div>` elements instead of 3D meshes
- Transforms: CSS `transform: translate() rotate()` instead of 3D matrix math
- Selection: Click detection via React events instead of raycasting

### 2. types.ts
**CatalogItem Changes**:
- ❌ Removed: `depth: number` (not needed in 2D)
- ✅ Changed: `width` and `height` now in pixels (was cm)
- ✅ Added: `imageUrl?: string` for product photos

**FurniturePlacement Changes**:
- `position`: Still `[number, number, number]` but now [x, y, unused] in pixels (was [x, y, z] in meters)
- `rotationY`: Now degrees (was radians), used for CSS `rotate()`
- `scale`: Still uniform scale factor (unchanged)

### 3. catalog.ts
- Updated dimensions from cm to pixels (e.g., chair 45cm → 80px)
- Removed `depth` property
- Added `imageUrl` with placeholder.com URLs (can be replaced with real product images)

### 4. CatalogPanel.tsx
- Changed dimension display from "W × D × H cm" to "W × H px"

### 5. App.tsx
- Changed initial placement position from `[0, 0.5, 0]` (3D center) to `[400, 300, 0]` (2D screen center)

### 6. package.json
- ❌ Removed: `three` (~600KB)
- ❌ Removed: `@types/three`
- Result: Faster builds, smaller bundle size

## How It Works Now

### Furniture Placement
1. User clicks "Add" in catalog
2. New furniture item appears at center (400, 300) pixels
3. Rendered as a `<div>` with:
   - `position: absolute`
   - `left: position[0]`, `top: position[1]`
   - `transform: translate(-50%, -50%) rotate({rotationY}deg)`
   - Background color from catalog (can be replaced with product image)

### Drag Interaction
1. User clicks on furniture item → `onMouseDown`
2. Store drag start position and item's current position
3. During drag (`onMouseMove`): calculate delta, update item position
4. Release (`onMouseUp`): stop dragging

### Controls
- **Rotate**: Increments rotation by ~11.5° (0.2 radians converted)
- **Scale**: Multiplies by 1.15 (bigger) or 0.85 (smaller)
- **Remove**: Filters out selected item from placements array

### Room Photo Background
- Set via CSS `backgroundImage` on container div
- `backgroundSize: cover` ensures it fills the viewport
- Furniture divs overlay on top via `position: absolute`

## Next Steps (Future Enhancements)

### Phase 1: Better Visuals
- [ ] Replace placeholder URLs with actual furniture product images
- [ ] Add drop shadow and perspective CSS for depth illusion
- [ ] Improve mobile touch support (pinch to scale, two-finger rotate)

### Phase 2: AI Integration
- [ ] Add depth estimation backend (MiDaS via Replicate/HF)
- [ ] Use depth map to determine furniture size based on room depth
- [ ] Add floor/wall segmentation (SAM) for smart placement

### Phase 3: Advanced Features
- [ ] Multiple photos (before/after comparison)
- [ ] Export/share rendered images
- [ ] Real-time shadows/reflections using canvas compositing
- [ ] AR mode using WebXR

## Testing Checklist
- [x] Upload room photo
- [ ] Add furniture from catalog
- [ ] Drag furniture to reposition
- [ ] Click "Rotate" button multiple times
- [ ] Click "Bigger" and "Smaller" buttons
- [ ] Click "Remove" to delete item
- [ ] Refresh page - verify localStorage persistence
- [ ] Click "Render in Room" - verify furniture shows over photo

## Technical Debt Removed
✅ No more complex raycasting math
✅ No more WebGL context management
✅ No more 3D coordinate system conversions
✅ No more camera/viewport calculations
✅ Simpler testing (just DOM interactions)
