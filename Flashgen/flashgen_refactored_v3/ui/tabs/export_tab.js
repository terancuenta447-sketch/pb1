/**
 * ExportTabComponent - Componente para pestaña de exportación
 */

import { TabComponent } from '../tab_component.js';
import { State } from '../../core/state.js';

export class ExportTabComponent extends TabComponent {
    constructor() {
        super('export', '#export');
        this.previewEl = null;
        this.formatSelectEl = null;
    }

    mount() {
        super.mount();

        this.previewEl = document.getElementById('exportPreview');
        this.formatSelectEl = document.getElementById('exportFormat');

        // ✅ GARANTIZAR altura mínima
        if (this.previewEl) {
            this.previewEl.style.minHeight = '200px';
        }

        // Bind eventos
        if (this.formatSelectEl) {
            this.formatSelectEl.addEventListener('change', () => this.render());
        }

        const exportBtn = document.getElementById('exportBtn');
        const copyBtn = document.getElementById('copyExportBtn');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.download());
        }
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyToClipboard());
        }

        console.log(`✅ ExportTabComponent montado`);
    }

    render() {
        if (!this.isMounted || !this.previewEl) return;

        const flashcards = State.flashcards || [];
        this.previewEl.style.minHeight = '200px';

        if (flashcards.length === 0) {
            this.previewEl.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📭</div>
                    <p style="text-align: center; color: var(--color-text-secondary);">
                        No hay flashcards para exportar
                    </p>
                </div>
            `;
            return;
        }

        const format = this.formatSelectEl?.value || 'json';
        const content = this.buildContent(format, flashcards);

        this.previewEl.textContent = content;
        console.log(`📊 ExportTabComponent: Preview actualizado (${format})`);
    }

    buildContent(format, flashcards) {
        switch (format) {
            case 'csv':
                return this.toCSV(flashcards);
            case 'anki':
                return this.toAnki(flashcards);
            case 'markdown':
                return this.toMarkdown(flashcards);
            case 'json':
            default:
                return JSON.stringify(flashcards, null, 2);
        }
    }

    toCSV(cards) {
        const headers = ['question', 'answer', 'status'];
        const rows = cards.map(card =>
            headers.map(key => this.escapeCSV((card[key] || '').toString()))
        );
        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    escapeCSV(value) {
        if (value.includes(',') || value.includes('\n') || value.includes('"')) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    }

    toAnki(cards) {
        return cards.map(card => `${card.question || ''}\t${card.answer || ''}`).join('\n');
    }

    toMarkdown(cards) {
        return cards.map((card, i) =>
            `### Tarjeta ${i + 1}\n- **Pregunta:** ${card.question || ''}\n- **Respuesta:** ${card.answer || ''}`
        ).join('\n\n');
    }

    download() {
        const flashcards = State.flashcards || [];
        if (flashcards.length === 0) {
            alert('No hay flashcards para exportar');
            return;
        }

        const format = this.formatSelectEl?.value || 'json';
        const content = this.buildContent(format, flashcards);

        let extension = format;
        if (format === 'anki') extension = 'txt';
        if (format === 'markdown') extension = 'md';

        const filename = `flashgen_export_${format}_${Date.now()}.${extension}`;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log(`✅ Exportado: ${filename}`);
    }

    async copyToClipboard() {
        const flashcards = State.flashcards || [];
        if (flashcards.length === 0) {
            alert('No hay flashcards para copiar');
            return;
        }

        const format = this.formatSelectEl?.value || 'json';
        const content = this.buildContent(format, flashcards);

        try {
            await navigator.clipboard.writeText(content);
            console.log('✅ Copiado al portapapeles');
        } catch (error) {
            console.error('❌ Error copiando:', error);
        }
    }
}

// Exponer globalmente
if (typeof window !== 'undefined') {
    window.ExportTabComponent = ExportTabComponent;
}

export default ExportTabComponent;
