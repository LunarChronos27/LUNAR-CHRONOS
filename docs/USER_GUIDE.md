# LUNAR CHRONOS — User guide

**NASA Space Apps Challenge 2026**  
**Challenge:** Lunar Landing Site Navigator  
**Developed by:** N. Sahra

*Explore the Moon. Plan with precision.*

## 1. Purpose of this guide

This guide explains how to navigate and use the current LUNAR CHRONOS prototype.

The application brings together lunar mapping, SPICE-based geometric calculations, Earth visibility analysis, mission-planning functions and the proposed Cosmic Calendar — Universal Standard Time (UST).

The guide describes the functionality available in the current prototype. It does not describe proposed future capabilities as implemented features.

## 2. Starting the application

LUNAR CHRONOS is a locally runnable application, not a publicly hosted web service.

The complete development environment requires the frontend, Python backend, dependencies and the SPICE kernel files used by the calculation engine.

### 2.1 Start the scientific backend

From the repository's root directory, open a terminal and start the FastAPI backend:

```powershell
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

The backend is expected to run locally at:

`http://127.0.0.1:8000`

Check its health endpoint in a browser:

`http://127.0.0.1:8000/health`

The health response reports whether the SPICE kernels have loaded and whether calculations are enabled. A healthy response is required before relying on the scientific calculation functions. If the backend reports a degraded status or a kernel error, the calculation engine is not ready.

### 2.2 Start the application interface

Open a second terminal in the repository's root directory.

Install the frontend dependencies if this is the first setup:

```powershell
npm install
```

Start the Vite development server:

```powershell
npm run dev
```

Open the local address displayed by Vite, normally:

`http://localhost:5173`

Keep both terminal processes running while using the application.

**Note:** The repository's `README.txt` contains separate instructions for the Mission Operations Planner installation package. It is not a complete installation guide for the full LUNAR CHRONOS application.

## 3. Dashboard and navigation

The dashboard provides access to the principal application modules:

- Overview.
- Lunar map.
- Mission setup.
- Cosmic Calendar.
- Telemetry.
- Visibility scan.
- CLPS missions.

The modules provide different views of the lunar environment and mission-planning information. Their outputs should be interpreted together rather than as independent proof of mission feasibility.

## 4. Exploring the lunar map

Open **Lunar map** to explore the lunar surface and the selected areas of interest.

The prototype focuses on the lunar South Pole and includes reference locations such as:

- Lunar South Pole.
- Shackleton Crater.
- de Gerlache vicinity.

The map uses LROC imagery services, including Wide Angle Camera (WAC) and Narrow Angle Camera (NAC) imagery.

Use the map to examine the displayed lunar region and understand the geographical context of the selected reference locations.

**Important:** The displayed coordinates and markers are reference points for exploration and comparison. They are not certified landing sites, and the map does not provide a complete terrain-hazard or landing-safety assessment.

## 5. Mission setup and location selection

Open **Mission setup** to configure the location and observation time used for the relevant mission-planning calculations.

Select an available reference location or enter coordinates where the interface permits custom coordinates.

Check the latitude and longitude before proceeding. Coordinate conventions and reference locations should be treated carefully, particularly when comparing results with external lunar datasets.

Enter the observation date and time using UTC.

UTC is the authoritative time reference for the application's astronomical calculations. Do not assume that a local computer time or a displayed UST value is interchangeable with UTC.

## 6. Solar elevation analysis

The solar elevation function examines the geometric elevation of the Sun relative to the local lunar horizon.

To examine a result:

1. Select the reference location.
2. Set the observation date and time in UTC.
3. Run or consult the solar elevation calculation.
4. Review the reported elevation value and associated information.

The interpretation is:

- A positive elevation indicates that the Sun is above the modelled reference horizon.
- A negative elevation indicates that the Sun is below the modelled reference horizon.
- A value close to zero indicates proximity to the geometric horizon.

The current calculation uses a spherical lunar reference model and SPICE-based astronomical data.

It does not include complete terrain obstruction, a detailed local slope model or a complete solar-power assessment. A positive result therefore does not guarantee direct sunlight at a particular surface location.

## 7. Earth visibility analysis

The Earth visibility function examines the apparent geometric position of Earth from the selected lunar location and observation time.

The principal outputs include:

**Earth-centre elevation:** The elevation of the apparent centre of Earth relative to the reference horizon.

**Earth angular radius:** The apparent angular radius of Earth's disk as viewed from the observation point.

**Upper-limb elevation:** The elevation of the upper edge of Earth's apparent disk.

**Lower-limb elevation:** The elevation of the lower edge of Earth's apparent disk.

The results can be interpreted as follows:

- If the upper limb is below the horizon, the modelled Earth disk is entirely below the geometric horizon.
- If the upper limb is above the horizon but the lower limb is below it, part of the apparent Earth disk is geometrically visible.
- If the lower limb is at or above the horizon, the entire apparent Earth disk is geometrically above the horizon.

These are geometric visibility results. They do not establish radio-link availability, antenna compatibility, signal strength, communication quality or operational connectivity.

The current model does not include local terrain obstruction or atmospheric refraction.

## 8. Earth visibility scan

Open **Visibility scan** to examine how geometric Earth visibility changes over a period of time.

The current analysis supports a 708-hour window with hourly sampling.

The scan identifies sampled periods during which at least part of Earth's apparent disk is geometrically above the reference horizon.

When reviewing the results:

1. Check the selected reference location.
2. Check the starting date and time in UTC.
3. Review the analysis period and sampling interval.
4. Examine the resulting visibility intervals and their UTC timestamps.

The reported intervals are based on discrete samples. Their boundaries are therefore limited by the sampling interval and are not precise interpolated transition times.

The scan is a geometric analysis, not a communications-window certification.

## 9. Cosmic Calendar — Universal Standard Time (UST)

Open **Cosmic Calendar** to examine the proposed Universal Standard Time framework.

UST is an original proposed 13-phase temporal framework intended to provide an additional way of organising lunar mission timelines alongside UTC.

The calendar provides a supplementary temporal representation. UTC remains the authoritative time reference.

The current implementation is provisional. It uses UTC-based date-time arithmetic and a custom epoch. It does not provide a complete UTC-to-lunar-local-time conversion, a leap-second model or an actual lunar phase prediction.

UST should therefore be understood as an experimental organisational framework, not an official lunar time standard.

When comparing mission events, retain their UTC timestamps as the primary reference.

## 10. Mission Operations Planner

The Mission Operations Planner supports the organisation and comparison of selected mission activities.

The current functionality allows users to examine solar elevation and geometric Earth visibility at the beginning and end of a selected activity for up to two reference locations.

A typical workflow is:

1. Open the Mission Operations Planner.
2. Enter or select the activity information requested by the interface.
3. Select the reference location or locations.
4. Set the relevant activity start and end times.
5. Review the calculated environmental conditions at the selected times.
6. Compare the results between the selected locations.

The comparison provides geometric snapshots at the specified activity times.

It does not constitute a complete mission-feasibility assessment. It does not independently establish terrain safety, communications performance, power availability or operational suitability.

## 11. CLPS Mission Browser

Open **CLPS missions** to consult the selected Commercial Lunar Payload Services mission references included in the prototype.

The module provides mission context and selected information about lunar exploration activities.

The records are a curated selection. They are not an exhaustive or continuously updated CLPS mission registry.

Mission details and planned dates should be checked against the relevant official mission sources before being used in formal planning or research.

## 12. Understanding the results and their limitations

LUNAR CHRONOS is an independently developed lunar mission-planning prototype. Its calculations and outputs should be interpreted within the scope of the current implementation.

In particular:

- Solar elevation is based on a geometric reference model and does not account for complete local terrain obstruction.
- Earth visibility is geometric and does not establish communications availability.
- Visibility scan intervals depend on the selected sampling resolution.
- Map markers are reference locations, not certified landing sites.
- The proposed UST framework is experimental and does not replace UTC.
- The prototype does not provide certified landing-site safety assessments or complete terrain-hazard analysis.
- Numerical outputs remain subject to further independent scientific verification.

A preliminary comparison with NASA/JPL Horizons is documented separately in the project documentation. It should not be interpreted as complete scientific validation.

## 13. Suggested end-to-end exploration workflow

For a first exploration of LUNAR CHRONOS, the following sequence provides a practical overview:

1. Start the backend and frontend, then check the backend health status.
2. Open the application dashboard and review the available modules.
3. Explore the lunar map and identify a reference location.
4. Open Mission setup and select the location and observation time in UTC.
5. Examine the solar elevation result.
6. Examine Earth's geometric visibility at the same location and time.
7. Use Visibility scan to examine changes in geometric visibility over the analysis period.
8. Consult the Cosmic Calendar to see the supplementary proposed UST representation.
9. Use the Mission Operations Planner to compare selected activity times and reference locations.
10. Consult the CLPS Mission Browser for selected mission context.

This workflow demonstrates how the existing modules can be used together to explore lunar environmental conditions and organise preliminary mission-planning scenarios.

## 14. Further information

For further details, consult the other repository documents:

- [Project overview and demonstration](../README.md).
- [Complete project documentation](PROJECT_DOCUMENTATION.md).
- [NASA Space Apps Challenge project demonstration](../LUNAR_CHRONOS_NASA_2026_Project_Demo_FINAL_v3.pdf).

Scientific data sources and technical references are listed in the main project documentation.

---

**LUNAR CHRONOS**  
*Explore the Moon. Plan with precision.*

Developed by N. Sahra  
NASA Space Apps Challenge 2026
