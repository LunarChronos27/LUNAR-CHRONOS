import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export default function LunarGlobe() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState('Loading NASA lunar model...');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let animationFrame = 0;
    let lunarModel: THREE.Object3D | null = null;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#071321');

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.01,
      1000
    );
    camera.position.set(0, 0, 3);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.8));

    const sunlight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunlight.position.set(5, 3, 5);
    scene.add(sunlight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 1.2;
    controls.maxDistance = 8;
    controls.rotateSpeed = 0.6;
    controls.zoomSpeed = 0.8;

    const loader = new GLTFLoader();

    loader.load(
      '/models/moon_small.glb',
      (gltf) => {
        if (disposed) return;

        lunarModel = gltf.scene;

        const bounds = new THREE.Box3().setFromObject(lunarModel);
        const center = bounds.getCenter(new THREE.Vector3());
        const sphere = bounds.getBoundingSphere(new THREE.Sphere());

        lunarModel.position.sub(center);
        scene.add(lunarModel);

        const radius = Math.max(sphere.radius, 0.1);
        camera.position.set(0, 0, radius * 3.2);
        camera.near = radius * 0.01;
        camera.far = radius * 20;
        camera.updateProjectionMatrix();

        controls.minDistance = radius * 1.15;
        controls.maxDistance = radius * 8;
        controls.target.set(0, 0, 0);
        controls.update();

        setStatus('NASA lunar model loaded');
      },
      undefined,
      () => {
        if (!disposed) {
          setStatus('Unable to load the lunar model');
        }
      }
    );

    const resizeObserver = new ResizeObserver(() => {
      if (disposed) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      if (width === 0 || height === 0) return;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });

    resizeObserver.observe(container);

    const animate = () => {
      animationFrame = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      controls.dispose();

      if (lunarModel) {
        lunarModel.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();

            const materials = Array.isArray(object.material)
              ? object.material
              : [object.material];

            materials.forEach((material) => {
              material.dispose();
            });
          }
        });
      }

      renderer.dispose();

      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="lunar-globe-container">
      <div ref={containerRef} className="lunar-globe-view" />
      <div className="lunar-globe-status">{status}</div>
      <div className="lunar-globe-instructions">
        DRAG TO ROTATE · SCROLL TO ZOOM
      </div>
    </div>
  );
}
