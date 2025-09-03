import { bboxToTileRange } from "./bboxToTileRange";
import { buildTexturedTerrain } from "./buildTexturedTerrain";
import type { GPX3DWindow } from "./types";

export const transform = async () => {
  const map = (window as unknown as GPX3DWindow).gpx3D.map!;
  const bounds = map.getBounds()!;
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();

  const zoom = Math.round(map.getZoom());

  const bbox: [number, number, number, number] = [
    sw.lng,
    sw.lat,
    ne.lng,
    ne.lat,
  ];
  const { xRange, yRange } = bboxToTileRange(bbox, zoom);
  await buildTexturedTerrain(
    (window as unknown as GPX3DWindow).gpx3D.scene!,
    zoom,
    xRange,
    yRange,
  );
};
