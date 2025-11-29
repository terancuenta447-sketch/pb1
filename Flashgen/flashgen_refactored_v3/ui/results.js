/**
 * Módulo: Results
 * Categoría: ui
 * Extraído de: Flashgen.js (líneas 2886-3068)
 * Generado automáticamente: 2025-11-28 11:46:46
 * 
 * Dependencias: Results, State
 */

import { State } from '../core/state.js';

const Results = {
    initialized: false,
    chainMetrics: null,

    init() {
        if (this.initialized) return;
        try {
            this.cacheDom();
            this.bindEvents();
            this.initialized = true;
        } catch (error) {
            console.error('Results.init() falló:', error);
            this.initialized = false;
            throw error;
        }
    },

    cacheDom() {
        this.statsContainer = document.getElementById('resultsStats');
        this.flashcardsList = document.getElementById('flashcardsList');
        this.approveAllBtn = document.getElementById('approveAllBtn');
        this.rejectAllBtn = document.getElementById('rejectAllBtn');
        this.chainMetricsCard = document.getElementById('chainMetricsCard');
        this.chainMetricsContent = document.getElementById('chainMetricsContent');
        
        // ✅ VALIDACIÓN ESTRICTA: Lanzar error si elementos críticos no existen
        if (!this.statsContainer) {
            throw new Error('❌ CRÍTICO: #resultsStats no existe en el DOM. Revisa Flashgen.html');
        }
        if (!this.flashcardsList) {
            throw new Error('❌ CRÍTICO: #flashcardsList no existe en el DOM. Revisa Flashgen.html');
        }
        
        if (this.statsContainer) {
            this.statNodes = {
                total: this.statsContainer.querySelector('[data-stat="total"]'),
                approved: this.statsContainer.querySelector('[data-stat="approved"]'),
                rejected: this.statsContainer.querySelector('[data-stat="rejected"]'),
                pending: this.statsContainer.querySelector('[data-stat="pending"]')
            };
        }
    },

    bindEvents() {
        if (this.approveAllBtn) {
            this.approveAllBtn.addEventListener('click', () => this.bulkUpdate('approved'));
        }
        if (this.rejectAllBtn) {
            this.rejectAllBtn.addEventListener('click', () => this.bulkUpdate('rejected'));
        }
        if (this.flashcardsList) {
            this.flashcardsList.addEventListener('click', (event) => {
                const action = event.target?.getAttribute('data-action');
                if (!action) return;
                const index = parseInt(event.target.getAttribute('data-index'), 10);
                if (!Number.isInteger(index)) return;
                this.updateCardStatus(index, action === 'approve' ? 'approved' : 'rejected');
            });
        }
    },

    updateUI() {
        this.init();
        this.updateStats();
        this.renderFlashcards();
        this.renderChainMetrics();
        // ✅ FIX: Acceder a Exporter vía window para evitar dependencia circular
        if (typeof window !== 'undefined' && window.Exporter && typeof window.Exporter.updatePreview === 'function') {
            try {
                window.Exporter.updatePreview();
            } catch (e) {
                // Silent fail - Exporter puede estar procesando
                console.warn('⚠️ Exporter.updatePreview falló:', e);
            }
        }
    },

    updateStats() {
        // ✅ FIX #4: Siempre inicializar antes de acceder al DOM
        this.init();
        if (!this.statNodes) {
            console.warn('⚠️ Results.updateStats(): statNodes no disponible');
            return;
        }
        
        const cards = State.flashcards || [];
        
        // ✅ MEJORA: Manejar estado vacío explícitamente
        if (cards.length === 0) {
            console.log('📊 Results: Sin flashcards, mostrando estadísticas en cero');
        }
        
        const stats = cards.reduce((acc, card) => {
            const status = (card.status || 'pending').toLowerCase();
            if (status === 'approved') acc.approved++;
            else if (status === 'rejected') acc.rejected++;
            else acc.pending++;
            return acc;
        }, { total: cards.length, approved: 0, rejected: 0, pending: 0 });
        stats.pending = stats.total - stats.approved - stats.rejected;

        // ✅ MEJORA: Validar que los nodos existen antes de actualizar
        if (this.statNodes.total) this.statNodes.total.textContent = stats.total;
        if (this.statNodes.approved) this.statNodes.approved.textContent = stats.approved;
        if (this.statNodes.rejected) this.statNodes.rejected.textContent = stats.rejected;
        if (this.statNodes.pending) this.statNodes.pending.textContent = stats.pending;
    },

    renderFlashcards() {
        // ✅ FIX #4: Inicializar antes de acceder al DOM
        this.init();
        if (!this.flashcardsList) return;

        // ✅ FIX: Asegurar que el contenedor mantenga altura mínima
        this.flashcardsList.style.minHeight = '150px';

        const cards = State.flashcards || [];
        const visibleCards = cards
            .map((card, index) => ({ card, index }))
            .filter(({ card }) => (card.status || 'pending').toLowerCase() !== 'rejected');

        if (cards.length === 0) {
            this.flashcardsList.innerHTML = '<p class="empty-state">Las tarjetas generadas aparecerán aquí</p>';
            return;
        }

        if (!visibleCards.length) {
            this.flashcardsList.innerHTML = '<p class="empty-state">Todas las tarjetas visibles fueron rechazadas. Genera nuevas o aprueba alguna existente.</p>';
            return;
        }

        this.flashcardsList.innerHTML = visibleCards.map(({ card, index }) => {
            const status = (card.status || 'pending').toLowerCase();
            const iterations = card?.metadata?.chainIterations || 0;
            const score = Math.round(card?.metadata?.chainScore || 0);
            // ✅ FIX #9: Sanitizar números antes de insertar en HTML
            const badgeHtml = iterations > 0 ? `
                <div class="refinement-badge" style="position: absolute; top: 8px; right: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">
                    🔄 Refinada ${Results.escape(String(iterations))}x${score ? ` (Score: ${Results.escape(String(score))}%)` : ''}
                </div>
            ` : '';
            return `
                <div class="flashcard ${status}" style="position: relative;">
                    ${badgeHtml}
                    <div class="flashcard-question">${Results.escape(card.question || 'Sin pregunta')}</div>
                    <div class="flashcard-answer">${Results.escape(card.answer || 'Sin respuesta')}</div>
                    <div class="flashcard-actions">
                        <button class="btn btn-sm ${status === 'approved' ? 'btn-secondary' : 'btn-primary'}" data-action="approve" data-index="${index}">✅ Aprobar</button>
                        <button class="btn btn-sm ${status === 'rejected' ? 'btn-secondary' : 'btn-outline'}" data-action="reject" data-index="${index}">❌ Rechazar</button>
                    </div>
                    ${this.renderMetadata(card)}
                </div>
            `;
        }).join('');
    },

    renderMetadata(card) {
        const meta = card.metadata || {};
        const entries = Object.entries(meta)
            .filter(([key, value]) => value && !['chunkPreview'].includes(key))
            .map(([key, value]) => `<span><strong>${key}:</strong> ${Results.escape(String(value))}</span>`);
        if (entries.length === 0) {
            return '';
        }
        return `<div class="flashcard-meta">${entries.join(' | ')}</div>`;
    },

    updateCardStatus(index, status) {
        const cards = State.flashcards || [];
        if (!cards[index]) return;
        cards[index].status = status;
        State.flashcards = cards;
        this.updateUI();
    },

    bulkUpdate(status) {
        const cards = State.flashcards || [];
        cards.forEach(card => {
            card.status = status;
        });
        State.flashcards = cards;
        this.updateUI();
    },

    resetChainMetrics() {
        this.chainMetrics = null;
        if (this.chainMetricsCard) {
            this.chainMetricsCard.style.display = 'none';
        }
    },

    recordChainMetrics(metrics = {}) {
        if (!metrics) return;
        if (!this.chainMetrics) {
            this.chainMetrics = { apiCalls: 0, totalLatency: 0, totalDuration: 0, runs: 0 };
        }
        this.chainMetrics.apiCalls += metrics.apiCalls || 0;
        this.chainMetrics.totalLatency += metrics.totalLatency || 0;
        this.chainMetrics.totalDuration += metrics.totalDuration || 0;
        this.chainMetrics.runs += 1;
    },

    renderChainMetrics() {
        if (!this.chainMetricsCard || !this.chainMetricsContent) return;

        // ✅ FIX: Asegurar altura mínima incluso cuando está vacío
        this.chainMetricsCard.style.minHeight = '180px';
        this.chainMetricsContent.style.minHeight = '100px';

        if (!this.chainMetrics) {
            this.chainMetricsCard.style.display = 'block';
            this.chainMetricsContent.innerHTML = '<p class="empty-state">Las métricas de cadena aparecerán aquí cuando se generen flashcards con el modo Chain activado.</p>';
            return;
        }

        const { apiCalls, totalLatency, totalDuration, runs } = this.chainMetrics;
        this.chainMetricsContent.innerHTML = `
            <p><strong>Ejecuciones de chain:</strong> ${runs}</p>
            <p><strong>Llamadas API totales:</strong> ${apiCalls}</p>
            <p><strong>Latencia acumulada:</strong> ${Math.round(totalLatency)} ms</p>
            <p><strong>Duración total:</strong> ${Math.round(totalDuration)} ms</p>
        `;
        this.chainMetricsCard.style.display = 'block';
    },

    escape(str) {
        const div = document.createElement('div');
        div.textContent = String(str ?? '');
        return div.innerHTML;
    }
};

// Exponer globalmente para inicialización lazy
if (typeof window !== 'undefined') {
    window.Results = Results;
}

// Exports
export { Results };
export default Results;
