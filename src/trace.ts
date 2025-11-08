import { transform } from "./transform";
import type { GPX3DWindow } from "./types";

export const trace = (geoJSON: GeoJSON.FeatureCollection) => {
  const name = "gpx";
  const map = (window as unknown as GPX3DWindow).gpx3D.map!;
  if (map.getLayer(name)) {
    map.removeLayer(name);
    map.removeSource(name);
  }
  const { coordinates } = geoJSON.features[0].geometry as {
    coordinates: number[][];
  };
  const lats = coordinates.map((m: number[]) => m[1]);
  const lngs = coordinates.map((m: number[]) => m[0]);
  map.addSource(name, {
    type: "geojson",
    data: geoJSON,
  });
  map.addLayer({
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
  map.fitBounds([
    [Math.min(...lngs) - padding, Math.min(...lats) - padding],
    [Math.max(...lngs) + padding, Math.max(...lats) + padding],
  ]);

  map.on("moveend", async () => {
    await transform();
  });
};
