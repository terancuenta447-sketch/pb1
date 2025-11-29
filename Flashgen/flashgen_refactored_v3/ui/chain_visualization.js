/**
 * Módulo: ChainVisualization
 * Categoría: ui
 * Extraído de: Flashgen.js (líneas 357-469)
 * Generado automáticamente: 2025-11-28 11:46:46
 * 
 * Dependencias: Results
 */

import { Results } from './results.js';

const safeEscape = (value) => {
    if (Results && typeof Results.escape === 'function') {
        return Results.escape(value);
    }
    return String(value ?? '');
};

const ChainVisualization = {
    initialized: false,
    runs: [],
    maxRuns: 8,

    init() {
        if (this.initialized) return;
        this.cacheDom();
        this.bindEvents();
        this.initialized = true;
        this.render();
    },

    cacheDom() {
        this.container = document.getElementById('chainVisualization');
        this.expandBtn = document.getElementById('expandAllSteps');
        this.collapseBtn = document.getElementById('collapseAllSteps');
        this.toggleCheckbox = document.getElementById('showChainVisualization');
    },

    bindEvents() {
        if (this.expandBtn) {
            this.expandBtn.addEventListener('click', () => this.expandAll());
        }
        if (this.collapseBtn) {
            this.collapseBtn.addEventListener('click', () => this.collapseAll());
        }
        if (this.toggleCheckbox) {
            this.toggleCheckbox.addEventListener('change', () => this.render());
        }
    },

    isEnabled() {
        if (!this.toggleCheckbox) return true;
        return this.toggleCheckbox.checked;
    },

    recordRun(run) {
        this.init();
        if (!this.isEnabled() || !run) return;
        const enriched = {
            ...run,
            id: `chainRun_${Date.now()}_${run.chunkIndex || 0}`,
            timestamp: new Date().toISOString()
        };
        this.runs.unshift(enriched);
        this.runs = this.runs.slice(0, this.maxRuns);
        this.render();
    },

    render() {
        if (!this.container) {
            console.warn('⚠️ ChainVisualization.render(): container no disponible');
            return;
        }

        // ✅ FIX: Asegurar altura mínima del container
        this.container.style.minHeight = '150px';

        // ✅ MEJORA: Logging para debugging
        console.log(`📊 ChainVisualization: ${this.runs.length} runs disponibles`);

        if (!this.isEnabled()) {
            this.container.innerHTML = '<p class="empty-state">Visualización desactivada. Actívala en Configuración.</p>';
            console.log('ℹ️ ChainVisualization: Visualización desactivada');
            return;
        }

        if (this.runs.length === 0) {
            this.container.innerHTML = '<p class="empty-state">Genera flashcards con modo Chain activado para ver los pasos de ejecución</p>';
            console.log('ℹ️ ChainVisualization: Sin runs, mostrando mensaje de estado vacío');
            return;
        }

        const runBlocks = this.runs.map(run => {
            // ✅ FIX #13: Validar executionLog antes de .map()
            const steps = (Array.isArray(run.executionLog) ? run.executionLog : []).map(entry => `
                <li class="chain-step ${entry.success ? 'success' : 'error'}">
                    <div class="chain-step-header">
                        <strong>${safeEscape(entry.nodeName || entry.nodeId || 'Paso')}</strong>
                        <span>${entry.success ? '✅' : '⚠️'}</span>
                    </div>
                    <div class="chain-step-body">
                        <p><strong>Input:</strong> ${safeEscape(entry.input || 'N/A')}</p>
                        ${entry.output ? `<p><strong>Output:</strong> ${safeEscape(entry.output)}</p>` : ''}
                        ${entry.error ? `<p class="error">${safeEscape(entry.error)}</p>` : ''}
                    </div>
                </li>
            `).join('');

            const metrics = run.metrics || {};
            return `
                <details class="chain-run" open>
                    <summary>
                        <div>
                            <strong>${safeEscape(run.chunkTitle || 'Chunk')}</strong>
                            <span class="chain-run-meta">Chunk ${run.chunkIndex || '?'} · ${new Date(run.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div class="chain-run-metrics">
                            <span>API: ${metrics.apiCalls ?? 0}</span>
                            <span>Latencia: ${(metrics.totalLatency ?? 0)}ms</span>
                            <span>Duración: ${(metrics.totalDuration ?? 0)}ms</span>
                        </div>
                    </summary>
                    <div class="chain-run-preview">
                        <p>${safeEscape(run.textPreview || '')}</p>
                    </div>
                    <ul class="chain-steps">
                        ${steps || '<li class="chain-step"><p class="empty-state">Sin pasos registrados</p></li>'}
                    </ul>
                </details>
            `;
        }).join('');

        this.container.innerHTML = `<div class="chain-run-list">${runBlocks}</div>`;
    },

    expandAll() {
        if (!this.container) return;
        this.container.querySelectorAll('details').forEach(details => details.setAttribute('open', 'true'));
    },

    collapseAll() {
        if (!this.container) return;
        this.container.querySelectorAll('details').forEach(details => details.removeAttribute('open'));
    }
};

// Exponer globalmente
if (typeof window !== 'undefined') {
    window.ChainVisualization = ChainVisualization;
}

// Exports
export { ChainVisualization };
export default ChainVisualization;
