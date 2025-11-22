# AI Furniture Visualization Platform Blueprint

## 1. High-Level Architecture Overview

```
[Browser / Mobile]
   | React/Next.js SPA (Furniture Canvas, Catalog, Auth, Dashboard)
   | WebGL/Three.js/Babylon.js layer
   v
[API Gateway / Edge (CDN + WAF)]
   v
[Backend App Layer]
  - Core REST/GraphQL API (FastAPI or Node.js/Express/NestJS)
  - Auth service (OAuth/JWT issuance)
  - Catalog service
  - Scene service (saved rooms, transforms)
  - Partner admin service
  - Analytics event ingestion
   |
   +--> [AI Workers / Microservices]
         - Depth Estimation (MiDaS / Torch)
         - Segmentation (SAM)
         - Optional Blending (Image Gen model)
         - Queue (e.g. AWS SQS / Redis Streams)
   +--> [3D Asset Pipeline]
         - Model optimization (glTF compression, Draco, mesh simplification)
         - Thumbnail generation
   +--> [Storage]
         - Object Store (Images, Models) S3/GCP/Supabase
         - Relational/Document DB (PostgreSQL or MongoDB)
         - Cache (Redis) for session, precomputed depth maps
   +--> [Analytics / Metrics]
         - Event store (e.g. Postgres table / BigQuery / Snowflake later)
         - Logging + APM (OpenTelemetry -> Grafana / Datadog)
```

## 2. Component Breakdown

- **Frontend App:** Upload UI, catalog browsing, interactive placement canvas, account management, partner dashboard module.
- **3D Interaction Layer:** WebGL scene, object transforms (translate/rotate/scale), gizmos, collision/floor snapping.
- **Auth Service:** OAuth provider integration (Google/Apple) + JWT issuance, refresh tokens, RBAC roles (user, partner_admin, platform_admin).
- **Catalog Service:** CRUD for furniture items, ingestion pipeline, search/filter (tags, category, brand, price range), availability status.
- **Scene Service:** Persist user room scenes (original photo reference + furniture placements + transforms + depth metadata version).
- **AI Processing Service:** Orchestrates depth + segmentation + scaling heuristics; asynchronous job status API.
- **Blending Service (Optional Phase 2+):** Light/shadow adjustment, color tone harmonization using diffusion/inpainting.
- **Partner Admin Dashboard:** Manage inventory, view engagement metrics, referral click stats.
- **Analytics Collector:** Lightweight ingestion endpoint batching events (placement, rotate, buy_click, save_scene).
- **Event Queue:** Decouples heavy AI tasks from synchronous API responses.
- **Asset Pipeline:** Validates and optimizes 3D models (glTF compression, texture resizing, baking ambient occlusion if needed).

## 3. Core Data Models (Indicative Fields)

### User
- id (UUID)
- email
- auth_provider (enum)
- role (enum: user, partner_admin, platform_admin)
- created_at, last_login

### FurnitureItem
- id (UUID)
- name
- brand_id (FK Brand)
- category (enum / text)
- tags (array[str])
- price (numeric + currency)
- referral_url
- model_urls { glb, usdz? }
- thumbnail_url
- dimensions { width_cm, depth_cm, height_cm }
- metadata { material, color_variants }
- active (bool)
- updated_at

### RoomScene
- id (UUID)
- user_id (FK User)
- original_image_url
- depth_map_url (optional)
- segmentation_map_url (optional)
- placements [FurniturePlacement]
- status (enum: draft, finalized)
- created_at, updated_at

### FurniturePlacement
- item_id (FK FurnitureItem)
- transform { position: [x,y,z], rotation: [x,y,z], scale: [x,y,z] }
- z_index / layering_hint
- ai_confidence (float?)

### Brand / Partner
- id
- display_name
- contact_email
- dashboard_user_id (FK User)
- active

### AnalyticsEvent
- id
- user_id (nullable if anonymous)
- type (enum: upload, place, rotate, scale, remove, buy_click, save_scene, share)
- payload (JSON)
- created_at

### AIJob
- id
- room_scene_id
- type (depth|segmentation|blend)
- status (queued|processing|success|error)
- error_message (nullable)
- created_at, completed_at

## 4. AI Pipeline Design

1. Upload triggers `AIJob(depth)`.
2. Depth Estimation (MiDaS): produce normalized depth map; persist to storage; cache result keyed by image hash.
3. Segmentation (SAM): generate masks for floor, walls, large furniture obstacles (for occlusion logic).
4. Scaling Heuristics: Estimate scene scale (e.g. floor-plane pixel distances vs typical room object sizes).
5. Placement Suggestion (optional): Suggest initial coordinates relative to floor plane center.
6. Blending (future): Diffusion/inpainting pass using depth + mask for realistic lighting adaptation.
7. Return aggregated job status; frontend polls or uses WebSocket for updates.

Performance Notes: Batch GPU operations; maintain model warm pool; reuse depth for same image hash; prefetch segmentation after depth completes; consider ONNX runtime for inference speed.

## 5. 3D Rendering Pipeline

- Load base room photo as background plane or use photo as environment texture for ambient light estimation.
- Build synthetic 3D floor plane from detected perspective (homography + vanishing point estimation). Optionally allow user to adjust.
- Insert furniture glTF models; apply scale from AI heuristics (clamp unrealistic values).
- Provide transform gizmos (handles for translate on X/Z, vertical lift constraint, rotation about Y axis, uniform scale).
- Depth-based occlusion approximation: Use depth map to hide parts of furniture behind existing scene objects (shader discards fragments where furniture depth > room depth threshold).
- Lighting: Simple image-based lighting (IBL) using extracted approximate color temperature; later upgrade to screen-space shadow estimation.
- Optimization: Draco + meshopt compression; lazy load models; maintain a local LRU cache; use requestIdleCallback for secondary assets.

## 6. API Spec Skeleton (REST)

- `POST /auth/oauth/callback` – Exchange code for JWT.
- `GET /users/me` – Profile & roles.
- `POST /rooms` – Create scene (upload image init) → returns scene_id.
- `POST /rooms/{id}/upload` – Presigned URL or direct upload token.
- `POST /rooms/{id}/jobs` – Start AI jobs (depth, segmentation).
- `GET /rooms/{id}/jobs` – List statuses.
- `GET /rooms/{id}` – Fetch scene + placements.
- `PUT /rooms/{id}/placements` – Bulk update placements array.
- `POST /rooms/{id}/finalize` – Mark complete.
- `GET /catalog/items` – Query with filters (pagination, search, tags).
- `POST /catalog/items` – (partner_admin) Create/update.
- `GET /catalog/items/{id}` – Details.
- `POST /analytics/events` – Batch event ingestion.
- `GET /partners/dashboard/metrics` – Aggregated metrics (secure, role-based).

(WebSocket / SSE optional): `ws /rooms/{id}/updates` – Push AI job completion notifications.

## 7. Deployment & Infrastructure

- **Environments:** dev, staging, prod.
- **CI/CD:** GitHub Actions (lint, tests, build Docker images, run model smoke tests, deploy via IaC).
- **IaC:** Terraform or Pulumi (VPC, ECS/EKS or GKE, S3 buckets, CloudFront CDN, RDS/Postgres, Redis cluster).
- **Scaling:** API autoscaling on CPU; AI workers autoscale on GPU queue depth; use spot instances for inference cost reduction.
- **Caching:** Redis for session tokens + depth map metadata; CDN for static assets and 3D models.
- **Observability:** OpenTelemetry tracing; centralized structured logs; metrics dashboards (Grafana); alerting (error rate, job latency).

## 8. Security & Compliance

- JWT access tokens (short-lived) + refresh tokens (HTTP-only cookies or secure storage).
- RBAC middleware checks routes; partner admin isolated operations.
- Signed URLs for image/model upload (expiring, scoped).
- Input validation (image MIME + size limit, model file whitelist).
- Rate limiting per IP/user for upload endpoints.
- Encryption at rest (S3 default, DB with KMS). Encryption in transit (HTTPS everywhere).
- Basic privacy compliance: allow deletion of scenes & account; audit log for admin actions.
- Image moderation (Phase 2) using third-party API.

## 9. Analytics & Monetization

- Event taxonomy documented; minimal payload (scene_id, item_id, action_type, timestamp).
- Referral tracking: Append partner-specific UTM + referral code; store `buy_click` event.
- Partner dashboard: Conversion funnel (views → placements → buy_clicks); top-performing items; average interaction durations.
- Future: Predictive recommendation engine based on prior placements and style classification.

## 10. Phased Roadmap

### Phase 0: Foundations (1–2 weeks)
- Repo scaffold (frontend + backend + infra boilerplate).
- Auth (OAuth + JWT) minimal.
- Catalog CRUD (basic) + file upload.

### Phase 1: Core Visualization (3–4 weeks)
- Image upload → depth + segmentation pipeline.
- 3D canvas with placement & transforms.
- Scene persistence + placements editing.
- Basic analytics events.

### Phase 2: Partner & Monetization (2–3 weeks)
- Partner admin dashboard.
- Referral link handling + metrics aggregation.
- Model optimization pipeline automation.

### Phase 3: Enhanced Realism (4+ weeks)
- Lighting & shadow blending.
- Occlusion refinement using GPU shaders.
- Performance tuning, caching strategy.

### Phase 4: Intelligence & AR (Future)
- Style-based recommendations.
- Automated measurement / dimension inference.
- Mobile AR mode (WebXR / native bridge).

## 11. Risks & Mitigations

- **GPU Cost:** Use mixed precision, ONNX runtime; batch inference.
- **Model Quality Variance:** Maintain validation pipeline, reject malformed meshes.
- **Latency Spikes:** Queue with backpressure; pre-warm workers; circuit breaker on blending service.
- **Scaling DB:** Consider early partitioning or move analytics to append-only warehouse.
- **Security Breach via Uploads:** Strict MIME/type scanning; limit file size; virus scan service (ClamAV container) if needed.

## 12. Initial Folder Structure Proposal

```
root/
  frontend/ (Next.js)
    src/
      components/
      pages/
      lib/
      hooks/
      styles/
  backend/
    app/
      api/
      models/
      services/
      workers/
      schemas/
      auth/
    tests/
  infra/
    terraform/ or pulumi/
  ai/
    depth/
    segmentation/
    blending/
    utils/
  scripts/
  docs/
    requirements.md
    architecture_blueprint.md
```

## 13. Next Action Suggestions

1. Confirm tech stack choices (FastAPI vs Node, Three.js vs Babylon.js).
2. Decide DB (Postgres strongly recommended for relational & JSON fields).
3. Implement repo scaffold + CI baseline.
4. Stand up auth & catalog first for early partner demos.
5. Integrate depth estimation worker; measure initial latency.
6. Begin 3D canvas prototype with mock data.

---
Generated on: 2025-11-22
