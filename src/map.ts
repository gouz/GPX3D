import mapboxgl from "mapbox-gl";
import { getMapboxKey } from "./storage";

export const createMap = () => {
  window.gpx3D.map = new mapboxgl.Map({
    container: "map",
    zoom: 1,
    center: [0, 0],
    bearing: -10,
    style: "mapbox://styles/mapbox/satellite-streets-v12",
    accessToken: getMapboxKey(),
  });

  window.gpx3D.map.on("style.load", () => {
    window.gpx3D.map.addSource("mapbox-dem", {
      type: "raster-dem",
      url: "mapbox://mapbox.mapbox-terrain-dem-v1",
      tileSize: 512,
      maxzoom: 14,
    });
    window.gpx3D.map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
  });

  window.gpx3D.map.addControl(new mapboxgl.NavigationControl());
};
