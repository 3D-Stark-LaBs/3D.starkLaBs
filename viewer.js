// viewer.js
import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function renderSTL(containerId, stlUrl) {
    const container = document.getElementById(containerId);
    if (!container) return console.error(`Container '${containerId}' not found`);

    // Clear container
    container.innerHTML = '';

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(100, 100, 100);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(1, 1, 1).normalize();
    scene.add(dirLight);

    // Load model
    const loader = new STLLoader();
    loader.load(
        stlUrl,
        geometry => {
            const material = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
            const mesh = new THREE.Mesh(geometry, material);

            // Centering
            geometry.computeBoundingBox();
            const box = geometry.boundingBox;
            const center = new THREE.Vector3();
            box.getCenter(center);
            mesh.position.sub(center);

            // Scale to fit
            const size = new THREE.Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 150 / maxDim;
            mesh.scale.set(scale, scale, scale);

            scene.add(mesh);
        },
        undefined,
        error => {
            console.error("Error loading STL:", error);
            container.innerHTML = '<p class="text-red-500">Error loading 3D model</p>';
        }
    );

    // Resize
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    // Animate
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
}
window.renderSTLViewer = renderSTL;
