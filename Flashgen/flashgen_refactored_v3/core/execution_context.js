/**
 * Módulo: ExecutionContext
 * Categoría: core
 * Extraído de: Flashgen.js (líneas 11251-11402, 12212-12271)
 * Generado: 2025-11-28
 * 
 * Descripción: Contexto de ejecución del pipeline - maneja estado, opciones y features
 * Dependencias: GenerationProfiles, State, DebugLogger
 */

import { GenerationProfiles } from './generation_profiles.js';
import { State } from './state.js';
import { DebugLogger } from '../ui/debug_logger.js';

// ExecutionContext Pattern - Estado unificado y predecible
class ExecutionContext {
    constructor(template, profile, pipelineSteps) {
        this.template = template;
        this.profile = profile;
        this.pipeline = pipelineSteps;
        this.features = this.computeFeatures();
        this.options = this.computeOptions();
        
        // Congelar para prevenir cambios inesperados
        Object.freeze(this.features);
        Object.freeze(this.options);
        Object.freeze(this);
    }
    
    computeFeatures() {
        const profileConfig = GenerationProfiles[this.profile]?.config || {};
        const featureState = State.config?.features || {};
        const pipelineOptions = State.pipeline?.options || {};
        
        return {
            // Chain features
            chain: typeof featureState.chain === 'boolean'
                ? featureState.chain
                : !!profileConfig.enableChain,
            chainBypassQuality: typeof pipelineOptions.chainBypassQuality === 'boolean'
                ? pipelineOptions.chainBypassQuality
                : !!profileConfig.chainBypassQuality,
            maxRefinements: (typeof pipelineOptions.maxRefinements === 'number'
                ? pipelineOptions.maxRefinements
                : (profileConfig.maxRefinements || 3)),
            
            // Quality features
            quality: typeof featureState.autoQuality === 'boolean'
                ? featureState.autoQuality
                : !!profileConfig.enableQuality,
            strictQuality: !!profileConfig.strictQuality,
            qualityThreshold: typeof pipelineOptions.qualityThreshold === 'number'
                ? pipelineOptions.qualityThreshold
                : (profileConfig.qualityThreshold || 70),
            
            // Processing features
            enableRefinement: profileConfig.enableRefinement || false,
            enableDedupe: profileConfig.enableDedupe || false,
            enableScoring: profileConfig.enableScoring || false,
            
            // Template-specific features
            templateFeatures: this.template?.features || {},
            
            // Runtime features
            hasPdfMetadata: !!State.pdfMetadata,
            hasEntityExtraction: false, // Se actualiza durante ejecución
            chapterMode: this.template?.defaultChunkMethod === 'chapter'
        };
    }
    
    computeOptions() {
        // Combinar opciones de perfil, template y pipeline
        const profileConfig = GenerationProfiles[this.profile]?.config || {};
        const templateConfig = this.template || {};
        const pipelineOptions = State.pipeline?.options || {};
        const outputConfig = State.config?.output || {};
        
        return {
            // Generación
            temperature: profileConfig.temperature || 0.7,
            maxTokens: profileConfig.maxTokens || 150,
            outputType: outputConfig.type || templateConfig.outputType || 'template',
            sourceLanguage: outputConfig.sourceLanguage || 'Inglés',
            
            // Chunking
            chunkMethod: templateConfig.defaultChunkMethod || pipelineOptions.chunkMethod || 'sentence',
            chunkSize: pipelineOptions.chunkSize || 500,
            chunkOverlap: pipelineOptions.chunkOverlap || 10,
            
            // Calidad
            qualityThreshold: pipelineOptions.qualityThreshold || 70,
            strictQuality: pipelineOptions.strictQuality || false,
            
            // Salida
            sourceLanguage: State.config?.output?.sourceLanguage || 'Inglés',
            ankiFormat: pipelineOptions.ankiFormat || 'basic',
            
            // Metadata
            profile: this.profile,
            templateId: State.activeTemplate,
            timestamp: new Date().toISOString()
        };
    }
    
    // Métodos de consulta
    shouldUseChain() {
        return this.features.chain && this.profile !== 'fast';
    }
    
    shouldUseChapterDetection() {
        // FASE 2: DETECCIÓN DE CAPÍTULOS ACCESIBLE UNIVERSALMENTE
        // Liberado de restricciones artificiales - ahora disponible para cualquier template
        
        // 1. Detección explícita por chunkMethod
        if (this.options.chunkMethod === 'chapter') {
            DebugLogger.log('📖 Detección por chunkMethod=chapter', 'info');
            return true;
        }
        
        // 2. Detección automática inteligente (sin restricciones)
        const hasChapterKeywords = this.template?.systemPrompt?.toLowerCase().includes('capítulo') ||
                                this.template?.systemPrompt?.toLowerCase().includes('chapter') ||
                                this.template?.name?.toLowerCase().includes('libro') ||
                                this.template?.name?.toLowerCase().includes('book');
        
        if (hasChapterKeywords) {
            DebugLogger.log('📖 Detección automática por template', 'info');
            return true;
        }
        
        // 3. Detección por tamaño de texto (antes >1000 chars, ahora más flexible)
        if (this.options.chunkSize > 800) {  // Reducido de 1000 a 800
            DebugLogger.log('📖 Detección por tamaño de texto (>800 chars)', 'info');
            return true;
        }
        
        // 4. Detección por PDF metadata (mantenida)
        if (this.features.hasPdfMetadata) {
            DebugLogger.log('📖 Detección por PDF metadata', 'info');
            return true;
        }
        
        // 5. Detección universal para perfiles de alta calidad
        if (this.profile === 'ultra_quality' || this.profile === 'balanced') {
            DebugLogger.log('📖 Detección por perfil de alta calidad', 'info');
            return true;
        }
        
        // 6. Detección por contenido (análisis de texto)
        if (this.template?.variables?.bookTitle || this.template?.variables?.chapter) {
            DebugLogger.log('📖 Detección por variables de libro/capítulo', 'info');
            return true;
        }
        
        return false;
    }
    
    shouldEnableQuality() {
        return this.features.quality && !this.features.chainBypassQuality;
    }
    
    getProcessingMode() {
        if (this.profile === 'fast') return 'fast';
        if (this.shouldUseChain()) return 'chain';
        return 'standard';
    }
}

// PipelineExecutionContext - Singleton que gestiona el contexto actual
class PipelineExecutionContext {
    constructor() {
        this.current = null;
    }

    create(template, profile, pipelineSteps) {
        this.current = new ExecutionContext(template, profile, pipelineSteps);
        DebugLogger.log('🎯 ExecutionContext creado', 'success');
        DebugLogger.log(`   Profile: ${profile}`, 'info');
        DebugLogger.log(`   Features: ${JSON.stringify(this.current.features)}`, 'info');
        return this.current;
    }

    get() {
        if (!this.current) {
            throw new Error('ExecutionContext no inicializado. Llama a PipelineExecutionContext.create() primero.');
        }
        return this.current;
    }

    reset() {
        this.current = null;
        DebugLogger.log('🔄 ExecutionContext reseteado', 'info');
    }

    // Métodos de compatibilidad con código existente
    getRuntime() {
        const ctx = this.get();
        return {
            generateConfig: {
                temperature: ctx.options.temperature,
                maxTokens: ctx.options.maxTokens,
                outputType: ctx.options.outputType,
                sourceLanguage: ctx.options.sourceLanguage,
                ankiFormat: ctx.options.ankiFormat
            },
            entityExtraction: null, // Se establece durante ejecución
            qualityConfig: {
                threshold: ctx.options.qualityThreshold,
                strict: ctx.options.strictQuality
            },
            difficultyConfig: {
                easyCount: 10,
                mediumCount: 10,
                hardCount: 10,
                estimationMethod: 'wordCount'
            },
            scoreConfig: {
                variants: 3,
                temperatures: [0.5, 0.7, 0.9],
                weightOverlap: 0.5,
                weightLength: 0.2,
                weightFormat: 0.3
            }
        };
    }
}

// Instancia global de PipelineExecutionContext
const PipelineExecutionContextInstance = new PipelineExecutionContext();

// Exportar
export { ExecutionContext, PipelineExecutionContext, PipelineExecutionContextInstance };
export default PipelineExecutionContextInstance;

// Exponer globalmente para compatibilidad
if (typeof window !== 'undefined') {
    window.ExecutionContext = ExecutionContext;
    window.PipelineExecutionContext = PipelineExecutionContext;
    window.PipelineExecutionContextInstance = PipelineExecutionContextInstance;
}

