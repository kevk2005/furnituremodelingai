# Browser-Only MVP

This prototype is a front-end only implementation of the AI Furniture Visualization concept. It runs entirely in the browser with local mock data and no backend services.

## Included Features
- Image upload (local) for room background.
- Mock catalog of furniture items.
- 3D scene using Three.js with simple box placeholders for furniture.
- Placement, drag move (XZ plane), rotate, scale, remove.
- Local persistence of scene state (`localStorage`).
- Basic console analytics logs for major actions.

## Not Included (Future Backend)
- True depth estimation / segmentation.
- Real furniture 3D models optimization.
- Authentication, multi-user scenes.
- Partner dashboards, referral tracking.
- AI blending, lighting, realistic occlusion.

## Setup

```powershell
cd "c:\Users\kevin\AI furniture\frontend"
npm install
npm run dev
```
Then open http://localhost:5173

## File Structure
```
frontend/
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  src/
    main.tsx
    App.tsx
    types.ts
    mock/catalog.ts
    components/
      ImageUpload.tsx
      CatalogPanel.tsx
      SceneCanvas.tsx
```

## Next Steps
1. Replace box geometry with glTF loader and real models.
2. Add simple depth mock (gradient shader) for preliminary occlusion.
3. Introduce a state sidebar to list placed items and reorder.
4. Prepare API layer abstraction for eventual backend integration.
5. Add performance stats overlay (FPS, object count).

## License
Internal prototype – not for distribution.
