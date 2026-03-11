/**
 * PM2 Ecosystem Config - Skillarix
 * Ports: 3006 Backend (FastAPI) | 3005 Frontend (Vite React)
 */

module.exports = {
    apps: [
        // Backend - FastAPI via Uvicorn
        {
            name: "skillarix-backend",
            cwd: "./backend",
            script: "python",
            args: "-m uvicorn app.main:app --host 0.0.0.0 --port 3006",
            max_memory_restart: "512M",
            env_production: {
                NODE_ENV: "production",
                PORT: 3006,
            },
        },

        // Frontend - Vite React app
        {
            name: "skillarix-frontend",
            cwd: "./frontend",
            script: "npm",
            args: "run dev -- --host 0.0.0.0 --port 3005",
            env_file: "./frontend/.env",
            env_production: {
                NODE_ENV: "production",
                PORT: 3005,
            },
        },
    ],
};

