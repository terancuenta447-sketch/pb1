/**
 * Modulo: Chain Panel Controller (Gestion UI Panel Inferior)
 * Categoria: ui
 * Extraido de: Flashgen.js (lineas 12276-12380)
 * Generado: 2025-11-28 09:49:00
 * 
 * Metodos: updateState, init, renderFromState, getGenerateStep, bindEvents
 * Dependencias: DebugLogger, State, UI
 */

import { DebugLogger } from './debug_logger.js';
import { State } from '../core/state.js';
import { UI } from './ui.js';

    const ChainPanelController = {
        init() {
            this.bindEvents();
        },

        getGenerateStep() {
            return (State.pipeline.steps || []).find(s => s.id === 'generate');
        },

        renderFromState() {
            const step = this.getGenerateStep();
            if (!step || !step.config || !step.config.chainConfig) return;

            const cfg = step.config.chainConfig;
            const prompts = cfg.prompts || {};
            
            // Generacion
            if (document.getElementById('lc_gen_system')) {
                document.getElementById('lc_gen_system').value = prompts.generate?.system || '';
            }
            
            // Evaluacion
            if (document.getElementById('lc_eval_threshold')) {
                document.getElementById('lc_eval_threshold').value = cfg.qualityThreshold || 75;
            }
            if (document.getElementById('lc_eval_criteria')) {
                document.getElementById('lc_eval_criteria').value = prompts.evaluate?.criteria || '';
            }
            
            // Modo de Evaluacion (Radio)
            const evalMode = cfg.evalMode || 'heuristic';
            const radio = document.querySelector(`input[name="lc_eval_mode"][value="${evalMode}"]`);
            if (radio) radio.checked = true;
            
            const llmOpts = document.getElementById('lc_eval_llm_opts');
            if (llmOpts) llmOpts.style.display = evalMode === 'llm' ? 'block' : 'none';

            // Refinamiento
            if (document.getElementById('lc_refine_max')) {
                document.getElementById('lc_refine_max').value = cfg.maxRefinements || 2;
            }
            if (document.getElementById('lc_refine_instructions')) {
                document.getElementById('lc_refine_instructions').value = prompts.refine?.instructions || '';
            }
            
            // Visibilidad del panel
            const panel = document.getElementById('langChainConfigPanel');
            if (panel) {
                panel.style.display = step.config.enableChain ? 'block' : 'none';
            }
        },

        updateState() {
            const step = this.getGenerateStep();
            if (!step) return;

            if (!step.config.chainConfig) step.config.chainConfig = { prompts: {} };
            const cfg = step.config.chainConfig;
            if (!cfg.prompts) cfg.prompts = {};

            // Capturar valores
            cfg.prompts.generate = { system: document.getElementById('lc_gen_system')?.value || '' };
            
            // Evaluacion
            cfg.evalMode = document.querySelector('input[name="lc_eval_mode"]:checked')?.value || 'heuristic';
            cfg.qualityThreshold = parseInt(document.getElementById('lc_eval_threshold')?.value, 10) || 75;
            cfg.prompts.evaluate = { criteria: document.getElementById('lc_eval_criteria')?.value || '' };
            
            cfg.maxRefinements = parseInt(document.getElementById('lc_refine_max')?.value, 10) || 2;
            cfg.prompts.refine = { instructions: document.getElementById('lc_refine_instructions')?.value || '' };

            DebugLogger.log('🔗 Configuracion Chain actualizada desde panel', 'info');
        },

        bindEvents() {
            const inputs = [
                'lc_gen_system', 'lc_eval_threshold', 'lc_eval_criteria', 
                'lc_refine_max', 'lc_refine_instructions'
            ];

            inputs.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.addEventListener('change', () => this.updateState());
                }
            });

            // Radio buttons de modo evaluacion
            document.querySelectorAll('input[name="lc_eval_mode"]').forEach(el => {
                el.addEventListener('change', () => {
                    this.updateState();
                    const llmOpts = document.getElementById('lc_eval_llm_opts');
                    if (llmOpts) llmOpts.style.display = el.value === 'llm' ? 'block' : 'none';
                });
            });

            const refreshBtn = document.getElementById('refreshChainConfig');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    this.renderFromState();
                    if (typeof UI !== 'undefined' && UI.toast) UI.toast('Configuracion refrescada');
                });
            }
        }
    };


// Exponer globalmente
if (typeof window !== 'undefined') {
    window.ChainPanelController = ChainPanelController;
}

// Exports
export { ChainPanelController };
export default ChainPanelController;
