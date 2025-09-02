import mapboxgl from "mapbox-gl";

export const createMap = (apikey: string) => {
  mapboxgl.accessToken = apikey;

  const map = new mapboxgl.Map({
    container: "map",
    zoom: 1,
    center: [0, 0],
    style: "mapbox://styles/mapbox/satellite-streets-v12",
  });

  map.on("style.load", () => {
    map.addSource("mapbox-dem", {
      type: "raster-dem",
      url: "mapbox://mapbox.mapbox-terrain-dem-v1",
      tileSize: 512,
      maxzoom: 14,
    });
    map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
  });

  map.addControl(new mapboxgl.NavigationControl());

  return map;
};
