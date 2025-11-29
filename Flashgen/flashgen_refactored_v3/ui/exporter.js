/**
 * Módulo: Exporter
 * Categoría: ui
 * Extraído de: Flashgen.js (líneas 243-356)
 * 
 * Dependencias: DebugLogger, State
 */

import { DebugLogger } from './debug_logger.js';
import { State } from '../core/state.js';

// ✅ FIX: Mejorar acceso a UI
const getUI = () => {
    // Intentar múltiples formas de acceder a UI
    if (typeof window !== 'undefined') {
        if (window.__flashgenUI) return window.__flashgenUI;
        if (window.UI) return window.UI;
        if (window.UIInstance) return window.UIInstance;
    }
    return null;
};

const safeToast = (message, type = 'info') => {
    const ui = getUI();
    if (ui?.toast) {
        ui.toast(message, type);
    } else {
        // Fallback: console log
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
};

const safeDownload = (filename, content, mime = 'text/plain') => {
    try {
        const ui = getUI();
        if (ui?.download) {
            ui.download(filename, content, mime);
            return;
        }
        
        // ✅ FIX: Fallback directo si UI no está disponible
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        DebugLogger.log(`✅ Archivo descargado: ${filename}`, 'success');
    } catch (error) {
        DebugLogger.log(`❌ Error descargando archivo: ${error.message}`, 'error');
        safeToast(`Error al descargar: ${error.message}`, 'error');
    }
};

const Exporter = {
    initialized: false,

    init() {
        if (this.initialized) return;
        try {
            this.cacheDom();
            this.initialized = true;
            DebugLogger.log('✅ Exporter inicializado', 'success');
        } catch (error) {
            console.error('Exporter.init() falló:', error);
            this.initialized = false;
            throw error;
        }
    },

    cacheDom() {
        // ✅ FIX: Validar elementos DOM antes de cachearlos
        this.formatSelect = document.getElementById('exportFormat');
        this.preview = document.getElementById('exportPreview');
        
        if (!this.formatSelect) {
            DebugLogger.log('⚠️ Elemento exportFormat no encontrado', 'warning');
        }
        if (!this.preview) {
            DebugLogger.log('⚠️ Elemento exportPreview no encontrado', 'warning');
        }
    },

    getCards() {
        return State.flashcards || [];
    },

    getFormat() {
        return this.formatSelect?.value || 'json';
    },

    updatePreview() {
        // ✅ FIX: Re-validar DOM si es necesario
        if (!this.preview) {
            this.cacheDom();
            if (!this.preview) {
                // Silencioso: puede llamarse antes de que el DOM esté listo
                console.warn('⚠️ Exporter.updatePreview(): preview no disponible');
                return;
            }
        }

        // ✅ FIX: Asegurar altura mínima del preview
        this.preview.style.minHeight = '150px';

        const cards = this.getCards();

        // ✅ MEJORA: Logging y manejo mejorado de estado vacío
        console.log(`📊 Exporter: ${cards.length} flashcards disponibles`);

        if (!cards.length) {
            this.preview.textContent = 'Aún no hay tarjetas para exportar';
            console.log('ℹ️ Exporter: Mostrando mensaje de estado vacío');
            return;
        }

        try {
            const format = this.getFormat();
            console.log(`📊 Exporter: Generando preview en formato ${format}`);
            const content = this.buildContent(format, cards);
            this.preview.textContent = content || 'Error generando preview';
            console.log('✅ Exporter: Preview actualizado exitosamente');
        } catch (error) {
            DebugLogger.log(`❌ Error actualizando preview: ${error.message}`, 'error');
            console.error('❌ Exporter.updatePreview() error:', error);
            this.preview.textContent = `Error: ${error.message}`;
        }
    },

    buildContent(format, cards) {
        switch (format) {
            case 'csv':
                return this.toCSV(cards);
            case 'anki':
                return this.toAnki(cards);
            case 'markdown':
                return this.toMarkdown(cards);
            case 'json':
            default:
                return JSON.stringify(cards, null, 2);
        }
    },

    toCSV(cards) {
        const headers = ['question', 'answer', 'status'];
        const rows = cards.map(card => headers.map(key => this.escapeCSV((card[key] || '').toString())));
        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    },

    escapeCSV(value) {
        if (value.includes(',') || value.includes('\n') || value.includes('"')) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    },

    toAnki(cards) {
        return cards.map(card => `${card.question || ''}\t${card.answer || ''}`).join('\n');
    },

    toMarkdown(cards) {
        return cards.map((card, index) => `### Tarjeta ${index + 1}\n- **Pregunta:** ${card.question || ''}\n- **Respuesta:** ${card.answer || ''}\n- **Estado:** ${(card.status || 'pending')}`).join('\n\n');
    },

    download() {
        try {
            // ✅ FIX: Asegurar que está inicializado
            if (!this.initialized) {
                this.init();
            }
            
            const cards = this.getCards();
            if (!cards.length) {
                safeToast('❌ No hay tarjetas para exportar', 'warning');
                DebugLogger.log('⚠️ Intento de exportar sin tarjetas', 'warning');
                return;
            }
            
            const format = this.getFormat();
            const content = this.buildContent(format, cards);
            
            if (!content) {
                safeToast('❌ Error generando contenido de exportación', 'error');
                DebugLogger.log('❌ buildContent retornó vacío', 'error');
                return;
            }
            
            // ✅ FIX: Determinar extensión correcta
            let extension = format;
            if (format === 'anki') extension = 'txt';
            if (format === 'markdown') extension = 'md';
            
            const filename = `flashgen_export_${format}_${Date.now()}.${extension}`;
            
            // ✅ FIX: Determinar MIME type correcto
            let mimeType = 'text/plain';
            if (format === 'json') mimeType = 'application/json';
            if (format === 'csv') mimeType = 'text/csv';
            if (format === 'markdown') mimeType = 'text/markdown';
            
            safeDownload(filename, content, mimeType);
            safeToast('✅ Exportación descargada correctamente', 'success');
            DebugLogger.log(`✅ Exportación descargada: ${filename} (${cards.length} tarjetas)`, 'success');
        } catch (error) {
            DebugLogger.log(`❌ Error en Exporter.download: ${error.message}`, 'error');
            safeToast(`❌ Error al exportar: ${error.message}`, 'error');
        }
    },

    async copyToClipboard() {
        const cards = this.getCards();
        if (!cards.length) {
            safeToast('No hay tarjetas para copiar', 'warning');
            return;
        }
        const content = this.buildContent(this.getFormat(), cards);
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(content);
            } else {
                this.fallbackCopy(content);
            }
            safeToast('Contenido copiado al portapapeles');
        } catch (error) {
            DebugLogger.log(`❌ Error copiando exportación: ${error.message}`, 'error');
            safeToast('Error al copiar exportación', 'error');
        }
    },

    fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.id = `exporterCopyTextarea_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        textarea.name = textarea.id;
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
};

// Exponer globalmente para inicialización lazy
if (typeof window !== 'undefined') {
    window.Exporter = Exporter;
}

export { Exporter };
export default Exporter;


