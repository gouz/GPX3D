import type { Engine, Mesh, Scene } from "@babylonjs/core";

export type GPX3DWindow = {
  gpx3D: {
    map?: mapboxgl.Map;
    scene?: Scene;
    engine?: Engine;
    mesh?: Mesh | null;
  };
};
