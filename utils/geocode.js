// Turns a place name into GeoJSON using OpenStreetMap's free Nominatim service.
// Returns null if the place can't be found or the service can't be reached,
// so the caller can carry on without crashing.
module.exports = async function geocode(query) {
  if (!query || !query.trim()) return null;

  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=" +
    encodeURIComponent(query.trim());

  try {
    const res = await fetch(url, {
      // Nominatim's usage policy requires a User-Agent that identifies your app
      headers: { "User-Agent": "Wanderlust-learning-project/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;

    const results = await res.json();
    if (!Array.isArray(results) || results.length === 0) return null;

    const lat = parseFloat(results[0].lat);
    const lon = parseFloat(results[0].lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null;

    // GeoJSON order is [longitude, latitude]
    return { type: "Point", coordinates: [lon, lat] };
  } catch (e) {
    console.log("Geocoding failed:", e.message);
    return null;
  }
};