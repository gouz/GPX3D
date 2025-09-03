import {
  Color3,
  Mesh,
  StandardMaterial,
  Vector3,
  VertexData,
} from "@babylonjs/core";
import { getMapboxKey } from "./storage";
import type { GPX3DWindow } from "./types";

const lngLatToPixelInTileExact = (lng: number, lat: number, z: number) => {
  const scale = Math.pow(2, z) * 256;
  const worldX = ((lng + 180) / 360) * scale;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const worldY =
    (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  const tileX = Math.floor(worldX / 256);
  const tileY = Math.floor(worldY / 256);
  const px = worldX - tileX * 256;
  const py = worldY - tileY * 256;
  return { tileX, tileY, px, py };
};

const loadImage = async (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = (_) => reject(new Error("error loading image: " + url));
    img.src = url;
  });

const decodeTerrainRGB = (r: number, g: number, b: number) =>
  -10000 + (r * 256 * 256 + g * 256 + b) * 0.1;

export const transform = async () => {
  const gridSize = 100;

  const bounds = (window as unknown as GPX3DWindow).gpx3D.map!.getBounds();
  const ne = bounds!.getNorthEast();
  const sw = bounds!.getSouthWest();
  const lngMin = sw.lng;
  const lngMax = ne.lng;
  const latMin = sw.lat;
  const latMax = ne.lat;
  const rows = gridSize;
  const cols = gridSize;

  const mapZoom = Math.round(
    (window as unknown as GPX3DWindow).gpx3D.map!.getZoom(),
  );
  const tileZ = Math.max(0, Math.min(15, mapZoom + 1));

  const tileSet = new Map();
  const pointTileMap = new Array(rows);
  for (let r = 0; r < rows; r++) {
    pointTileMap[r] = new Array(cols);
    const lat = latMax - (r / (rows - 1)) * (latMax - latMin);
    for (let c = 0; c < cols; c++) {
      const lng = lngMin + (c / (cols - 1)) * (lngMax - lngMin);
      const t = lngLatToPixelInTileExact(lng, lat, tileZ);
      const key = `${tileZ}/${t.tileX}/${t.tileY}`;
      pointTileMap[r][c] = { key, px: t.px, py: t.py };
      if (!tileSet.has(key))
        tileSet.set(key, { z: tileZ, x: t.tileX, y: t.tileY });
    }
  }

  const tileImageData = new Map();
  const tilePromises = [];
  for (const [key, t] of tileSet.entries()) {
    const p = (async () => {
      const url = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${t.z}/${t.x}/${t.y}.pngraw?access_token=${getMapboxKey()}`;
      const img = await loadImage(url);
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      const imgData = ctx?.getImageData(0, 0, c.width, c.height);
      tileImageData.set(key, {
        width: c.width,
        height: c.height,
        canvas: c,
        ctx,
        imageData: imgData,
      });
    })();
    tilePromises.push(p);
  }
  await Promise.all(tilePromises);

  const heights = new Array(rows);
  for (let r = 0; r < rows; r++) {
    heights[r] = new Array(cols);
    for (let c = 0; c < cols; c++) {
      const pt = pointTileMap[r][c];
      const tile = tileImageData.get(pt.key);
      if (!tile) {
        heights[r][c] = 0;
        continue;
      }
      const px = Math.max(
        0,
        Math.min(tile.width - 1, Math.floor(pt.px * (tile.width / 256))),
      );
      const py = Math.max(
        0,
        Math.min(tile.height - 1, Math.floor(pt.py * (tile.height / 256))),
      );
      const idx = (py * tile.width + px) * 4;
      const d = tile.imageData.data;
      const rch = d[idx],
        gch = d[idx + 1],
        bch = d[idx + 2];
      heights[r][c] = decodeTerrainRGB(rch, gch, bch) / 10;
    }
  }

  const positions = [];
  const indices = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const y = heights[r][c];
      positions.push(r, y, c);
    }
  }
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const i00 = r * cols + c;
      const i10 = (r + 1) * cols + c;
      const i01 = r * cols + (c + 1);
      const i11 = (r + 1) * cols + (c + 1);
      indices.push(i00, i10, i11);
      indices.push(i00, i11, i01);
    }
  }

  const minY = Math.min(...positions.filter((_, i) => i % 3 === 1));
  const baseY = minY - 50;
  // LEFT edge (c=0)
  for (let r = 0; r < rows - 1; r++) {
    const a = r * cols + 0;
    const b = (r + 1) * cols + 0;
    // deux vertices bas correspondants
    const ax: number = positions[a * 3],
      ay = baseY,
      az: number = positions[a * 3 + 2];
    const bx: number = positions[b * 3],
      by = baseY,
      bz: number = positions[b * 3 + 2];
    const ai = positions.length / 3;
    positions.push(ax, ay, az);
    const bi = positions.length / 3;
    positions.push(bx, by, bz);
    // triangles : a -> b -> bi  and a -> bi -> ai
    indices.push(a, b, bi);
    indices.push(a, bi, ai);
  }
  // RIGHT edge (c=cols-1)
  for (let r = 0; r < rows - 1; r++) {
    const a = r * cols + (cols - 1);
    const b = (r + 1) * cols + (cols - 1);
    const ax: number = positions[a * 3],
      ay = baseY,
      az: number = positions[a * 3 + 2];
    const bx: number = positions[b * 3],
      by = baseY,
      bz: number = positions[b * 3 + 2];
    const ai = positions.length / 3;
    positions.push(ax, ay, az);
    const bi = positions.length / 3;
    positions.push(bx, by, bz);
    // triangles (note orientation to garder normales extérieures)
    indices.push(a, bi, b);
    indices.push(a, ai, bi);
  }
  // TOP edge (r=0)
  for (let c = 0; c < cols - 1; c++) {
    const a = 0 * cols + c;
    const b = 0 * cols + (c + 1);
    const ax: number = positions[a * 3],
      ay = baseY,
      az: number = positions[a * 3 + 2];
    const bx: number = positions[b * 3],
      by = baseY,
      bz: number = positions[b * 3 + 2];
    const ai = positions.length / 3;
    positions.push(ax, ay, az);
    const bi = positions.length / 3;
    positions.push(bx, by, bz);
    indices.push(a, b, bi);
    indices.push(a, bi, ai);
  }
  // BOTTOM edge (r=rows-1)
  for (let c = 0; c < cols - 1; c++) {
    const a = (rows - 1) * cols + c;
    const b = (rows - 1) * cols + (c + 1);
    const ax: number = positions[a * 3],
      ay = baseY,
      az: number = positions[a * 3 + 2];
    const bx: number = positions[b * 3],
      by = baseY,
      bz: number = positions[b * 3 + 2];
    const ai = positions.length / 3;
    positions.push(ax, ay, az);
    const bi = positions.length / 3;
    positions.push(bx, by, bz);
    indices.push(a, bi, b);
    indices.push(a, ai, bi);
  }
  // Base: créer un quadrillage simple (triangles) reliant les vertices bas ajoutés.
  // Pour simplicité on génère une grille baseM x baseN : ici on peut créer un rectangle couvrant la bbox.
  // Pour simplicité et robustesse, on générera 4 sommets de coins au niveau baseY et 2 triangles.
  const minX = Math.min(...positions.filter((_, i) => i % 3 === 0));
  const maxX = Math.max(...positions.filter((_, i) => i % 3 === 0));
  const minZ = Math.min(...positions.filter((_, i) => i % 3 === 2));
  const maxZ = Math.max(...positions.filter((_, i) => i % 3 === 2));
  const v00i = positions.length / 3;
  positions.push(minX, baseY, minZ);
  const v10i = positions.length / 3;
  positions.push(maxX, baseY, minZ);
  const v11i = positions.length / 3;
  positions.push(maxX, baseY, maxZ);
  const v01i = positions.length / 3;
  positions.push(minX, baseY, maxZ);
  // two triangles (orientation vers le bas)
  indices.push(v00i, v10i, v11i);
  indices.push(v00i, v11i, v01i);

  if ((window as unknown as GPX3DWindow).gpx3D.mesh) {
    (window as unknown as GPX3DWindow).gpx3D.mesh!.dispose();
    (window as unknown as GPX3DWindow).gpx3D.mesh = null;
  }
  const custom = new Mesh(
    "terrainMesh",
    (window as unknown as GPX3DWindow).gpx3D.scene,
  );
  const vertexData = new VertexData();
  vertexData.positions = positions;
  vertexData.indices = indices;
  vertexData.normals = [];
  VertexData.ComputeNormals(positions, indices, vertexData.normals);
  vertexData.applyToMesh(custom, true);
  (window as unknown as GPX3DWindow).gpx3D.mesh = custom;
  const mat = new StandardMaterial(
    "mat",
    (window as unknown as GPX3DWindow).gpx3D.scene,
  );
  mat.specularColor = new Color3(0, 0, 0);
  mat.diffuseColor = new Color3(0.85, 0.85, 0.85);
  custom.material = mat;

  const centerX = gridSize / 2;
  const centerZ = gridSize / 2;
  (window as unknown as GPX3DWindow).gpx3D.scene!.activeCamera!.position =
    new Vector3(
      centerX,
      Math.max(...positions.filter((_, i) => i % 3 === 1)) + 200,
      centerZ + 400,
    );
};
