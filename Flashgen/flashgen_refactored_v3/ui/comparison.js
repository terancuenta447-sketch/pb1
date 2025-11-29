/**
 * Módulo: Comparison
 * Categoría: comparison
 * Extraído de: Flashgen.js (líneas 3308-3391)
 */

import { State } from '../core/state.js';

const Comparison = {
    initialized: false,
    
    init() {
        if (this.initialized) return;
        try {
            this.bindEvents();
            this.initialized = true;
        } catch (error) {
            console.error('Comparison.init() falló:', error);
            this.initialized = false;
            throw error;
        }
    },
    
    bindEvents() {
        const compareBtn = document.getElementById('compareModesBtn');
        if (!compareBtn) {
            console.warn('⚠️ Comparison: elemento compareModesBtn no encontrado');
            return;
        }
        compareBtn.addEventListener('click', () => this.compare());
    },
    
    compare() {
        const cards = State.flashcards || [];
        
        // ✅ MEJORA: Logging para debugging
        console.log(`📊 Comparison.compare(): ${cards.length} flashcards disponibles`);
        
        if (cards.length === 0) {
            console.log('ℹ️ Comparison: Sin flashcards, mostrando mensaje');
            this.renderMessage('No hay tarjetas generadas para comparar. Genera flashcards primero.');
            return;
        }

        const deterministicSample = cards.filter(card => (card.metadata?.mode || '').includes('deterministic'));
        const stochasticSample = cards.filter(card => (card.metadata?.mode || '').includes('stochastic'));
        
        console.log(`📊 Comparison: ${deterministicSample.length} determinísticas, ${stochasticSample.length} estocásticas`);

        if (deterministicSample.length === 0 && stochasticSample.length === 0) {
            console.log('ℹ️ Comparison: Sin metadata de modo, mostrando mensaje');
            this.renderMessage('No se encontró metadata de modo determinístico/estocástico. Las flashcards deben generarse con diferentes modos para comparar.');
            return;
        }

        const deterministicStats = this.summarize(deterministicSample);
        const stochasticStats = this.summarize(stochasticSample);
        this.renderComparison(deterministicStats, stochasticStats);
        console.log('✅ Comparison: Comparación renderizada exitosamente');
    },

    summarize(sample) {
        if (!sample || sample.length === 0) {
            return null;
        }
        const totals = sample.reduce((acc, card) => {
            const words = (card.answer || '').split(/\s+/).filter(Boolean).length;
            acc.totalWords += words;
            if ((card.status || 'pending').toLowerCase() === 'approved') acc.approved++;
            if ((card.status || 'pending').toLowerCase() === 'rejected') acc.rejected++;
            return acc;
        }, { totalWords: 0, approved: 0, rejected: 0 });

        return {
            count: sample.length,
            avgWords: (totals.totalWords / sample.length).toFixed(1),
            approved: totals.approved,
            rejected: totals.rejected
        };
    },

    renderComparison(deterministicStats, stochasticStats) {
        const container = document.getElementById('modeComparison');
        if (!container) return;

        // ✅ FIX: Asegurar altura mínima del container
        container.style.minHeight = '120px';

        if (!deterministicStats && !stochasticStats) {
            this.renderMessage('No hay suficientes datos para comparar.');
            return;
        }

        const block = (title, stats) => {
            if (!stats) {
                return `
                    <div class="comparison-card">
                        <h4>${title}</h4>
                        <p class="empty-state">Sin datos</p>
                    </div>`;
            }
            return `
                <div class="comparison-card">
                    <h4>${title}</h4>
                    <ul class="metadata-list">
                        <li><strong>Tarjetas:</strong> ${stats.count}</li>
                        <li><strong>Palabras promedio (respuesta):</strong> ${stats.avgWords}</li>
                        <li><strong>Aprobadas:</strong> ${stats.approved}</li>
                        <li><strong>Rechazadas:</strong> ${stats.rejected}</li>
                    </ul>
                </div>`;
        };

        container.innerHTML = `
            <div class="comparison-grid">
                ${block('Determinístico', deterministicStats)}
                ${block('Estocástico', stochasticStats)}
            </div>`;
    },

    renderMessage(message) {
        const container = document.getElementById('modeComparison');
        if (container) {
            // ✅ FIX: Asegurar altura mínima
            container.style.minHeight = '120px';
            container.innerHTML = `<p class="empty-state">${this.escape(message)}</p>`;
        }
    },
    
    escape(str) {
        const div = document.createElement('div');
        div.textContent = String(str ?? '');
        return div.innerHTML;
    }
};

// Exponer globalmente para inicialización lazy
if (typeof window !== 'undefined') {
    window.Comparison = Comparison;
}

export { Comparison };
export default Comparison;
