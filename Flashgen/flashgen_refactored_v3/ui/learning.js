/**
 * Módulo: Learning
 * Categoría: ui
 * Proporciona análisis de flashcards generadas
 */

import { State } from '../core/state.js';

const Learning = {
    initialized: false,

    init() {
        if (this.initialized) return;
        try {
            this.cacheDom();
            this.bindEvents();
            this.initialized = true;
        } catch (error) {
            console.error('Learning.init() falló:', error);
            this.initialized = false;
            throw error;
        }
    },

    cacheDom() {
        this.cardSelect = document.getElementById('learningCardSelect');
        this.analysisContainer = document.getElementById('tokenAnalysis');
        
        if (!this.cardSelect) {
            console.warn('⚠️ Learning: elemento learningCardSelect no encontrado');
        }
        if (!this.analysisContainer) {
            console.warn('⚠️ Learning: elemento tokenAnalysis no encontrado');
        }
    },

    bindEvents() {
        if (this.cardSelect) {
            this.cardSelect.addEventListener('change', () => this.renderAnalysis());
        }
    },

    updateUI() {
        this.init();
        if (!this.cardSelect || !this.analysisContainer) {
            console.warn('⚠️ Learning.updateUI(): Elementos DOM no disponibles');
            return;
        }

        // ✅ FIX: Asegurar altura mínima del container de análisis
        this.analysisContainer.style.minHeight = '120px';

        const cards = State.flashcards || [];

        // ✅ MEJORA: Logging para debugging
        console.log(`📊 Learning: ${cards.length} flashcards disponibles`);

        const previousValue = this.cardSelect.value;
        const options = cards.map((card, index) => {
            const label = (card.question || card.metadata?.title || `Tarjeta ${index + 1}`).substring(0, 80);
            return `<option value="${index}">${this.escape(label)}</option>`;
        }).join('');
        this.cardSelect.innerHTML = `<option value="">-- Selecciona --</option>${options}`;

        // ✅ MEJORA: Manejo mejorado de estado vacío
        if (!cards.length) {
            this.analysisContainer.innerHTML = '<p class="empty-state">No hay tarjetas para analizar</p>';
            console.log('ℹ️ Learning: Mostrando mensaje de estado vacío');
            return;
        }

        if (previousValue && this.cardSelect.querySelector(`option[value="${previousValue}"]`)) {
            this.cardSelect.value = previousValue;
        } else {
            this.cardSelect.value = '';
        }

        this.renderAnalysis();
    },

    renderAnalysis() {
        if (!this.analysisContainer) return;

        // ✅ FIX: Asegurar altura mínima
        this.analysisContainer.style.minHeight = '120px';

        const cards = State.flashcards || [];
        const selectedIndex = parseInt(this.cardSelect?.value ?? '', 10);
        if (!Number.isInteger(selectedIndex) || !cards[selectedIndex]) {
            this.analysisContainer.innerHTML = '<p class="empty-state">Selecciona una flashcard para ver el análisis</p>';
            return;
        }

        const card = cards[selectedIndex];
        
        this.analysisContainer.innerHTML = `
            <div class="analysis-block">
                <h4>Pregunta</h4>
                <p>${this.escape(card.question || 'Sin pregunta')}</p>
                <h4>Respuesta</h4>
                <p>${this.escape(card.answer || 'Sin respuesta')}</p>
                <h4>Metadatos</h4>
                <pre>${JSON.stringify(card.metadata || {}, null, 2)}</pre>
                <h4>Calidad</h4>
                <pre>${JSON.stringify(card.quality || {}, null, 2)}</pre>
            </div>
        `;
    },

    escape(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

export { Learning };
export default Learning;

// Exponer globalmente
if (typeof window !== 'undefined') {
    window.Learning = Learning;
}

