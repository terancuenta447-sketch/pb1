/**
 * Modulo: DOM Cache
 * Categoria: ui
 * Responsabilidad: Cacheo centralizado de elementos DOM con validación y re-cacheo automático
 * Generado: 2025-11-28 16:03:00
 */

export const DomCache = {
    // Cache por categorías
    inputs: {},
    buttons: {},
    containers: {},
    selects: {},
    sliders: {},
    
    /**
     * Cachear elementos de una categoría específica
     * @param {string} category - Categoría (inputs, buttons, containers, selects, sliders)
     * @param {Object} selectors - Objeto con {nombre: 'id-del-elemento'}
     */
    cacheCategory(category, selectors) {
        if (!this[category]) {
            console.error(`❌ Categoría inválida: ${category}`);
            return false;
        }
        
        let cached = 0;
        let missing = 0;
        
        for (const [name, id] of Object.entries(selectors)) {
            const element = document.getElementById(id);
            if (element) {
                this[category][name] = element;
                cached++;
            } else {
                console.warn(`⚠️ Elemento no encontrado: ${id} (${category}.${name})`);
                missing++;
            }
        }
        
        console.log(`📋 ${category}: ${cached} cacheados, ${missing} faltantes`);
        return missing === 0;
    },
    
    /**
     * Obtener elemento del cache o del DOM
     * @param {string} id - ID del elemento
     * @param {string|null} category - Categoría opcional para búsqueda específica
     */
    get(id, category = null) {
        // Si se especifica categoría, buscar ahí primero
        if (category && this[category] && this[category][id]) {
            return this[category][id];
        }
        
        // Buscar en todas las categorías
        for (const cat of ['inputs', 'buttons', 'containers', 'selects', 'sliders']) {
            if (this[cat][id]) {
                return this[cat][id];
            }
        }
        
        // Si no está en cache, buscar en DOM y cachear
        const element = document.getElementById(id);
        if (element && category && this[category]) {
            this[category][id] = element;
        }
        
        return element;
    },
    
    /**
     * Re-cachear todos los elementos
     */
    refresh() {
        console.log('🔄 Re-cacheando todos los elementos DOM...');
        
        // Re-cachear inputs (solo elementos que existen en Flashgen.html)
        this.cacheCategory('inputs', {
            inputText: 'inputText',
            manualContext: 'manualContext',
            chunkSize: 'chunkSize',
            chunkOverlap: 'chunkOverlap',
            minChunkSize: 'minChunkSize',
            semanticThreshold: 'semanticThreshold',
            apiEndpoint: 'apiEndpoint',
            apiKey: 'apiKey',
            modelName: 'modelName',
            autoDetectLanguage: 'autoDetectLanguage',
            templateName: 'templateName',
            systemPrompt: 'systemPrompt',
            userPrompt: 'userPrompt',
            varLanguage: 'varLanguage',
            varSubject: 'varSubject',
            varDifficulty: 'varDifficulty',
            varBookTitle: 'varBookTitle',
            varChapter: 'varChapter',
            varChapterSummary: 'varChapterSummary',
            varTargetLanguage: 'varTargetLanguage',
            showChainVisualization: 'showChainVisualization'
        });
        
        // Re-cachear buttons (solo elementos que existen en Flashgen.html)
        this.cacheCategory('buttons', {
            generateBtn: 'generateBtn',
            cancelGenerationBtn: 'cancelGenerationBtn',
            clearInputBtn: 'clearInputBtn',
            importTextBtn: 'importTextBtn',
            importPdfBtn: 'importPdfBtn',
            importWordListBtn: 'importWordListBtn',
            importJsonBtn: 'importJsonBtn',
            pasteFromClipboardBtn: 'pasteFromClipboardBtn',
            testApiBtn: 'testApiBtn',
            testSpacyBtn: 'testSpacyBtn',
            saveConfigBtn: 'saveConfigBtn',
            newTemplateBtn: 'newTemplateBtn',
            deleteTemplateBtn: 'deleteTemplateBtn',
            saveTemplateBtn: 'saveTemplateBtn',
            importTemplateBtn: 'importTemplateBtn',
            exportTemplateBtn: 'exportTemplateBtn',
            testTemplateBtn: 'testTemplateBtn',
            compareModesBtn: 'compareModesBtn',
            exportBtn: 'exportBtn',
            copyExportBtn: 'copyExportBtn',
            clearMemoryBtn: 'clearMemoryBtn'
        });
        
        // Re-cachear selects (solo elementos que existen en Flashgen.html)
        this.cacheCategory('selects', {
            chunkMethod: 'chunkMethod',
            outputTypeSelect: 'outputTypeSelect',
            targetLanguageSelect: 'targetLanguageSelect',
            apiProfile: 'apiProfile',
            templateSelect: 'templateSelect',
            exportFormat: 'exportFormat'
        });
        
        // Re-cachear containers (solo elementos que existen en Flashgen.html)
        this.cacheCategory('containers', {
            progressFill: 'progressFill',
            importStatus: 'importStatus',
            importStatusText: 'importStatusText',
            methodHelpContent: 'methodHelpContent',
            methodHelpText: 'methodHelpText',
            manualContextGroup: 'manualContextGroup',
            chunkSizeGroup: 'chunkSizeGroup',
            overlapGroup: 'overlapGroup',
            minChunkSizeGroup: 'minChunkSizeGroup',
            semanticOptions: 'semanticOptions',
            chunkPreview: 'chunkPreview',
            agentToolsGrid: 'agentTools',
            agentToolLog: 'agentToolLog',
            inputStats: 'inputStats',
            charCount: 'charCount',
            wordCount: 'wordCount',
            lineCount: 'lineCount',
            estimatedChunks: 'estimatedChunks',
            // ✅ FIX: Agregar elementos de estadísticas de segmentación
            totalChunksValue: 'totalChunksValue',
            avgCharsValue: 'avgCharsValue',
            avgWordsValue: 'avgWordsValue',
            rangeValue: 'rangeValue',
            memoryPanel: 'memoryPanel',
            agentPanel: 'agentPanel',
            debugConsole: 'debugConsole'
        });
        
        // Re-cachear sliders (solo elementos que existen en Flashgen.html)
        this.cacheCategory('sliders', {
            batchSize: 'batchSizeSlider',
            batchSizeValue: 'batchSizeValue',
            batchDelaySlider: 'batchDelaySlider',
            batchDelayValue: 'batchDelayValue'
        });
        
        console.log('✅ Re-cacheo completo');
    },
    
    /**
     * Validar que elementos críticos existen
     */
    validate() {
        const critical = [
            'generateBtn',
            'inputText',
            'chunkMethod',
            'templateSelect'
        ];
        
        const missing = [];
        for (const id of critical) {
            if (!this.get(id)) {
                missing.push(id);
            }
        }
        
        if (missing.length > 0) {
            console.error(`❌ Elementos críticos faltantes: ${missing.join(', ')}`);
            return false;
        }
        
        console.log('✅ Todos los elementos críticos están presentes');
        return true;
    }
};
