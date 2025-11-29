/**
 * ChainTabComponent - Componente para pestaña de cadena
 */

import { TabComponent } from '../tab_component.js';
import { StateManager } from '../../core/state_manager.js';

export class ChainTabComponent extends TabComponent {
    constructor() {
        super('chain', '#chain');
        this.visualizationEl = null;
        this.chainInfoEl = null;
    }

    mount() {
        super.mount();

        this.visualizationEl = document.getElementById('chainVisualization');
        this.chainInfoEl = document.getElementById('chainInfo');

        // ✅ GARANTIZAR altura mínima
        if (this.visualizationEl) {
            this.visualizationEl.style.minHeight = '200px';
        }
        if (this.chainInfoEl) {
            this.chainInfoEl.style.minHeight = '100px';
        }

        // Subscribir a cambios
        this.subscribe('chainRuns', () => {
            this.render();
        });

        console.log(`✅ ChainTabComponent montado`);
    }

    render() {
        if (!this.isMounted) return;

        const chainRuns = StateManager.get('chainRuns') || [];

        console.log(`📊 ChainTabComponent: Renderizando ${chainRuns.length} runs`);

        this.renderVisualization(chainRuns);
        this.renderChainInfo(chainRuns);
    }

    renderVisualization(chainRuns) {
        if (!this.visualizationEl) return;

        this.visualizationEl.style.minHeight = '200px';

        if (chainRuns.length === 0) {
            this.visualizationEl.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">⛓️</div>
                    <p class="empty-state" style="text-align: center;">
                        No hay ejecuciones de cadena registradas.<br>
                        <span style="font-size: 14px; color: var(--color-text-secondary); margin-top: 8px; display: inline-block;">
                            Genera flashcards con modo Chain activado
                        </span>
                    </p>
                </div>
            `;
            return;
        }

        // Renderizar runs
        const html = chainRuns.map(run => {
            const title = this.escape(run.chunkTitle || 'Chunk');
            const timestamp = new Date(run.timestamp).toLocaleTimeString();

            return `
                <details class="chain-run" style="margin-bottom: 16px; padding: 16px; background: var(--color-surface); border-radius: var(--radius-base); border: 1px solid var(--color-border);">
                    <summary style="cursor: pointer; font-weight: 600;">
                        ${title} - ${timestamp}
                    </summary>
                    <div style="margin-top: 12px; padding: 12px; background: var(--color-background); border-radius: var(--radius-base);">
                        <pre style="white-space: pre-wrap; font-size: 12px;">${this.escape(JSON.stringify(run, null, 2))}</pre>
                    </div>
                </details>
            `;
        }).join('');

        this.visualizationEl.innerHTML = html;
    }

    renderChainInfo(chainRuns) {
        if (!this.chainInfoEl) return;

        this.chainInfoEl.style.minHeight = '100px';

        if (chainRuns.length === 0) {
            this.chainInfoEl.innerHTML = `
                <div style="padding: 20px; text-align: center;">
                    <p class="empty-state">
                        La información detallada aparecerá aquí cuando se ejecute una cadena
                    </p>
                </div>
            `;
            return;
        }

        const totalRuns = chainRuns.length;
        const avgDuration = chainRuns.reduce((acc, run) =>
            acc + (run.metrics?.totalDuration || 0), 0) / totalRuns;

        this.chainInfoEl.innerHTML = `
            <div style="padding: 16px;">
                <p><strong>Total de ejecuciones:</strong> ${totalRuns}</p>
                <p><strong>Duración promedio:</strong> ${Math.round(avgDuration)} ms</p>
            </div>
        `;
    }
}

// Exponer globalmente
if (typeof window !== 'undefined') {
    window.ChainTabComponent = ChainTabComponent;
}

export default ChainTabComponent;
