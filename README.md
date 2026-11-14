# LUNAR CHRONOS

### An integrated lunar mission-planning prototype

**By N. Sahra · NASA Space Apps Challenge 2026**

![LUNAR CHRONOS application dashboard](lunar%20app%202.JPG)

**Explore the Moon. Plan with precision.**

LUNAR CHRONOS is an independently developed lunar mission-planning prototype built around an original proposed temporal framework. Developed for the NASA Space Apps Challenge 2026, under the **Lunar Landing Site Navigator** challenge, it brings together lunar mapping, solar geometry, Earth visibility analysis, mission-planning tools, and the proposed Cosmic Calendar — Universal Standard Time (UST).

---

## 1. Project overview

### 1.1 The concept

LUNAR CHRONOS explores how lunar location, observation time, solar geometry, Earth visibility, and mission activities can be considered together in one interactive environment.

The project originated from an original concept developed by N. Sahra. Its first practical implementation focuses on the lunar South Pole and selected surrounding reference locations.

### 1.2 Project objective

The objective is to provide a preliminary environment for examining lunar locations and comparing how observation time and local environmental geometry may affect mission planning.

Rather than presenting individual scientific tools as new inventions, LUNAR CHRONOS brings complementary capabilities together and introduces an original proposed temporal framework.

## 2. Main capabilities

### 2.1 Interactive lunar mapping

An interactive lunar map provides geographical context for examining selected reference locations, including the lunar South Pole, Shackleton Crater, and the de Gerlache vicinity.

The application uses Lunar Reconnaissance Orbiter Camera (LROC) Wide Angle Camera (WAC) and Narrow Angle Camera (NAC) imagery through the LROC mapping service.

These locations are reference points for exploration and comparison. They are not certified landing sites.

### 2.2 Solar elevation analysis

SPICE-based calculations determine the geometric elevation of the Sun relative to the local lunar horizon for selected locations and observation times.

This provides a preliminary indication of illumination geometry relevant to mission timing and future solar-energy assessment.

### 2.3 Earth visibility analysis

The application calculates Earth-centre elevation, angular radius, and upper- and lower-limb geometry relative to the local lunar horizon.

This provides a more detailed picture of geometric Earth visibility than a simple visible-or-not-visible indicator.

### 2.4 Time-dependent visibility analysis

An hourly sampled 708-hour Earth-visibility scan allows users to examine how geometric visibility changes over time and identify potential visibility windows for further investigation.

### 2.5 Location and scenario comparison

Mission-planning tools support the examination of different reference locations and observation scenarios. This helps users consider how location and timing affect lunar environmental geometry.

### 2.6 Mission planning and CLPS references

The application includes mission timeline functions and a reference module covering selected Commercial Lunar Payload Services (CLPS) missions.

These records provide mission context. They are not intended to constitute a complete or official CLPS mission registry.

## 3. Scientific and technical foundation

### 3.1 Scientific data and reference resources

LUNAR CHRONOS combines scientific resources and computational methods to examine lunar environmental geometry.

The principal resources include:

- JPL DE440 planetary ephemeris;
- NASA/JPL SPICE toolkit;
- SpiceyPy;
- Lunar Reconnaissance Orbiter Camera (LROC) imagery;
- USGS Gazetteer of Planetary Nomenclature;
- NASA/JPL Horizons for preliminary independent calculation comparisons.

### 3.2 Computational approach

The application uses SPICE-based calculations and lunar reference-frame information to examine the changing geometry of the Sun and Earth relative to selected lunar locations.

These calculations provide a scientific computational foundation for preliminary exploration. Their outputs remain subject to further independent testing and verification.

### 3.3 Software architecture

The application combines a Python backend using FastAPI and SpiceyPy with a frontend developed using React, TypeScript, and Vite.

OpenLayers provides the interactive mapping environment.

Together, these technologies bring scientific calculations, geographical visualization, and mission-planning functions into one prototype.

## 4. Cosmic Calendar — Universal Standard Time (UST)

### 4.1 The original timekeeping concept

The Cosmic Calendar and its proposed Universal Standard Time framework originate from N. Sahra's original conceptual work on timekeeping.

The idea was to explore whether an alternative temporal structure could help organize lunar mission activities alongside the changing environmental conditions at a particular lunar location.

### 4.2 The proposed 13-phase framework

For LUNAR CHRONOS, this concept has been translated into a proposed 13-phase temporal framework designed to provide a consistent reference for organising lunar mission timelines alongside local lunar environmental conditions.

The framework represents an original conceptual dimension of the project and is intended to complement the application's mission-planning functions.

### 4.3 Relationship with UTC

UST is a provisional proposal developed for this project. It is not an officially recognized lunar time standard.

UTC remains the authoritative time reference. The proposed UST framework is intended as a supplementary temporal layer, not a replacement for UTC.

## 5. Preliminary independent calculation comparison

### 5.1 Initial comparison

An initial comparison was undertaken to examine whether selected LUNAR CHRONOS outputs were numerically consistent with independent NASA/JPL Horizons results.

The documented test was conducted on 8 November 2026 at 12:00 UTC, at the lunar South Pole reference location.

| Parameter | LUNAR CHRONOS | Horizons |
|---|---:|---:|
| Solar elevation | +1.533300° | +1.533280° |
| Earth-centre elevation | −6.456700° | −6.456684° |

### 5.2 Interpretation and limitations

These results provide an encouraging initial numerical comparison. However, the calculations used different ephemerides and configurations.

The comparison is therefore preliminary. It is not a comprehensive or strictly like-for-like scientific validation.

Further independent testing, harmonisation of calculation configurations, and a documented assessment of numerical tolerances are required before broader scientific conclusions can be drawn.

## 6. Limitations and scientific integrity

### 6.1 Current scope

LUNAR CHRONOS is a research and mission-planning prototype. It is not a certified operational mission system or a landing-site safety assessment.

The selected lunar locations are reference locations, not certified landing sites.

### 6.2 Capabilities not yet implemented

The current prototype does not provide:

- A complete LOLA-based terrain and hazard assessment;
- Terrain-resolved 3D surface analysis;
- A complete solar-power generation model;
- A terrain-aware operational communications-link assessment;
- A complete solar-elevation time curve over the 708-hour scan.

### 6.3 Interpretation of environmental results

Geometric Earth visibility does not establish the availability of an operational communications link.

Terrain obstruction, antenna characteristics, link budgets, and communications network availability require further modelling.

The application's scientific outputs remain subject to further independent verification. These distinctions are important: preliminary calculations should not be mistaken for validated operational results.

## 7. Future development

### 7.1 Scientific validation

Planned work includes:

- Expanding independent comparisons against authoritative NASA/JPL data;
- Harmonising calculation configurations and documenting assumptions;
- Assessing numerical differences and tolerances;
- Extending testing across additional dates, lunar locations, and observation conditions.

### 7.2 Lunar terrain and 3D visualisation

Future development may include:

- Integrating verified lunar elevation and topographic datasets, including relevant LOLA data;
- Developing interactive 3D lunar terrain visualisation;
- Progressively introducing terrain-aware analysis, including slopes and horizon obstruction.

### 7.3 Environmental and mission-operations analysis

Planned improvements include:

- Adding solar-elevation curves alongside Earth-visibility analysis;
- Improving the identification and timing of solar and Earth horizon crossings;
- Developing more complete illumination and solar-energy assessment;
- Progressing towards terrain-aware communications analysis, including future consideration of antenna characteristics and link budgets.

### 7.4 Mission planning and temporal development

Further development may include:

- Expanding the range of lunar reference locations using verified coordinates;
- Improving scenario comparison and mission-timeline organisation;
- Further developing the proposed UST framework as a supplementary temporal layer while retaining UTC as the authoritative reference.

### 7.5 Progressive development approach

Future capabilities will depend on the availability, quality, resolution, and compatibility of authoritative scientific datasets.

Each development stage will involve identifying technical gaps, integrating appropriate data, testing calculations and visualisations, and documenting remaining uncertainties.

This roadmap describes future development objectives, not functionality claimed as already implemented.

## 8. NASA project demonstration

### 8.1 Project presentation

The seven-slide project presentation is available in this repository:

[View the LUNAR CHRONOS NASA 2026 project demonstration (PDF)](LUNAR_CHRONOS_NASA_2026_Project_Demo_FINAL_v3.pdf)

## 9. Application access

### 9.1 Source code and documentation

The application is currently available as a locally runnable prototype rather than a publicly hosted web application.

This public GitHub repository provides access to the project's source code and supporting documentation.

## 10. AI assistance and original authorship

### 10.1 Original concept and project direction

LUNAR CHRONOS originated from an original concept developed by N. Sahra, including its proposed Cosmic Calendar and Universal Standard Time (UST) framework.

### 10.2 Use of AI-assisted tools

ChatGPT (OpenAI) was used during development to assist with research, technical explanations, coding, debugging, data interpretation, and documentation. AI-assisted suggestions and code were reviewed, adapted, and evaluated by the project creator.

These tools helped translate the original concept into a practical application. They did not originate the project's central concept or replace the creator's decisions concerning its purpose, structure, proposed temporal framework, development priorities, and final presentation.

### 10.3 Responsibility and scientific verification

The project's central concept, design direction, proposed temporal framework, and principal development decisions remain the creator's own.

The project creator remained responsible for directing the development process, reviewing and adapting technical suggestions, and assessing the results.

AI assistance does not constitute independent scientific validation of the application's calculations or results.

---

**Explore the Moon. Plan with precision.**
