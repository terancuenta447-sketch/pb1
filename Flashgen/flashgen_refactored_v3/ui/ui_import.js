/**
 * Módulo: UI Import
 * Categoría: ui
 * Responsabilidad: Métodos de importación de archivos y gestión de texto importado
 * Extraído de: ui.js (refactorización para reducir complejidad)
 * Generado: 2025-11-29
 *
 * ⚠️ IMPORTANTE: Este archivo mantiene 100% compatibilidad con ui.js original
 * NO cambiar nombres de funciones ni firmas
 */

/**
 * Vincular botones de importación con handlers de archivos
 * Compatible con UI.bindImportButtons()
 * @param {Function} getElement - Función para obtener elementos del DOM (inyectada)
 * @param {Function} setImportedText - Callback para establecer texto importado
 * @param {Function} showImportStatus - Callback para mostrar estado
 * @param {Function} toast - Callback para mostrar notificaciones
 * @param {Object} fileInput - Input de archivo (inyectado)
 * @param {Object} Processing - Módulo de procesamiento
 * @param {Object} State - Estado global
 */
export function bindImportButtons(getElement, setImportedText, showImportStatus, toast, fileInputRef, Processing, State) {
    const fileInput = fileInputRef.current || fileInputRef;
    if (!fileInput) return;

    const triggerFileSelect = (accept, handler) => {
        fileInput.accept = accept;
        fileInput.onchange = async (event) => {
            const file = event.target.files && event.target.files[0];
            if (!file) return;

            // Validar tamaño de archivo (maximo 10MB)
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                toast(`❌ Archivo demasiado grande (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximo: 10MB`, 'error');
                fileInput.value = '';
                return;
            }

            try {
                await handler(file);
            } finally {
                fileInput.value = '';
            }
        };
        fileInput.click();
    };

    const importTextBtn = getElement('importTextBtn', 'buttons');
    if (importTextBtn) {
        importTextBtn.addEventListener('click', () => {
            triggerFileSelect('.txt,.md,.docx', async (file) => {
                const ext = file.name.split('.').pop()?.toLowerCase();
                let text = '';
                if (ext === 'docx') {
                    text = await Processing.extractDocxText(file);
                } else {
                    text = await file.text();
                }
                setImportedText(text);
                showImportStatus(`✅ Archivo cargado (${file.name})`, 'success');
            });
        });
    }

    const importPdfBtn = getElement('importPdfBtn', 'buttons');
    if (importPdfBtn) {
        importPdfBtn.addEventListener('click', () => {
            triggerFileSelect('.pdf', async (file) => {
                const text = await Processing.extractPdfText(file);
                setImportedText(text);
            });
        });
    }

    const importWordListBtn = getElement('importWordListBtn', 'buttons');
    if (importWordListBtn) {
        importWordListBtn.addEventListener('click', () => {
            triggerFileSelect('.txt,.csv', async (file) => {
                const text = await file.text();
                const normalized = text
                    .split(/\r?\n/)
                    .map(line => line.trim())
                    .filter(Boolean)
                    .join('\n');
                setImportedText(normalized);
                showImportStatus(`✅ Lista importada (${file.name})`, 'success');
            });
        });
    }

    const importJsonBtn = getElement('importJsonBtn', 'buttons');
    if (importJsonBtn) {
        importJsonBtn.addEventListener('click', () => {
            triggerFileSelect('.json', async (file) => {
                try {
                    const content = await file.text();
                    const parsed = JSON.parse(content);
                    const chunks = Array.isArray(parsed)
                        ? parsed
                        : Array.isArray(parsed.chunks) ? parsed.chunks : [];
                    if (!chunks.length) {
                        throw new Error('JSON sin chunks');
                    }
                    State.pipeline.options.chunkMethod = 'none';
                    State.importedChunks = chunks;
                    setImportedText(chunks.map(chunk => chunk.text || chunk).join('\n\n'));
                    showImportStatus(`✅ JSON con ${chunks.length} chunks cargado`, 'success');
                } catch (err) {
                    showImportStatus(`❌ Error al procesar JSON: ${err.message}`, 'error');
                }
            });
        });
    }

    const pasteFromClipboardBtn = getElement('pasteFromClipboardBtn', 'buttons');
    if (pasteFromClipboardBtn) {
        pasteFromClipboardBtn.addEventListener('click', async () => {
            try {
                if (!navigator.clipboard || !navigator.clipboard.readText) {
                    toast('❌ API de portapapeles no disponible en este navegador', 'error');
                    return;
                }
                const text = await navigator.clipboard.readText();
                if (!text || !text.trim()) {
                    toast('⚠️ Portapapeles vacio', 'warning');
                    return;
                }
                setImportedText(text);
                showImportStatus(`✅ Texto pegado desde portapapeles (${text.length} caracteres)`, 'success');
            } catch (error) {
                toast(`❌ Error al leer portapapeles: ${error.message}`, 'error');
            }
        });
    }
}

/**
 * Establecer texto importado en el textarea
 * Compatible con UI.setImportedText(text)
 * @param {string} text - Texto a importar
 * @param {Function} getElement - Función para obtener elementos (inyectada)
 * @param {Function} updateInputStats - Callback para actualizar estadísticas
 * @param {Function} scheduleChunkPreviewUpdate - Callback para actualizar preview
 * @param {Function} switchTab - Callback para cambiar a tab input
 */
export function setImportedText(text, getElement, updateInputStats, scheduleChunkPreviewUpdate, switchTab) {
    const inputText = getElement('inputText', 'inputs');
    if (inputText) {
        inputText.value = text;
        updateInputStats();
        scheduleChunkPreviewUpdate();
        switchTab('input');
    }
}
