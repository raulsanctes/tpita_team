import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// --- 1. VARIABLES GLOBALES Y ESTADO ---
window.customFreq = "22222"; 
let firstKey = true;

let profileImg = new Image();
profileImg.src = 'profile.jpg'; 
let imgLoaded = false;
profileImg.onload = () => { imgLoaded = true; };

let previewImg = new Image();
previewImg.crossOrigin = "Anonymous"; 
let lastLoadedUrl = "";

let DATA = null; 
const CONFIG = {
    width: 2560, 
    height: 1440,
    color: '#1aff80',
    bgColor: '#000000',
    padding: 80,
    topHeight: 520,
    barHeight: 40,
    sideWidth: 550,
    gap: 20
};

const STYLE = {
    scale: 1.0,
    h_title: 48,
    h_sub: 24,
    bar_text: 22,
    cv_name: 32,
    cv_text: 20,
    lore_text: 20,
    code_text: 18,
    file_text: 22
};

let stackScroll = 0;
let loadingBar = 0;
let loadingTarget = 60;
let currentFileIdx = 0;
let clickZones = [];
let hoveredLink = null;

async function loadData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error("No se encontró data.json");
        DATA = await response.json();
        init(); 
    } catch (error) {
        console.error("Error:", error);
    }
}

// --- 3. CONFIGURACIÓN DE THREE.JS ---
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
let texture;

function init() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    camera.position.z = 1;
    canvas.width = CONFIG.width;
    canvas.height = CONFIG.height;
    texture = new THREE.CanvasTexture(canvas);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: texture }));
    scene.add(plane);
    animate();
}

function font(size, bold = false) {
    return `${bold ? 'bold ' : ''}${size * STYLE.scale}px monospace`;
}

function drawWindow(x, y, w, h, title) {
    ctx.strokeStyle = CONFIG.color;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = CONFIG.color;
    ctx.fillRect(x, y, w, CONFIG.barHeight);
    ctx.fillStyle = CONFIG.bgColor;
    ctx.font = font(STYLE.bar_text, true);
    ctx.fillText(title, x + 15, y + CONFIG.barHeight - 12);
    ctx.fillStyle = CONFIG.color;
}

function drawWrappedText(text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let cursorY = y;
    ctx.font = font(STYLE.cv_text);
    for(let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        if (ctx.measureText(testLine).width > maxWidth && n > 0) {
            ctx.fillText(line, x, cursorY);
            line = words[n] + ' ';
            cursorY += lineHeight;
        } else { line = testLine; }
    }
    ctx.fillText(line, x, cursorY);
    return cursorY + lineHeight;
}

// --- 4. FUNCIÓN PRINCIPAL DE DIBUJO ---
function drawInterface() {
    if (!DATA) return;
    
    ctx.fillStyle = CONFIG.bgColor;
    ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
    ctx.strokeStyle = CONFIG.color;
    ctx.fillStyle = CONFIG.color;
    clickZones = [];

    const p = CONFIG.padding;
    const cw = CONFIG.width - (p*2);
    const ch = CONFIG.height - (p*2);
    
    // HEADER
    ctx.font = font(STYLE.h_title, true);
    ctx.fillText(DATA.header.title, p + CONFIG.sideWidth + CONFIG.gap, p + 50);
    ctx.font = font(STYLE.h_sub);
    ctx.fillText(DATA.header.subtitle, p + CONFIG.sideWidth + CONFIG.gap, p + 90);

    // --- PROFILE, LORE, RADIO Y TECH STACK (Código anterior mantenido) ---
    drawWindow(p, p, CONFIG.sideWidth, CONFIG.topHeight, "USER_PROFILE");
    if (imgLoaded) {
        ctx.save();
        ctx.filter = 'grayscale(100%) contrast(150%) brightness(90%)';
        ctx.drawImage(profileImg, p+30, p+60, 150, 150);        
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = CONFIG.color;
        ctx.fillRect(p+30, p+60, 150, 150);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.2; ctx.fillStyle = 'black';
        for(let l = 0; l < 150; l += 4) { ctx.fillRect(p+30, p+60 + l, 150, 2); }
        ctx.restore();
    }
    ctx.strokeRect(p+30, p+60, 150, 150);
    ctx.font = font(STYLE.cv_name, true);
    ctx.fillText(DATA.profile.name, p + 30, p + 250);
    ctx.font = font(STYLE.cv_text);
    DATA.profile.stats.forEach((stat, i) => ctx.fillText(stat, p + 200, p + 90 + (i * 35)));
    let bioY = drawWrappedText(DATA.profile.bio, p + 30, p + 290, CONFIG.sideWidth - 60, 30);
    // Busca esta parte en tu función drawInterface:
    DATA.profile.links.forEach((link, i) => {
        let ly = bioY + 20 + (i * 40);
        ctx.font = font(STYLE.cv_text, hoveredLink === i);
        
        // ESTA LÍNEA ES LA CLAVE: debe usar link.label
        ctx.fillText(`> [ ${link.label} ]`, p + 30, ly); 
        
        let m = ctx.measureText(`> [ ${link.label} ]`);
        clickZones.push({
            x: p+30, y: ly - 25, w: m.width, h: 30, 
            action: 'link', 
            url: link.url, // Y aquí usa link.url del JSON
            id: i
        });
    });

    const midX = p + CONFIG.sideWidth + CONFIG.gap;
    const midW = cw - (CONFIG.sideWidth * 2) - (CONFIG.gap * 2);
    const midH = CONFIG.topHeight - 120;
    const midY = p + 120;
    const halfW = midW / 2;
    drawWindow(midX, midY, midW, midH, "CORE_COMMUNICATIONS // SCANNING...");
    ctx.save();
    ctx.beginPath(); ctx.rect(midX, midY + CONFIG.barHeight, halfW, midH - CONFIG.barHeight); ctx.clip();
    ctx.font = font(STYLE.lore_text);
    DATA.lore.forEach((line, i) => { ctx.fillText(line, midX + 20, midY + 80 + (i * 30)); });
    ctx.restore();

    const radioX = midX + halfW;
    const radioCenterY = midY + (midH / 2) + 20;
    ctx.beginPath();
    for (let x = 0; x < halfW - 40; x++) {
        const wave = Math.sin(x * 0.05 + Date.now() * 0.012) * 20 + Math.sin(x * 0.1) * 10;
        const y = radioCenterY + wave + (Math.random() - 0.5) * 4;
        if (x === 0) ctx.moveTo(radioX + 20 + x, y);
        else ctx.lineTo(radioX + 20 + x, y);
    }
    ctx.stroke();

    const dispX = radioX + (halfW / 2) - 110;
    const dispY = midY + 60;
    ctx.strokeRect(dispX, dispY, 220, 60);
    ctx.font = font(26, true);
    ctx.textAlign = "center";
    const cursor = (Math.floor(Date.now() / 500) % 2 === 0) ? "_" : " ";
    let drift = (Math.random() * 0.09).toFixed(2).split('.')[1];
    ctx.fillText(`${window.customFreq + cursor}.${drift} MHZ`, radioX + (halfW / 2), dispY + 42);
    ctx.textAlign = "left";

    const rightX = p + CONFIG.sideWidth + midW + (CONFIG.gap * 2);
    drawWindow(rightX, p, CONFIG.sideWidth, CONFIG.topHeight, "SYSTEM_DECODING");
    ctx.save();
    ctx.beginPath(); ctx.rect(rightX, p + CONFIG.barHeight, CONFIG.sideWidth, CONFIG.topHeight - CONFIG.barHeight - 70); ctx.clip();
    const stackH = DATA.stack.keywords.length * 40;
    for(let i=0; i<20; i++) {
        let y = (p + 60) + (i * 40) - (stackScroll % stackH);
        if(y < p + CONFIG.barHeight) y += stackH;
        ctx.globalAlpha = 0.3; ctx.fillText(DATA.stack.ascii[i % DATA.stack.ascii.length], rightX + 20, y);
        ctx.globalAlpha = 1.0; ctx.font = font(STYLE.code_text, true);
        ctx.fillText(DATA.stack.keywords[i % DATA.stack.keywords.length], rightX + 140, y);
    }
    ctx.restore();
    const barY = p + CONFIG.topHeight - 45;
    ctx.strokeRect(rightX + 20, barY, CONFIG.sideWidth - 40, 20);
    ctx.fillRect(rightX + 24, barY + 4, (CONFIG.sideWidth - 48) * (loadingBar/100), 12);

// --- SECCIÓN INFERIOR: EXPLORADOR Y VISOR TÉCNICO ---
    const botY = p + CONFIG.topHeight + CONFIG.gap;
    const botH = ch - CONFIG.topHeight - CONFIG.gap;
    const explorerW = cw * 0.3; 
    const viewerW = cw * 0.7 - CONFIG.gap; 
    const viewerX = p + explorerW + CONFIG.gap;

    // 1. EXPLORADOR (Izquierda)
    drawWindow(p, botY, explorerW, botH, "FILE_EXPLORER");
    DATA.files.forEach((file, i) => {
        let fy = botY + 80 + (i * 50);
        let isSelected = currentFileIdx === i;
        if (isSelected) {
            ctx.globalAlpha = 0.2; ctx.fillRect(p + 15, fy - 35, explorerW - 30, 45);
            ctx.globalAlpha = 1.0; ctx.fillText(">", p + 25, fy);
        }
        ctx.font = font(STYLE.file_text, isSelected);
        ctx.fillText(file.name, p + 55, fy);
        clickZones.push({x: p, y: fy - 35, w: explorerW, h: 45, action: 'file', idx: i});
    });

    // 2. VISOR CON ASPECT RATIO Y COORDENADAS (Derecha)
    let selectedFile = DATA.files[currentFileIdx];
    drawWindow(viewerX, botY, viewerW, botH, `IMAGE_VIEWER // ${selectedFile ? selectedFile.name : 'NONE'}`);

    if (selectedFile && selectedFile.url) {
        if (lastLoadedUrl !== selectedFile.url) {
            previewImg.src = selectedFile.url;
            lastLoadedUrl = selectedFile.url;
        }

        const pad = 40;
        const iX = viewerX + pad;
        const iY = botY + CONFIG.barHeight + pad;
        const iW = viewerW - (pad * 2);
        const iH = botH - CONFIG.barHeight - (pad * 2);

        ctx.save();
        ctx.strokeStyle = CONFIG.color;
        ctx.strokeRect(iX, iY, iW, iH); 

        if (previewImg.complete && previewImg.naturalWidth !== 0) {
            // --- CÁLCULO DE ESCALA (NO DEFORMACIÓN) ---
            const imgRatio = previewImg.naturalWidth / previewImg.naturalHeight;
            const viewRatio = iW / iH;
            let dW, dH;

            if (imgRatio > viewRatio) {
                dW = iW; dH = iW / imgRatio;
            } else {
                dH = iH; dW = iH * imgRatio;
            }

            const oX = iX + (iW - dW) / 2;
            const oY = iY + (iH - dH) / 2;

            // Dibujar imagen con filtro
            ctx.filter = 'grayscale(100%) contrast(130%) brightness(80%)';
            ctx.drawImage(previewImg, oX, oY, dW, dH);
            
            // Tinte verde
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = CONFIG.color;
            ctx.fillRect(iX, iY, iW, iH);
            
            ctx.globalCompositeOperation = 'source-over';
            
            // --- OVERLAY DE COORDENADAS Y DATOS ---
            ctx.filter = 'none';
            ctx.fillStyle = CONFIG.color;
            ctx.font = font(14);
            
            // Generamos coordenadas "falsas" pero realistas basadas en el índice
            const lat = (currentFileIdx * 12.4532).toFixed(4);
            const lon = (currentFileIdx * -45.1293).toFixed(4);
            
            // Esquinas con coordenadas
            ctx.fillText(`LAT: ${lat}°N`, iX + 10, iY + 20);
            ctx.fillText(`LON: ${lon}°W`, iX + 10, iY + 40);
            ctx.fillText(`ALT: 4500m`, iX + 10, iY + 60);

            // Marca de agua / Timestamp
            ctx.textAlign = "right";
            ctx.fillText(`ISO_DATE: ${new Date().toISOString().split('T')[0]}`, iX + iW - 10, iY + 20);
            ctx.fillText(`SYNC_STATUS: ENCRYPTED`, iX + iW - 10, iY + 40);            

            // Scanlines
            ctx.globalAlpha = 0.15; ctx.fillStyle = 'black';
            for(let l = 0; l < iH; l += 5) ctx.fillRect(iX, iY + l, iW, 2);
            
        } else {
            ctx.font = font(20); ctx.textAlign = "center";
            ctx.fillText("WAITING_FOR_DATA_STREAM...", viewerX + viewerW/2, botY + botH/2);
        }
        ctx.restore();
    }
    texture.needsUpdate = true;
}

function animate() {
    requestAnimationFrame(animate);
    stackScroll += 1;
    if (loadingBar < loadingTarget) loadingBar += 0.5;
    else { loadingTarget = Math.random() * 100; if (loadingBar > 99) loadingBar = 0; }
    drawInterface();
    renderer.render(scene, camera);
}

// --- EVENTOS ---
window.addEventListener('mousemove', (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (CONFIG.width / rect.width);
    const my = (e.clientY - rect.top) * (CONFIG.height / rect.height);
    hoveredLink = null;
    document.body.style.cursor = 'default';
    clickZones.forEach(z => {
        if (mx >= z.x && mx <= z.x + z.w && my >= z.y && my <= z.y + z.h) {
            document.body.style.cursor = 'pointer';
            if (z.action === 'link') hoveredLink = z.id;
        }
    });
});

window.addEventListener('mousedown', (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (CONFIG.width / rect.width);
    const my = (e.clientY - rect.top) * (CONFIG.height / rect.height);
    clickZones.forEach(z => {
        if (mx >= z.x && mx <= z.x + z.w && my >= z.y && my <= z.y + z.h) {
            if (z.action === 'file') currentFileIdx = z.idx;
            if (z.action === 'link' && z.url) window.open(z.url, '_blank');
        }
    });
});

document.addEventListener('keydown', (e) => {
    if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        if (firstKey) { window.customFreq = ""; firstKey = false; }
        if (window.customFreq.length < 5) window.customFreq += e.key;
    }
    if (e.key === "Backspace") {
        e.preventDefault();
        window.customFreq = window.customFreq.slice(0, -1);
        if (window.customFreq === "") firstKey = true;
    }
}, true);

loadData();