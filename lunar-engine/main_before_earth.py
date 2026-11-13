

from datetime import datetime, timezone
from pathlib import Path
import math

import spiceypy as spice
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

BASE_DIR = Path(__file__).resolve().parent
KERNEL_DIR = BASE_DIR / "kernels"

KERNELS = [
    "naif0012.tls",
    "pck00011.tpc",
    "moon_de440_250416.tf",
    "moon_pa_de440_200625.bpc",
    "de440.bsp",
]

MOON_RADIUS_KM = 1737.4
MOON_FRAME = "MOON_ME_DE440_ME421"

app = FastAPI(
    title="Lunar Chronos API",
    description="Scientific calculation backend for Lunar Chronos",
    version="0.3.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

kernels_loaded = False
kernel_error = None


@app.on_event("startup")
def load_spice_kernels():
    global kernels_loaded, kernel_error

    try:
        spice.kclear()

        for filename in KERNELS:
            kernel_path = KERNEL_DIR / filename

            if not kernel_path.is_file():
                raise FileNotFoundError(
                    f"Missing SPICE kernel: {kernel_path}"
                )

            spice.furnsh(str(kernel_path))

        if spice.namfrm(MOON_FRAME) == 0:
            raise RuntimeError(
                f"SPICE frame unavailable: {MOON_FRAME}"
            )

        kernels_loaded = True
        kernel_error = None

    except Exception as exc:
        kernels_loaded = False
        kernel_error = str(exc)


@app.get("/")
def home():
    return {
        "project": "Lunar Chronos",
        "status": "Backend running",
        "scientific_engine": (
            "SPICE ready" if kernels_loaded else "Not available"
        ),
    }


@app.get("/health")
def health():
    return {
        "status": "healthy" if kernels_loaded else "degraded",
        "spiceypy_available": True,
        "kernels_loaded": kernels_loaded,
        "calculations_enabled": kernels_loaded,
        "kernel_error": kernel_error,
    }


@app.get("/solar/elevation")
def solar_elevation(
    latitude: float = Query(-89.67, ge=-90, le=90),
    longitude: float = Query(129.78, ge=-180, le=180),
    date_time: str = Query("2026-11-03T12:00:00"),
):
    if not kernels_loaded:
        raise HTTPException(
            status_code=503,
            detail=f"SPICE kernels are not ready: {kernel_error}",
        )

    try:
        observation_time = datetime.fromisoformat(date_time)

        if observation_time.tzinfo is None:
            observation_time = observation_time.replace(
                tzinfo=timezone.utc
            )

        utc_text = observation_time.astimezone(
            timezone.utc
        ).strftime("%Y-%m-%dT%H:%M:%S")

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid date_time: {str(exc)}",
        )

    try:
        et = spice.utc2et(utc_text)

        lat_rad = math.radians(latitude)
        lon_rad = math.radians(longitude)

        point = [
            MOON_RADIUS_KM * math.cos(lat_rad) * math.cos(lon_rad),
            MOON_RADIUS_KM * math.cos(lat_rad) * math.sin(lon_rad),
            MOON_RADIUS_KM * math.sin(lat_rad),
        ]

        sun_state, _ = spice.spkezr(
            "SUN",
            et,
            MOON_FRAME,
            "NONE",
            "MOON",
        )

        sun_position = sun_state[:3]

        sun_direction = [
            sun_position[i] - point[i]
            for i in range(3)
        ]

        direction_unit = spice.vhat(sun_direction)
        normal_unit = spice.vhat(point)

        dot_product = spice.vdot(
            normal_unit,
            direction_unit,
        )

        dot_product = max(-1.0, min(1.0, dot_product))

        elevation = math.degrees(
            math.asin(dot_product)
        )

        return {
            "project": "Lunar Chronos",
            "calculation": "Solar elevation",
            "date_time_utc": utc_text,
            "latitude_deg": latitude,
            "longitude_deg": longitude,
            "solar_elevation_deg": round(elevation, 4),
            "sun_above_reference_horizon": elevation > 0,
            "reference_frame": MOON_FRAME,
            "ephemeris": "JPL DE440",
            "surface_model": "Spherical Moon",
            "reference_radius_km": MOON_RADIUS_KM,
            "terrain_obstruction_included": False,
            "coordinate_convention_verified": False,
            "scientific_status": (
                "Geometric calculation; coordinate convention "
                "and terrain effects require further validation."
            ),
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Solar calculation failed: {str(exc)}",
        )
