async function loadTerminal() {
    try {
        const response = await fetch('data.json?v=' + Date.now());
        const data = await response.json();

        // Header
        document.getElementById('header-title').textContent = data.header.title;
        document.getElementById('header-subtitle').textContent = data.header.subtitle;

        // Profile
        document.getElementById('profile-name').textContent = data.profile.name;
        document.getElementById('profile-bio').textContent = data.profile.bio;
        
        const statsList = document.getElementById('profile-stats');
        data.profile.stats.forEach(s => statsList.innerHTML += `<li>${s}</li>`);

        const linksCont = document.getElementById('profile-links');
        data.profile.links.forEach(l => {
            linksCont.innerHTML += `<a href="${l.url}" target="_blank" class="neon-link">> [ ${l.label} ]</a>`;
        });

        // Files
        const fileList = document.getElementById('file-list');
        data.files.forEach((file, index) => {
            const btn = document.createElement('div');
            btn.className = 'file-item';
            btn.textContent = `> ${file.name}`;
            btn.onclick = () => selectFile(file, index);
            fileList.appendChild(btn);
        });

        // Cargar primer archivo por defecto
        if(data.files.length > 0) selectFile(data.files[0], 0);

    } catch (e) {
        console.error("Error cargando terminal:", e);
    }
}

function selectFile(file, index) {
    document.getElementById('viewer-title').textContent = `IMAGE_VIEWER // ${file.name}`;
    document.getElementById('main-viewer-img').src = file.url;
    document.getElementById('hud-lat').textContent = `LAT: ${(index * 12.4532).toFixed(4)}°N`;
    document.getElementById('hud-lon').textContent = `LON: ${(index * -45.1293).toFixed(4)}°W`;
}

loadTerminal();

            
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
