# Coding Contest Site

A full-stack coding contest platform with:

- React frontend in `frontend/`
- Node/Express backend in `backend/`
- Redis + BullMQ job queue

## Prerequisites

- Node.js 18+
- npm
- Redis running locally on `localhost:6379`

## Setup

1. Install dependencies from the repository root:

```bash
npm install
npm --prefix frontend install
npm --prefix backend install
```

2. Start Redis locally if it is not already running.

## Running the Application

### Recommended workflow

```bash
npm run dev
```

This starts:

- backend API (`backend/index.js`)
- worker (`backend/worker.js`)
- frontend dev server (`frontend`)

> Note: `npm run dev` assumes Redis is already running.

### Full stack startup

```bash
npm start
```

This starts:

- backend API
- worker
- frontend dev server

## Available Scripts

| Script              | Description                                  |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Start backend, worker, and frontend          |
| `npm start`         | Start backend, worker, and frontend          |
| `npm run backend`   | Start backend API only                       |
| `npm run worker`    | Start the worker process                      |
| `npm run frontend`  | Start frontend only                          |
| `npm run judge`     | Start Redis wait and then run the worker     |

## Local URLs

- Frontend: http://localhost:8080
- Backend API: http://localhost:3000
- Redis: `localhost:6379`

## Troubleshooting

### Redis connection refused

Make sure Redis is running locally and accessible at `localhost:6379`.

### Port already in use

Find and kill the process using the port:

```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Worker not processing jobs

Check that:

1. Redis is running locally
2. Backend is running
3. `npm run worker` or `npm run dev` is running properly

## Notes

- `npm run dev` is the recommended development command.
- `npm start` also starts the app, assuming Redis is available.

---

**Ready to start?** Run `npm run dev` and open http://localhost:8080

