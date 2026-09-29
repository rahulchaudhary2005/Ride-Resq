# Kubernetes manifests (placeholder)

For a production cluster deployment, add here:
- `backend-deployment.yaml` + `backend-service.yaml` (3+ replicas, HPA on CPU/memory)
- `admin-web-deployment.yaml` + `admin-web-service.yaml`
- `postgres` — prefer a managed service (RDS/Cloud SQL) over in-cluster Postgres for production
- `redis` — managed (ElastiCache/Memorystore) recommended for the Socket.io adapter
- `ingress.yaml` with TLS via cert-manager
- `secrets.yaml` (sealed-secrets or an external secret manager — never commit plain secrets)

For a first launch, the Docker Compose setup + a single VM (or a PaaS like Render/Railway/Fly.io
for the backend + Vercel for admin-web) is simpler and sufficient.
