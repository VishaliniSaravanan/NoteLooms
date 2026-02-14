# Commands to run Notelooms locally

Backend code is unchanged. Use either **native (Python + Node)** or **Docker**.

---

## Option A: Native (no Docker)

### 1. Backend (terminal 1)

```bash
cd Backend
pip install -r requirements.txt
```

Create `Backend/.env` with your keys (e.g. `GEMINI_API_KEY`, `YOUTUBE_API_KEY`). Then:

```bash
python App.py
```

Backend: **http://localhost:5000**

### 2. Frontend (terminal 2)

**Development (hot reload):**

```bash
cd Frontend
npm install
npm run dev
```

Frontend: **http://localhost:5173** (uses backend at `http://127.0.0.1:5000` by default in dev)

**Production-style (build + serve static only, no `npm run dev`):**

```bash
cd Frontend
npm install
npm run build
npx serve dist -l 5173
```

Then open **http://localhost:5173**. Static files only; API calls go to backend at `http://127.0.0.1:5000` if `VITE_BACKEND_URL` was not set at build time (Vite dev default).

---

## Option B: Docker (build + static frontend, no dev server)

From the **project root** (where `docker-compose.yml` is):

```bash
docker compose build
docker compose up
```

- Backend: **http://localhost:5000**
- Frontend (built static files via nginx): **http://localhost:80**

Stop:

```bash
docker compose down
```

### Check backend image size (target 300–500 MB)

```bash
docker compose build backend
docker images
```

Look for the backend image size in the list.

---

## Summary

| How you run        | Backend              | Frontend                    |
|--------------------|----------------------|-----------------------------|
| Native dev         | `python App.py`      | `npm run dev`               |
| Native prod-style  | `python App.py`      | `npm run build` then `npx serve dist -l 5173` |
| Docker             | `docker compose up`  | Built static files served by nginx (no `npm run dev`) |
