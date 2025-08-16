<template>
    <Card class="w-full shadow-md">
        <template #title>
            <div class="flex items-center justify-between gap-3">
                <span class="text-xl font-semibold">Headache Mapper (3D)</span>
                <div class="flex items-center gap-2">
                    <ToggleButton v-model="autoRotate" onLabel="Auto-rotate" offLabel="Auto-rotate" :onIcon="'pi pi-sync'" :offIcon="'pi pi-sync'" class="text-sm" />
                    <Button label="Reset view" icon="pi pi-refresh" @click="resetView" severity="secondary" outlined />
                    <Button label="Clear points" icon="pi pi-trash" @click="clearPoints" severity="danger" outlined />
                    <input v-if="enableUpload" ref="fileInput" type="file" accept=".glb,.gltf" class="hidden" @change="onFileChosen" />
                    <Button v-if="enableUpload" label="Load model" icon="pi pi-upload" @click="fileInput?.click()" />
                </div>
            </div>
        </template>

        <template #content>
            <div class="grid md:grid-cols-3 grid-cols-1 gap-4">
                <!-- 3D Canvas -->
                <div class="md:col-span-2">
                    <div ref="canvasContainer" class="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-gray-900">
                        <!-- Help overlay -->
                        <div class="absolute top-2 left-2 z-10 bg-black/40 text-white text-xs rounded px-2 py-1 select-none">Drag to rotate • Scroll to zoom • Click on the head to drop a marker</div>
                    </div>
                </div>

                <!-- Points List -->
                <div class="md:col-span-1">
                    <DataTable :value="points" dataKey="id" class="text-sm" scrollable scrollHeight="28rem">
                        <Column field="createdAt" header="Time" :body="timeBody" style="width: 8rem" />
                        <Column header="Angles (°)" :body="anglesBody" style="width: 8rem" />
                        <Column header="Actions" :body="actionsBody" style="width: 6rem" />
                    </DataTable>
                    <div class="mt-3 flex items-center gap-2">
                        <Button label="Export JSON" icon="pi pi-download" @click="exportPoints" outlined />
                    </div>
                </div>
            </div>
        </template>
    </Card>

    <!-- Optional details dialog for a clicked point -->
    <Dialog v-model:visible="detailsOpen" modal header="Point details" :style="{ width: '28rem' }">
        <div class="flex flex-col gap-3">
            <div class="flex items-center gap-2">
                <span class="w-24 text-sm text-gray-500">Label</span>
                <InputText v-model="draft.label" placeholder="e.g., sharp pain" class="w-full" />
            </div>
            <div class="flex items-center gap-2">
                <span class="w-24 text-sm text-gray-500">Intensity</span>
                <Slider v-model="draft.intensity" :min="1" :max="10" class="flex-1" />
                <span class="w-10 text-right">{{ draft.intensity }}</span>
            </div>
            <div class="flex justify-end gap-2">
                <Button label="Cancel" severity="secondary" outlined @click="detailsOpen = false" />
                <Button label="Save" icon="pi pi-check" @click="saveDraft" />
            </div>
        </div>
    </Dialog>
</template>

<script setup>
import { onMounted, onUnmounted, ref, reactive, watch, nextTick } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// PrimeVue components
import Card from 'primevue/card';
import Button from 'primevue/button';
import ToggleButton from 'primevue/togglebutton';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import Slider from 'primevue/slider';
import InputText from 'primevue/inputtext';

// Props
const props = defineProps({
    modelUrl: { type: String, default: '' }, // optional glTF/GLB model of a head
    headColor: { type: String, default: '#c9c9c9' },
    markerColor: { type: String, default: '#ff3b30' },
    enableUpload: { type: Boolean, default: true }
});

const emit = defineEmits(['point-added', 'points-cleared']);

// UI state
const canvasContainer = ref(null);
const fileInput = ref(null);
const autoRotate = ref(false);

// Points state
let idCounter = 1;
const points = ref([]);
const detailsOpen = ref(false);
const draft = reactive({ id: null, label: '', intensity: 5 });

// Three.js core
let renderer, scene, camera, controls, raycaster;
let rootGroup, headGroup, markersGroup;
let clickTargets = []; // meshes to intersect
let headBoundingSphere = null; // { center: Vector3, radius: number }

// Utils: safe disposal
function disposeObject3D(obj) {
    obj.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
            else child.material.dispose();
        }
        if (child.texture) child.texture.dispose && child.texture.dispose();
    });
}

onMounted(() => {
    initThree();
    animate();
    window.addEventListener('resize', onResize);
});

onUnmounted(() => {
    window.removeEventListener('resize', onResize);
    if (renderer) renderer.dispose();
    if (controls) controls.dispose();
    if (scene) disposeObject3D(scene);
});

watch(
    () => props.modelUrl,
    async (url) => {
        if (!url) return;
        await loadHeadModel(url);
    }
);

function initThree() {
    const container = canvasContainer.value;
    const { clientWidth: w, clientHeight: h } = container;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0b0b);

    camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0.2, 2.2);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0.15, 0);
    controls.autoRotate = autoRotate.value;
    controls.autoRotateSpeed = 1.2;

    // Lights
    const hemi = new THREE.HemisphereLight(0xffffff, 0x222233, 1.0);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(2, 3, 4);
    scene.add(dir);

    // Groups
    rootGroup = new THREE.Group();
    headGroup = new THREE.Group();
    markersGroup = new THREE.Group();
    rootGroup.add(headGroup);
    rootGroup.add(markersGroup);
    scene.add(rootGroup);

    // Default primitive head (sphere) until a model is loaded
    addDefaultHead();

    // Raycast setup
    raycaster = new THREE.Raycaster();
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    // Watch auto-rotate toggle
    watch(autoRotate, (v) => (controls.autoRotate = v));
}

function addDefaultHead() {
    // Clear existing first
    headGroup.clear();
    clickTargets = [];

    const geom = new THREE.SphereGeometry(0.9, 64, 64);
    const mat = new THREE.MeshStandardMaterial({ color: props.headColor, roughness: 0.8, metalness: 0.0 });
    const head = new THREE.Mesh(geom, mat);
    head.position.y = 0.15;
    headGroup.add(head);
    clickTargets.push(head);

    // Bounding sphere
    const bs = new THREE.Sphere(new THREE.Vector3(0, 0.15, 0), 0.9);
    headBoundingSphere = bs;
}

async function loadHeadModel(url) {
    // Remove prior meshes
    headGroup.clear();
    clickTargets = [];

    const loader = new GLTFLoader();
    try {
        const gltf = await loader.loadAsync(url);
        // Normalize size & position
        const model = gltf.scene;
        model.traverse((obj) => {
            if (obj.isMesh) {
                obj.castShadow = false;
                obj.receiveShadow = true;
                // Ensure standard material for consistent lighting if needed
                if (!(obj.material instanceof THREE.MeshStandardMaterial)) {
                    obj.material = new THREE.MeshStandardMaterial({ color: props.headColor });
                }
                clickTargets.push(obj);
            }
        });
        // Fit to unit size around radius ~0.9
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);

        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.8 / maxDim; // roughly radius ~0.9
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        model.position.y += 0.15; // raise similar to default sphere

        headGroup.add(model);

        // Compute bounding sphere for normalized mapping
        const fittedBox = new THREE.Box3().setFromObject(headGroup);
        headBoundingSphere = fittedBox.getBoundingSphere(new THREE.Sphere());
    } catch (e) {
        // Fallback on failure
        console.warn('Failed to load model, using default sphere.', e);
        addDefaultHead();
    }
}

function onPointerDown(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const intersects = raycaster.intersectObjects(clickTargets, true);
    if (!intersects.length) return;

    const hit = intersects[0];
    const worldPoint = hit.point.clone();

    // Place a small marker at the hit point
    const markerRadius = headBoundingSphere ? headBoundingSphere.radius * 0.02 : 0.02;
    const markerGeom = new THREE.SphereGeometry(markerRadius, 20, 20);
    const markerMat = new THREE.MeshStandardMaterial({ color: props.markerColor, emissive: new THREE.Color(props.markerColor), emissiveIntensity: 0.4 });
    const marker = new THREE.Mesh(markerGeom, markerMat);
    marker.position.copy(worldPoint);
    markersGroup.add(marker);

    // Compute normalized spherical angles relative to head center
    const center = headBoundingSphere ? headBoundingSphere.center : new THREE.Vector3(0, 0, 0);
    const rel = worldPoint.clone().sub(center);
    const sph = new THREE.Spherical().setFromVector3(rel.clone().normalize());
    // Convert to degrees for UI
    const toDeg = (r) => (r * 180) / Math.PI;
    const thetaDeg = toDeg(sph.theta); // 0..360 around Y (from +X)
    const phiDeg = toDeg(sph.phi); // 0..180 from +Y (downwards)

    const entry = {
        id: String(idCounter++),
        createdAt: new Date(),
        world: { x: worldPoint.x, y: worldPoint.y, z: worldPoint.z },
        spherical: { theta: sph.theta, phi: sph.phi, thetaDeg, phiDeg },
        marker, // reference to remove later
        label: '',
        intensity: 5
    };
    points.value.unshift(entry);
    draft.id = entry.id;
    draft.label = '';
    draft.intensity = 5;
    detailsOpen.value = true;
    emit('point-added', entry);
}

function saveDraft() {
    const idx = points.value.findIndex((p) => p.id === draft.id);
    if (idx !== -1) {
        points.value[idx].label = draft.label;
        points.value[idx].intensity = draft.intensity;
    }
    detailsOpen.value = false;
}

function timeBody(row) {
    const d = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function anglesBody(row) {
    const t = row.spherical.thetaDeg.toFixed(1);
    const p = row.spherical.phiDeg.toFixed(1);
    return `${t}°, ${p}°`;
}

function actionsBody(row) {
    return (
        <div class="flex gap-2">
            <Button size="small" icon="pi pi-pencil" rounded text aria-label="Edit" onClick={() => openEdit(row)} />
            <Button size="small" icon="pi pi-trash" severity="danger" rounded text aria-label="Delete" onClick={() => removePoint(row)} />
        </div>
    );
}

function openEdit(row) {
    draft.id = row.id;
    draft.label = row.label || '';
    draft.intensity = row.intensity || 5;
    detailsOpen.value = true;
}

function removePoint(row) {
    if (row.marker && markersGroup) markersGroup.remove(row.marker);
    points.value = points.value.filter((p) => p.id !== row.id);
}

function clearPoints() {
    // Remove all marker meshes
    markersGroup.children.slice().forEach((m) => markersGroup.remove(m));
    points.value = [];
    emit('points-cleared');
}

function resetView() {
    controls.reset();
}

function exportPoints() {
    const data = points.value.map((p) => ({
        id: p.id,
        createdAt: p.createdAt,
        label: p.label,
        intensity: p.intensity,
        world: p.world,
        spherical: p.spherical
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `headache-points-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function onResize() {
    if (!renderer || !camera || !canvasContainer.value) return;
    const { clientWidth: w, clientHeight: h } = canvasContainer.value;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
}

function animate() {
    requestAnimationFrame(animate);
    controls && controls.update();
    renderer && renderer.render(scene, camera);
}

function onFileChosen(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    loadHeadModel(url);
}
</script>

<style scoped>
/* Optional: smooth font rendering for the overlay */
</style>
