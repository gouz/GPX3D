import {
  Engine,
  FreeCamera,
  HemisphericLight,
  Scene,
  Vector3,
} from "@babylonjs/core";
import type { GPX3DWindow } from "./types";

export const babylon = () => {
  const canvas = document.getElementById("babylon");
  if ((window as unknown as GPX3DWindow).gpx3D.engine) return;
  (window as unknown as GPX3DWindow).gpx3D.engine = new Engine(
    canvas as HTMLCanvasElement,
    true,
    {
      preserveDrawingBuffer: true,
      stencil: true,
    },
  );
  (window as unknown as GPX3DWindow).gpx3D.scene = new Scene(
    (window as unknown as GPX3DWindow).gpx3D.engine!,
  );
  const camera = new FreeCamera(
    "cam",
    new Vector3(0, 2000, 4000),
    (window as unknown as GPX3DWindow).gpx3D.scene,
  );
  camera.setTarget(Vector3.Zero());
  camera.attachControl(canvas, false);
  new HemisphericLight(
    "h",
    new Vector3(0, 1, 0),
    (window as unknown as GPX3DWindow).gpx3D.scene,
  );
  (window as unknown as GPX3DWindow).gpx3D.engine!.runRenderLoop(() =>
    (window as unknown as GPX3DWindow).gpx3D.scene!.render(),
  );
};
