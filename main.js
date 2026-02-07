/**
 * TERMINAL CONTROL SYSTEM - JSON LOADER
 */

async function initTerminal() {
    try {
        // Cargamos el JSON con un timestamp para evitar la caché
        const response = await fetch('data.json?v=' + Date.now());
        if (!response.ok) throw new Error("Error al leer data.json");
        
        const data = await response.json();

        // --- 1. CABECERA Y LORE ---
        document.getElementById('header-title').textContent = data.header.title;
        document.getElementById('header-subtitle').textContent = data.header.subtitle;

        // --- 2. PERFIL ---
        document.getElementById('profile-name').textContent = data.profile.name;
        // La imagen se carga del JSON si existe, si no usa la que tienes
        if(data.profile.image) {
            document.getElementById('profile-img').src = data.profile.image;
        }

        // Dentro de initTerminal, en la parte de perfil:
        document.getElementById('profile-name').textContent = data.profile.name;
        document.getElementById('profile-bio').textContent = data.profile.bio;

        // Cargar links en el box de perfil
        const linksBox = document.getElementById('profile-links-container');
        linksBox.innerHTML = '';
        data.profile.links.forEach(link => {
            linksBox.innerHTML += `<a href="${link.url}" target="_blank">> [${link.label}]</a>`;
        });

        // --- 3. TECH STACK (STATS) ---
        const statsContainer = document.getElementById('profile-stats');
        statsContainer.innerHTML = ''; // Limpiar antes de llenar
        data.profile.stats.forEach(stat => {
            const li = document.createElement('li');
            li.textContent = `> ${stat}`;
            statsContainer.appendChild(li);
        });

        // --- 4. EXPLORADOR DE ARCHIVOS ---
        const fileList = document.getElementById('file-list');
        fileList.innerHTML = ''; 

        data.files.forEach((file, index) => {
            const fileBtn = document.createElement('div');
            fileBtn.className = 'file-item';
            fileBtn.style.cursor = 'pointer';
            fileBtn.style.marginBottom = '5px';
            fileBtn.style.padding = '5px';
            fileBtn.style.borderBottom = '1px solid var(--dark-green)';
            fileBtn.textContent = `> ${file.name}`;
            
            fileBtn.onclick = () => {
                // Efecto visual de selección
                document.querySelectorAll('.file-item').forEach(el => el.style.background = 'none');
                fileBtn.style.background = 'rgba(26, 255, 128, 0.2)';
                updateViewer(file, index);
            };

            fileList.appendChild(fileBtn);
        });

        // Cargar primer archivo por defecto
        if (data.files.length > 0) {
            updateViewer(data.files[0], 0);
        }

        // --- 5. INICIAR ESCÁNER DE FRECUENCIA ---
        startFrequencyScanner();

    } catch (error) {
        console.error("CRITICAL ERROR:", error);
        document.getElementById('header-title').textContent = "ERROR: JSON_NOT_FOUND";
    }
}

/**
 * Actualiza el Visor de Imágenes
 */
function updateViewer(file, index) {
    const viewerImg = document.getElementById('main-viewer-img');
    const viewerTitle = document.getElementById('viewer-title');
    const latEl = document.getElementById('hud-lat');
    const lonEl = document.getElementById('hud-lon');

    viewerImg.src = file.url;
    viewerTitle.textContent = `VISOR_SAT // ARCHIVE: ${file.name}`;

    // Coordenadas militares ficticias
    latEl.textContent = `LAT: ${(19.4326 + index).toFixed(4)}°N`;
    lonEl.textContent = `LON: ${(-99.1332 - index).toFixed(4)}°W`;
}

/**
 * Animación de la Frecuencia
 */
function startFrequencyScanner() {
    const freqEl = document.getElementById('freq-mhz');
    setInterval(() => {
        const base = 22222;
        const rand = (Math.random() * 0.999).toFixed(3);
        freqEl.textContent = `${base}.${rand}`;
    }, 100);
}

// Arrancar sistema
document.addEventListener('DOMContentLoaded', initTerminal);