/**
 * ResultsTabComponent - Componente para pestaña de resultados
 *
 * GARANTIZA que siempre muestre contenido visible
 * Usa StateManager para observar cambios en flashcards
 */

import { TabComponent } from '../tab_component.js';
import { StateManager } from '../../core/state_manager.js';
import { State } from '../../core/state.js';

export class ResultsTabComponent extends TabComponent {
    constructor() {
        super('results', '#results');
        this.flashcardsListEl = null;
        this.statsEl = null;
    }

    mount() {
        super.mount();

        // Cachear elementos DOM
        this.flashcardsListEl = document.getElementById('flashcardsList');
        this.statsEl = document.getElementById('resultsStats');

        // ✅ GARANTIZAR altura mínima de elementos
        if (this.flashcardsListEl) {
            this.flashcardsListEl.style.minHeight = '200px';
        }

        // Subscribir a cambios en flashcards
        this.subscribe('flashcards', () => {
            this.render();
        });

        console.log(`✅ ResultsTabComponent montado`);
    }

    render() {
        if (!this.isMounted) return;

        // Obtener flashcards del State legacy
        const flashcards = State.flashcards || [];

        console.log(`📊 ResultsTabComponent: Renderizando ${flashcards.length} flashcards`);

        // Renderizar estadísticas
        this.renderStats(flashcards);

        // Renderizar lista de flashcards
        this.renderFlashcardsList(flashcards);
    }

    renderStats(flashcards) {
        if (!this.statsEl) return;

        const stats = {
            total: flashcards.length,
            approved: flashcards.filter(c => (c.status || 'pending').toLowerCase() === 'approved').length,
            rejected: flashcards.filter(c => (c.status || 'pending').toLowerCase() === 'rejected').length,
            pending: 0
        };

        stats.pending = stats.total - stats.approved - stats.rejected;

        // Actualizar DOM
        const totalEl = this.statsEl.querySelector('[data-stat="total"]');
        const approvedEl = this.statsEl.querySelector('[data-stat="approved"]');
        const rejectedEl = this.statsEl.querySelector('[data-stat="rejected"]');
        const pendingEl = this.statsEl.querySelector('[data-stat="pending"]');

        if (totalEl) totalEl.textContent = stats.total;
        if (approvedEl) approvedEl.textContent = stats.approved;
        if (rejectedEl) rejectedEl.textContent = stats.rejected;
        if (pendingEl) pendingEl.textContent = stats.pending;
    }

    renderFlashcardsList(flashcards) {
        if (!this.flashcardsListEl) return;

        // ✅ GARANTIZAR altura mínima
        this.flashcardsListEl.style.minHeight = '200px';

        if (flashcards.length === 0) {
            this.flashcardsListEl.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px; padding: 40px;">
                    <div style="font-size: 64px; margin-bottom: 16px;">📭</div>
                    <p class="empty-state" style="text-align: center; font-size: 16px;">
                        No hay flashcards generadas todavía.<br>
                        <span style="font-size: 14px; color: var(--color-text-secondary); margin-top: 8px; display: inline-block;">
                            Genera flashcards en la pestaña "Entrada"
                        </span>
                    </p>
                </div>
            `;
            return;
        }

        // Filtrar rechazadas
        const visibleCards = flashcards.filter(c => (c.status || 'pending').toLowerCase() !== 'rejected');

        if (visibleCards.length === 0) {
            this.flashcardsListEl.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px; padding: 40px;">
                    <div style="font-size: 64px; margin-bottom: 16px;">🚫</div>
                    <p class="empty-state" style="text-align: center;">
                        Todas las flashcards visibles fueron rechazadas
                    </p>
                </div>
            `;
            return;
        }

        // Renderizar flashcards
        const html = visibleCards.map((card, index) => {
            const status = (card.status || 'pending').toLowerCase();
            const question = this.escape(card.question || 'Sin pregunta');
            const answer = this.escape(card.answer || 'Sin respuesta');

            return `
                <div class="flashcard ${status}" style="margin-bottom: 16px; position: relative;">
                    <div class="flashcard-question" style="font-weight: 600; margin-bottom: 8px;">
                        ${question}
                    </div>
                    <div class="flashcard-answer" style="color: var(--color-text-secondary);">
                        ${answer}
                    </div>
                    <div class="flashcard-actions" style="margin-top: 12px; display: flex; gap: 8px;">
                        <button class="btn btn-sm ${status === 'approved' ? 'btn-secondary' : 'btn-primary'}"
                                onclick="window.ResultsTab?.approveCard(${index})">
                            ✅ Aprobar
                        </button>
                        <button class="btn btn-sm ${status === 'rejected' ? 'btn-secondary' : 'btn-outline'}"
                                onclick="window.ResultsTab?.rejectCard(${index})">
                            ❌ Rechazar
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        this.flashcardsListEl.innerHTML = html;
    }

    approveCard(index) {
        if (State.flashcards[index]) {
            State.flashcards[index].status = 'approved';
            this.render();
        }
    }

    rejectCard(index) {
        if (State.flashcards[index]) {
            State.flashcards[index].status = 'rejected';
            this.render();
        }
    }
}

// Exponer globalmente
if (typeof window !== 'undefined') {
    window.ResultsTabComponent = ResultsTabComponent;
}

export default ResultsTabComponent;
