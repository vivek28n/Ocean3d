# Ocean3D Data Directory
This folder stores downloaded or generated oceanographic data files (NetCDF .nc, CSV, Argo profiles, and model grid extracts).
In the MVP, data is served dynamically by the Xarray-compatible synthetic ocean data engine in `backend/data_engine.py`.
Real-world NetCDF and Copernicus Marine data files should be placed here for future production ingestion.
