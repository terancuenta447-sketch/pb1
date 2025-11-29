/**
 * Modulo: Few-Shot Manager
 * Categoria: managers
 * Extraido de: Flashgen.js (lineas 475-651)
 * Generado: 2025-11-28 09:48:59
 * 
 * Metodos: getEnabledState, clearAll, init, collect, switchTab
 * Dependencias: DebugLogger, FewShotManager, UI
 */

import { DebugLogger } from '../ui/debug_logger.js';
import { UI } from '../ui/ui.js';

    const FewShotManager = {
        currentTab: 'positive',
        
        init() {
            const posTab = document.getElementById('fewShotPositiveTab');
            const negTab = document.getElementById('fewShotNegativeTab');
            const addPos = document.getElementById('addFewShotPositive');
            const addNeg = document.getElementById('addFewShotNegative');
            const clear = document.getElementById('clearFewShotBtn');
            const enablePos = document.getElementById('enableFewShotPositive');
            const enableNeg = document.getElementById('enableFewShotNegative');
            
            posTab?.addEventListener('click', () => this.switchTab('positive'));
            negTab?.addEventListener('click', () => this.switchTab('negative'));
            addPos?.addEventListener('click', () => this.addExample('positive'));
            addNeg?.addEventListener('click', () => this.addExample('negative'));
            clear?.addEventListener('click', () => this.clearAll());
            
            // Listeners para checkboxes de activacion
            enablePos?.addEventListener('change', (e) => {
                DebugLogger.log(`Few-Shot Positivos: ${e.target.checked ? 'Activado' : 'Desactivado'}`, 'info');
                this.updateActivationState();
            });
            enableNeg?.addEventListener('change', (e) => {
                DebugLogger.log(`Few-Shot Negativos: ${e.target.checked ? 'Activado' : 'Desactivado'}`, 'info');
                this.updateActivationState();
            });
            
            // Actualizar contadores inicialmente
            this.updateCounts();
        },
        
        updateActivationState() {
            const enablePos = document.getElementById('enableFewShotPositive');
            const enableNeg = document.getElementById('enableFewShotNegative');
            
            // Actualizar tambien los checkboxes de la seccion de mejora de prompts
            const templateEnableFewShot = document.getElementById('templateEnableFewShot');
            const templateEnableFewShotNegatives = document.getElementById('templateEnableFewShotNegatives');
            
            if (templateEnableFewShot && enablePos) {
                templateEnableFewShot.checked = enablePos.checked;
            }
            if (templateEnableFewShotNegatives && enableNeg) {
                templateEnableFewShotNegatives.checked = enableNeg.checked;
            }
        },
        
        updateCounts() {
            const posCount = this.collect('positive').length;
            const negCount = this.collect('negative').length;
            
            const posCountEl = document.getElementById('fewShotPositiveCount');
            const negCountEl = document.getElementById('fewShotNegativeCount');
            
            if (posCountEl) posCountEl.textContent = `${posCount} ejemplo${posCount !== 1 ? 's' : ''}`;
            if (negCountEl) negCountEl.textContent = `${negCount} ejemplo${negCount !== 1 ? 's' : ''}`;
        },
        
        switchTab(tab) {
            this.currentTab = tab;
            const posContainer = document.getElementById('fewShotPositiveContainer');
            const negContainer = document.getElementById('fewShotNegativeContainer');
            const posTab = document.getElementById('fewShotPositiveTab');
            const negTab = document.getElementById('fewShotNegativeTab');
            
            if (tab === 'positive') {
                posContainer.style.display = 'block';
                negContainer.style.display = 'none';
                posTab.className = 'btn btn-sm btn-secondary';
                negTab.className = 'btn btn-sm btn-outline';
            } else {
                posContainer.style.display = 'none';
                negContainer.style.display = 'block';
                posTab.className = 'btn btn-sm btn-outline';
                negTab.className = 'btn btn-sm btn-secondary';
            }
        },
        
        addExample(type) {
            const container = document.getElementById(`fewShot${type === 'positive' ? 'Positive' : 'Negative'}List`);
            if (!container) return;
            
            const div = document.createElement('div');
            div.className = `few-shot-example ${type}`;
            
            // Generar IDs únicos para este ejemplo
            const exampleId = `fewShot_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const questionId = `${exampleId}_question`;
            const answerId = `${exampleId}_answer`;
            const issueId = `${exampleId}_issue`;
            
            // ✅ FIX #12: Usar addEventListener en lugar de onclick inline
            const removeBtn = document.createElement('button');
            removeBtn.className = 'btn btn-sm btn-outline remove-btn';
            removeBtn.textContent = '🗑️';
            removeBtn.type = 'button'; // ✅ Accesibilidad: evitar submit
            removeBtn.addEventListener('click', () => this.removeExample(removeBtn));
            
            // ✅ Accesibilidad: Label con atributo 'for' asociado al input
            const questionLabel = document.createElement('label');
            questionLabel.setAttribute('for', questionId);
            questionLabel.className = 'form-label';
            questionLabel.textContent = 'Pregunta';
            
            // ✅ Accesibilidad: Input con id y name
            const questionInput = document.createElement('input');
            questionInput.type = 'text';
            questionInput.id = questionId;
            questionInput.name = questionId;
            questionInput.className = 'form-control few-shot-question';
            questionInput.placeholder = '¿Cual es la pregunta de ejemplo?';
            questionInput.addEventListener('change', () => this.updateCounts());
            
            // ✅ Accesibilidad: Label con atributo 'for' asociado al textarea
            const answerLabel = document.createElement('label');
            answerLabel.setAttribute('for', answerId);
            answerLabel.className = 'form-label';
            answerLabel.textContent = `Respuesta ${type === 'positive' ? 'Correcta' : 'Incorrecta'}`;
            
            // ✅ Accesibilidad: Textarea con id y name
            const answerTextarea = document.createElement('textarea');
            answerTextarea.id = answerId;
            answerTextarea.name = answerId;
            answerTextarea.className = 'form-control few-shot-answer';
            answerTextarea.placeholder = 'Respuesta de ejemplo...';
            answerTextarea.rows = 2;
            answerTextarea.addEventListener('change', () => this.updateCounts());
            
            div.appendChild(removeBtn);
            div.appendChild(questionLabel);
            div.appendChild(questionInput);
            div.appendChild(answerLabel);
            div.appendChild(answerTextarea);
            
            if (type === 'negative') {
                // ✅ Accesibilidad: Label con atributo 'for' asociado al input
                const issueLabel = document.createElement('label');
                issueLabel.setAttribute('for', issueId);
                issueLabel.className = 'form-label';
                issueLabel.textContent = 'Problema';
                
                // ✅ Accesibilidad: Input con id y name
                const issueInput = document.createElement('input');
                issueInput.type = 'text';
                issueInput.id = issueId;
                issueInput.name = issueId;
                issueInput.className = 'form-control few-shot-issue';
                issueInput.placeholder = '¿Por que esta mal?';
                div.appendChild(issueLabel);
                div.appendChild(issueInput);
            }
            
            container.appendChild(div);
            this.updateCounts();
        },
        
        removeExample(btn) {
            btn.parentElement.remove();
            this.updateCounts();
        },
        
        collect(type) {
            const container = document.getElementById(`fewShot${type === 'positive' ? 'Positive' : 'Negative'}List`);
            if (!container) return [];
            
            const examples = [];
            container.querySelectorAll('.few-shot-example').forEach(ex => {
                const q = ex.querySelector('.few-shot-question')?.value;
                const a = ex.querySelector('.few-shot-answer')?.value;
                const issue = ex.querySelector('.few-shot-issue')?.value;
                
                if (q && a) {
                    const example = { question: q, answer: a };
                    if (type === 'negative' && issue) example.issue = issue;
                    examples.push(example);
                }
            });
            return examples;
        },
        
        load(positive, negative, enabledState) {
            const posList = document.getElementById('fewShotPositiveList');
            const negList = document.getElementById('fewShotNegativeList');
            if (posList) posList.innerHTML = '';
            if (negList) negList.innerHTML = '';
            
            positive?.forEach(ex => {
                this.addExample('positive');
                const container = document.getElementById('fewShotPositiveList');
                const last = container?.lastElementChild;
                if (last) {
                    last.querySelector('.few-shot-question').value = ex.question || '';
                    last.querySelector('.few-shot-answer').value = ex.answer || '';
                }
            });
            
            negative?.forEach(ex => {
                this.addExample('negative');
                const container = document.getElementById('fewShotNegativeList');
                const last = container?.lastElementChild;
                if (last) {
                    last.querySelector('.few-shot-question').value = ex.question || '';
                    last.querySelector('.few-shot-answer').value = ex.answer || '';
                    const issueInput = last.querySelector('.few-shot-issue');
                    if (issueInput && ex.issue) issueInput.value = ex.issue;
                }
            });
            
            // Cargar estado de activacion si existe
            if (enabledState) {
                const enablePos = document.getElementById('enableFewShotPositive');
                const enableNeg = document.getElementById('enableFewShotNegative');
                if (enablePos) enablePos.checked = enabledState.positive !== false;
                if (enableNeg) enableNeg.checked = enabledState.negative || false;
            }
            
            this.updateCounts();
        },
        
        clearAll() {
            if (!confirm('¿Eliminar todos los ejemplos?')) return;
            const posList = document.getElementById('fewShotPositiveList');
            const negList = document.getElementById('fewShotNegativeList');
            if (posList) posList.innerHTML = '';
            if (negList) negList.innerHTML = '';
            this.updateCounts();
            UI.toast('🗑️ Ejemplos eliminados', 'info');
        },
        
        getEnabledState() {
            return {
                positive: document.getElementById('enableFewShotPositive')?.checked || false,
                negative: document.getElementById('enableFewShotNegative')?.checked || false
            };
        }
    };


// Exponer globalmente
if (typeof window !== 'undefined') {
    window.FewShotManager = FewShotManager;
}

// Exports
export { FewShotManager };
export default FewShotManager;
