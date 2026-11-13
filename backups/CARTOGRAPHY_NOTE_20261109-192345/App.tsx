
import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import 'ol/ol.css';
import './App.css';
import CLPSBrowser from './CLPSBrowser';
import USTMissionTimeline from './USTMissionTimeline';
import MissionOperationsPlanner from './MissionOperationsPlanner';
import SiteDateComparison from './SiteDateComparison';

const WMS_URL = 'https://wms.im-ldi.com/';
const API_URL = 'http://127.0.0.1:8000';

type SolarResult = {
  solar_elevation_deg: number;
  sun_above_reference_horizon: boolean;
  reference_frame: string;
  ephemeris: string;
  terrain_obstruction_included: boolean;
  coordinate_convention_verified: boolean;
  scientific_status: string;
};

type EarthResult = {
  earth_centre_elevation_deg: number;
  earth_angular_radius_deg: number;
  earth_upper_limb_elevation_deg: number;
  earth_lower_limb_elevation_deg: number;
  earth_distance_km: number;
  visibility: string;
  any_part_geometrically_visible: boolean;
  entire_disk_geometrically_visible: boolean;
  scientific_status: string;
};

type WindowResult = {
  start_utc: string;
  end_utc: string;
};

type VisibilitySample = {
  date_time_utc: string;
  earth_upper_limb_elevation_deg: number;
  any_part_geometrically_visible: boolean;
};

type WindowsResponse = {
  sample_count: number;
  duration_hours: number;
  sampling_interval_minutes: number;
  visible_windows: WindowResult[];
  samples: VisibilitySample[];
  scientific_status: string;
};

function VisibilityProfile({
  samples,
}: {
  samples: VisibilitySample[];
}) {
  if (!Array.isArray(samples) || samples.length < 2) {
    return (
      <p className="technical-note">
        Insufficient sampled data to display the visibility profile.
      </p>
    );
  }

  const values = samples.map(
    sample => sample.earth_upper_limb_elevation_deg
  );

  const minimum = Math.min(0, ...values);
  const maximum = Math.max(0, ...values);
  const range = Math.max(1, maximum - minimum);

  const x = (index: number) =>
    (index / (samples.length - 1)) * 1000;

  const y = (value: number) =>
    18 + ((maximum - value) / range) * 190;

  const line = samples
    .map((sample, index) =>
      `${index === 0 ? 'M' : 'L'} ${x(index).toFixed(2)} ${y(sample.earth_upper_limb_elevation_deg).toFixed(2)}`
    )
    .join(' ');

  const horizonY = y(0);
  const visibleCount = samples.filter(
    sample => sample.any_part_geometrically_visible
  ).length;

  return (
    <div className="visibility-profile">
      <div className="visibility-profile-heading">
        <strong>EARTH UPPER-LIMB ELEVATION</strong>
        <span>
          {visibleCount} / {samples.length} visible samples
        </span>
      </div>

      <svg
        className="visibility-chart"
        viewBox="0 0 1000 240"
        role="img"
        aria-label="Sampled Earth upper-limb elevation over the 708-hour scan. The zero-degree line represents the geometric horizon."
      >
        <line
          x1="0"
          y1={horizonY}
          x2="1000"
          y2={horizonY}
          className="visibility-horizon"
        />

        <path
          d={line}
          className="visibility-profile-line"
        />

        <text x="8" y="14" className="visibility-axis-label">
          {maximum.toFixed(2)}°
        </text>

        <text
          x="8"
          y="232"
          className="visibility-axis-label"
        >
          {minimum.toFixed(2)}°
        </text>

        <text
          x="992"
          y={Math.max(14, Math.min(230, horizonY - 7))}
          textAnchor="end"
          className="visibility-horizon-label"
        >
          0° HORIZON
        </text>
      </svg>

      <div className="visibility-profile-axis">
        <span>{samples[0].date_time_utc} UTC</span>
        <span>{samples[samples.length - 1].date_time_utc} UTC</span>
      </div>

      <p className="technical-note">
        Positive upper-limb elevation indicates that some part of the
        Earth's apparent disk is geometrically above the reference
        horizon. Negative values indicate that the entire disk is
        below it. Sampling interval: 60 minutes. No terrain obstruction
        or communications availability is included.
      </p>
    </div>
  );
}
type USTResult = {
  calendar_name: string;
  calendar_version: string;
  epoch_identifier: string;
  epoch_utc: string;
  input_utc: string;
  reference_time_scale: string;
  time_conversion_status: string;
  time_conversion_model: string;
  time_conversion_uncertainty: number | null;
  elapsed_seconds: number;
  cycle_number: number;
  phase_number: number;
  phases_per_cycle: number;
  phase_progress_percent: number;
  phase_elapsed_seconds: number;
  cycle_elapsed_seconds: number;
  cycle_duration_days: number;
  cycle_duration_seconds: number;
  phase_duration_days: number;
  phase_duration_seconds: number;
  scientific_status: string;
  tcl_value: string | null;
  tcl_conversion_performed: boolean;
  actual_lunar_phase: string | null;
};

const locations = [
  {
    id: 'south-pole',
    name: 'Lunar South Pole',
    description: 'General reference region near the lunar South Pole.',
    coordinates: 'Regional reference · 90° S',
    center: [0, -89.5] as [number, number],
    zoom: 3,
    latitude: -90,
    longitude: 0,
  },
  {
    id: 'shackleton',
    name: 'Shackleton Crater',
    description:
      'USGS–IAU Gazetteer centre coordinates; planetographic, positive east.',
    coordinates: '89.67° S · 129.78° E',
    center: [129.78, -89.67] as [number, number],
    zoom: 5,
    latitude: -89.67,
    longitude: 129.78,
  },
  {
    id: 'de-gerlache',
    name: 'de Gerlache Crater vicinity',
    description: 'South polar region for further investigation.',
    coordinates: 'Provisional map centre',
    center: [-87.0, -88.5] as [number, number],
    zoom: 5,
    latitude: -88.5,
    longitude: -87,
  },
];

// The automatically selected calendar date is obtained in UTC.
function getUTCDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function LunarMap({
  selectedLocation,
}: {
  selectedLocation: number;
}) {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<Map | null>(null);
  const selectedLocationRef = useRef(selectedLocation);
  selectedLocationRef.current = selectedLocation;

  const [mapStatus, setMapStatus] = useState(
    'Connecting to lunar imagery services...'
  );

  useEffect(() => {
    if (!mapElement.current || mapInstance.current) return;

    const wacLayer = new TileLayer({
      source: new TileWMS({
        url: WMS_URL,
        params: {
          SERVICE: 'WMS',
          VERSION: '1.1.1',
          REQUEST: 'GetMap',
          LAYERS: 'luna_wac_global',
          STYLES: '',
          FORMAT: 'image/jpeg',
          SRS: 'EPSG:4326',
          TRANSPARENT: false,
        },
        serverType: 'geoserver',
        crossOrigin: 'anonymous',
      }),
    });

    const nacLayer = new TileLayer({
      opacity: 1,
      source: new TileWMS({
        url: WMS_URL,
        params: {
          SERVICE: 'WMS',
          VERSION: '1.1.1',
          REQUEST: 'GetMap',
          LAYERS: 'luna_nac_sp_mosaic',
          STYLES: '',
          FORMAT: 'image/png',
          SRS: 'EPSG:4326',
          TRANSPARENT: true,
        },
        serverType: 'geoserver',
        crossOrigin: 'anonymous',
      }),
    });

    // Geographic reference markers. These are not landing-site assessments.
    const markerFeatures = locations.map((location) => {
      const feature = new Feature({
        geometry: new Point(location.center),
      });

      feature.set('locationId', location.id);
      feature.set('locationName', location.name);

      return feature;
    });

    const markerSource = new VectorSource({
      features: markerFeatures,
    });

    const markerLayer = new VectorLayer({
      source: markerSource,
      declutter: true,
      style: (feature) => {
        const isSelected =
          feature.get('locationId') ===
          locations[selectedLocationRef.current]?.id;

        return new Style({
          image: new CircleStyle({
            radius: isSelected ? 9 : 6,
            fill: new Fill({
              color: isSelected ? '#55d9f2' : '#e6b96b',
            }),
            stroke: new Stroke({
              color: '#071321',
              width: 2,
            }),
          }),
          text: new Text({
            text: String(feature.get('locationName') || ''),
            font: '600 11px sans-serif',
            offsetY: -19,
            fill: new Fill({
              color: '#ffffff',
            }),
            stroke: new Stroke({
              color: '#071321',
              width: 3,
            }),
          }),
        });
      },
    });

    const map = new Map({
      target: mapElement.current,
      layers: [wacLayer, nacLayer, markerLayer],
      view: new View({
        projection: 'EPSG:4326',
        center: locations[selectedLocation]?.center || locations[0].center,
        zoom: locations[selectedLocation]?.zoom || locations[0].zoom,
        minZoom: 1,
        maxZoom: 8,
      }),
    });

    mapInstance.current = map;

    let wacLoaded = false;
    let nacLoaded = false;
    let nacError = false;

    wacLayer.getSource()?.on('tileloadend', () => {
      wacLoaded = true;

      if (nacLoaded) {
        setMapStatus(
          'WAC background and NAC polar imagery received'
        );
      } else if (nacError) {
        setMapStatus(
          'WAC imagery received · NAC layer needs checking'
        );
      } else {
        setMapStatus(
          'Global lunar imagery received · Loading NAC polar layer'
        );
      }
    });

    nacLayer.getSource()?.on('tileloadend', () => {
      nacLoaded = true;

      setMapStatus(
        wacLoaded
          ? 'WAC background and NAC polar imagery received'
          : 'NAC polar imagery received'
      );
    });

    nacLayer.getSource()?.on('tileloaderror', () => {
      nacError = true;
      setMapStatus(
        'NAC imagery could not be loaded · WAC background retained'
      );
    });

    wacLayer.getSource()?.on('tileloaderror', () => {
      setMapStatus(
        'Some global imagery tiles could not be loaded'
      );
    });

    return () => {
      map.setTarget(undefined);
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    const location = locations[selectedLocation];

    if (!map || !location) return;

    map.getView().animate({
      center: location.center,
      zoom: location.zoom,
      duration: 1200,
    });

    map.render();
  }, [selectedLocation]);

  const activeLocation = locations[selectedLocation];

  return (
    <section className="panel map-panel" id="lunar-map">
      <div className="panel-heading">
        <div>
          <span className="module-code numbered-module-code">
            <span className="module-number">01</span>
            <span>CARTOGRAPHY</span>
          </span>
          <h2>Lunar surface map</h2>
          <p>
            South polar region · LROC WAC global imagery · NAC overlay
          </p>
        </div>

        <span className="live-indicator">MAP SERVICE</span>
      </div>

      <div className="map-frame">
        <div ref={mapElement} className="lunar-map" />

        <div className="map-overlay map-overlay-top">
          <span>SELECTED REFERENCE LOCATION</span>
          <strong>{activeLocation.name}</strong>
          <span className="map-coordinate-label">
            LAT {activeLocation.latitude.toFixed(4)}° · LON {activeLocation.longitude.toFixed(4)}°
          </span>
        </div>

        <div className="map-overlay map-overlay-bottom">
          <span>IMAGERY STATUS</span>
          <strong>{mapStatus}</strong>
        </div>
      </div>

      <div className="map-marker-legend">
        <span>
          <i className="map-marker-dot map-marker-selected" />
          Selected reference
        </span>
        <span>
          <i className="map-marker-dot map-marker-reference" />
          Other reference locations
        </span>
        <span className="map-legend-note">
          Geographic references only · Not landing-site assessments
        </span>
      </div>

      <p className="technical-note">
        Source: Lunaserv WMS. WAC global imagery and NAC polar imagery.
        Layer resolution, coverage and coordinate compatibility require
        further validation. Markers identify reference coordinates only;
        they do not represent confirmed landing sites or hazard assessments.
      </p>
    </section>
  );
}
function App() {
  const [selectedLocation, setSelectedLocation] = useState(0);

  const [selectedDate, setSelectedDate] = useState(getUTCDate);
  const [selectedTime, setSelectedTime] = useState('12:00');

  const [solarResult, setSolarResult] =
    useState<SolarResult | null>(null);

  const [earthResult, setEarthResult] =
    useState<EarthResult | null>(null);

  const [windowsResult, setWindowsResult] =
    useState<WindowsResponse | null>(null);

  const [ustResult, setUstResult] =
    useState<USTResult | null>(null);

  const [ustLoading, setUstLoading] = useState(false);
  const [ustError, setUstError] = useState('');

  const [isCalculating, setIsCalculating] = useState(false);
  const [isCheckingEarth, setIsCheckingEarth] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');

  const activeLocation = locations[selectedLocation];

  useEffect(() => {
    setSolarResult(null);
    setEarthResult(null);
    setWindowsResult(null);
    setError('');
  }, [selectedLocation, selectedDate, selectedTime]);

  // COSMIC CALENDAR — UST API integration
  useEffect(() => {
    if (!selectedDate || !selectedTime) {
      setUstResult(null);
      setUstError('Select a valid UTC date and time.');
      setUstLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadUst() {
      setUstLoading(true);
      setUstError('');

      try {
        const dateTime = `${selectedDate}T${selectedTime}:00Z`;

        const query = new URLSearchParams({
          date_time: dateTime,
        });

        const response = await fetch(
          `${API_URL}/ust/calendar?${query}`,
          { signal: controller.signal }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || 'UST calculation failed.'
          );
        }

        setUstResult(data as USTResult);
      } catch (err) {
        if (
          err instanceof Error &&
          err.name === 'AbortError'
        ) {
          return;
        }

        setUstResult(null);
        setUstError(
          err instanceof Error
            ? err.message
            : 'UST calculation failed.'
        );
      } finally {
        if (!controller.signal.aborted) {
          setUstLoading(false);
        }
      }
    }

    loadUst();

    return () => controller.abort();
  }, [selectedDate, selectedTime]);

  // All mission calculation requests use the selected UTC date and time.
  function makeQuery() {
    return new URLSearchParams({
      latitude: String(activeLocation.latitude),
      longitude: String(activeLocation.longitude),
      date_time: `${selectedDate}T${selectedTime}:00Z`,
    });
  }

  async function calculateSolarElevation() {
    if (!selectedDate || !selectedTime) {
      setError('Please select a UTC date and time.');
      return;
    }

    setIsCalculating(true);
    setError('');

    try {
      const response = await fetch(
        `${API_URL}/solar/elevation?${makeQuery()}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || 'Solar calculation failed.'
        );
      }

      setSolarResult(data as SolarResult);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Solar calculation failed.'
      );
    } finally {
      setIsCalculating(false);
    }
  }

  async function calculateEarthVisibility() {
    if (!selectedDate || !selectedTime) {
      setError('Please select a UTC date and time.');
      return;
    }

    setIsCheckingEarth(true);
    setError('');

    try {
      const response = await fetch(
        `${API_URL}/earth/visibility?${makeQuery()}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || 'Earth calculation failed.'
        );
      }

      setEarthResult(data as EarthResult);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Earth calculation failed.'
      );
    } finally {
      setIsCheckingEarth(false);
    }
  }

  async function scanEarthWindows() {
    if (!selectedDate || !selectedTime) {
      setError('Please select a UTC date and time.');
      return;
    }

    setIsScanning(true);
    setError('');

    const query = makeQuery();
    query.set('duration_hours', '708');
    query.set('step_minutes', '60');

    try {
      const response = await fetch(
        `${API_URL}/earth/windows?${query}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || 'Visibility scan failed.'
        );
      }

      setWindowsResult(data as WindowsResponse);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Visibility scan failed.'
      );
    } finally {
      setIsScanning(false);
    }
  }

  return (
    <main className="mission-app">
      <aside className="sidebar">
        <a className="brand" href="#overview">
          <span className="brand-symbol">◐</span>
          <span>
            <strong>LUNAR CHRONOS</strong>
            <small>MISSION OPERATIONS</small>
          </span>
        </a>

        <div className="sidebar-section-label">WORKSPACE</div>

        <nav className="side-navigation" aria-label="Main navigation">
          <a className="nav-item active" href="#overview">
            <span>◈</span> Overview
          </a>

          <a className="nav-item" href="#lunar-map">
            <span>◎</span> Lunar map
          </a>

          <a className="nav-item" href="#mission-config">
            <span>⌖</span> Mission setup
          </a>

          <a className="nav-item" href="#site-date-comparison">
            <span>⇄</span> Site comparison
          </a>

          <a className="nav-item" href="#cosmic-calendar">
            <span>◷</span> Cosmic Calendar
          </a>

          <a className="nav-item" href="#telemetry">
            <span>⌁</span> Telemetry
          </a>

          <a className="nav-item" href="#visibility-scan">
            <span>◷</span> Visibility scan
          </a>

          <a className="nav-item" href="#ust-mission-timeline">
            <span>▦</span> Mission calendar
          </a>

          <a className="nav-item" href="#mission-operations">
            <span>⌘</span> Mission operations
          </a>

          <a className="nav-item" href="#clps-missions">
            <span>▤</span> CLPS missions
          </a>
        </nav>

        <div className="sidebar-bottom">
          <span className="system-dot" />
          <div>
            <strong>LOCAL ENGINE</strong>
            <small>SPICE API · PORT 8000</small>
          </div>
        </div>
      </aside>

      <div className="workspace">
        <header className="system-header">
          <div>
            <span className="header-kicker">
              LUNAR MISSION OPERATIONS
            </span>
            <strong>Mission planning environment</strong>
          </div>

          <div className="header-status">
            <span className="system-dot" />
            <span>LOCAL WORKSPACE</span>
            <span className="header-divider" />
            <span>JPL DE440</span>
          </div>
        </header>

        <div className="dashboard-content" id="overview">
          <section className="page-intro">
            <div>
              <span className="module-code">
                MISSION CONTROL / OVERVIEW
              </span>
              <h1>Lunar mission planning</h1>
              <p>
                Analyse lunar surface conditions, solar geometry and Earth
                visibility for selected polar reference locations.
              </p>
            </div>

            <a
              className="external-link"
              href="https://quickmap.lroc.asu.edu/"
              target="_blank"
              rel="noreferrer"
            >
              OPEN LROC QUICKMAP ↗
            </a>
          </section>

          <section
            className="mission-status-strip"
            aria-label="Current mission configuration"
          >
            <div>
              <span>ACTIVE REGION</span>
              <strong>{activeLocation.name}</strong>
            </div>

            <div>
              <span>REFERENCE DATE · UTC</span>
              <strong>{selectedDate}</strong>
            </div>

            <div>
              <span>OBSERVATION TIME · UTC</span>
              <strong>{selectedTime} UTC</strong>
            </div>

            <div>
              <span>EPHEMERIS</span>
              <strong>JPL DE440</strong>
            </div>
          </section>

          <div className="dashboard-grid">
            <div className="dashboard-main-column">
              <LunarMap selectedLocation={selectedLocation} />

              <section className="panel region-panel">
                <div className="panel-heading">
                  <div>
                    <span className="module-code numbered-module-code">
                      <span className="module-number">02</span>
                      <span>TARGET SELECTION</span>
                    </span>

                    <h2>Reference locations</h2>

                    <p>
                      Select a region to update the map and calculation inputs.
                    </p>
                  </div>
                </div>

                <div className="location-list">
                  {locations.map((location, index) => (
                    <button
                      key={location.id}
                      className={`location-option ${
                        selectedLocation === index ? 'selected' : ''
                      }`}
                      onClick={() => setSelectedLocation(index)}
                      aria-pressed={selectedLocation === index}
                    >
                      <span className="location-index">
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      <span className="location-option-copy">
                        <strong>{location.name}</strong>
                        <small>{location.coordinates}</small>
                      </span>

                      <span className="location-select-mark">
                        {selectedLocation === index
                          ? 'SELECTED'
                          : 'SELECT'}
                      </span>
                    </button>
                  ))}
                </div>

                <p className="technical-note">
                  {activeLocation.description}
                </p>
              </section>

              <SiteDateComparison
                locations={locations.map(
                  ({ id, name, latitude, longitude }) => ({
                    id,
                    name,
                    latitude,
                    longitude,
                  })
                )}
              />

              {/* COSMIC CALENDAR — UST */}
              <section className="panel ust-panel" id="cosmic-calendar">
                <div className="panel-heading">
                  <div>
                    <span className="module-code numbered-module-code">
                      <span className="module-number">03</span>
                      <span>PROPOSED TIMEKEEPING FRAMEWORK</span>
                    </span>

                    <h2>
                      Cosmic Calendar — Universal Standard Time
                    </h2>

                    <p className="ust-description">
                      A proposed 13-phase temporal framework designed to provide a consistent reference for organising lunar mission timelines alongside local lunar environmental conditions.
                    </p>

                    <p>
                      A fixed 13-phase calendar calculated from the selected
                      UTC observation time and the custom UST epoch.
                    </p>
                  </div>

                  <span className="ust-version">UST v0.1.1</span>
                </div>

                {ustLoading && (
                  <p className="technical-note">
                    Calculating UST...
                  </p>
                )}

                {ustError && (
                  <p className="ust-error" role="alert">
                    {ustError}
                  </p>
                )}

                {ustResult && (
                  <>
                    <div className="ust-metrics">
                      <article className="ust-metric">
                        <span className="telemetry-label">
                          CYCLE NUMBER
                        </span>
                        <strong>{ustResult.cycle_number}</strong>
                      </article>

                      <article className="ust-metric">
                        <span className="telemetry-label">
                          PHASE
                        </span>
                        <strong>
                          {ustResult.phase_number}
                          <small>
                            {' '} / {ustResult.phases_per_cycle}
                          </small>
                        </strong>
                      </article>

                      <article className="ust-metric">
                        <span className="telemetry-label">
                          PHASE PROGRESS
                        </span>
                        <strong>
                          {ustResult.phase_progress_percent.toFixed(2)}%
                        </strong>
                      </article>
                    </div>

                    <div
                      className="ust-progress-track"
                      role="progressbar"
                      aria-label="UST phase progress"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.min(
                        100,
                        Math.max(
                          0,
                          ustResult.phase_progress_percent
                        )
                      )}
                    >
                      <div
                        className="ust-progress-fill"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              ustResult.phase_progress_percent
                            )
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="ust-details">
                      <div>
                        <span>INPUT TIME</span>
                        <strong>{ustResult.input_utc}</strong>
                      </div>

                      <div>
                        <span>CUSTOM EPOCH</span>
                        <strong>{ustResult.epoch_utc}</strong>
                      </div>

                      <div>
                        <span>PHASE DURATION</span>
                        <strong>
                          {(
                            ustResult.phase_duration_seconds / 3600
                          ).toFixed(2)}{' '}
                          hours
                        </strong>
                      </div>

                      <div>
                        <span>PHASE ELAPSED</span>
                        <strong>
                          {(
                            ustResult.phase_elapsed_seconds / 3600
                          ).toFixed(2)}{' '}
                          hours
                        </strong>
                      </div>
                    </div>

                    <p className="ust-caveat">
                      {ustResult.time_conversion_status}: UTC-based
                      datetime-label arithmetic. No UTC-to-TCL conversion
                      has been performed. This is a proposed calendar
                      calculation, not an actual lunar phase prediction.
                    </p>
                  </>
                )}
              </section>

              <section className="panel telemetry-panel" id="telemetry">
                <div className="panel-heading">
                  <div>
                    <span className="module-code numbered-module-code">
                      <span className="module-number">04</span>
                      <span>ENVIRONMENTAL TELEMETRY</span>
                    </span>

                    <h2>Mission environment</h2>

                    <p>
                      Calculated geometric conditions at the selected
                      reference point.
                    </p>
                  </div>
                </div>

                <div className="telemetry-grid">
                  <article className="telemetry-card">
                    <span className="telemetry-label">
                      SOLAR ELEVATION
                    </span>

                    <strong className="telemetry-value">
                      {solarResult
                        ? `${solarResult.solar_elevation_deg.toFixed(4)}°`
                        : '—'}
                    </strong>

                    <span className="telemetry-foot">
                      {solarResult
                        ? solarResult.sun_above_reference_horizon
                          ? 'Above reference horizon'
                          : 'Below reference horizon'
                        : 'Awaiting calculation'}
                    </span>

                    <button
                      type="button"
                      className="action-button telemetry-action-button"
                      onClick={calculateSolarElevation}
                      disabled={isCalculating}
                    >
                      {isCalculating
                        ? 'CALCULATING...'
                        : 'CALCULATE SOLAR'}
                    </button>
                  </article>

                  <article className="telemetry-card">
                    <span className="telemetry-label">
                      EARTH VISIBILITY
                    </span>

                    <strong className="telemetry-value telemetry-text-value">
                      {earthResult
                        ? earthResult.any_part_geometrically_visible
                          ? 'VISIBLE'
                          : 'BELOW HORIZON'
                        : '—'}
                    </strong>

                    <span className="telemetry-foot">
                      {earthResult
                        ? earthResult.visibility
                        : 'Awaiting calculation'}
                    </span>

                    <button
                      type="button"
                      className="action-button telemetry-action-button"
                      onClick={calculateEarthVisibility}
                      disabled={isCheckingEarth}
                    >
                      {isCheckingEarth
                        ? 'CALCULATING...'
                        : 'CALCULATE EARTH'}
                    </button>
                  </article>
                </div>

                {solarResult && (
                  <div className="detail-readout">
                    <strong>Solar calculation details</strong>
                    <p>{solarResult.scientific_status}</p>
                    <p>
                      Reference frame: {solarResult.reference_frame}
                    </p>
                    <p>Ephemeris: {solarResult.ephemeris}</p>
                    <p>
                      Terrain obstruction included:{' '}
                      {solarResult.terrain_obstruction_included
                        ? 'Yes'
                        : 'No'}
                    </p>
                  </div>
                )}

                {earthResult && (
                  <div className="detail-readout">
                    <strong>Earth geometry details</strong>

                    <p>
                      Centre elevation:{' '}
                      {earthResult.earth_centre_elevation_deg.toFixed(4)}°
                    </p>

                    <p>
                      Angular radius:{' '}
                      {earthResult.earth_angular_radius_deg.toFixed(4)}°
                    </p>

                    <p>
                      Upper limb:{' '}
                      {earthResult.earth_upper_limb_elevation_deg.toFixed(4)}°
                    </p>

                    <p>
                      Lower limb:{' '}
                      {earthResult.earth_lower_limb_elevation_deg.toFixed(4)}°
                    </p>

                    <p>
                      Earth distance:{' '}
                      {earthResult.earth_distance_km.toLocaleString()} km
                    </p>

                    <p>{earthResult.scientific_status}</p>
                  </div>
                )}
              </section>

              <section className="panel scan-panel" id="visibility-scan">
                <div className="panel-heading">
                  <div>
                    <span className="module-code numbered-module-code">
                      <span className="module-number">05</span>
                      <span>MISSION DESIGN</span>
                    </span>

                    <h2>Earth visibility window scan</h2>

                    <p>
                      Evaluate sampled geometric visibility over a 708-hour
                      interval using one-hour sampling.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="action-button primary-action"
                  onClick={scanEarthWindows}
                  disabled={isScanning}
                >
                  {isScanning
                    ? 'SCANNING...'
                    : 'RUN 708-HOUR SCAN'}
                </button>

                {windowsResult && (
                  <div className="detail-readout">
                    <strong>Scan summary</strong>

                    <p>
                      {windowsResult.sample_count} samples ·{' '}
                      {windowsResult.duration_hours} hours ·{' '}
                      {windowsResult.sampling_interval_minutes}-minute
                      interval
                    </p>

                    <VisibilityProfile samples={windowsResult.samples} />

                    <h3>Sampled visibility windows</h3>

                    {windowsResult.visible_windows.length === 0 ? (
                      <p>No visible windows found in this scan.</p>
                    ) : (
                      windowsResult.visible_windows.map(
                        (window, index) => (
                          <div
                            className="window-row"
                            key={`${window.start_utc}-${index}`}
                          >
                            <strong>WINDOW {index + 1}</strong>
                            <span>
                              Start: {window.start_utc} UTC
                            </span>
                            <span>
                              End: {window.end_utc} UTC
                            </span>
                          </div>
                        )
                      )
                    )}

                    <p>{windowsResult.scientific_status}</p>
                  </div>
                )}

                <p className="technical-note">
                  Geometric visibility is not confirmation of actual
                  communications. Terrain, antennas and network availability
                  are not modelled. Window boundaries are based on the
                  configured sampling interval.
                </p>
              </section>

              <section className="panel config-panel" id="mission-config">
                <div className="panel-heading">
                  <div>
                    <span className="module-code">
                      MISSION PARAMETERS
                    </span>

                    <h2>Observation setup</h2>

                    <p>Configure the calculation reference.</p>
                  </div>
                </div>

                <div className="config-field">
                  <label htmlFor="location-select">
                    REFERENCE LOCATION
                  </label>

                  <select
                    id="location-select"
                    value={selectedLocation}
                    onChange={(event) =>
                      setSelectedLocation(Number(event.target.value))
                    }
                  >
                    {locations.map((location, index) => (
                      <option key={location.id} value={index}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="config-field">
                  <label htmlFor="observation-date">
                    OBSERVATION DATE · UTC
                  </label>

                  <input
                    id="observation-date"
                    type="date"
                    value={selectedDate}
                    onChange={(event) =>
                      setSelectedDate(event.target.value)
                    }
                  />
                </div>

                <div className="config-field">
                  <label htmlFor="observation-time">
                    OBSERVATION TIME · UTC
                  </label>

                  <input
                    id="observation-time"
                    type="time"
                    value={selectedTime}
                    onChange={(event) =>
                      setSelectedTime(event.target.value)
                    }
                  />
                </div>

                <div className="coordinate-readout">
                  <span>LATITUDE</span>
                  <strong>
                    {activeLocation.latitude.toFixed(4)}°
                  </strong>

                  <span>LONGITUDE</span>
                  <strong>
                    {activeLocation.longitude.toFixed(4)}°
                  </strong>
                </div>

                <p className="technical-note">
                  Date and time inputs are interpreted as UTC. Changing
                  the location or observation time clears previous
                  calculation results.
                </p>
              </section>

              <section className="panel engine-panel">
                <div className="panel-heading">
                  <div>
                    <span className="module-code">COMPUTATION</span>
                    <h2>SPICE engine</h2>
                  </div>

                  <span className="engine-indicator">LOCAL</span>
                </div>

                <div className="engine-readout">
                  <span>EPHEMERIS</span>
                  <strong>JPL DE440</strong>

                  <span>FRAME</span>
                  <strong>Moon reference frame</strong>

                  <span>API ENDPOINT</span>
                  <strong>127.0.0.1:8000</strong>
                </div>

                <p className="technical-note">
                  Calculation service availability is determined by
                  successful API responses, not by this display label.
                </p>
              </section>

            </div>

            <aside className="dashboard-side-column">
              <USTMissionTimeline
                apiUrl={API_URL}
                locations={locations.map(({ id, name }) => ({ id, name }))}
              />
              <MissionOperationsPlanner apiUrl={API_URL} locations={locations} />

              {error && (
                <section className="panel error-panel" role="alert">
                  <strong>CALCULATION ERROR</strong>
                  <p>{error}</p>
                </section>
              )}
            </aside>
          </div>

          <div id="ust-master-calendar-host" className="ust-master-calendar-host" />

          <section id="clps-missions" className="clps-host-panel">
            <CLPSBrowser />
          </section>

          <footer className="app-footer">
            <span>LUNAR CHRONOS · PROTOTYPE</span>
            <span>Scientific data integration in progress</span>
          </footer>
        </div>
      </div>
    </main>
  );
}

export default App;
