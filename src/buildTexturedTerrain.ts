import {
  Color3,
  Mesh,
  MultiMaterial,
  StandardMaterial,
  SubMesh,
  Texture,
  VertexData,
} from "@babylonjs/core";
import { getElevation } from "./getElevation";
import { stitchTiles } from "./stitchTiles";
import type { GPX3DWindow } from "./types";

export const buildTexturedTerrain = async (
  z: number,
  xRange: number[],
  yRange: number[],
  baseHeight = -50,
): Promise<Mesh> => {
  const demData = await stitchTiles(z, xRange, yRange, "terrain");
  const texCanvas = document.createElement("canvas");
  texCanvas.width = demData.width;
  texCanvas.height = demData.height;

  // Récupérer la texture satellite
  const texCtx = texCanvas.getContext("2d")!;
  const satData = await stitchTiles(z, xRange, yRange, "satellite");
  texCtx.putImageData(satData, 0, 0);

  const positions: number[] = [];
  const indicesSurface: number[] = [];
  const uvs: number[] = [];

  // --- Construire la surface du terrain ---
  for (let y = 0; y < demData.height; y++) {
    for (let x = 0; x < demData.width; x++) {
      const i = (y * demData.width + x) * 4;
      const elevation = getElevation(
        demData.data[i],
        demData.data[i + 1],
        demData.data[i + 2],
      );

      positions.push(
        x - demData.width / 2,
        elevation / 20,
        y - demData.height / 2,
      );

      uvs.push(x / demData.width, y / demData.height);
    }
  }

  // Indices pour la surface
  for (let y = 0; y < demData.height - 1; y++) {
    for (let x = 0; x < demData.width - 1; x++) {
      const i = y * demData.width + x;
      indicesSurface.push(i, i + 1, i + demData.width);
      indicesSurface.push(i + 1, i + demData.width + 1, i + demData.width);
    }
  }

  const vertexCount = positions.length / 3;

  // --- Créer la base plane ---
  const baseVertices: number[] = [];
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const z = positions[i + 2];
    baseVertices.push(x, baseHeight, z);
  }

  // --- Créer les murs verticaux ---
  const indicesWalls: number[] = [];
  for (let i = 0; i < vertexCount - 1; i++) {
    const top1 = i;
    const top2 = i + 1;
    const bottom1 = i + vertexCount;
    const bottom2 = i + 1 + vertexCount;

    indicesWalls.push(top1, top2, bottom1);
    indicesWalls.push(top2, bottom2, bottom1);
  }

  // --- Fusionner données ---
  const combinedPositions = positions.concat(baseVertices);
  const combinedUVs = uvs.concat(new Array(vertexCount * 2).fill(0)); // UVs inutiles pour murs/base
  const combinedIndices = indicesSurface.concat(indicesWalls);

  const scene = (window as unknown as GPX3DWindow).gpx3D.scene!;
  // --- Créer le mesh ---
  const terrainBlock = new Mesh("terrainBlock", scene);
  const vertexData = new VertexData();
  vertexData.positions = combinedPositions;
  vertexData.indices = combinedIndices;
  vertexData.uvs = combinedUVs;
  vertexData.applyToMesh(terrainBlock);

  // --- Matériaux ---
  const matTop = new StandardMaterial("matTop", scene);
  matTop.diffuseTexture = new Texture(
    texCanvas.toDataURL(),
    scene,
    false,
    true,
    Texture.TRILINEAR_SAMPLINGMODE,
  );

  const matBlack = new StandardMaterial("matBlack", scene);
  matBlack.diffuseColor = new Color3(0, 0, 0);

  // --- MultiMaterial ---
  const multiMat = new MultiMaterial("multi", scene);
  multiMat.subMaterials.push(matTop); // 0 : surface
  multiMat.subMaterials.push(matBlack); // 1 : murs + base
  terrainBlock.material = multiMat;

  // Définir les SubMeshes
  terrainBlock.subMeshes = [];
  new SubMesh(0, 0, vertexCount, 0, indicesSurface.length, terrainBlock);
  new SubMesh(
    1,
    0,
    vertexCount * 2,
    indicesSurface.length,
    indicesWalls.length,
    terrainBlock,
  );

  return terrainBlock;
};
