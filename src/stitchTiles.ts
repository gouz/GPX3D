import { getMapboxKey } from "./storage";

export const stitchTiles = async (
  z: number,
  xRange: number[],
  yRange: number[],
  type: "terrain" | "satellite",
): Promise<ImageData> => {
  const tileSize = 256;
  const width = (xRange[1] - xRange[0] + 1) * tileSize;
  const height = (yRange[1] - yRange[0] + 1) * tileSize;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  for (let ty = yRange[0]; ty <= yRange[1]; ty++) {
    for (let tx = xRange[0]; tx <= xRange[1]; tx++) {
      const url =
        type === "terrain"
          ? `https://api.mapbox.com/v4/mapbox.terrain-rgb/${z}/${tx}/${ty}.pngraw?access_token=${getMapboxKey()}`
          : `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/256/${z}/${tx}/${ty}?access_token=${getMapboxKey()}`;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      await img.decode();

      ctx.drawImage(
        img,
        (tx - xRange[0]) * tileSize,
        (ty - yRange[0]) * tileSize,
      );
    }
  }

  return ctx.getImageData(0, 0, width, height);
};
