import { transform } from "./transform";

export const trace = (geoJSON: GeoJSON.FeatureCollection) => {
  const name = "gpx";

  if (window.gpx3D.map.getLayer(name)) {
    window.gpx3D.map.removeLayer(name);
    window.gpx3D.map.removeSource(name);
  }
  const { coordinates } = geoJSON.features[0].geometry as {
    coordinates: number[][];
  };
  const lats = coordinates.map((m: number[]) => m[1]);
  const lngs = coordinates.map((m: number[]) => m[0]);
  window.gpx3D.map.addSource(name, {
    type: "geojson",
    data: geoJSON,
  });
  window.gpx3D.map.addLayer({
    id: name,
    type: "line",
    source: name,
    layout: {
      "line-join": "round",
      "line-cap": "round",
      visibility: "visible",
    },
    paint: {
      "line-color": "#FF0000",
      "line-width": 4,
      "line-opacity": 1,
    },
  });
  const padding = 0.01;
  window.gpx3D.map.fitBounds([
    [Math.min(...lngs) - padding, Math.min(...lats) - padding],
    [Math.max(...lngs) + padding, Math.max(...lats) + padding],
  ]);

  setTimeout(async () => {
    await transform();
  }, 5000);
};
