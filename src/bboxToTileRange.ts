function lonLatToTile(
  lon: number,
  lat: number,
  z: number,
): { x: number; y: number } {
  const latRad = (lat * Math.PI) / 180;
  const n = 2 ** z;
  const x = Math.floor(((lon + 180) / 360) * n);
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  );
  return { x, y };
}

export const bboxToTileRange = (
  bbox: [number, number, number, number],
  z: number,
) => {
  const t1 = lonLatToTile(bbox[0], bbox[3], z); // NW corner
  const t2 = lonLatToTile(bbox[2], bbox[1], z); // SE corner
  return {
    xRange: [t1.x, t2.x] as [number, number],
    yRange: [t1.y, t2.y] as [number, number],
  };
};
