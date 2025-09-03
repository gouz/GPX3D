import type { Engine, Mesh, Scene } from "@babylonjs/core";
import type { Map } from "mapbox-gl";

export type GPX3DWindow = {
  gpx3D: {
    map?: Map;
    scene?: Scene;
    engine?: Engine;
    mesh?: Mesh | null;
  };
};
