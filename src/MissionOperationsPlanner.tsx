import { useEffect, useMemo, useState } from 'react';

type LocationOption = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  coordinates?: string;
};

type USTPosition = {
  cycle_number: number;
  phase_number: number;
  phases_per_cycle: number;
  phase_progress_percent: number;
};

type TimelineActivity = {
  id: string;
  name: string;
  description?: string;
  start_utc: string;
  end_utc: string | null;
  location_id?: string;
  location_name?: string;
  start_ust?: USTPosition;
  end_ust?: USTPosition | null;
};

type SolarResult = {
  solar_elevation_deg: number;
  sun_above_reference_horizon: boolean;
};

type EarthResult = {
  earth_centre_elevation_deg: number;
  earth_upper_limb_elevation_deg: number;
  earth_lower_limb_elevation_deg: number;
  any_part_geometrically_visible: boolean;
};

type SiteResult = {
  location: LocationOption;
  solar: SolarResult;
  earth: EarthResult;
};

type MomentResult = {
  label: string;
  utc: string;
  ust?: USTPosition | null;
  sites: SiteResult[];
};

const STORAGE_KEY = 'lunar-chronos-ust-mission-timeline-v1';

function isActivity(value: unknown): value is TimelineActivity {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.start_utc === 'string' &&
    (typeof item.end_utc === 'string' || item.end_utc === null);
}

function formatUtc(value: string): string {
  return value.replace('T', ' ').replace(/(\.\d+)?Z$/, ' UTC');
}

function formatUst(value?: USTPosition | null): string {
  if (!value) return 'UST position unavailable';
  return `Cycle ${value.cycle_number} · Phase ${value.phase_number}/${value.phases_per_cycle} · ${value.phase_progress_percent.toFixed(2)}%`;
}

async function readJson<T>(response: Response): Promise<T> {
  const payload: unknown = await response.json();
  if (!response.ok) {
    const detail = payload && typeof payload === 'object' && 'detail' in payload
      ? String((payload as { detail: unknown }).detail)
      : `Request failed (${response.status})`;
    throw new Error(detail);
  }
  return payload as T;
}

export default function MissionOperationsPlanner({
  apiUrl,
  locations,
}: {
  apiUrl: string;
  locations: LocationOption[];
}) {
  const [activities, setActivities] = useState<TimelineActivity[]>([]);
  const [activityId, setActivityId] = useState('');
  const [primaryLocationId, setPrimaryLocationId] = useState('');
  const [comparisonLocationId, setComparisonLocationId] = useState('');
  const [results, setResults] = useState<MomentResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function refreshActivities() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      const valid = Array.isArray(parsed)
        ? parsed.filter(isActivity).sort((a, b) => a.start_utc.localeCompare(b.start_utc))
        : [];
      setActivities(valid);
      setActivityId(current => valid.some(item => item.id === current)
        ? current
        : valid[0]?.id ?? '');
      setResults([]);
      setError('');
    } catch {
      setError('Mission records could not be read from this browser.');
    }
  }

  useEffect(() => {
    refreshActivities();
    // The records are intentionally loaded on mount; use REFRESH after editing the calendar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activity = activities.find(item => item.id === activityId);
  const assignedLocation = locations.find(item => item.id === activity?.location_id);
  const primaryLocation = locations.find(item => item.id === primaryLocationId) || assignedLocation || locations[0];
  const comparisonLocation = locations.find(item => item.id === comparisonLocationId) ||
    locations.find(item => item.id !== primaryLocation?.id);

  useEffect(() => {
    if (!primaryLocation) return;
    setPrimaryLocationId(current => current || assignedLocation?.id || primaryLocation.id);
    setComparisonLocationId(current => current || locations.find(item => item.id !== primaryLocation.id)?.id || '');
  }, [primaryLocation, assignedLocation, locations]);

  const selectedLocations = useMemo(() => {
    const result: LocationOption[] = [];
    if (primaryLocation) result.push(primaryLocation);
    if (comparisonLocation && comparisonLocation.id !== primaryLocation?.id) result.push(comparisonLocation);
    return result;
  }, [primaryLocation, comparisonLocation]);

  async function calculateProfile() {
    if (!activity || selectedLocations.length === 0) {
      setError('Select a mission activity and at least one lunar reference location.');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const moments = [
        { label: 'ACTIVITY START', utc: activity.start_utc, ust: activity.start_ust },
        ...(activity.end_utc
          ? [{ label: 'ACTIVITY END', utc: activity.end_utc, ust: activity.end_ust }]
          : []),
      ];

      const profile = await Promise.all(moments.map(async moment => {
        const sites = await Promise.all(selectedLocations.map(async location => {
          const query = new URLSearchParams({
            latitude: String(location.latitude),
            longitude: String(location.longitude),
            date_time: moment.utc,
          });
          const [solarResponse, earthResponse] = await Promise.all([
            fetch(`${apiUrl}/solar/elevation?${query}`),
            fetch(`${apiUrl}/earth/visibility?${query}`),
          ]);
          const [solar, earth] = await Promise.all([
            readJson<SolarResult>(solarResponse),
            readJson<EarthResult>(earthResponse),
          ]);
          if (typeof solar.solar_elevation_deg !== 'number' ||
              typeof earth.earth_centre_elevation_deg !== 'number' ||
              typeof earth.any_part_geometrically_visible !== 'boolean') {
            throw new Error(`Incomplete environmental result for ${location.name}.`);
          }
          return { location, solar, earth };
        }));
        return { label: moment.label, utc: moment.utc, ust: moment.ust, sites };
      }));
      setResults(profile);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Mission conditions could not be calculated.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel mission-operations-planner" id="mission-operations">
      <div className="panel-heading">
        <div>
          <span className="module-code">UST-AWARE OPERATIONS</span>
          <h2>Mission Operations Planner</h2>
        </div>
        <button type="button" className="ops-refresh" onClick={refreshActivities}>REFRESH ACTIVITIES</button>
      </div>

      <p className="technical-note">
        Compare the environmental conditions associated with a recorded mission activity
        at two lunar reference locations. UTC remains authoritative; UST is a proposed,
        provisional calendar representation.
      </p>

      {activities.length === 0 ? (
        <p className="technical-note">No mission activities found. Add an activity in the UST Mission Calendar, then select REFRESH ACTIVITIES.</p>
      ) : (
        <>
          <div className="ops-controls">
            <div className="ops-field">
              <label htmlFor="ops-activity">MISSION ACTIVITY</label>
              <select id="ops-activity" value={activityId} onChange={event => {
                setActivityId(event.target.value);
                setResults([]);
                setError('');
              }}>
                {activities.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
            <div className="ops-field">
              <label htmlFor="ops-primary-location">REFERENCE LOCATION A</label>
              <select id="ops-primary-location" value={primaryLocation?.id ?? ''} onChange={event => {
                setPrimaryLocationId(event.target.value);
                setResults([]);
              }}>
                {locations.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
            <div className="ops-field">
              <label htmlFor="ops-comparison-location">COMPARISON LOCATION B</label>
              <select id="ops-comparison-location" value={comparisonLocation?.id ?? ''} onChange={event => {
                setComparisonLocationId(event.target.value);
                setResults([]);
              }}>
                <option value="">No comparison</option>
                {locations.filter(item => item.id !== primaryLocation?.id).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
          </div>

          {activity && (
            <div className="ops-time-context">
              <div>
                <span>START · UTC</span>
                <strong>{formatUtc(activity.start_utc)}</strong>
                <small>{formatUst(activity.start_ust)}</small>
              </div>
              {activity.end_utc && (
                <div>
                  <span>END · UTC</span>
                  <strong>{formatUtc(activity.end_utc)}</strong>
                  <small>{formatUst(activity.end_ust)}</small>
                </div>
              )}
            </div>
          )}

          <button type="button" className="ops-calculate" onClick={calculateProfile} disabled={loading || !activity || !primaryLocation}>
            {loading ? 'CALCULATING PROFILE…' : 'COMPARE MISSION CONDITIONS'}
          </button>

          {error && <p className="ust-timeline-error" role="alert">{error}</p>}

          {results.length > 0 && (
            <div className="ops-profile-results">
              {results.map(moment => (
                <article className="ops-profile-moment" key={moment.label}>
                  <div className="ops-profile-heading">
                    <div><strong>{moment.label}</strong><span>{formatUtc(moment.utc)}</span></div>
                    <small>{formatUst(moment.ust)}</small>
                  </div>
                  <div className="ops-profile-grid">
                    {moment.sites.map(site => (
                      <div className="ops-site-card" key={site.location.id}>
                        <h3>{site.location.name}</h3>
                        <div className="ops-site-metric">
                          <span>SOLAR ELEVATION</span>
                          <strong>{site.solar.solar_elevation_deg.toFixed(4)}°</strong>
                          <small>{site.solar.sun_above_reference_horizon ? 'Above geometric horizon' : 'At or below geometric horizon'}</small>
                        </div>
                        <div className="ops-site-metric">
                          <span>EARTH GEOMETRIC VISIBILITY</span>
                          <strong>{site.earth.any_part_geometrically_visible ? 'PARTLY OR FULLY VISIBLE' : 'BELOW HORIZON'}</strong>
                          <small>Centre: {site.earth.earth_centre_elevation_deg.toFixed(4)}°</small>
                          <small>Upper limb: {site.earth.earth_upper_limb_elevation_deg.toFixed(4)}°</small>
                          <small>Lower limb: {site.earth.earth_lower_limb_elevation_deg.toFixed(4)}°</small>
                        </div>
                        {site.location.id === 'de-gerlache' && <small className="ops-provisional">Reference coordinates are provisional and require verification.</small>}
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}

          <p className="ops-caveat">
            These are geometric snapshots at activity start and, where applicable, end times.
            They do not establish continuous visibility windows, terrain clearance, radio-link
            performance, power generation or operational feasibility.
          </p>
        </>
      )}
    </section>
  );
}
