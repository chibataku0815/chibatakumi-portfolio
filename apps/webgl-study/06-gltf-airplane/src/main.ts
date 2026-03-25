import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { loadGLTF } from "@shared/gltf-loader";
import airplaneUrl from "../../assets/lowpoly-airplane.glb?url";

// --- Renderer ---
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// --- Scene ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);

// --- Camera ---
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(3, 2, 5);

// --- Controls ---
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 0, 0);

// --- Lighting (scene lights, in case glTF lights don't export) ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
dirLight.position.set(5, 3, 4);
scene.add(dirLight);

const fillLight = new THREE.DirectionalLight(0x8899cc, 1.0);
fillLight.position.set(-3, 1, -2);
scene.add(fillLight);

const rimLight = new THREE.PointLight(0xffeedd, 1.5, 20);
rimLight.position.set(0, 3, -3);
scene.add(rimLight);

// --- Ground grid ---
const grid = new THREE.GridHelper(10, 20, 0x222222, 0x161616);
scene.add(grid);

// --- Load GLTF ---
loadGLTF(airplaneUrl).then((gltf) => {
  const model = gltf.scene;

  // Center the model
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center);

  scene.add(model);
  console.log("Airplane loaded:", model);
});

// --- Resize ---
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Animate ---
function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
