import {
  ArcRotateCamera,
  Engine,
  HemisphericLight,
  Scene,
  Vector3,
} from "@babylonjs/core";
import type { GPX3DWindow } from "./types";

export const babylon = () => {
  const canvas = document.getElementById("babylon");
  if ((window as unknown as GPX3DWindow).gpx3D.engine) return;
  const engine = new Engine(canvas as HTMLCanvasElement, true, {
    preserveDrawingBuffer: true,
    stencil: true,
  });
  const scene = new Scene(engine);
  const camera = new ArcRotateCamera(
    "camera",
    -Math.PI / 2,
    Math.PI / 2.5,
    3,
    new Vector3(0, 0, -250),
    scene,
  );
  camera.setTarget(Vector3.Zero());
  camera.attachControl(canvas, false);
  new HemisphericLight("h", new Vector3(0, 1, 0), scene);
  engine.runRenderLoop(() => scene.render());
  (window as unknown as GPX3DWindow).gpx3D.scene = scene;
  (window as unknown as GPX3DWindow).gpx3D.engine = engine;
};
