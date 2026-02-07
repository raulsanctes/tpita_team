/**
 * TERMINAL CORE LOGIC V4
 * Gestiona la carga de datos JSON y la interacción del visor.
 */

// Función principal de carga
async function initTerminal() {
    try {
        // Añadimos un timestamp (?v=...) para que no guarde el JSON en caché y siempre veas los cambios
        const response = await fetch('data.json?v=' + Date.now());
        
        if (!response.ok) throw new Error("No se pudo cargar el archivo data.json");
        
        const data = await response.json();

        // 1. CARGAR CABECERA
        document.getElementById('header-title').textContent = data.header.title || "SYSTEM_ACTIVE";
        document.getElementById('header-subtitle').textContent = data.header.subtitle || "ENCRYPTED_LINK";

        // 2. CARGAR PERFIL
        document.getElementById('profile-name').textContent = data.profile.name;
        
        const statsContainer = document.getElementById('profile-stats');
        statsContainer.innerHTML = ''; // Limpiar
        data.profile.stats.forEach(stat => {
            const li = document.createElement('li');
            li.textContent = stat;
            statsContainer.appendChild(li);
        });

        // 3. CARGAR LINKS
        const linksContainer = document.getElementById('profile-links');
        linksContainer.innerHTML = '';
        data.profile.links.forEach(link => {
            const a = document.createElement('a');
            a.href = link.url;
            a.className = 'neon-link';
            a.target = '_blank';
            a.textContent = `> [ ${link.label} ]`;
            linksContainer.appendChild(a);
            linksContainer.appendChild(document.createElement('br'));
        });

        // 4. CARGAR EXPLORADOR DE ARCHIVOS
        const fileList = document.getElementById('file-list');
        fileList.innerHTML = '';

        data.files.forEach((file, index) => {
            const fileBtn = document.createElement('div');
            fileBtn.className = 'file-item';
            fileBtn.textContent = `FILE_${index.toString().padStart(3, '0')}.DAT`;
            
            // Evento al hacer clic en un archivo
            fileBtn.onclick = () => {
                // Quitar clase activa de otros
                document.querySelectorAll('.file-item').forEach(el => el.classList.remove('active'));
                // Añadir a este
                fileBtn.classList.add('active');
                // Actualizar visor
                updateViewer(file, index);
            };

            fileList.appendChild(fileBtn);
        });

        // 5. CARGAR PRIMERA IMAGEN POR DEFECTO
        if (data.files.length > 0) {
            updateViewer(data.files[0], 0);
            fileList.firstChild.classList.add('active');
        }

        console.log("Terminal vinculada correctamente.");

    } catch (error) {
        console.error("CRITICAL_ERROR:", error);
        document.getElementById('header-title').textContent = "SYSTEM_FAILURE";
    }
}

/**
 * Actualiza el visor principal con la imagen y coordenadas
 */
function updateViewer(file, index) {
    const viewerImg = document.getElementById('main-viewer-img');
    const viewerTitle = document.getElementById('viewer-title');
    const latEl = document.getElementById('hud-lat');
    const lonEl = document.getElementById('hud-lon');

    // Cambiar imagen y título
    viewerImg.src = file.url;
    viewerTitle.textContent = `VISOR_SATELITAL // SRC: ${file.name}`;

    // Generar coordenadas ficticias basadas en el índice del archivo
    const mockLat = (12.4532 + (index * 0.0521)).toFixed(4);
    const mockLon = (-45.1293 - (index * 0.0842)).toFixed(4);

    latEl.textContent = `LAT: ${mockLat}°N`;
    lonEl.textContent = `LON: ${mockLon}°W`;

    // Efecto visual: parpadeo al cargar nueva imagen
    viewerImg.style.opacity = "0";
    setTimeout(() => {
        viewerImg.style.opacity = "1";
    }, 50);
}

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initTerminal);
