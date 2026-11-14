# LUNAR CHRONOS

### An integrated lunar mission-planning prototype

**NASA Space Apps Challenge 2026**

**Challenge:** Lunar Landing Site Navigator

**Developed by:** N. Sahra

*Explore the Moon. Plan with precision.*

![LUNAR CHRONOS application dashboard](lunar%20app%202.JPG)

## Project overview

LUNAR CHRONOS is an independently developed lunar mission-planning prototype with an original proposed temporal framework.

Developed for the NASA Space Apps Challenge 2026, under the Lunar Landing Site Navigator challenge, it brings together interactive lunar mapping, SPICE-based astronomical calculations, solar elevation analysis, Earth visibility geometry and mission-planning capabilities within a single application.

The prototype focuses on the lunar South Pole, where illumination conditions, visibility of Earth and the timing of surface activities are important considerations for future exploration.

Its distinguishing contribution is the integration of these capabilities with the **Cosmic Calendar — Universal Standard Time (UST)**, an original proposed 13-phase temporal framework designed to organise lunar mission timelines alongside local lunar environmental conditions.

UST is a proposed concept, not an official lunar time standard. UTC remains the authoritative time reference in the application.

LUNAR CHRONOS is a research and development prototype. It is not a certified landing-site assessment tool, an operational lunar navigation service or a scientifically validated mission-operations platform.

## Main capabilities

### Interactive lunar mapping

The application provides an interactive lunar map with a focus on the lunar South Pole and selected locations of interest, including Shackleton Crater and the de Gerlache vicinity.

It uses Lunar Reconnaissance Orbiter Camera (LROC) Wide Angle Camera (WAC) and Narrow Angle Camera (NAC) imagery through the LROC mapping service.

The displayed locations are reference points for exploration and comparison. They are not certified landing sites.

### Solar elevation analysis

SPICE-based calculations determine the geometric elevation of the Sun relative to the local lunar horizon for selected locations and observation times.

These calculations provide a preliminary basis for examining local illumination conditions. They do not yet constitute a complete terrain-aware solar exposure or power-generation model.

### Earth visibility analysis

The application examines the geometric visibility of Earth from selected lunar locations. Its outputs include Earth-centre elevation, apparent angular radius, and upper- and lower-limb elevation.

A time-dependent visibility scan is also available, using hourly sampling over a 708-hour analysis window.

Geometric visibility does not establish radio-link availability, communication quality or operational connectivity.

### Mission planning

The prototype includes mission-planning functionality for organising activities and examining selected environmental conditions at relevant mission times.

The Mission Operations Planner supports comparison of solar elevation and geometric Earth visibility at the beginning and end of a selected activity for up to two reference locations.

This is a geometric snapshot comparison, not a complete assessment of mission feasibility, terrain obstruction, communications performance or energy requirements.

### Cosmic Calendar — Universal Standard Time

The Cosmic Calendar introduces a proposed 13-phase temporal framework for organising lunar mission timelines.

It is intended to provide an additional temporal reference alongside UTC, while keeping UTC as the authoritative time standard.

The current implementation is provisional. It uses UTC-based date-time arithmetic and a custom epoch. It does not provide a complete UTC-to-lunar-local-time conversion, a leap-second model or an actual lunar phase prediction.

### CLPS mission references

The application includes selected Commercial Lunar Payload Services (CLPS) mission references to provide context for lunar exploration activities.

These records are a curated selection, not an exhaustive or continuously updated mission registry.

## Scientific and technical architecture

LUNAR CHRONOS combines a Python-based scientific calculation backend with a browser-based application interface.

**Scientific computation and data**

- NASA/JPL Development Ephemeris DE440.
- NAIF SPICE toolkit and lunar orientation kernels.
- SpiceyPy for Python access to SPICE functionality.
- NASA/JPL Horizons for independent computational comparison.

**Application architecture**

- Python and FastAPI for the calculation backend.
- React and TypeScript for the application interface.
- Vite for development and production builds.
- OpenLayers for interactive mapping.
- LROC WAC and NAC imagery services for lunar visualisation.

The application uses SPICE-based calculations and lunar orientation information to support its geometric analyses. The numerical outputs remain subject to further independent testing and scientific verification.

## Preliminary computational comparison

A preliminary comparison has been conducted between selected LUNAR CHRONOS outputs and NASA/JPL Horizons.

The documented test was conducted on 8 November 2026 at 12:00 UTC, at the lunar South Pole reference location.

| Parameter | LUNAR CHRONOS | NASA/JPL Horizons |
|---|---:|---:|
| Solar elevation | +1.533300° | +1.533280° |
| Earth-centre elevation | −6.456700° | −6.456684° |

These results provide an encouraging initial numerical comparison. However, the two calculations used different ephemerides and computational configurations.

The comparison is therefore preliminary, not a strict like-for-like validation or proof of scientific accuracy.

Further testing, configuration harmonisation, documented tolerances and independent verification are required before scientific validation can be claimed.

## Current limitations

The current prototype has a defined scope and several areas requiring further development.

- It does not provide certified landing-site safety assessments or complete terrain-hazard analysis.
- Its solar calculations do not yet constitute a complete terrain-aware illumination or solar-power model.
- Its Earth visibility calculations are geometric and do not establish communications availability.
- It does not yet include a complete LOLA-based terrain analysis or terrain-aware Earth-visibility assessment.
- The proposed UST framework is experimental and does not replace UTC.
- Selected mission and location records require continued review and verification.

These limitations distinguish implemented functionality from future development objectives.

## Future development

The next development stages are intended to strengthen the scientific basis and extend the planning capabilities of LUNAR CHRONOS.

Priority areas include:

1. **Scientific validation:** independent comparison of calculations, reproducible test cases, documented assumptions and quantitative error tolerances.
2. **Lunar terrain analysis:** integration and evaluation of additional LRO datasets, including LOLA elevation data and further LROC imagery.
3. **Environmental analysis:** investigation of thermal conditions, illumination, shadowing and relevant public lunar datasets.
4. **Mission operations:** development of more comprehensive mission timelines and environmental planning tools.
5. **Energy and infrastructure planning:** exploration of solar exposure, energy requirements and potential surface infrastructure applications.
6. **Temporal framework research:** further examination of the proposed UST concept and its possible adaptation to other planetary environments.

These are proposed development objectives. They should not be interpreted as capabilities already implemented or scientifically validated.

## Project demonstration

The seven-slide NASA Space Apps Challenge project presentation is available here:

[View the LUNAR CHRONOS NASA 2026 project demonstration (PDF)](LUNAR_CHRONOS_NASA_2026_Project_Demo_FINAL_v3.pdf)

## Full technical documentation

The complete project documentation provides further details on the original concept, application capabilities, scientific and technical architecture, proposed UST framework, preliminary computational comparison, current limitations and future development roadmap.

[Read the complete LUNAR CHRONOS project documentation](docs/PROJECT_DOCUMENTATION.md)

## Running the application

LUNAR CHRONOS is a locally runnable prototype rather than a hosted web application.

The repository contains the application source code, backend components and supporting files. Running the complete application requires the appropriate local development environment and dependencies.

The `README.txt` file provides separate instructions for the Mission Operations Planner installation package. Those instructions apply to that component and are not a complete installation guide for the entire application.

## Scientific data and references

The project draws on publicly available scientific resources and software documentation, including:

- [NASA/JPL Solar System Dynamics — Planetary and Lunar Ephemerides](https://ssd.jpl.nasa.gov/planets/eph_export.html)
- [NASA NAIF — SPICE Toolkit](https://naif.jpl.nasa.gov/)
- [NASA/JPL Horizons](https://ssd.jpl.nasa.gov/horizons/)
- [Lunar Reconnaissance Orbiter Camera — LROC](https://data.lroc.im-ldi.com/lroc/)
- [USGS Gazetteer of Planetary Nomenclature](https://planetarynames.wr.usgs.gov/)
- [Lunaserv](https://lunaserv.im-ldi.com/about.html)
- [SpiceyPy documentation](https://spiceypy.readthedocs.io/)
- [OpenLayers documentation](https://openlayers.org/)
- [React documentation](https://react.dev/)
- [TypeScript documentation](https://www.typescriptlang.org/)
- [FastAPI documentation](https://fastapi.tiangolo.com/)
- [Vite documentation](https://vite.dev/)

## AI-assisted development and original authorship

The original LUNAR CHRONOS concept and the proposed Cosmic Calendar temporal framework were developed by N. Sahra.

ChatGPT (OpenAI) was used during development to assist with research, technical explanations, coding, debugging, data interpretation and documentation. AI-assisted suggestions and code were reviewed, adapted and evaluated by the project creator.

AI assistance does not constitute independent scientific validation. Responsibility for the project concept, development decisions, interpretation and submitted work remains with the developer.

---

**LUNAR CHRONOS**

*Explore the Moon. Plan with precision.*

Developed by N. Sahra  
NASA Space Apps Challenge 2026
