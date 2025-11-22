# AI Furniture Visualization Platform

Browser-based furniture visualization app with AI-powered room scanning and 3D placement preview.

## Features

- **Room Photo Upload**: Upload a room photo to create a 3D backdrop environment
- **3D Furniture Placement**: Drag, rotate, and scale furniture items in 3D space
- **Mock Catalog**: Browse sample furniture items (chairs, sofas, tables, lamps)
- **Local Persistence**: Scene state saved to browser localStorage
- **Orbit Controls**: Rotate camera view by dragging on empty space

## Tech Stack

### Frontend (Current - Browser-Only MVP)
- React 18 + TypeScript
- Vite (dev server & build)
- Three.js (3D rendering)
- Local state management

### Backend (Planned - AI Integration)
- FastAPI (Python) or Node.js/Express
- AI Models:
  - Depth Estimation: MiDaS or DPT
  - Segmentation: Segment Anything Model (SAM)
  - Optional: Image blending/inpainting for realistic lighting
- Cloud Storage: S3/GCP/Supabase for images & models
- Database: PostgreSQL for catalog, scenes, users

## Project Structure

```
AI furniture/
├── frontend/               # React + Three.js browser app
│   ├── src/
│   │   ├── components/    # ImageUpload, CatalogPanel, SceneCanvas
│   │   ├── mock/          # Mock catalog data
│   │   ├── types.ts       # TypeScript interfaces
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── requirements.md        # Full product requirements
├── architecture_blueprint.md  # System design doc
└── README.md
```

## Getting Started

### Prerequisites
- Node.js v18+ (LTS recommended)
- npm or yarn

### Installation

```powershell
cd "AI furniture/frontend"
npm install
```

### Development

```powershell
npm run dev
```

Open http://localhost:5173

### Build

```powershell
npm run build
```

## Current Status: Browser-Only MVP

✅ Implemented:
- Image upload UI
- 3D scene with photo backdrop + grid floor
- Furniture catalog panel
- Box placeholder furniture rendering
- Drag-to-place, rotate, scale controls
- localStorage persistence
- Basic analytics logging (console)

🚧 In Progress:
- Git repository setup
- GitHub integration

📋 Planned (AI Integration):
- Backend API for depth estimation
- Real-time depth map processing (MiDaS/DPT)
- Floor plane detection & auto-scaling
- Semantic segmentation for occlusion
- Real 3D furniture models (glTF/GLB)
- User authentication
- Partner catalog management
- Referral tracking & monetization

## AI Architecture (Next Phase)

### Depth Estimation Flow
1. User uploads room photo
2. Frontend sends image to backend API
3. Backend runs MiDaS model (GPU inference)
4. Returns depth map (normalized grayscale)
5. Frontend applies depth-based occlusion in shader

### Scale Estimation
- Detect floor plane from depth point cloud (RANSAC)
- Estimate camera height assumption (~1.5m)
- Derive pixel-to-meter scale factor
- Auto-size furniture based on real-world dimensions

### Deployment Options
- **Option A**: Replicate.com (managed AI inference)
- **Option B**: HuggingFace Inference API
- **Option C**: Custom GPU server (AWS EC2 g4dn, Lambda Labs)
- **Option D**: Client-side ONNX Runtime Web (limited model size)

## Contributing

See `architecture_blueprint.md` for detailed system design.

## License

Internal prototype – not for public distribution.

---

**Generated**: November 22, 2025
