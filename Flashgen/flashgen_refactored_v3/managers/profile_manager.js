/**
 * Módulo: ProfileManager
 * Categoría: managers
 * Extraído de: Flashgen.js (líneas 3416-3565)
 * Generado: 2025-11-28
 * 
 * Descripción: Gestiona perfiles de generación (ultra_quality, balanced, fast, custom)
 * Dependencias: GenerationProfiles, State, UI, DebugLogger
 */

import { GenerationProfiles } from '../core/generation_profiles.js';
import { State } from '../core/state.js';
import { DebugLogger } from '../ui/debug_logger.js';

const ProfileManager = {
    apply(profileKey) {
        const profile = GenerationProfiles[profileKey];
        if (!profile) {
            console.error('Perfil no encontrado:', profileKey);
            return;
        }

        DebugLogger.log(`🎚️ Aplicando perfil: ${profile.name}`, 'info');

        const descEl = document.getElementById('profileDescription');
        if (descEl) {
            descEl.innerHTML = profile.description;
        }

        const customPanel = document.getElementById('customProfilePanel');
        if (customPanel) {
            customPanel.style.display = profileKey === 'custom' ? 'block' : 'none';
        }

        // ✅ Llamar a UI de forma segura
        if (typeof window !== 'undefined' && window.UI) {
            if (window.UI.renderCustomProfilePanel) {
                window.UI.renderCustomProfilePanel();
            }
            if (profileKey === 'custom') {
                if (window.UI.syncCustomProfilePanel) {
                    window.UI.syncCustomProfilePanel();
                }
                this.readCustomConfig();
                return;
            }
        }

        const cfg = profile.config;

        State.config.features.chain = cfg.enableChain;
        State.config.features.autoQuality = cfg.enableQuality;
        State.config.features.fewShot = cfg.enableFewShot;
        State.config.features.lexicalFilter = cfg.enableLexicalFilter;

        State.pipeline.options.qualityThreshold = cfg.qualityThreshold;
        State.pipeline.options.maxRefinements = cfg.maxRefinements;
        State.pipeline.options.enableAutoRefinement = cfg.enableRefinement;
        State.pipeline.options.chunkSize = cfg.chunkSize;

        // Default output overrides
        State.config.output = State.config.output || {};
        if (cfg.outputType) {
            State.config.output.type = cfg.outputType;
            if (window.UI && window.UI.outputTypeSelect) {
                window.UI.outputTypeSelect.value = cfg.outputType;
                if (window.UI.handleOutputTypeChange) {
                    window.UI.handleOutputTypeChange(cfg.outputType);
                }
            }
        }
        if (cfg.sourceLanguage) {
            State.config.output.sourceLanguage = cfg.sourceLanguage;
            if (window.UI && window.UI.sourceLanguageInput) {
                window.UI.sourceLanguageInput.value = cfg.sourceLanguage;
            }
        }

        const clozeStep = (State.pipeline.steps || []).find(s => s.id === 'cloze-generator');
        if (clozeStep) {
            clozeStep.enabled = cfg.enableCloze;
        }

        const contextStep = (State.pipeline.steps || []).find(s => s.id === 'context-inject');
        if (contextStep) {
            contextStep.enabled = cfg.enableContextInjection;
        }

        const batchDelaySlider = document.getElementById('batchDelaySlider');
        if (batchDelaySlider) {
            batchDelaySlider.value = cfg.batchDelay;
            const batchDelayValue = document.getElementById('batchDelayValue');
            if (batchDelayValue) batchDelayValue.textContent = cfg.batchDelay;
        }

        if (cfg.hyperparams) {
            State.config.hyperparams = { ...cfg.hyperparams };
            const { temperature, top_p, top_k } = cfg.hyperparams;
            const tempInput = document.getElementById('temperature');
            const topPInput = document.getElementById('topP');
            const topKInput = document.getElementById('topK');
            const tempValue = document.getElementById('tempValue');
            const topPValue = document.getElementById('topPValue');
            const topKValue = document.getElementById('topKValue');
            if (tempInput) tempInput.value = temperature;
            if (topPInput) topPInput.value = top_p;
            if (topKInput) topKInput.value = top_k;
            if (tempValue) tempValue.textContent = temperature;
            if (topPValue) topPValue.textContent = top_p;
            if (topKValue) topKValue.textContent = top_k;
        }

        this.syncGuiCheckboxes();
        if (window.UI && window.UI.renderCustomProfilePanel) {
            window.UI.renderCustomProfilePanel();
        }

        DebugLogger.log(`✅ Perfil ${profile.name} aplicado`, 'success');
        if (window.UI && window.UI.toast) {
            window.UI.toast(`${profile.name} aplicado`);
        }
    },

    syncGuiCheckboxes() {
        const checkboxMap = {
            'chainMode': State.config.features.chain,
            'batchMode': State.config.features.batch,
            'enableFewShot': State.config.features.fewShot,
            'enableFewShotNegatives': State.config.features.fewShotNegatives,
            'enableNegativePrompt': State.config.features.negativeExamplesInline,
            'enableLexicalFilter': State.config.features.lexicalFilter,
            'memoryMode': State.config.features.memory,
            'agentMode': State.config.features.agent
        };

        Object.entries(checkboxMap).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.checked = value;
        });
        this.updateFeaturePanels();
    },

    readCustomConfig() {
        State.config.features.chain = document.getElementById('profile_enableChain')?.checked ?? true;
        State.config.features.autoQuality = document.getElementById('profile_enableQuality')?.checked ?? true;
        State.config.features.fewShot = document.getElementById('profile_enableFewShot')?.checked ?? false;
        State.config.features.lexicalFilter = document.getElementById('profile_enableLexicalFilter')?.checked ?? false;

        State.pipeline.options.enableAutoRefinement = document.getElementById('profile_enableRefinement')?.checked ?? true;
        State.pipeline.options.qualityThreshold = parseInt(document.getElementById('profile_qualityThreshold')?.value ?? 70, 10);
        State.pipeline.options.maxRefinements = parseInt(document.getElementById('profile_maxRefine')?.value ?? 2, 10);

        const batchDelay = parseInt(document.getElementById('profile_batchDelay')?.value ?? 300, 10);
        const batchDelaySlider = document.getElementById('batchDelaySlider');
        const batchDelayValue = document.getElementById('batchDelayValue');
        if (batchDelaySlider) batchDelaySlider.value = batchDelay;
        if (batchDelayValue) batchDelayValue.textContent = batchDelay;

        const clozeEnabled = document.getElementById('profile_enableCloze')?.checked ?? false;
        const clozeStep = (State.pipeline.steps || []).find(s => s.id === 'cloze-generator');
        if (clozeStep) clozeStep.enabled = clozeEnabled;

        const contextEnabled = document.getElementById('profile_enableContextInjection')?.checked ?? false;
        const contextStep = (State.pipeline.steps || []).find(s => s.id === 'context-inject');
        if (contextStep) contextStep.enabled = contextEnabled;

        this.syncGuiCheckboxes();

        DebugLogger.log('🔧 Configuración custom leída desde GUI', 'info');
        if (window.UI && window.UI.toast) {
            window.UI.toast('Configuración custom aplicada');
        }
    },

    updateFeaturePanels() {
        // Delegado a UI si existe
        if (window.UI && window.UI.updateFeaturePanels) {
            window.UI.updateFeaturePanels();
        }
    },

    getCurrentProfile() {
        const select = document.getElementById('generationProfile');
        return select ? select.value : 'balanced';
    }
};

// Exportar
export { ProfileManager };
export default ProfileManager;

// Exponer globalmente
if (typeof window !== 'undefined') {
    window.ProfileManager = ProfileManager;
}

