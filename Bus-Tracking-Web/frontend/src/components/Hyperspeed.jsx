import { useEffect, useRef } from "react";
import * as THREE from "three";

const defaultOptions = {
  distortion: "turbulentDistortion",
  length: 400,
  roadWidth: 10,
  islandWidth: 2,
  lanesPerRoad: 3,
  fov: 90,
  fovSpeedUp: 150,
  speedUp: 2,
  carLightsFade: 0.4,
  totalSideLightSticks: 20,
  lightPairsPerRoadWay: 40,
  shoulderLinesWidthPercentage: 0.05,
  brokenLinesWidthPercentage: 0.1,
  brokenLinesLengthPercentage: 0.5,
  lightStickWidth: [0.12, 0.5],
  lightStickHeight: [1.3, 1.7],
  movingAwaySpeed: [60, 80],
  movingCloserSpeed: [-120, -160],
  carLightsLength: [12, 80],
  carLightsRadius: [0.05, 0.14],
  carWidthPercentage: [0.3, 0.5],
  carShiftX: [-0.8, 0.8],
  carFloorSeparation: [0, 5],
  colors: {
    roadColor: 0x080808,
    islandColor: 0x0a0a0a,
    background: 0x000000,
    shoulderLines: 0x131318,
    brokenLines: 0x131318,
    leftCars: [0xd856bf, 0x6750a2, 0xc247ac],
    rightCars: [0x03b3c3, 0x0e5ea5, 0x324555],
    sticks: 0x03b3c3
  }
};

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

export default function Hyperspeed({ effectOptions = {} }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const options = {
      ...defaultOptions,
      ...effectOptions,
      colors: {
        ...defaultOptions.colors,
        ...(effectOptions.colors || {})
      }
    };

    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(options.colors.background);
    scene.fog = new THREE.Fog(options.colors.background, 40, options.length);

    const camera = new THREE.PerspectiveCamera(
      options.fov,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 7, 18);
    camera.rotation.x = -0.35;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const pointLight = new THREE.PointLight(0xffffff, 1.2, 200);
    pointLight.position.set(0, 20, 20);
    scene.add(pointLight);

    const roadGroup = new THREE.Group();
    scene.add(roadGroup);

    const roadMaterial = new THREE.MeshStandardMaterial({
      color: options.colors.roadColor,
      roughness: 0.95,
      metalness: 0.05
    });

    const islandMaterial = new THREE.MeshStandardMaterial({
      color: options.colors.islandColor,
      roughness: 1
    });

    const lineMaterial = new THREE.MeshBasicMaterial({
      color: options.colors.brokenLines
    });

    const shoulderMaterial = new THREE.MeshBasicMaterial({
      color: options.colors.shoulderLines
    });

    const roadLeft = new THREE.Mesh(
      new THREE.PlaneGeometry(options.roadWidth, options.length),
      roadMaterial
    );
    roadLeft.rotation.x = -Math.PI / 2;
    roadLeft.position.x = -(options.islandWidth / 2 + options.roadWidth / 2);
    roadLeft.position.z = -options.length / 2 + 20;
    roadGroup.add(roadLeft);

    const roadRight = new THREE.Mesh(
      new THREE.PlaneGeometry(options.roadWidth, options.length),
      roadMaterial
    );
    roadRight.rotation.x = -Math.PI / 2;
    roadRight.position.x = options.islandWidth / 2 + options.roadWidth / 2;
    roadRight.position.z = -options.length / 2 + 20;
    roadGroup.add(roadRight);

    const island = new THREE.Mesh(
      new THREE.PlaneGeometry(options.islandWidth, options.length),
      islandMaterial
    );
    island.rotation.x = -Math.PI / 2;
    island.position.z = -options.length / 2 + 20;
    roadGroup.add(island);

    const shoulderWidth = options.roadWidth * options.shoulderLinesWidthPercentage;
    const shoulderGeo = new THREE.PlaneGeometry(shoulderWidth, options.length);

    const leftShoulder = new THREE.Mesh(shoulderGeo, shoulderMaterial);
    leftShoulder.rotation.x = -Math.PI / 2;
    leftShoulder.position.x =
      -(options.islandWidth / 2 + options.roadWidth) + shoulderWidth / 2;
    leftShoulder.position.z = -options.length / 2 + 20;
    roadGroup.add(leftShoulder);

    const rightShoulder = new THREE.Mesh(shoulderGeo, shoulderMaterial);
    rightShoulder.rotation.x = -Math.PI / 2;
    rightShoulder.position.x =
      options.islandWidth / 2 + options.roadWidth - shoulderWidth / 2;
    rightShoulder.position.z = -options.length / 2 + 20;
    roadGroup.add(rightShoulder);

    const brokenLineWidth =
      (options.roadWidth / options.lanesPerRoad) *
      options.brokenLinesWidthPercentage;
    const brokenLineLength = 12;
    const brokenLineGap = 10;
    const totalLines = Math.floor(options.length / (brokenLineLength + brokenLineGap));
    const roadOffset = options.islandWidth / 2;

    const laneLines = [];

    for (let side of [-1, 1]) {
      for (let lane = 1; lane < options.lanesPerRoad; lane++) {
        const laneX =
          side *
          (roadOffset +
            (lane * options.roadWidth) / options.lanesPerRoad);

        for (let i = 0; i < totalLines; i++) {
          const segment = new THREE.Mesh(
            new THREE.PlaneGeometry(brokenLineWidth, brokenLineLength),
            lineMaterial
          );
          segment.rotation.x = -Math.PI / 2;
          segment.position.set(
            laneX,
            0.02,
            -(i * (brokenLineLength + brokenLineGap))
          );
          scene.add(segment);
          laneLines.push(segment);
        }
      }
    }

    const sticks = [];
    for (let side of [-1, 1]) {
      for (let i = 0; i < options.totalSideLightSticks; i++) {
        const h = randomBetween(
          options.lightStickHeight[0],
          options.lightStickHeight[1]
        );
        const w = randomBetween(
          options.lightStickWidth[0],
          options.lightStickWidth[1]
        );

        const stick = new THREE.Mesh(
          new THREE.BoxGeometry(w, h, w),
          new THREE.MeshBasicMaterial({
            color: options.colors.sticks
          })
        );

        stick.position.x = side * (options.islandWidth / 2 + options.roadWidth + 2.5);
        stick.position.y = h / 2;
        stick.position.z = -i * (options.length / options.totalSideLightSticks);

        scene.add(stick);
        sticks.push(stick);
      }
    }

    const leftCars = [];
    const rightCars = [];

    function createCarLights(side, colorList, speedRange, store) {
      const count = options.lightPairsPerRoadWay;
      for (let i = 0; i < count; i++) {
        const radius = randomBetween(
          options.carLightsRadius[0],
          options.carLightsRadius[1]
        );
        const length = randomBetween(
          options.carLightsLength[0],
          options.carLightsLength[1]
        );
        const geometry = new THREE.BoxGeometry(radius, radius, length);
        const color =
          colorList[Math.floor(Math.random() * colorList.length)];

        const material = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.9
        });

        const light = new THREE.Mesh(geometry, material);

        const laneWidth = options.roadWidth / options.lanesPerRoad;
        const laneIndex = Math.floor(Math.random() * options.lanesPerRoad);

        const xBase =
          side *
          (options.islandWidth / 2 +
            laneWidth * laneIndex +
            laneWidth * randomBetween(0.3, 0.7));

        light.position.x = xBase + randomBetween(
          options.carShiftX[0],
          options.carShiftX[1]
        ) * 0.3;
        light.position.y = randomBetween(
          options.carFloorSeparation[0],
          options.carFloorSeparation[1]
        ) * 0.05 + 0.15;
        light.position.z = -Math.random() * options.length;

        light.userData.speed = randomBetween(speedRange[0], speedRange[1]) * 0.08;
        light.userData.side = side;

        scene.add(light);
        store.push(light);
      }
    }

    createCarLights(-1, options.colors.leftCars, options.movingAwaySpeed, leftCars);
    createCarLights(1, options.colors.rightCars, options.movingCloserSpeed, rightCars);

    let animationFrameId;

    const clock = new THREE.Clock();

    function animate() {
      const elapsed = clock.getElapsedTime();
      const delta = clock.getDelta();

      laneLines.forEach((line) => {
        line.position.z += 35 * delta;
        if (line.position.z > 25) {
          line.position.z = -options.length + randomBetween(0, 20);
        }
      });

      sticks.forEach((stick) => {
        stick.position.z += 55 * delta;
        if (stick.position.z > 20) {
          stick.position.z = -options.length;
        }
      });

      leftCars.forEach((light) => {
        light.position.z += light.userData.speed * delta;
        light.material.opacity = 0.65 + Math.sin(elapsed * 4) * 0.15;
        if (light.position.z > 30) {
          light.position.z = -options.length;
        }
      });

      rightCars.forEach((light) => {
        light.position.z -= Math.abs(light.userData.speed) * delta;
        light.material.opacity = 0.65 + Math.cos(elapsed * 4) * 0.15;
        if (light.position.z < -options.length) {
          light.position.z = 25;
        }
      });

      if (options.distortion === "mountainDistortion") {
        camera.position.x = Math.sin(elapsed * 0.35) * 1.2;
        camera.position.y = 7 + Math.sin(elapsed * 0.5) * 0.3;
      } else if (options.distortion === "xyDistortion") {
        camera.position.x = Math.sin(elapsed * 0.8) * 0.8;
        camera.position.y = 7 + Math.cos(elapsed * 0.9) * 0.4;
      } else if (options.distortion === "deepDistortion") {
        camera.position.z = 18 + Math.sin(elapsed * 0.4) * 2;
      } else {
        camera.position.x = Math.sin(elapsed * 0.45) * 0.35;
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    function handleResize() {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);

      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });

      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [effectOptions]);

  return <div id="lights" ref={mountRef} />;
}