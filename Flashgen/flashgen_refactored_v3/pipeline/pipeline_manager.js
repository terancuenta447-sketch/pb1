/**
 * Módulo: PipelineManager
 * Categoría: pipeline
 * Extraído de: Flashgen.js (líneas 8711-8829)
 */

import { DebugLogger } from '../ui/debug_logger.js';
import { State } from '../core/state.js';
import { UI } from '../ui/ui.js';

const PipelineManager = {
    createId() {
        return `pl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    },

    capture(name, description = '') {
        const stepsConfig = (State.pipeline.steps || []).map(step => ({
            id: step.id,
            name: step.name,
            enabled: !!step.enabled,
            order: typeof step.order === 'number' ? step.order : 0
        }));

        const snapshot = {
            id: this.createId(),
            name,
            description,
            stepsConfig,
            options: { ...State.pipeline.options },
            variables: { ...State.pipelineVariables },
            apiConfig: {
                temperature: State.config.hyperparams.temperature,
                top_p: State.config.hyperparams.top_p,
                top_k: State.config.hyperparams.top_k,
                max_tokens: 150
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        return snapshot;
    },

    apply(pipelineId) {
        const pipeline = State.customPipelines.find(p => p.id === pipelineId);
        if (!pipeline) {
            return false;
        }

        const currentStepsById = new Map(
            (State.pipeline.steps || []).map(step => [step.id, step])
        );

        const defaultConfigs = {
            'extract-entities': { extractPeople: true, extractPlaces: true, extractDates: true, extractQuotes: true, minQuoteLength: 30 },
            'preprocess': { removeReferences: true, filterUrls: true, normalizeSpaces: true, excludeBiblio: true },
            'chunk': { method: 'sentence', size: 500, overlap: 10, minSize: 100 },
            'spacy-enhance': { entityEnrichment: true, syntacticAnalysis: true, semanticClustering: false, nerValidation: true },
            'context-inject': { template: 'Contexto relevante:', includeCharacters: true, includeEvents: true, includeThemes: false, contextWindow: 2 },
            'generate': { temperature: 0.7, maxTokens: 150, outputType: 'template', sourceLanguage: 'Inglés', ankiFormat: 'basic' },
            'quality': { threshold: 70, strict: true },
            'difficulty-balance': { easyCount: 10, mediumCount: 10, hardCount: 10, estimationMethod: 'wordCount' },
            'spacy-validation': { grammarCheck: true, entityConsistency: true, syntaxValidation: false, semanticCoherence: true },
            'cloze-generator': { clozeEntities: true, clozeNumbers: true, clozeDates: true, clozeKeywords: false, maxVariantsPerCard: 2 },
            'spacy-cloze': { nounPhrases: true, verbPhrases: true, namedEntities: true, syntacticHeads: false, preserveGrammar: true },
            'score': { variants: 3, temperatures: [0.5, 0.7, 0.9], weightOverlap: 0.5, weightLength: 0.2, weightFormat: 0.3 },
            'dedupe': {}
        };

        State.pipeline.steps = (pipeline.stepsConfig || []).map(config => {
            const existing = currentStepsById.get(config.id) || {
                id: config.id,
                name: config.id,
                enabled: true,
                order: typeof config.order === 'number' ? config.order : 0,
                config: defaultConfigs[config.id] || {}
            };

            const finalName = (config.name && config.name.trim()) || existing.name || config.id;

            return {
                ...existing,
                name: finalName,
                enabled: !!config.enabled,
                order: typeof config.order === 'number' ? config.order : existing.order,
                config: existing.config || defaultConfigs[config.id] || {}
            };
        });

        State.pipeline.options = {
            ...State.pipeline.options,
            ...(pipeline.options || {})
        };

        State.pipelineVariables = {
            ...(pipeline.variables || {})
        };

        if (pipeline.apiConfig) {
            if (typeof pipeline.apiConfig.temperature === 'number') {
                State.config.hyperparams.temperature = pipeline.apiConfig.temperature;
            }
            if (typeof pipeline.apiConfig.top_p === 'number') {
                State.config.hyperparams.top_p = pipeline.apiConfig.top_p;
            }
            if (typeof pipeline.apiConfig.top_k === 'number') {
                State.config.hyperparams.top_k = pipeline.apiConfig.top_k;
            }
        }

        State.activePipeline = pipeline.id;
        pipeline.updatedAt = new Date().toISOString();

        return true;
    },

    save() {
        const name = window.prompt('Nombre del pipeline:');
        if (!name) {
            return null;
        }

        const snapshot = this.capture(name);
        State.customPipelines.push(snapshot);
        UI.toast(`✅ "${name}" guardado`);

        return snapshot;
    },
    
    renderPipeline() {
        DebugLogger.log('📋 Renderizando pipeline', 'info');
        
        const container = document.getElementById('pipelineSteps');
        if (!container) {
            DebugLogger.log('⚠️ Contenedor pipelineSteps no encontrado', 'warning');
            return;
        }

        const steps = State.pipeline.steps || [];
        container.innerHTML = steps.map(step => {
            // ✅ Accesibilidad: Generar ID único para cada checkbox
            const checkboxId = `pipeline_step_${step.id}_checkbox`;
            return `
            <div class="pipeline-step" data-step="${step.id}" draggable="true" data-config='${JSON.stringify(step.config || {})}'>
                <span class="drag-handle">☰</span>
                <input type="checkbox" id="${checkboxId}" name="${checkboxId}" class="step-checkbox"${step.enabled ? ' checked' : ''}>
                <span class="step-name">${step.name}</span>
                <button type="button" class="btn btn-sm btn-outline step-edit-btn" style="margin-left: auto;">
                    ⚙️ Configurar
                </button>
            </div>
        `;
        }).join('');
        
        // Bind events para checkboxes
        container.querySelectorAll('.step-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const stepDiv = e.target.closest('.pipeline-step');
                const stepId = stepDiv?.dataset.step;
                if (stepId) {
                    const step = (State.pipeline.steps || []).find(s => s.id === stepId);
                    if (step) {
                        step.enabled = e.target.checked;
                        DebugLogger.log(`✓ Paso ${step.name} ${step.enabled ? 'habilitado' : 'deshabilitado'}`, 'info');
                    }
                }
            });
        });
        
        // Bind events para botones de acción
        this.bindActionButtons();
        
        // Setup drag & drop
        this.setupDragDrop();
        
        // Actualizar indicador de estado
        this.updateStatusIndicator(steps);
        
        DebugLogger.log(`✓ Pipeline renderizado: ${steps.length} pasos`, 'success');
    },
    
    bindActionButtons() {
        const container = document.getElementById('pipelineSteps');
        if (!container) return;
        
        // Config buttons
        container.querySelectorAll('.step-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const stepDiv = e.target.closest('.pipeline-step');
                const stepId = stepDiv?.dataset.step;
                if (stepId) this.openConfigModal(stepId);
            });
        });
    },
    
    setupDragDrop() {
        const steps = document.querySelectorAll('.pipeline-step');
        let draggedItem = null;

        steps.forEach(step => {
            step.addEventListener('dragstart', (e) => {
                draggedItem = step;
                step.style.opacity = '0.5';
            });

            step.addEventListener('dragend', () => {
                step.style.opacity = '1';
                draggedItem = null;
            });

            step.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            step.addEventListener('drop', (e) => {
                e.preventDefault();
                if (draggedItem && draggedItem !== step) {
                    const container = step.parentNode;
                    const items = Array.from(container.children);
                    const draggedIndex = items.indexOf(draggedItem);
                    const targetIndex = items.indexOf(step);
                    
                    if (draggedIndex < targetIndex) {
                        container.insertBefore(draggedItem, step.nextSibling);
                    } else {
                        container.insertBefore(draggedItem, step);
                    }
                    
                    this.updatePipelineState();
                }
            });
        });
    },
    
    updatePipelineState() {
        const container = document.getElementById('pipelineSteps');
        if (!container) return;
        
        const stepDivs = Array.from(container.querySelectorAll('.pipeline-step'));
        const newOrder = stepDivs.map((div, index) => {
            const stepId = div.dataset.step;
            const step = State.pipeline.steps.find(s => s.id === stepId);
            if (step) {
                step.order = index;
                return step;
            }
            return null;
        }).filter(Boolean);
        
        State.pipeline.steps = newOrder;
        
        // Persistir automáticamente
        if (typeof Storage !== 'undefined' && Storage.save) {
            Storage.save();
        }
        
        // Actualizar indicador
        this.updateStatusIndicator(State.pipeline.steps);
        
        DebugLogger.log('✓ Orden de pipeline actualizado y guardado', 'success');
    },
    
    addStep(stepId, customName = '') {
        const defaultConfigs = {
            'extract-entities': { name: '🔍 Extracción de Entidades', config: { extractPeople: true, extractPlaces: true, extractDates: true, extractQuotes: true, minQuoteLength: 30 } },
            'preprocess': { name: '🧹 Preprocesamiento', config: { removeReferences: true, filterUrls: true, normalizeSpaces: true, excludeBiblio: true } },
            'chunk': { name: '✂️ Chunking', config: { method: 'sentence', size: 500, overlap: 10, minSize: 100 } },
            'spacy-enhance': { name: '🧠 spaCy Enhancement', config: { entityEnrichment: true, syntacticAnalysis: true, semanticClustering: false, nerValidation: true } },
            'context-inject': { name: '📝 Inyección de Contexto', config: { template: 'Contexto relevante:', includeCharacters: true, includeEvents: true, includeThemes: false, contextWindow: 2 } },
            'generate': { name: '⚡ Generación LLM', config: { temperature: 0.7, maxTokens: 150, outputType: 'template', sourceLanguage: 'Inglés', ankiFormat: 'basic' } },
            'quality': { name: '✅ Control de Calidad', config: { threshold: 70, strict: true } },
            'difficulty-balance': { name: '⚖️ Balance de Dificultad', config: { easyCount: 10, mediumCount: 10, hardCount: 10, estimationMethod: 'wordCount' } },
            'spacy-validation': { name: '🔬 Validación spaCy', config: { grammarCheck: true, entityConsistency: true, syntaxValidation: false, semanticCoherence: true } },
            'cloze-generator': { name: '🎯 Generador Cloze', config: { clozeEntities: true, clozeNumbers: true, clozeDates: true, clozeKeywords: false, maxVariantsPerCard: 2 } },
            'spacy-cloze': { name: '🧠 Cloze spaCy', config: { nounPhrases: true, verbPhrases: true, namedEntities: true, syntacticHeads: false, preserveGrammar: true } },
            'score': { name: '🏆 Re-ranking (Scorer)', config: { variants: 3, temperatures: [0.5, 0.7, 0.9], weightOverlap: 0.5, weightLength: 0.2, weightFormat: 0.3 } },
            'dedupe': { name: '🗑️ Deduplicación', config: {} }
        };
        
        const stepConfig = defaultConfigs[stepId];
        if (!stepConfig) {
            DebugLogger.log(`❌ Tipo de paso desconocido: ${stepId}`, 'error');
            return;
        }
        
        const newStep = {
            id: stepId,
            name: customName || stepConfig.name,
            enabled: true,
            order: State.pipeline.steps.length,
            config: { ...stepConfig.config }
        };
        
        State.pipeline.steps.push(newStep);
        this.renderPipeline();
        DebugLogger.log(`✅ Paso agregado: ${newStep.name}`, 'success');
    },
    
    updateStatusIndicator(steps) {
        const statusDiv = document.getElementById('pipelineStatus');
        const statusText = document.getElementById('pipelineStatusText');
        const stepCount = document.getElementById('pipelineStepCount');
        
        if (!statusDiv || !statusText || !stepCount) return;
        
        const enabled = steps.filter(s => s.enabled).length;
        const total = steps.length;
        
        statusDiv.style.display = 'block';
        statusText.textContent = `Pipeline configurado con ${enabled} de ${total} pasos activos`;
        stepCount.textContent = `${enabled}/${total}`;
        
        // Color según cantidad de pasos activos
        if (enabled === 0) {
            statusDiv.style.borderLeft = '3px solid var(--color-error)';
        } else if (enabled < total / 2) {
            statusDiv.style.borderLeft = '3px solid var(--color-warning)';
        } else {
            statusDiv.style.borderLeft = '3px solid var(--color-success)';
        }
    },
    
    openConfigModal(stepId) {
        const step = State.pipeline.steps.find(s => s.id === stepId);
        if (!step) return;

        const existingModal = document.getElementById('pipelineStepConfigModal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = 'pipelineStepConfigModal';
        modal.style.cssText = `position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.6); z-index: 10000; padding: 16px;`;

        const configStr = JSON.stringify(step.config || {}, null, 2);
        
        modal.innerHTML = `
            <div style="background: var(--color-surface, #1f1f1f); border-radius: var(--radius-lg, 12px); max-width: 600px; width: 100%; padding: 24px; max-height: 90vh; overflow-y: auto;">
                <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <div>
                        <h3 style="margin:0;">⚙️ Configurar Paso</h3>
                        <p style="margin: 4px 0 0 0; color: var(--color-text-secondary, #bdbdbd); font-size: 13px;">${step.name}</p>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline" id="closeStepConfigModal">✖</button>
                </div>
                
                <div style="margin-bottom: 12px; padding: 10px; background: var(--color-info-bg, #1a2332); border-radius: var(--radius-base, 8px); border-left: 3px solid var(--color-info, #3b82f6);">
                    <strong style="font-size: 12px; color: var(--color-info, #3b82f6);">💡 Ayuda</strong>
                    <p style="margin: 4px 0 0 0; font-size: 11px; color: var(--color-text-secondary, #bdbdbd); line-height: 1.4;">
                        Edita la configuración en formato JSON. Los cambios se guardan automáticamente al hacer clic en "Guardar".
                    </p>
                </div>
                
                <label for="stepConfigEditor" style="font-size: 12px; font-weight: 600; color: var(--color-text, #f5f5f5); display: block; margin-bottom: 8px;">Configuración JSON</label>
                <textarea id="stepConfigEditor" name="stepConfigEditor" style="width: 100%; min-height: 220px; font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 13px; border-radius: var(--radius-base, 8px); padding: 12px; background: var(--color-bg-1, #121212); color: var(--color-text, #f5f5f5); border: 1px solid var(--color-border, #333); resize: vertical;">${configStr}</textarea>
                
                <div id="configValidation" style="margin-top: 8px; padding: 8px; border-radius: var(--radius-sm, 4px); display: none;"></div>
                
                <div style="display:flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 16px;">
                    <button type="button" class="btn btn-sm btn-outline" id="formatConfigJson" style="font-size: 11px;">📝 Formatear</button>
                    <div style="display:flex; gap: 8px;">
                        <button type="button" class="btn btn-outline" id="cancelStepConfig">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="saveStepConfig">Guardar</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeModal = () => modal.remove();
        modal.querySelector('#closeStepConfigModal')?.addEventListener('click', closeModal);
        modal.querySelector('#cancelStepConfig')?.addEventListener('click', closeModal);

        // Formatear JSON
        modal.querySelector('#formatConfigJson')?.addEventListener('click', () => {
            const textarea = modal.querySelector('#stepConfigEditor');
            if (!textarea) return;
            
            try {
                const parsed = JSON.parse(textarea.value);
                textarea.value = JSON.stringify(parsed, null, 2);
                this.showValidation(modal, 'success', '✅ JSON formateado correctamente');
            } catch (error) {
                this.showValidation(modal, 'error', `❌ Error: ${error.message}`);
            }
        });
        
        // Validación en tiempo real
        const textarea = modal.querySelector('#stepConfigEditor');
        if (textarea) {
            textarea.addEventListener('input', () => {
                try {
                    JSON.parse(textarea.value);
                    this.showValidation(modal, 'success', '✅ JSON válido');
                } catch (error) {
                    this.showValidation(modal, 'error', `❌ ${error.message}`);
                }
            });
        }
        
        modal.querySelector('#saveStepConfig')?.addEventListener('click', () => {
            const textarea = modal.querySelector('#stepConfigEditor');
            if (!textarea) return;

            try {
                const parsed = JSON.parse(textarea.value);
                step.config = parsed;
                
                // Persistir automáticamente
                if (typeof Storage !== 'undefined' && Storage.save) {
                    Storage.save();
                }
                
                this.renderPipeline();
                UI.toast(`✅ Configuración guardada para ${step.name}`);
                DebugLogger.log(`⚙️ Configuración actualizada: ${step.name}`, 'success');
                closeModal();
            } catch (error) {
                this.showValidation(modal, 'error', `❌ JSON inválido: ${error.message}`);
                DebugLogger.log(`❌ Error parseando config: ${error.message}`, 'error');
            }
        });
    },
    
    showValidation(modal, type, message) {
        const validationDiv = modal.querySelector('#configValidation');
        if (!validationDiv) return;
        
        validationDiv.style.display = 'block';
        validationDiv.textContent = message;
        
        if (type === 'success') {
            validationDiv.style.background = 'var(--color-success-bg, #1a3a1a)';
            validationDiv.style.color = 'var(--color-success, #4ade80)';
            validationDiv.style.borderLeft = '3px solid var(--color-success, #4ade80)';
        } else {
            validationDiv.style.background = 'var(--color-error-bg, #3a1a1a)';
            validationDiv.style.color = 'var(--color-error, #f87171)';
            validationDiv.style.borderLeft = '3px solid var(--color-error, #f87171)';
        }
        
        setTimeout(() => {
            if (type === 'success') {
                validationDiv.style.display = 'none';
            }
        }, 3000);
    },
    
    reset() {
        if (!confirm('¿Restaurar pipeline a configuración por defecto?')) return;
        
        // Restaurar pasos por defecto desde State inicial
        State.pipeline.steps = [
            { id: 'extract-entities', name: '🔍 Extracción de Entidades', enabled: false, order: 0, config: {} },
            { id: 'preprocess', name: '🧹 Preprocesamiento', enabled: true, order: 1, config: {} },
            { id: 'chunk', name: '✂️ Chunking', enabled: true, order: 2, config: {} },
            { id: 'context-inject', name: '📝 Inyección de Contexto', enabled: false, order: 3, config: {} },
            { id: 'generate', name: '⚡ Generación LLM', enabled: true, order: 4, config: {} },
            { id: 'quality', name: '✅ Control de Calidad', enabled: false, order: 5, config: {} },
            { id: 'difficulty-balance', name: '⚖️ Balance de Dificultad', enabled: false, order: 6, config: {} },
            { id: 'cloze-generator', name: '🎯 Generador Cloze', enabled: false, order: 7, config: {} },
            { id: 'score', name: '🏆 Re-ranking (Scorer)', enabled: false, order: 8, config: {} },
            { id: 'dedupe', name: '🗑️ Deduplicación', enabled: false, order: 9, config: {} }
        ];
        
        this.renderPipeline();
        UI.toast('✅ Pipeline restaurado');
        DebugLogger.log('🔄 Pipeline reseteado a configuración por defecto', 'info');
    },
    
    exportPipeline() {
        const pipeline = this.capture('Export', 'Pipeline exportado');
        const json = JSON.stringify(pipeline, null, 2);
        
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pipeline_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        UI.toast('✅ Pipeline exportado');
        DebugLogger.log('📤 Pipeline exportado', 'success');
    },
    
    importPipeline(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                
                if (!imported.stepsConfig || !Array.isArray(imported.stepsConfig)) {
                    throw new Error('Formato de pipeline inválido');
                }
                
                State.customPipelines.push(imported);
                const success = this.apply(imported.id);
                
                if (success) {
                    this.renderPipeline();
                    UI.toast(`✅ Pipeline "${imported.name}" importado`);
                    DebugLogger.log(`📥 Pipeline importado: ${imported.name}`, 'success');
                }
            } catch (error) {
                UI.toast('❌ Error al importar pipeline', 'error');
                DebugLogger.log(`❌ Error importando: ${error.message}`, 'error');
            }
        };
        reader.readAsText(file);
    }
};

// Exponer globalmente para inicialización lazy
if (typeof window !== 'undefined') {
    window.PipelineManager = PipelineManager;
}

export { PipelineManager };
export default PipelineManager;