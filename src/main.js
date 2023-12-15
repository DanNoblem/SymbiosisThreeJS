import * as THREE from "three";
import "./style.css";
import { OrbitControls } from "three/addons/controls/OrbitControls";
import { DragControls } from "three/addons/controls/DragControls.js";
import { TrailRenderer } from "./TrailRenderer.js";

//post processing effects
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { AfterimagePass } from "three/addons/postprocessing/AfterimagePass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

/* 
SETUP //////////////////////////////////////////////////////////////////////////////
*/

let objects = [];

// app
const app = document.querySelector("#app");

//renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
app.appendChild(renderer.domElement);
document.body.appendChild(renderer.domElement);

//post processing
let afterimagePass;
let composer;

// scene
const scene = new THREE.Scene();
scene.background = new THREE.Color("white");

// perspective camera
const camera = new THREE.PerspectiveCamera(
  35,
  window.innerWidth / window.innerHeight,
  1,
  1000
);
camera.position.set(0, 0, 100);

// axis helper -> X: red, Y: green, Z: blue
// const axesHelper = new THREE.AxesHelper(5);
// axesHelper.position.y = 0.001;
// scene.add(axesHelper);

// light
const ambientLight = new THREE.AmbientLight("white", 0.2);
const hemisphereLight = new THREE.HemisphereLight("#ffffff", "#ff00ff", 0.8);
const directionalLight = new THREE.DirectionalLight("white", 0.8);
directionalLight.position.set(-1, 1, 1);
scene.add(ambientLight, hemisphereLight);

// control
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.05;
orbitControls.screenSpacePanning = false;
orbitControls.enableRotate = true;
orbitControls.rotateSpeed = 0.5;
orbitControls.enableZoom = true;
orbitControls.zoomSpeed = 0.5;
orbitControls.minDistance = 100;
orbitControls.maxDistance = 10000;
orbitControls.target = new THREE.Vector3(0, 0, 0);
const dragControls = new DragControls(objects, camera, renderer.domElement);

dragControls.addEventListener("dragstart", function () {
  orbitControls.enabled = false;
});
dragControls.addEventListener("dragend", function () {
  orbitControls.enabled = true;
});

// resize
const onResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

window.addEventListener("resize", onResize);

/* 
DRAWING//////////////////////////////////////////////////////////////////////////////
*/

let balls = [];
let mass = [];
let vel = [];
let acc = [];

let trails = [];

let food;

const geometry = new THREE.BoxGeometry(4, 4, 4);
const foodMaterial = new THREE.MeshStandardMaterial({
  color: "green",
  roughness: 0.8,
  metalness: 0.2,
});
//Sphere rendering properties
const sphereMaterial = new THREE.MeshStandardMaterial({ color: "black" });
const sphereGeometry = new THREE.SphereGeometry(0.5, 64, 64);

//create spheres
for (let i = 0; i < 20; i++) {
  balls[i] = new THREE.Mesh(sphereGeometry, sphereMaterial.clone());
  mass[i] = Math.random() * 5;
  const x = 50 - Math.random() * 100;
  const y = 50 - Math.random() * 100;
  const z = 50 - Math.random() * 100;
  balls[i].position.set(x, y, z);
  vel[i] = new THREE.Vector3(0, 0, 0);
  acc[i] = new THREE.Vector3(0, 0, 0);

  // adding custome properties to use later
  balls[i].name = "sphere";
  balls[i].isAnimating = false;

  scene.add(balls[i]);

  //Create Trail
  // specify points to create planar trail-head geometry
  const trailHeadGeometry = [];
  trailHeadGeometry.push(
    new THREE.Vector3(-1.0, 0.0, 0.0),
    new THREE.Vector3(0.0, 0.0, 0.0),
    new THREE.Vector3(1.0, 0.0, 0.0)
  );

  // create the trail renderer object
  trails[i] = new TrailRenderer(scene, false);

  // set how often a new trail node will be added and existing nodes will be updated
  trails[i].setAdvanceFrequency(100);

  // create material for the trail renderer
  const trailMaterial = TrailRenderer.createBaseMaterial();

  // specify length of trail
  const trailLength = 150;

  // initialize the trail
  trails[i].initialize(
    trailMaterial,
    trailLength,
    false,
    0,
    trailHeadGeometry,
    balls[i]
  );

  // activate the trail
  trails[i].activate();
}

//create food
let foodMass = 70;
food = new THREE.Mesh(geometry, foodMaterial.clone());
food.position.set(2, 4, 2);
objects.push(food);
scene.add(food);

/* 
//////////////////////////////////////////////////////////////////////////////
*/

/*post processing
composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

afterimagePass = new AfterimagePass();
composer.addPass(afterimagePass);

const outputPass = new OutputPass();
composer.addPass(outputPass);

window.addEventListener("resize", onWindowResize);

//post processing effects
if (typeof TESTING !== "undefined") {
  for (let i = 0; i < 45; i++) {
    render();
  }
}

function render() {
  balls[0].rotation.x += 0.1;
  balls[0].rotation.y += 0.01;

  afterimagePass.enabled = params.enable;

  composer.render();
}
*/

/* 
//////////////////////////////////////////////////////////////////////////////
*/

//animation
const animate = () => {
  requestAnimationFrame(animate);

  for (let i = 0; i < balls.length; i++) {
    //gravity calculation
    //attraction
    let f = new THREE.Vector3();
    f.subVectors(food.position, balls[i].position);
    let dist = balls[i].position.distanceTo(food.position);
    //constrain
    if (dist < 100) {
      dist = 200;
    }
    if (dist > 1000) {
      dist = 500;
    }

    let g = 10;
    let power = (g * (mass[i] * foodMass)) / (dist * dist);
    f.normalize();
    f.multiplyScalar(power);
    let force = f;
    acc[i] = force.divideScalar(mass[i]);

    //apply force and update
    vel[i].add(acc[i]);

    acc[i] = new THREE.Vector3(0, 0, 0);

    balls[i].position.add(vel[i]);

    trails[i].update();
  }

  renderer.render(scene, camera);
};

animate();

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}
