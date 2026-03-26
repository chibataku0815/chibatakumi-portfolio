/**
 * debug-gui.ts -- lil-gui debug panel for 02-atmos
 *
 * Conditionally loaded via `import()` when `location.hash === "#debug"`.
 * All GUI bytes are tree-shaken out of the production bundle.
 *
 * @example
 * // main.ts
 * if (location.hash === "#debug") {
 *   const { setupDebugGUI } = await import("./utils/debug-gui");
 *   setupDebugGUI({ ... });
 * }
 */

import GUI from "lil-gui";
import type * as THREE from "three";
import type { CameraPath } from "../scene/CameraPath";
import type { Environment } from "../scene/Environment";
import type { AirplaneModel } from "../scene/AirplaneModel";
import type { CloudField } from "../scene/CloudField";

export interface DebugGUIConfig {
  cameraPath: CameraPath;
  environment: Environment;
  debugPathMesh: THREE.Mesh;
  controlPointMeshes: THREE.Mesh[];
  gridHelper: THREE.GridHelper;
  progressRef: { value: number };
  fogDensityRef: { value: number };
  airplaneRef: { current: AirplaneModel | null };
  cloudFieldRef: { current: CloudField | null };
  hemiIntensityRef: { value: number };
  dirIntensityRef: { value: number };
}

export function setupDebugGUI(config: DebugGUIConfig): GUI {
  const {
    cameraPath,
    debugPathMesh,
    controlPointMeshes,
    gridHelper,
    progressRef,
    fogDensityRef,
    airplaneRef,
    cloudFieldRef,
    hemiIntensityRef,
    dirIntensityRef,
  } = config;

  const gui = new GUI({ title: "Atmos Debug" });

  // -- Progress ---------------------------------------------------------------
  const progressFolder = gui.addFolder("Progress");
  progressFolder.add(progressRef, "value", 0, 1, 0.001).listen().disable();

  // -- View -------------------------------------------------------------------
  const viewParams = { showPath: false, showGrid: false };

  const viewFolder = gui.addFolder("View");
  viewFolder.add(viewParams, "showPath").onChange((v: boolean) => {
    debugPathMesh.visible = v;
    controlPointMeshes.forEach((m) => (m.visible = v));
  });
  viewFolder.add(viewParams, "showGrid").onChange((v: boolean) => {
    gridHelper.visible = v;
  });

  // -- Control Points ---------------------------------------------------------
  const cpFolder = gui.addFolder("Control Points");
  cameraPath.points.forEach((point, i) => {
    const folder = cpFolder.addFolder(`P${i}`);
    folder.add(point, "x", -20, 20, 0.5).onChange(() => {
      cameraPath.rebuild();
      controlPointMeshes[i]!.position.copy(point);
    });
    folder.add(point, "y", -5, 30, 0.5).onChange(() => {
      cameraPath.rebuild();
      controlPointMeshes[i]!.position.copy(point);
    });
    folder.add(point, "z", -120, 10, 1).onChange(() => {
      cameraPath.rebuild();
      controlPointMeshes[i]!.position.copy(point);
    });
    folder.close();
  });
  cpFolder.close();

  // -- Fog (auto) -------------------------------------------------------------
  const fogFolder = gui.addFolder("Fog (auto)");
  fogFolder.add(fogDensityRef, "value", 0, 0.1, 0.001).listen().disable();
  fogFolder.close();

  // -- Airplane ---------------------------------------------------------------
  const airplaneParams = { scale: 0.5, offset: 0.05, bankStrength: 0.2, wobble: false };

  const airplaneFolder = gui.addFolder("Airplane");
  airplaneFolder.add(airplaneParams, "scale", 0.1, 2.0, 0.01).onChange((v: number) => {
    if (airplaneRef.current?.params) airplaneRef.current.params.scale = v;
  });
  airplaneFolder.add(airplaneParams, "offset", 0.01, 0.15, 0.005).onChange((v: number) => {
    if (airplaneRef.current?.params) airplaneRef.current.params.offset = v;
  });
  airplaneFolder.add(airplaneParams, "bankStrength", 0.0, 0.5, 0.01).onChange((v: number) => {
    if (airplaneRef.current?.params) airplaneRef.current.params.bankStrength = v;
  });
  airplaneFolder.add(airplaneParams, "wobble").onChange((v: boolean) => {
    if (airplaneRef.current?.params) airplaneRef.current.params.wobble = v;
  });

  // -- Cloud ------------------------------------------------------------------
  const cloudParams = { opacity: 0.25 };

  const cloudFolder = gui.addFolder("Cloud");
  cloudFolder.add(cloudParams, "opacity", 0.05, 0.5, 0.01).onChange((v: number) => {
    if (cloudFieldRef.current?.params) cloudFieldRef.current.params.opacity = v;
  });

  // -- Lighting (auto) --------------------------------------------------------
  const lightingFolder = gui.addFolder("Lighting (auto)");
  lightingFolder.add(hemiIntensityRef, "value").name("hemiIntensity").listen().disable();
  lightingFolder.add(dirIntensityRef, "value").name("dirIntensity").listen().disable();
  lightingFolder.close();

  return gui;
}
