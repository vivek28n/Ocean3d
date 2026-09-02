Ocean3D 🌊

Ocean3D is an interactive 3D ocean visualization and analysis platform built to explore ocean conditions across different parameters, depths, locations, and time steps.

The project combines a modern React-based 3D interface with a FastAPI backend to visualize ocean model data, compare it with observational data, detect anomalies, and present useful analytical insights.


[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61DAFB.svg)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/3D%20Engine-Three.js-black.svg)](https://threejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](#)


✨ Features

🌊 Interactive 3D ocean visualization

🌡️ Sea Surface Temperature (SST) visualization

🧂 Salinity visualization

📏 Sea Surface Height (SSH) visualization

🌀 Current velocity visualization

🔍 Interactive model vs observation comparison

📊 Difference / residual visualization

🚨 Z-score based anomaly detection

📍 Interactive observation stations

⏱️ Time-step navigation and playback

🏊 Depth-wise exploration

📈 Analytics and statistical summaries

🧭 Region-based exploration

⚡ FastAPI REST API backend

🎨 Modern responsive interface

🛠️ Tech Stack

Frontend

React

TypeScript

Vite

Three.js

React Three Fiber

Tailwind CSS

Recharts

Lucide React

Backend

Python

FastAPI

Pydantic

NumPy

Pandas

🏗️ Architecture

                    Ocean3D
                       │
          ┌────────────┴────────────┐
          │                         │
      Frontend                  Backend
          │                         │
   React + TypeScript          FastAPI
          │                         │
   Three.js / R3F              Data Engine
          │                         │
          └────────────┬────────────┘
                       │
                Ocean Data Layer
                       │
        ┌──────────────┼──────────────┐
        │              │              │
      Model       Observations     Analytics
        │              │              │
        └──────────────┼──────────────┘
                       │
             Comparison & Anomalies

📁 Project Structure

Ocean3d/
├── backend/
│   ├── main.py
│   ├── data_engine.py
│   ├── models.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── api.ts
│   │   ├── types.ts
│   │   ├── App.tsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.ts
│
└── README.md

🚀 Getting Started

Prerequisites

Make sure you have the following installed:

Node.js

npm

Python 3.10+

1. Clone the repository

git clone https://github.com/vivek28n/Ocean3d.git
cd Ocean3d

2. Start the backend

cd backend
pip install -r requirements.txt
uvicorn main:app --reload

The backend will be available at:

http://127.0.0.1:8000

API documentation:

http://127.0.0.1:8000/docs

3. Start the frontend

Open another terminal:

cd frontend
npm install
npm run dev

The frontend will be available at:

http://127.0.0.1:5173

🔌 API

The backend provides REST endpoints for:

Health checks

Available parameters

Ocean regions

Ocean grid data

Observation data

Model vs observation comparison

Anomaly detection

Statistical summaries

Time-series analysis

📊 Data

The current version uses deterministic synthetic ocean-model data and simulated in-situ observations for development and visualization.

The data pipeline is structured so that real ocean datasets can be integrated in future versions without changing the overall application architecture.

🔎 Analysis

Ocean3D compares modeled values with observational values and calculates their difference:

Difference = Observed Value − Model Value

It also uses statistical analysis to identify unusual observations through Z-score based anomaly detection.

The visualization makes these differences easier to inspect spatially, temporally, and across depth.

🔮 Future Improvements

Integration with real ocean datasets

NetCDF / Xarray based data processing

Argo and buoy observation integration

Larger-scale ocean datasets

Geospatial database support

Improved anomaly detection methods

Advanced ocean-state analytics

Cloud-based data processing and deployment

👨‍💻 Author

Vivek Nigam

Built as a personal full-stack visualization and data-analysis project.

⭐ If you find the project interesting, feel free to explore the code and experiment with it.
