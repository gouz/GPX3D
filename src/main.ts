import { manageDropZone } from "./drop";
import gpxToGeoJSON from "./gpx-to-geojson";
import { createMap } from "./map";
import { getMapboxKey } from "./storage";
import "./style.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { trace } from "./trace";

const mapboxKey = getMapboxKey();

if (mapboxKey !== "") {
  const map = createMap(mapboxKey);

  manageDropZone();

  window.addEventListener("gpxDroped", (event: Event) => {
    const customEvent = event as CustomEvent<{ content: string }>;
    const geoJSON = gpxToGeoJSON(customEvent.detail.content);
    trace(geoJSON, map);
  });
}
