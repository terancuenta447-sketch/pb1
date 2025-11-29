/**
 * Módulo: UI Helpers
 * Categoría: ui
 * Responsabilidad: Métodos de utilidad para notificaciones, progreso, descarga y UI básico
 * Extraído de: ui.js (refactorización para reducir complejidad)
 * Generado: 2025-11-29
 *
 * ⚠️ IMPORTANTE: Este archivo mantiene 100% compatibilidad con ui.js original
 * NO cambiar nombres de funciones ni firmas
 */

/**
 * Contenedor global de toasts (compartido entre funciones)
 */
let toastContainerInstance = null;

/**
 * Asegurar que existe el contenedor de toasts
 * Compatible con UI.ensureToastContainer()
 */
export function ensureToastContainer() {
    if (toastContainerInstance) return toastContainerInstance;

    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '8px';
    container.style.zIndex = '2000';
    document.body.appendChild(container);

    toastContainerInstance = container;
    return toastContainerInstance;
}

/**
 * Mostrar notificación toast
 * Compatible con UI.toast(message, type)
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de toast ('info', 'success', 'error', 'warning')
 */
export function toast(message, type = 'info') {
    if (!message) return;

    const toastContainer = ensureToastContainer();

    const toastElement = document.createElement('div');
    toastElement.className = `toast toast-${type}`;
    toastElement.textContent = message;

    toastContainer.appendChild(toastElement);

    setTimeout(() => {
        toastElement.classList.add('fade-out');
        setTimeout(() => toastElement.remove(), 300);
    }, 4000);
}

/**
 * Actualizar barra de progreso
 * Compatible con UI.updateProgress(current, total)
 * @param {number} current - Progreso actual
 * @param {number} total - Total
 * @param {Function} getElement - Función para obtener elemento del DOM (inyectada)
 */
export function updateProgress(current, total, getElement) {
    const progressFill = getElement('progressFill', 'containers');
    if (!progressFill) return;
    if (total <= 0) total = 1;
    const percentage = Math.min(100, Math.round((current / total) * 100));
    progressFill.style.width = `${percentage}%`;
    progressFill.textContent = `${percentage}%`;
}

/**
 * Actualizar contenido HTML de un elemento
 * Compatible con UI.updateElement(id, html)
 * @param {string} id - ID del elemento
 * @param {string} html - HTML a insertar
 */
export function updateElement(id, html) {
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = html;
}

/**
 * Descargar archivo
 * Compatible con UI.download(filename, data, mimeType)
 * @param {string} filename - Nombre del archivo
 * @param {string} data - Datos a descargar
 * @param {string} mimeType - Tipo MIME (default: 'text/plain')
 */
export function download(filename, data, mimeType = 'text/plain') {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
}

/**
 * Mostrar estado de importación
 * Compatible con UI.showImportStatus(message, type)
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de estado ('info', 'success', 'error', 'warning')
 * @param {Function} getElement - Función para obtener elemento del DOM (inyectada)
 */
export function showImportStatus(message, type = 'info', getElement) {
    const importStatus = getElement('importStatus', 'containers');
    const importStatusText = getElement('importStatusText', 'containers');
    if (!importStatus || !importStatusText) return;
    importStatus.className = `import-status status-${type}`;
    importStatus.style.display = 'flex';
    importStatusText.textContent = message;
}

/**
 * Alternar visibilidad de un grupo/elemento
 * Compatible con UI.toggleGroup(element, shouldShow)
 * @param {HTMLElement} element - Elemento a mostrar/ocultar
 * @param {boolean} shouldShow - Si debe mostrarse
 */
export function toggleGroup(element, shouldShow) {
    if (!element) return;
    element.style.display = shouldShow ? '' : 'none';
}

/**
 * Obtener referencia al contenedor de toasts (para compatibilidad)
 * @returns {HTMLElement|null}
 */
export function getToastContainer() {
    return toastContainerInstance;
}
