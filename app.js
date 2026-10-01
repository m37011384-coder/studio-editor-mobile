const viewport = document.getElementById('viewport');
const explorerList = document.getElementById('explorerList');
const propertiesPanel = document.getElementById('propertiesPanel');
const consoleLog = document.getElementById('consoleLog');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111827);
scene.fog = new THREE.Fog(0x111827, 18, 50);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
viewport.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 1000);
camera.position.set(8, 8, 10);

const controls = new THREE.OrbitControls(camera, viewport);
controls.enableDamping = true;
controls.enablePan = true;
controls.target.set(0, 1.5, 0);
controls.minDistance = 4;
controls.maxDistance = 30;
controls.maxPolarAngle = Math.PI / 2.05;

const ambientLight = new THREE.AmbientLight(0xffffff, 1.15);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.15);
sunLight.position.set(7, 11, 6);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
scene.add(sunLight);

const grid = new THREE.GridHelper(40, 40, 0x3b82f6, 0x334155);
grid.position.y = 0;
scene.add(grid);

const ground = new THREE.Mesh(
  new THREE.CylinderGeometry(12, 12, 0.6, 48),
  new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9, metalness: 0.1 })
);
ground.position.y = -0.35;
ground.receiveShadow = true;
scene.add(ground);

const objects = [];
let selectedObject = null;
let selectedMode = 'select';
let dragState = null;

function logMessage(message) {
  consoleLog.textContent = message;
}

function makeMaterial(color = 0x60a5fa) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.6,
    metalness: 0.2,
    emissive: color,
    emissiveIntensity: 0.06
  });
}

function setSelectedObject(obj) {
  selectedObject = obj;
  if (!obj) {
    explorerList.querySelectorAll('li').forEach((item) => item.classList.remove('active'));
    renderProperties();
    return;
  }

  const allItems = explorerList.querySelectorAll('li');
  allItems.forEach((item) => item.classList.toggle('active', item.dataset.objectId === obj.userData.id));
  renderProperties();
}

function addObject(type, config = {}) {
  let mesh;
  const id = `obj-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

  if (type === 'box') {
    mesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), makeMaterial(config.color || 0x60a5fa));
    mesh.userData = { id, type: 'Part', label: 'Part', color: config.color || 0x60a5fa };
  } else if (type === 'sphere') {
    mesh = new THREE.Mesh(new THREE.SphereGeometry(0.9, 24, 20), makeMaterial(config.color || 0x8b5cf6));
    mesh.userData = { id, type: 'Part', label: 'Sphere', color: config.color || 0x8b5cf6 };
  } else if (type === 'light') {
    const light = new THREE.PointLight(config.color || 0xfbbf24, 1.6, 18, 2);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 18, 18),
      new THREE.MeshBasicMaterial({ color: config.color || 0xfbbf24 })
    );
    light.add(glow);
    light.position.set(config.x ?? 0, config.y ?? 2.2, config.z ?? 0);
    light.castShadow = true;
    scene.add(light);
    objects.push(light);
    light.userData = { id, type: 'Light', label: 'PointLight', color: config.color || 0xfbbf24 };
    const item = document.createElement('li');
    item.dataset.objectId = id;
    item.innerHTML = `<span class="label"><span class="bullet" style="background: linear-gradient(180deg, #fbbf24, #f59e0b);"></span>PointLight</span><span>•</span>`;
    item.addEventListener('click', () => setSelectedObject(light));
    explorerList.appendChild(item);
    setSelectedObject(light);
    logMessage('Added PointLight to the scene');
    return light;
  } else if (type === 'camera') {
    const cameraObj = new THREE.PerspectiveCamera(52, viewport.clientWidth / viewport.clientHeight, 0.1, 1000);
    cameraObj.position.set(config.x ?? 5, config.y ?? 4, config.z ?? 8);
    cameraObj.lookAt(0, 0, 0);
    scene.add(cameraObj);
    objects.push(cameraObj);
    cameraObj.userData = { id, type: 'Camera', label: 'Camera', color: 0x34d399 };
    const item = document.createElement('li');
    item.dataset.objectId = id;
    item.innerHTML = `<span class="label"><span class="bullet" style="background: linear-gradient(180deg, #34d399, #10b981);"></span>Camera</span><span>•</span>`;
    item.addEventListener('click', () => setSelectedObject(cameraObj));
    explorerList.appendChild(item);
    setSelectedObject(cameraObj);
    logMessage('Camera added to the scene');
    return cameraObj;
  } else {
    mesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 1.8), makeMaterial(config.color || 0x3b82f6));
    mesh.userData = { id, type: 'Part', label: 'Part', color: config.color || 0x3b82f6 };
  }

  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.set(
    config.x ?? (Math.random() * 4 - 2),
    config.y ?? 1.5,
    config.z ?? (Math.random() * 4 - 2)
  );
  mesh.scale.set(config.scaleX ?? 1, config.scaleY ?? 1, config.scaleZ ?? 1);
  mesh.rotation.set(config.rx ?? 0, config.ry ?? 0, config.rz ?? 0);
  scene.add(mesh);
  objects.push(mesh);

  const item = document.createElement('li');
  item.dataset.objectId = id;
  item.innerHTML = `<span class="label"><span class="bullet"></span>${mesh.userData.label}</span><span>•</span>`;
  item.addEventListener('click', () => setSelectedObject(mesh));
  explorerList.appendChild(item);

  setSelectedObject(mesh);
  logMessage(`Added ${mesh.userData.label} to the scene`);
  return mesh;
}

function renderProperties() {
  propertiesPanel.innerHTML = '';

  if (!selectedObject) {
    propertiesPanel.innerHTML = '<div class="prop-card"><h4>No selection</h4><div class="prop-row"><label>Select an object</label></div></div>';
    return;
  }

  const objectInfo = selectedObject.userData || { label: 'Object', type: 'Mesh', color: 0xffffff };

  const summary = document.createElement('div');
  summary.className = 'prop-card';
  summary.innerHTML = `
    <h4>Selection</h4>
    <div class="prop-row"><label>Name</label><span class="value">${objectInfo.label}</span></div>
    <div class="prop-row"><label>Type</label><span class="value">${objectInfo.type}</span></div>
    <div class="prop-row"><label>Layer</label><span class="value">Default</span></div>
  `;
  propertiesPanel.appendChild(summary);

  const transform = document.createElement('div');
  transform.className = 'prop-card';
  transform.innerHTML = `
    <h4>Transform</h4>
    <div class="prop-row"><label>Position X</label><input type="range" min="-10" max="10" step="0.1" value="${selectedObject.position.x.toFixed(1)}" data-prop="x" /></div>
    <div class="prop-row"><label>Position Y</label><input type="range" min="-10" max="10" step="0.1" value="${selectedObject.position.y.toFixed(1)}" data-prop="y" /></div>
    <div class="prop-row"><label>Position Z</label><input type="range" min="-10" max="10" step="0.1" value="${selectedObject.position.z.toFixed(1)}" data-prop="z" /></div>
  `;
  propertiesPanel.appendChild(transform);

  const colorCard = document.createElement('div');
  colorCard.className = 'prop-card';

  const color = selectedObject.material && selectedObject.material.color
    ? selectedObject.material.color.getHexString()
    : selectedObject.color && selectedObject.color.getHexString
      ? selectedObject.color.getHexString()
      : '60a5fa';

  colorCard.innerHTML = `
    <h4>Appearance</h4>
    <div class="prop-row"><label>Color</label><input type="color" value="#${color}" data-color="true" /></div>
    <div class="prop-row"><label>Size</label><span class="value">${selectedObject.scale.x.toFixed(2)}x</span></div>
  `;
  propertiesPanel.appendChild(colorCard);

  propertiesPanel.querySelectorAll('input[type="range"]').forEach((input) => {
    input.addEventListener('input', (event) => {
      const axis = event.target.dataset.prop;
      selectedObject.position[axis] = Number(event.target.value);
      logMessage(`${selectedObject.userData.label} position ${axis}: ${selectedObject.position[axis].toFixed(1)}`);
    });
  });

  const colorInput = propertiesPanel.querySelector('input[data-color="true"]');
  if (colorInput) {
    colorInput.addEventListener('input', (event) => {
      const colorValue = new THREE.Color(event.target.value);
      if (selectedObject.material) {
        selectedObject.material.color = colorValue;
      }
      if (selectedObject.isPointLight) {
        selectedObject.color = colorValue;
      }
      logMessage(`${selectedObject.userData.label} color changed`);
    });
  }
}

function resizeRenderer() {
  const { clientWidth, clientHeight } = viewport;
  if (!clientWidth || !clientHeight) return;
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(clientWidth, clientHeight, false);
}

window.addEventListener('resize', resizeRenderer);

function addDefaultScene() {
  const base = addObject('box', { x: 0, y: 1.2, z: 0, color: 0x3b82f6 });
  const second = addObject('box', { x: 2.4, y: 1.2, z: 0, color: 0x22c55e });
  second.scale.set(1.2, 1.2, 1.2);
  const third = addObject('sphere', { x: -2.4, y: 1.3, z: 0, color: 0x8b5cf6 });
  third.scale.set(1.2, 1.2, 1.2);
  addObject('light', { color: 0xfbbf24, x: 2, y: 4, z: 3 });
  setSelectedObject(base);
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function getPointer(event) {
  const rect = viewport.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function onPointerDown(event) {
  getPointer(event);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(objects, true)[0];
  if (!hit) {
    setSelectedObject(null);
    return;
  }

  const target = hit.object;
  setSelectedObject(target);

  if (selectedMode === 'move') {
    dragState = { type: 'move', start: { x: event.clientX, y: event.clientY }, obj: target, origin: target.position.clone() };
  } else if (selectedMode === 'rotate') {
    dragState = { type: 'rotate', start: { x: event.clientX, y: event.clientY }, obj: target, origin: target.rotation.clone() };
  }
}

function onPointerMove(event) {
  if (!dragState || !selectedObject) return;

  const dx = event.clientX - dragState.start.x;
  const dy = event.clientY - dragState.start.y;

  if (dragState.type === 'move') {
    selectedObject.position.x = dragState.origin.x + dx * 0.01;
    selectedObject.position.z = dragState.origin.z + dy * 0.01;
    selectedObject.position.y = dragState.origin.y + Math.abs(dx) * 0.003;
    renderProperties();
  } else if (dragState.type === 'rotate') {
    selectedObject.rotation.y = dragState.origin.y + dx * 0.01;
    selectedObject.rotation.x = dragState.origin.x + dy * 0.008;
    renderProperties();
  }
}

function onPointerUp() {
  dragState = null;
}

viewport.addEventListener('pointerdown', onPointerDown);
viewport.addEventListener('pointermove', onPointerMove);
viewport.addEventListener('pointerup', onPointerUp);
viewport.addEventListener('pointerleave', onPointerUp);

const actionButtons = document.querySelectorAll('[data-add]');
actionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const type = button.dataset.add;
    if (type === 'box') addObject('box');
    if (type === 'sphere') addObject('sphere');
    if (type === 'light') addObject('light');
    if (type === 'camera') addObject('camera');
  });
});

document.querySelectorAll('.tool').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.tool').forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    selectedMode = button.textContent.toLowerCase();
    logMessage(`Tool: ${button.textContent}`);
  });
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

resizeRenderer();
addDefaultScene();
animate();
