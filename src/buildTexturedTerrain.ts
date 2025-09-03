import * as BABYLON from "@babylonjs/core";
import { getElevation } from "./getElevation";
import { stitchTiles } from "./stitchTiles";

export const buildTexturedTerrain = async (
  scene: BABYLON.Scene,
  z: number,
  xRange: number[],
  yRange: number[],
): Promise<BABYLON.Mesh> => {
  const demData = await stitchTiles(z, xRange, yRange, "terrain");
  const texCanvas = document.createElement("canvas");
  texCanvas.width = demData.width;
  texCanvas.height = demData.height;

  // Stitch satellite texture
  const texCtx = texCanvas.getContext("2d")!;
  const satData = await stitchTiles(z, xRange, yRange, "satellite");
  texCtx.putImageData(satData, 0, 0);

  const positions: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];

  for (let y = 0; y < demData.height; y++) {
    for (let x = 0; x < demData.width; x++) {
      const i = (y * demData.width + x) * 4;
      const elevation = getElevation(
        demData.data[i],
        demData.data[i + 1],
        demData.data[i + 2],
      );

      // Vertex position
      positions.push(
        x - demData.width / 2,
        elevation / 20,
        y - demData.height / 2,
      );

      // UV coordinates
      uvs.push(x / demData.width, y / demData.height);
    }
  }

  for (let y = 0; y < demData.height - 1; y++) {
    for (let x = 0; x < demData.width - 1; x++) {
      const i = y * demData.width + x;
      indices.push(i, i + 1, i + demData.width);
      indices.push(i + 1, i + demData.width + 1, i + demData.width);
    }
  }

  const terrain = new BABYLON.Mesh("terrain", scene);
  const vertexData = new BABYLON.VertexData();
  vertexData.positions = positions;
  vertexData.indices = indices;
  vertexData.uvs = uvs;
  vertexData.applyToMesh(terrain);

  // Apply stitched texture
  const texture = new BABYLON.Texture(
    texCanvas.toDataURL(),
    scene,
    false,
    true,
    BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
  );
  const mat = new BABYLON.StandardMaterial("mat", scene);
  mat.diffuseTexture = texture;
  terrain.material = mat;

  return terrain;
};
