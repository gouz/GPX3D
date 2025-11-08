import mapboxgl from "mapbox-gl";
import { getMapboxKey } from "./storage";
import type { GPX3DWindow } from "./types";

export const createMap = () => {
  const map = new mapboxgl.Map({
    container: "map",
    zoom: 1,
    center: [0, 0],
    bearing: -10,
    style: "mapbox://styles/mapbox/satellite-streets-v12",
    accessToken: getMapboxKey(),
  });

  map.on("style.load", () => {
    map.addSource("mapbox-dem", {
      type: "raster-dem",
      url: "mapbox://mapbox.mapbox-terrain-dem-v1",
      tileSize: 512,
      maxzoom: 14,
    });
    map.setTerrain({
      source: "mapbox-dem",
      exaggeration: 1.5,
    });
  });

  map.addControl(new mapboxgl.NavigationControl());

  (window as unknown as GPX3DWindow).gpx3D.map = map;
};
