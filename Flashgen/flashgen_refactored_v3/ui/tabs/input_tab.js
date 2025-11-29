/**
 * InputTabComponent - Componente para pestaña de entrada
 */

import { TabComponent } from '../tab_component.js';
import { StateManager } from '../../core/state_manager.js';

export class InputTabComponent extends TabComponent {
    constructor() {
        super('input', '#input');
        this.inputTextEl = null;
        this.chunkPreviewEl = null;
    }

    mount() {
        super.mount();

        this.inputTextEl = document.getElementById('inputText');
        this.chunkPreviewEl = document.getElementById('chunkPreview');

        // ✅ GARANTIZAR altura mínima
        if (this.chunkPreviewEl) {
            this.chunkPreviewEl.style.minHeight = '200px';
        }

        // Subscribir a cambios
        this.subscribe('inputText', (newValue) => {
            if (this.inputTextEl && this.inputTextEl.value !== newValue) {
                this.inputTextEl.value = newValue;
            }
            this.updateChunkPreview();
        });

        this.subscribe('chunks', () => {
            this.updateChunkPreview();
        });

        // Evento de input
        if (this.inputTextEl) {
            this.inputTextEl.addEventListener('input', (e) => {
                StateManager.set('inputText', e.target.value);
            });
        }

        console.log(`✅ InputTabComponent montado`);
    }

    render() {
        if (!this.isMounted) return;

        const inputText = StateManager.get('inputText') || '';

        if (this.inputTextEl && this.inputTextEl.value !== inputText) {
            this.inputTextEl.value = inputText;
        }

        this.updateChunkPreview();
    }

    updateChunkPreview() {
        if (!this.chunkPreviewEl) return;

        this.chunkPreviewEl.style.minHeight = '200px';

        const chunks = StateManager.get('chunks') || [];
        const inputText = StateManager.get('inputText') || '';

        if (!inputText.trim()) {
            this.chunkPreviewEl.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
                    <p class="empty-state" style="text-align: center;">
                        Ingresa texto para ver la vista previa de chunks
                    </p>
                </div>
            `;
            return;
        }

        if (chunks.length === 0) {
            this.chunkPreviewEl.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
                    <p class="empty-state" style="text-align: center;">
                        Procesando texto...<br>
                        <span style="font-size: 14px; color: var(--color-text-secondary); margin-top: 8px; display: inline-block;">
                            Los chunks aparecerán aquí
                        </span>
                    </p>
                </div>
            `;
            return;
        }

        // Renderizar chunks
        const html = chunks.map((chunk, i) => {
            const text = this.escape(chunk.text || chunk);
            const preview = text.length > 200 ? text.substring(0, 200) + '...' : text;

            return `
                <div style="margin-bottom: 12px; padding: 12px; background: var(--color-surface); border-radius: var(--radius-base); border-left: 3px solid var(--color-primary);">
                    <div style="font-size: 12px; color: var(--color-text-secondary); margin-bottom: 6px;">
                        <strong>Chunk ${i + 1}</strong> (${text.length} caracteres)
                    </div>
                    <div style="font-size: 13px;">
                        ${preview}
                    </div>
                </div>
            `;
        }).join('');

        this.chunkPreviewEl.innerHTML = html;
    }
}

// Exponer globalmente
if (typeof window !== 'undefined') {
    window.InputTabComponent = InputTabComponent;
}

export default InputTabComponent;
