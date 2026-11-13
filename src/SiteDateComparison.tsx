import { useState } from 'react';

type LocationOption = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

type SolarData = {
  solar_elevation_deg: number;
  sun_above_reference_horizon: boolean;
  scientific_status: string;
};

type EarthData = {
  earth_centre_elevation_deg: number;
  earth_angular_radius_deg: number;
  earth_upper_limb_elevation_deg: number;
  earth_lower_limb_elevation_deg: number;
  visibility: string;
  any_part_geometrically_visible: boolean;
  entire_disk_geometrically_visible: boolean;
  scientific_status: string;
};

type ScenarioResult = {
  solar: SolarData;
  earth: EarthData;
};

type ScenarioInput = {
  locationIndex: number;
  date: string;
  time: string;
};

const API_URL = 'http://127.0.0.1:8000';

async function getCalculation<T>(
  endpoint: string,
  scenario: ScenarioInput,
  location: LocationOption
): Promise<T> {
  const query = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    date_time: `${scenario.date}T${scenario.time}:00Z`,
  });

  const response = await fetch(`${API_URL}${endpoint}?${query}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || `Request failed: ${endpoint}`);
  }

  return data as T;
}

function formatDifference(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(4)}°`;
}

export default function SiteDateComparison({
  locations,
}: {
  locations: LocationOption[];
}) {
  const [scenarioA, setScenarioA] = useState<ScenarioInput>({
    locationIndex: 0,
    date: '2026-11-08',
    time: '12:00',
  });
  const [scenarioB, setScenarioB] = useState<ScenarioInput>({
    locationIndex: 1,
    date: '2026-11-08',
    time: '12:00',
  });
  const [resultA, setResultA] = useState<ScenarioResult | null>(null);
  const [resultB, setResultB] = useState<ScenarioResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function updateScenario(
    which: 'A' | 'B',
    field: keyof ScenarioInput,
    value: string
  ) {
    const setter = which === 'A' ? setScenarioA : setScenarioB;

    if (field === 'locationIndex') {
      setter((previous) => ({
        ...previous,
        locationIndex: Number(value),
      }));
    } else if (field === 'date') {
      setter((previous) => ({
        ...previous,
        date: value,
      }));
    } else {
      setter((previous) => ({
        ...previous,
        time: value,
      }));
    }
  }

  async function compareScenarios() {
    if (
      !scenarioA.date ||
      !scenarioA.time ||
      !scenarioB.date ||
      !scenarioB.time
    ) {
      setError('Enter a date and UTC time for both scenarios.');
      return;
    }

    setLoading(true);
    setError('');
    setResultA(null);
    setResultB(null);

    try {
      const locationA = locations[scenarioA.locationIndex];
      const locationB = locations[scenarioB.locationIndex];

      const [solarA, earthA, solarB, earthB] = await Promise.all([
        getCalculation<SolarData>('/solar/elevation', scenarioA, locationA),
        getCalculation<EarthData>('/earth/visibility', scenarioA, locationA),
        getCalculation<SolarData>('/solar/elevation', scenarioB, locationB),
        getCalculation<EarthData>('/earth/visibility', scenarioB, locationB),
      ]);

      setResultA({ solar: solarA, earth: earthA });
      setResultB({ solar: solarB, earth: earthB });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Comparison calculation failed.'
      );
    } finally {
      setLoading(false);
    }
  }

  const solarDifference =
    resultA && resultB
      ? resultB.solar.solar_elevation_deg -
        resultA.solar.solar_elevation_deg
      : null;
  const earthDifference =
    resultA && resultB
      ? resultB.earth.earth_centre_elevation_deg -
        resultA.earth.earth_centre_elevation_deg
      : null;

  function renderScenario(
    label: string,
    scenario: ScenarioInput,
    setter: 'A' | 'B',
    result: ScenarioResult | null
  ) {
    const location = locations[scenario.locationIndex];

    return (
      <article className="comparison-scenario">
        <div className="comparison-scenario-heading">
          <span>{label}</span>
          <strong>{location.name}</strong>
        </div>

        <div className="comparison-fields">
          <label>
            <span>REFERENCE LOCATION</span>
            <select
              value={scenario.locationIndex}
              onChange={(event) =>
                updateScenario(setter, 'locationIndex', event.target.value)
              }
            >
              {locations.map((item, index) => (
                <option key={item.id} value={index}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>DATE · UTC</span>
            <input
              type="date"
              value={scenario.date}
              onChange={(event) =>
                updateScenario(setter, 'date', event.target.value)
              }
            />
          </label>

          <label>
            <span>TIME · UTC</span>
            <input
              type="time"
              value={scenario.time}
              onChange={(event) =>
                updateScenario(setter, 'time', event.target.value)
              }
            />
          </label>
        </div>

        {result && (
          <div className="comparison-results">
            <div>
              <span>SOLAR ELEVATION</span>
              <strong>{result.solar.solar_elevation_deg.toFixed(4)}°</strong>
              <small>
                {result.solar.sun_above_reference_horizon
                  ? 'Above reference horizon'
                  : 'Below reference horizon'}
              </small>
            </div>
            <div>
              <span>EARTH CENTRE ELEVATION</span>
              <strong>
                {result.earth.earth_centre_elevation_deg.toFixed(4)}°
              </strong>
              <small>{result.earth.visibility}</small>
            </div>
            <div>
              <span>EARTH UPPER LIMB</span>
              <strong>
                {result.earth.earth_upper_limb_elevation_deg.toFixed(4)}°
              </strong>
            </div>
            <div>
              <span>EARTH LOWER LIMB</span>
              <strong>
                {result.earth.earth_lower_limb_elevation_deg.toFixed(4)}°
              </strong>
            </div>
          </div>
        )}
      </article>
    );
  }

  return (
    <section className="panel comparison-panel" id="site-date-comparison">
      <div className="panel-heading">
        <div>
          <span className="module-code">SCENARIO EVALUATION</span>
          <h2>Site &amp; date comparison</h2>
          <p>
            Compare solar geometry and Earth visibility for two lunar
            location-and-time scenarios using the existing SPICE API.
          </p>
        </div>
      </div>

      <div className="comparison-scenarios">
        {renderScenario('SCENARIO A', scenarioA, 'A', resultA)}
        {renderScenario('SCENARIO B', scenarioB, 'B', resultB)}
      </div>

      <button
        type="button"
        className="action-button primary-action"
        onClick={compareScenarios}
        disabled={loading}
      >
        {loading ? 'COMPARING SCENARIOS...' : 'COMPARE TWO SCENARIOS'}
      </button>

      {error && (
        <p className="comparison-error" role="alert">
          {error}
        </p>
      )}

      {resultA && resultB && (
        <div className="comparison-differences">
          <strong>SCENARIO DIFFERENCE · B MINUS A</strong>
          <div>
            <span>Solar elevation</span>
            <b>{formatDifference(solarDifference ?? 0)}</b>
          </div>
          <div>
            <span>Earth-centre elevation</span>
            <b>{formatDifference(earthDifference ?? 0)}</b>
          </div>
          <p>
            A positive difference means the value is higher in Scenario B.
            Visibility classifications are geometric estimates, not
            confirmation of actual communications or available solar power.
          </p>
        </div>
      )}

      <p className="technical-note">
        Both scenarios use the existing solar-elevation and Earth-visibility
        endpoints, JPL DE440 and the spherical lunar reference model. Local
        terrain obstruction is not included; coordinate conventions remain
        subject to verification.
      </p>
    </section>
  );
}
