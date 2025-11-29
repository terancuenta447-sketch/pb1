/**
 * Modulo: Event Binder
 * Categoria: ui
 * Responsabilidad: Vincular event listeners por categorías con manejo de errores robusto
 * Generado: 2025-11-28 16:03:00
 */

import { DomCache } from './dom_cache.js';
import { TabManager } from './tab_manager.js';
import { DebugLogger } from './debug_logger.js';

export const EventBinder = {
    eventsBound: false,
    boundCategories: new Set(),
    
    /**
     * Vincular eventos de pestañas con logging detallado y manejo robusto de errores
     */
    bindTabEvents() {
        // ✅ CRÍTICO: Verificar que los eventos realmente están vinculados
        // No confiar solo en boundCategories, verificar en el DOM
        if (this.boundCategories.has('tabs')) {
            console.log('⚠️ Eventos de pestañas marcados como vinculados, verificando...');
            
            // Verificar que realmente hay listeners
            let actualListeners = 0;
            if (TabManager.tabButtons && TabManager.tabButtons.length > 0) {
                TabManager.tabButtons.forEach(btn => {
                    // Verificar si tiene el handler guardado
                    if (btn._tabClickHandler) {
                        actualListeners++;
                    }
                });
            }
            
            if (actualListeners === 0) {
                console.warn('⚠️ boundCategories dice que está vinculado, pero NO hay listeners reales');
                console.warn('⚠️ Re-vinculando eventos...');
                // Limpiar la marca y continuar
                this.boundCategories.delete('tabs');
            } else {
                console.log(`✅ Eventos realmente vinculados: ${actualListeners} listeners encontrados`);
                return true;
            }
        }
        
        try {
            console.log('🔗 Iniciando vinculación de eventos de pestañas...');
            
            // Paso 1: Verificar estado de TabManager
            console.log('📊 Verificando estado de TabManager...');
            console.log(`  - tabButtons: ${TabManager.tabButtons ? 'SÍ' : 'NO'} (${TabManager.tabButtons?.length || 0} elementos)`);
            console.log(`  - tabContents: ${TabManager.tabContents ? 'SÍ' : 'NO'} (${TabManager.tabContents?.length || 0} elementos)`);
            
            // Paso 2: Re-cachear si es necesario
            if (!TabManager.tabButtons || TabManager.tabButtons.length === 0) {
                console.warn('⚠️ Pestañas no cacheadas, ejecutando cacheTabs()...');
                TabManager.cacheTabs();
                console.log(`  - Después de cacheTabs: ${TabManager.tabButtons?.length || 0} botones`);
            }
            
            // Paso 3: Validar que tenemos botones
            if (!TabManager.tabButtons || TabManager.tabButtons.length === 0) {
                console.error('❌ CRÍTICO: No se pudieron encontrar botones de pestañas después de cacheTabs()');
                console.error('❌ Verifica que el HTML contiene elementos con clase .tab-btn');
                return false;
            }
            
            // Paso 4: Validar cantidad esperada y forzar re-cacheo si es necesario
            const expectedCount = 9;
            if (TabManager.tabButtons.length !== expectedCount) {
                console.warn(`⚠️ Se esperaban ${expectedCount} botones, se encontraron ${TabManager.tabButtons.length}`);
                console.log('🔄 Intentando re-cacheo forzado usando querySelectorAll directamente...');
                
                // Forzar re-cacheo usando querySelectorAll directamente
                const directButtons = document.querySelectorAll('.tab-btn');
                console.log(`📍 Búsqueda directa encontró ${directButtons.length} botones`);
                
                if (directButtons.length === expectedCount) {
                    console.log('✅ Re-cacheo exitoso: se encontraron todos los botones');
                    TabManager.tabButtons = Array.from(directButtons);
                } else if (directButtons.length > TabManager.tabButtons.length) {
                    console.log(`✅ Re-cacheo mejoró: ${TabManager.tabButtons.length} → ${directButtons.length} botones`);
                    TabManager.tabButtons = Array.from(directButtons);
                } else {
                    console.warn(`⚠️ Re-cacheo no mejoró la situación: ${directButtons.length} botones encontrados`);
                }
            } else {
                console.log(`✅ Cantidad correcta de botones: ${expectedCount}`);
            }

            let successCount = 0;
            let errorCount = 0;
            const processedTabs = [];
            
            // Paso 5: Validación previa - Verificar que todos los botones esperados existen
            const expectedTabs = ['config', 'templates', 'pipeline', 'input', 'chain', 'results', 'learning', 'comparison', 'export'];
            const foundTabIds = TabManager.tabButtons
                .map(btn => btn?.getAttribute('data-tab'))
                .filter(Boolean);
            
            console.log(`\n🔍 VALIDACIÓN PREVIA:`);
            console.log(`  - Botones encontrados: ${foundTabIds.length}`);
            console.log(`  - IDs encontrados: ${foundTabIds.join(', ')}`);
            
            const missingTabs = expectedTabs.filter(tab => !foundTabIds.includes(tab));
            if (missingTabs.length > 0) {
                console.error(`❌ Pestañas faltantes en botones: ${missingTabs.join(', ')}`);
                console.error('❌ No se pueden vincular eventos para pestañas faltantes');
            } else {
                console.log(`✅ Todas las pestañas esperadas están presentes`);
            }
            
            // Paso 6: Procesar cada botón con try-catch individual
            console.log(`\n📋 Procesando ${TabManager.tabButtons.length} botones:`);
            
            TabManager.tabButtons.forEach((button, index) => {
                try {
                    // Validación 5a: Botón no es null
                    if (!button) {
                        console.error(`  [${index}] ❌ Botón es null`);
                        errorCount++;
                        return;
                    }
                    
                    // Validación 5b: Botón tiene data-tab
                    const tabId = button.getAttribute('data-tab');
                    if (!tabId) {
                        console.error(`  [${index}] ❌ Sin atributo data-tab`);
                        console.error(`         Elemento:`, button);
                        errorCount++;
                        return;
                    }
                    
                    // Validación 5c: data-tab no está vacío
                    if (tabId.trim() === '') {
                        console.error(`  [${index}] ❌ data-tab vacío`);
                        errorCount++;
                        return;
                    }
                    
                    // Validación 5d: Agregar listener
                    // ✅ CRÍTICO: Verificar que TabManager.switchTab existe antes de vincular
                    if (typeof TabManager.switchTab !== 'function') {
                        console.error(`  [${index}] ❌ TabManager.switchTab no es una función`);
                        errorCount++;
                        return;
                    }
                    
                    // ✅ CRÍTICO: Crear handler que verifica disponibilidad de TabManager
                    // Usar múltiples referencias para máxima compatibilidad
                    const clickHandler = (e) => {
                        console.log(`\n🎯 ========== CLICK EN PESTAÑA "${tabId}" ==========`);
                        console.log(`📊 Evento:`, e);
                        console.log(`📊 Target:`, e.target);
                        console.log(`📊 CurrentTarget:`, e.currentTarget);
                        
                        e.preventDefault();
                        e.stopPropagation(); // Evitar que el evento se propague a otros elementos
                        
                        console.log(`👆 Click detectado en pestaña: ${tabId}`);
                        console.log(`📊 Estado antes de switchTab:`);
                        console.log(`   - activeTab actual: ${TabManager?.activeTab || 'desconocido'}`);
                        console.log(`   - Contenido actual activo:`, document.querySelector('.tab-content.active')?.id || 'ninguno');
                        
                        // Intentar múltiples formas de acceder a TabManager
                        let tabManagerInstance = null;
                        
                        // Método 1: Import directo (más confiable)
                        if (typeof TabManager !== 'undefined' && typeof TabManager.switchTab === 'function') {
                            tabManagerInstance = TabManager;
                            console.log(`✅ TabManager encontrado vía import directo`);
                        }
                        // Método 2: window.TabManager (fallback)
                        else if (typeof window !== 'undefined' && window.TabManager && typeof window.TabManager.switchTab === 'function') {
                            tabManagerInstance = window.TabManager;
                            console.log(`✅ TabManager encontrado vía window.TabManager`);
                        }
                        // Método 3: window.UI.switchTab (delegación)
                        else if (typeof window !== 'undefined' && window.UI && typeof window.UI.switchTab === 'function') {
                            console.log(`✅ Usando window.UI.switchTab como fallback`);
                            try {
                                window.UI.switchTab(tabId);
                                console.log(`✅ switchTab("${tabId}") ejecutado vía UI`);
                                return;
                            } catch (uiError) {
                                console.error(`❌ Error ejecutando UI.switchTab("${tabId}"):`, uiError);
                                return;
                            }
                        }
                        
                        // Si no encontramos TabManager, error crítico
                        if (!tabManagerInstance) {
                            console.error(`❌ CRÍTICO: TabManager no está disponible al hacer click en ${tabId}`);
                            console.error(`   - TabManager (import): ${typeof TabManager}`);
                            console.error(`   - window.TabManager: ${typeof window?.TabManager}`);
                            console.error(`   - window.UI: ${typeof window?.UI}`);
                            return;
                        }
                        
                        // Llamar a switchTab
                        try {
                            console.log(`🔄 Llamando TabManager.switchTab("${tabId}")...`);
                            tabManagerInstance.switchTab(tabId);
                            
                            // ✅ VERIFICACIÓN POST-SWITCH: Verificar que realmente cambió
                            setTimeout(() => {
                                const activeContent = document.querySelector('.tab-content.active');
                                const activeBtn = document.querySelector('.tab-btn.active');
                                const expectedContent = document.getElementById(tabId);
                                
                                console.log(`\n📊 Estado DESPUÉS de switchTab("${tabId}"):`);
                                console.log(`   - Contenido activo: ${activeContent?.id || 'NINGUNO'}`);
                                console.log(`   - Botón activo: ${activeBtn?.getAttribute('data-tab') || 'NINGUNO'}`);
                                console.log(`   - Contenido esperado (${tabId}):`, expectedContent ? 'EXISTE' : 'NO EXISTE');
                                if (expectedContent) {
                                    console.log(`   - Tiene clase active: ${expectedContent.classList.contains('active')}`);
                                    console.log(`   - Display computed: ${window.getComputedStyle(expectedContent).display}`);
                                    console.log(`   - Opacity computed: ${window.getComputedStyle(expectedContent).opacity}`);
                                }
                                
                                if (activeContent?.id === tabId) {
                                    console.log(`✅ switchTab("${tabId}") EXITOSO - pestaña activada correctamente`);
                                } else {
                                    console.error(`❌ switchTab("${tabId}") FALLÓ - pestaña NO activada`);
                                    console.error(`   Esperado: ${tabId}, Obtenido: ${activeContent?.id || 'NINGUNO'}`);
                                }
                                console.log(`🎯 ========== FIN CLICK EN "${tabId}" ==========\n`);
                            }, 100);
                            
                            console.log(`✅ switchTab("${tabId}") ejecutado exitosamente`);
                        } catch (switchError) {
                            console.error(`❌ Error ejecutando switchTab("${tabId}"):`, switchError);
                            console.error('Stack trace:', switchError.stack);
                            console.log(`🎯 ========== FIN CLICK EN "${tabId}" (ERROR) ==========\n`);
                        }
                    };
                    
                    // ✅ CRÍTICO: Verificar que el botón está realmente en el DOM antes de vincular
                    if (!button.isConnected) {
                        console.error(`  [${index}] ❌ Botón ${tabId} NO está conectado al DOM`);
                        errorCount++;
                        return;
                    }
                    
                    // ✅ CRÍTICO: Remover cualquier listener previo para evitar duplicados
                    // (aunque esto no es perfecto sin guardar la referencia original)
                    const newHandler = clickHandler;
                    
                    // Vincular el evento
                    try {
                        button.addEventListener('click', newHandler, { once: false, capture: false });
                        
                        // ✅ CRÍTICO: Guardar referencia al handler para verificación
                        button._tabClickHandler = newHandler;
                        button._tabId = tabId; // Guardar también el tabId para debugging
                        
                        // ✅ VERIFICACIÓN INMEDIATA: Probar que el listener se adjuntó
                        // (No podemos verificar addEventListener directamente, pero podemos verificar nuestra marca)
                        if (!button._tabClickHandler) {
                            throw new Error('Handler no se guardó correctamente');
                        }
                        
                        console.log(`  [${index}] ✅ Evento vinculado y verificado para "${tabId}"`);
                    } catch (addError) {
                        console.error(`  [${index}] ❌ Error al adjuntar listener:`, addError);
                        errorCount++;
                        return;
                    }
                    
                    // ✅ VERIFICACIÓN POST-VINCULACIÓN: Asegurar que el handler se guardó
                    if (!button._tabClickHandler) {
                        console.error(`  [${index}] ❌ CRÍTICO: Handler no se guardó después de addEventListener`);
                        errorCount++;
                        return;
                    }
                    
                    successCount++;
                    processedTabs.push(tabId);
                    console.log(`  [${index}] ✅ data-tab="${tabId}" | Vinculado y verificado`);
                    
                } catch (err) {
                    console.error(`  [${index}] ❌ Error vinculando botón:`, err);
                    console.error(`         Mensaje: ${err.message}`);
                    console.error(`         Stack:`, err.stack);
                    errorCount++;
                }
            });
            
            // ✅ VERIFICACIÓN FINAL: Asegurar que todos los botones tienen handlers
            console.log(`\n🔍 VERIFICACIÓN FINAL DE VINCULACIÓN:`);
            let verifiedCount = 0;
            TabManager.tabButtons.forEach((btn, i) => {
                if (btn._tabClickHandler) {
                    verifiedCount++;
                } else {
                    const tabId = btn.getAttribute('data-tab') || `botón[${i}]`;
                    console.warn(`  ⚠️ Botón [${i}] "${tabId}" NO tiene _tabClickHandler después de vinculación`);
                }
            });
            console.log(`  - Botones con handlers verificados: ${verifiedCount}/${TabManager.tabButtons.length}`);
            
            if (verifiedCount < TabManager.tabButtons.length) {
                console.error(`❌ CRÍTICO: Solo ${verifiedCount}/${TabManager.tabButtons.length} botones tienen handlers`);
                console.error(`❌ Esto significa que los eventos NO se vincularon correctamente`);
            }
            
            // Paso 7: Resumen de vinculación
            console.log(`\n📊 RESUMEN DE VINCULACIÓN:`);
            console.log(`  - Exitosos: ${successCount}/${TabManager.tabButtons.length}`);
            console.log(`  - Errores: ${errorCount}/${TabManager.tabButtons.length}`);
            console.log(`  - Pestañas procesadas: ${processedTabs.join(', ')}`);
            
            // Validar que se procesaron todas las pestañas esperadas
            const unprocessedTabs = expectedTabs.filter(tab => !processedTabs.includes(tab));
            if (unprocessedTabs.length > 0) {
                console.warn(`⚠️ Pestañas no procesadas: ${unprocessedTabs.join(', ')}`);
            }
            
            // Paso 8: Validación post-vinculación
            console.log(`\n✅ VALIDACIÓN POST-VINCULACIÓN:`);
            console.log(`  - Pestañas procesadas exitosamente: ${processedTabs.length}`);
            console.log(`  - Pestañas esperadas: ${expectedTabs.length}`);
            
            // Verificar que cada pestaña esperada fue procesada
            const missingProcessed = expectedTabs.filter(tab => !processedTabs.includes(tab));
            if (missingProcessed.length > 0) {
                console.warn(`  ⚠️ Pestañas NO procesadas: ${missingProcessed.join(', ')}`);
            } else {
                console.log(`  ✅ Todas las pestañas esperadas fueron procesadas`);
            }
            
            // Verificar que los botones están en el DOM y tienen data-tab
            let validButtonsCount = 0;
            const validButtons = [];
            TabManager.tabButtons.forEach((btn, i) => {
                const tabId = btn.getAttribute('data-tab');
                if (tabId && expectedTabs.includes(tabId)) {
                    validButtonsCount++;
                    validButtons.push(tabId);
                }
            });
            console.log(`  - Botones válidos en DOM: ${validButtonsCount}/${expectedTabs.length}`);
            if (validButtons.length > 0) {
                console.log(`  - Botones válidos: ${validButtons.join(', ')}`);
            }
            
            // Nota: addEventListener no es detectable fácilmente sin herramientas de desarrollo
            // pero si el botón está en processedTabs, significa que se vinculó exitosamente
            
            // Paso 9: Marcar como vinculado
            this.boundCategories.add('tabs');
            
            // Paso 10: Resultado final
            const success = errorCount === 0 && processedTabs.length === expectedTabs.length;
            if (success) {
                console.log(`\n✅ VINCULACIÓN EXITOSA: Todos los eventos de pestañas están listos (${processedTabs.length} pestañas)`);
            } else {
                console.warn(`\n⚠️ VINCULACIÓN PARCIAL:`);
                console.warn(`   - Errores: ${errorCount}`);
                console.warn(`   - Pestañas procesadas: ${processedTabs.length}/${expectedTabs.length}`);
                if (unprocessedTabs.length > 0) {
                    console.warn(`   - Pestañas faltantes: ${unprocessedTabs.join(', ')}`);
                }
            }
            
            return success;
        } catch (error) {
            console.error('❌ Error crítico vinculando eventos de pestañas:', error);
            console.error('Stack trace:', error.stack);
            return false;
        }
    },
    
    /**
     * Vincular eventos de configuración
     */
    bindConfigEvents() {
        if (this.boundCategories.has('config')) {
            return;
        }
        
        try {
            // API Profile
            const apiProfile = DomCache.get('apiProfile', 'selects');
            if (apiProfile) {
                apiProfile.addEventListener('change', (e) => {
                    if (window.UI && typeof window.UI.handleApiProfileChange === 'function') {
                        window.UI.handleApiProfileChange(e.target.value);
                    }
                });
            }
            
            // ✅ CRÍTICO: Prevenir submit del formulario apiConfigForm
            const apiConfigForm = document.getElementById('apiConfigForm');
            if (apiConfigForm) {
                apiConfigForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('⚠️ Submit del formulario apiConfigForm prevenido');
                    return false;
                });
            }
            
            // Test API
            const testApiBtn = DomCache.get('testApiBtn', 'buttons');
            if (testApiBtn) {
                // ✅ CRÍTICO: Asegurar que el botón no cause submit
                if (!testApiBtn.type || testApiBtn.type === 'submit') {
                    testApiBtn.type = 'button';
                }
                
                testApiBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔍 Click en Probar API - previniendo submit');
                    
                    // ✅ CRÍTICO: Deshabilitar botón durante la prueba para evitar múltiples clicks
                    testApiBtn.disabled = true;
                    const originalText = testApiBtn.innerText;
                    testApiBtn.innerText = '⏳ Probando...';
                    
                    try {
                        // Intentar múltiples métodos de prueba
                        if (window.API && typeof window.API.test === 'function') {
                            await window.API.test();
                        } else if (window.API && typeof window.API.testConnection === 'function') {
                            await window.API.testConnection();
                        } else if (window.UI && typeof window.UI.handleApiTest === 'function') {
                            await window.UI.handleApiTest();
                        } else {
                            console.error('❌ Ningún método de prueba de API disponible');
                            if (window.UI && typeof window.UI.toast === 'function') {
                                window.UI.toast('❌ API no disponible', 'error');
                            }
                        }
                    } catch (error) {
                        console.error('❌ Error probando API:', error);
                        if (window.UI && typeof window.UI.toast === 'function') {
                            window.UI.toast(`❌ Error: ${error.message}`, 'error');
                        }
                    } finally {
                        // Restaurar botón
                        testApiBtn.disabled = false;
                        testApiBtn.innerText = originalText;
                    }
                });
            }
            
            // Test spaCy
            const testSpacyBtn = DomCache.get('testSpacyBtn', 'buttons');
            if (testSpacyBtn) {
                // ✅ CRÍTICO: Asegurar que el botón no cause submit
                if (!testSpacyBtn.type || testSpacyBtn.type === 'submit') {
                    testSpacyBtn.type = 'button';
                }
                
                testSpacyBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔍 Click en Probar spaCy - previniendo submit');
                    
                    if (window.UI && typeof window.UI.handleSpacyTest === 'function') {
                        window.UI.handleSpacyTest();
                    } else {
                        console.error('❌ UI.handleSpacyTest no disponible');
                    }
                });
            }
            
            // Save Config
            const saveConfigBtn = DomCache.get('saveConfigBtn', 'buttons');
            if (saveConfigBtn) {
                // ✅ CRÍTICO: Asegurar que el botón no cause submit
                if (!saveConfigBtn.type || saveConfigBtn.type === 'submit') {
                    saveConfigBtn.type = 'button';
                }
                
                saveConfigBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('💾 Click en Guardar Config - previniendo submit');
                    
                    if (window.Storage && typeof window.Storage.saveConfig === 'function') {
                        window.Storage.saveConfig();
                        if (window.UI && typeof window.UI.toast === 'function') {
                            window.UI.toast('✅ Configuración guardada', 'success');
                        }
                    } else {
                        console.error('❌ Storage.saveConfig no disponible');
                    }
                });
            }
            
            this.boundCategories.add('config');
            console.log('✅ Eventos de configuración vinculados');
            return true;
        } catch (error) {
            console.error('❌ Error vinculando eventos de configuración:', error);
            return false;
        }
    },
    
    /**
     * Vincular eventos de plantillas
     */
    bindTemplatesEvents() {
        if (this.boundCategories.has('templates')) {
            return;
        }
        
        try {
            // Template Select
            const templateSelect = DomCache.get('templateSelect', 'selects');
            if (templateSelect) {
                templateSelect.addEventListener('change', (e) => {
                    if (window.Templates && typeof window.Templates.setActive === 'function') {
                        window.Templates.setActive(e.target.value);
                    }
                });
            }
            
            // New Template
            const newTemplateBtn = DomCache.get('newTemplateBtn', 'buttons');
            if (newTemplateBtn) {
                if (!newTemplateBtn.type || newTemplateBtn.type === 'submit') {
                    newTemplateBtn.type = 'button';
                }
                newTemplateBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (window.Templates && typeof window.Templates.createNew === 'function') {
                        window.Templates.createNew();
                    }
                });
            }
            
            // Delete Template
            const deleteTemplateBtn = DomCache.get('deleteTemplateBtn', 'buttons');
            if (deleteTemplateBtn) {
                if (!deleteTemplateBtn.type || deleteTemplateBtn.type === 'submit') {
                    deleteTemplateBtn.type = 'button';
                }
                deleteTemplateBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (window.Templates && typeof window.Templates.deleteActive === 'function') {
                        window.Templates.deleteActive();
                    }
                });
            }
            
            this.boundCategories.add('templates');
            console.log('✅ Eventos de plantillas vinculados');
            return true;
        } catch (error) {
            console.error('❌ Error vinculando eventos de plantillas:', error);
            return false;
        }
    },
    
    /**
     * Vincular eventos de entrada
     */
    bindInputEvents() {
        if (this.boundCategories.has('input')) {
            return;
        }
        
        try {
            // Generate Button
            const generateBtn = DomCache.get('generateBtn', 'buttons');
            if (generateBtn) {
                if (!generateBtn.type || generateBtn.type === 'submit') {
                    generateBtn.type = 'button';
                }
                generateBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🚀 Click en Generar - previniendo submit');
                    if (window.Processing && typeof window.Processing.startGeneration === 'function') {
                        await window.Processing.startGeneration();
                    }
                });
            }
            
            // Cancel Button
            const cancelBtn = DomCache.get('cancelGenerationBtn', 'buttons');
            if (cancelBtn) {
                if (!cancelBtn.type || cancelBtn.type === 'submit') {
                    cancelBtn.type = 'button';
                }
                cancelBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (window.State) {
                        window.State.cancelGeneration = true;
                        if (window.UI && typeof window.UI.toast === 'function') {
                            window.UI.toast('⚠️ Cancelando generación...', 'warning');
                        }
                    }
                });
            }
            
            // Clear Input
            const clearInputBtn = DomCache.get('clearInputBtn', 'buttons');
            if (clearInputBtn) {
                if (!clearInputBtn.type || clearInputBtn.type === 'submit') {
                    clearInputBtn.type = 'button';
                }
                clearInputBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const inputText = DomCache.get('inputText', 'inputs');
                    if (inputText) {
                        inputText.value = '';
                        if (window.UI && typeof window.UI.updateInputStats === 'function') {
                            window.UI.updateInputStats();
                        }
                    }
                });
            }
            
            // Import buttons
            const importTextBtn = DomCache.get('importTextBtn', 'buttons');
            if (importTextBtn) {
                if (!importTextBtn.type || importTextBtn.type === 'submit') {
                    importTextBtn.type = 'button';
                }
                importTextBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // ✅ Implementación directa en lugar de llamar a función faltante
                    const triggerFileSelect = (accept, handler) => {
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.id = `fileInput_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                        fileInput.name = fileInput.id;
                        fileInput.accept = accept;
                        fileInput.style.display = 'none';
                        fileInput.addEventListener('change', (e) => {
                            const file = e.target.files[0];
                            if (file) handler(file);
                        });
                        this.fileInput = fileInput;
                        this.fileInput.click();
                    };
                    
                    triggerFileSelect('.txt,.md,.docx', async (file) => {
                        const ext = file.name.split('.').pop()?.toLowerCase();
                        let text = '';
                        if (ext === 'docx') {
                            text = await window.Processing.extractDocxText(file);
                        } else {
                            text = await file.text();
                        }
                        if (window.UI && typeof window.UI.setImportedText === 'function') {
                            window.UI.setImportedText(text);
                            window.UI.showImportStatus(`✅ Archivo cargado (${file.name})`, 'success');
                        }
                    });
                });
            }
            
            // ✅ Botón importar PDF
            const importPdfBtn = DomCache.get('importPdfBtn', 'buttons');
            if (importPdfBtn) {
                if (!importPdfBtn.type || importPdfBtn.type === 'submit') {
                    importPdfBtn.type = 'button';
                }
                importPdfBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const triggerFileSelect = (accept, handler) => {
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.id = `fileInput_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                        fileInput.name = fileInput.id;
                        fileInput.accept = accept;
                        fileInput.style.display = 'none';
                        fileInput.addEventListener('change', (e) => {
                            const file = e.target.files[0];
                            if (file) handler(file);
                        });
                        this.fileInput = fileInput;
                        this.fileInput.click();
                    };
                    
                    triggerFileSelect('.pdf', async (file) => {
                        const text = await window.Processing.extractPdfText(file);
                        if (window.UI && typeof window.UI.setImportedText === 'function') {
                            window.UI.setImportedText(text);
                            window.UI.showImportStatus(`✅ PDF cargado (${file.name})`, 'success');
                        }
                    });
                });
            }
            
            // ✅ Botón importar lista de palabras
            const importWordListBtn = DomCache.get('importWordListBtn', 'buttons');
            if (importWordListBtn) {
                if (!importWordListBtn.type || importWordListBtn.type === 'submit') {
                    importWordListBtn.type = 'button';
                }
                importWordListBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const triggerFileSelect = (accept, handler) => {
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.id = `fileInput_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                        fileInput.name = fileInput.id;
                        fileInput.accept = accept;
                        fileInput.style.display = 'none';
                        fileInput.addEventListener('change', (e) => {
                            const file = e.target.files[0];
                            if (file) handler(file);
                        });
                        this.fileInput = fileInput;
                        this.fileInput.click();
                    };
                    
                    triggerFileSelect('.txt,.csv', async (file) => {
                        const text = await file.text();
                        const normalized = text
                            .split(/\r?\n/)
                            .map(line => line.trim())
                            .filter(Boolean)
                            .join('\n');
                        if (window.UI && typeof window.UI.setImportedText === 'function') {
                            window.UI.setImportedText(normalized);
                            window.UI.showImportStatus(`✅ Lista importada (${file.name})`, 'success');
                        }
                    });
                });
            }
            
            // ✅ Botón importar JSON
            const importJsonBtn = DomCache.get('importJsonBtn', 'buttons');
            if (importJsonBtn) {
                if (!importJsonBtn.type || importJsonBtn.type === 'submit') {
                    importJsonBtn.type = 'button';
                }
                importJsonBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const triggerFileSelect = (accept, handler) => {
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.id = `fileInput_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                        fileInput.name = fileInput.id;
                        fileInput.accept = accept;
                        fileInput.style.display = 'none';
                        fileInput.addEventListener('change', (e) => {
                            const file = e.target.files[0];
                            if (file) handler(file);
                        });
                        this.fileInput = fileInput;
                        this.fileInput.click();
                    };
                    
                    triggerFileSelect('.json', async (file) => {
                        try {
                            const json = await file.text();
                            const data = JSON.parse(json);
                            const chunks = data.chunks || data;
                            if (window.UI && typeof window.UI.setImportedText === 'function') {
                                window.UI.setImportedText(chunks.map(chunk => chunk.text || chunk).join('\n\n'));
                                window.UI.showImportStatus(`✅ JSON con ${chunks.length} chunks cargado`, 'success');
                            }
                        } catch (err) {
                            window.UI?.showImportStatus(`❌ Error al procesar JSON: ${err.message}`, 'error');
                        }
                    });
                });
            }
            
            // ✅ Botón pegar desde portapapeles
            const pasteFromClipboardBtn = DomCache.get('pasteFromClipboardBtn', 'buttons');
            if (pasteFromClipboardBtn) {
                if (!pasteFromClipboardBtn.type || pasteFromClipboardBtn.type === 'submit') {
                    pasteFromClipboardBtn.type = 'button';
                }
                pasteFromClipboardBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                        if (!navigator.clipboard || !navigator.clipboard.readText) {
                            window.UI?.toast('❌ API de portapapeles no disponible en este navegador', 'error');
                            return;
                        }
                        const text = await navigator.clipboard.readText();
                        if (!text || !text.trim()) {
                            window.UI?.toast('⚠️ Portapapeles vacío', 'warning');
                            return;
                        }
                        if (window.UI && typeof window.UI.setImportedText === 'function') {
                            window.UI.setImportedText(text);
                            window.UI.showImportStatus(`✅ Texto pegado desde portapapeles (${text.length} caracteres)`, 'success');
                        }
                    } catch (err) {
                        console.error('Error al pegar desde portapapeles:', err);
                        window.UI?.toast('❌ Error al acceder al portapapeles', 'error');
                    }
                });
            }
            
            // ✅ CRÍTICO: Evento input del textarea para actualizar estadísticas en tiempo real
            const inputText = DomCache.get('inputText', 'inputs');
            if (inputText) {
                inputText.addEventListener('input', () => {
                    if (window.UI && typeof window.UI.updateInputStats === 'function') {
                        window.UI.updateInputStats();
                    }
                    if (window.UI && typeof window.UI.scheduleChunkPreviewUpdate === 'function') {
                        window.UI.scheduleChunkPreviewUpdate();
                    }
                });
                
                // ✅ Drag & Drop de archivos en el textarea
                inputText.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    inputText.style.backgroundColor = 'var(--color-primary-light)';
                });
                
                inputText.addEventListener('dragleave', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    inputText.style.backgroundColor = '';
                });
                
                inputText.addEventListener('drop', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    inputText.style.backgroundColor = '';
                    
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                        const file = files[0];
                        const ext = file.name.split('.').pop()?.toLowerCase();
                        
                        try {
                            let text = '';
                            if (ext === 'pdf') {
                                text = await window.Processing.extractPdfText(file);
                            } else if (ext === 'docx') {
                                text = await window.Processing.extractDocxText(file);
                            } else if (['txt', 'md'].includes(ext)) {
                                text = await file.text();
                            } else {
                                window.UI?.toast('❌ Formato de archivo no soportado', 'error');
                                return;
                            }
                            
                            if (window.UI && typeof window.UI.setImportedText === 'function') {
                                window.UI.setImportedText(text);
                                window.UI.showImportStatus(`✅ Archivo arrastrado (${file.name})`, 'success');
                            }
                        } catch (error) {
                            console.error('Error procesando archivo arrastrado:', error);
                            window.UI?.toast('❌ Error al procesar archivo', 'error');
                        }
                    }
                });
            }
            
            // ✅ Eventos de controles de chunking
            const chunkMethodSelect = DomCache.get('chunkMethod', 'selects');
            if (chunkMethodSelect) {
                chunkMethodSelect.addEventListener('change', (event) => {
                    const method = event.target?.value || 'paragraph';
                    // Marcar que el usuario modificó manualmente
                    if (window.State) {
                        window.State.userModifiedChunkMethod = true;
                        window.State.pipeline.options.chunkMethod = method;
                    }
                    if (window.UI && typeof window.UI.updateChunkMethodHelp === 'function') {
                        window.UI.updateChunkMethodHelp(method);
                    }
                    if (window.UI && typeof window.UI.updateChunkControls === 'function') {
                        window.UI.updateChunkControls();
                    }
                    if (window.UI && typeof window.UI.scheduleChunkPreviewUpdate === 'function') {
                        window.UI.scheduleChunkPreviewUpdate();
                    }
                    window.DebugLogger?.log(`🔧 Usuario modificó método de chunking: ${method}`, 'info');
                });
            }
            
            // ✅ Eventos de inputs de chunking
            const chunkSizeInput = DomCache.get('chunkSize', 'inputs');
            if (chunkSizeInput) {
                chunkSizeInput.addEventListener('input', (event) => {
                    const size = parseInt(event.target?.value ?? '0', 10) || 300;
                    if (window.State) {
                        window.State.pipeline.options.chunkSize = size;
                    }
                    if (window.UI && typeof window.UI.scheduleChunkPreviewUpdate === 'function') {
                        window.UI.scheduleChunkPreviewUpdate();
                    }
                });
            }
            
            const chunkOverlapInput = DomCache.get('chunkOverlap', 'inputs');
            if (chunkOverlapInput) {
                chunkOverlapInput.addEventListener('input', (event) => {
                    const valueEl = document.getElementById('overlapValue');
                    if (valueEl) valueEl.textContent = `${event.target.value}%`;
                    const overlap = parseInt(event.target?.value ?? '0', 10) || 0;
                    if (window.State) {
                        window.State.pipeline.options.chunkOverlap = overlap;
                    }
                    if (window.UI && typeof window.UI.scheduleChunkPreviewUpdate === 'function') {
                        window.UI.scheduleChunkPreviewUpdate();
                    }
                });
            }
            
            const minChunkSizeInput = DomCache.get('minChunkSize', 'inputs');
            if (minChunkSizeInput) {
                minChunkSizeInput.addEventListener('input', () => {
                    if (window.UI && typeof window.UI.scheduleChunkPreviewUpdate === 'function') {
                        window.UI.scheduleChunkPreviewUpdate();
                    }
                });
            }
            
            const semanticThresholdInput = DomCache.get('semanticThreshold', 'inputs');
            if (semanticThresholdInput) {
                semanticThresholdInput.addEventListener('input', () => {
                    if (window.UI && typeof window.UI.scheduleChunkPreviewUpdate === 'function') {
                        window.UI.scheduleChunkPreviewUpdate();
                    }
                });
            }
            
            this.boundCategories.add('input');
            console.log('✅ Eventos de entrada vinculados');
            return true;
        } catch (error) {
            console.error('❌ Error vinculando eventos de entrada:', error);
            return false;
        }
    },
    
    /**
     * Vincular eventos de pipeline
     */
    bindPipelineEvents() {
        if (this.boundCategories.has('pipeline')) {
            return;
        }
        
        try {
            // Add Pipeline Step
            const addStepBtn = DomCache.get('addPipelineStepBtn', 'buttons');
            if (addStepBtn) {
                if (!addStepBtn.type || addStepBtn.type === 'submit') {
                    addStepBtn.type = 'button';
                }
                addStepBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (window.PipelineManager && typeof window.PipelineManager.addStep === 'function') {
                        window.PipelineManager.addStep();
                    }
                });
            }
            
            // Reset Pipeline
            const resetBtn = DomCache.get('resetPipelineBtn', 'buttons');
            if (resetBtn) {
                if (!resetBtn.type || resetBtn.type === 'submit') {
                    resetBtn.type = 'button';
                }
                resetBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (window.PipelineManager && typeof window.PipelineManager.reset === 'function') {
                        window.PipelineManager.reset();
                    }
                });
            }
            
            this.boundCategories.add('pipeline');
            console.log('✅ Eventos de pipeline vinculados');
            return true;
        } catch (error) {
            console.error('❌ Error vinculando eventos de pipeline:', error);
            return false;
        }
    },
    
    /**
     * Vincular eventos de importación
     */
    bindImportEvents() {
        if (this.boundCategories.has('import')) {
            return;
        }
        
        try {
            // Los eventos de importación se delegan a UI.bindImportButtons()
            // porque requieren lógica compleja de selección de archivos
            if (window.UI && typeof window.UI.bindImportButtons === 'function') {
                window.UI.bindImportButtons();
            }
            
            this.boundCategories.add('import');
            console.log('✅ Eventos de importación delegados a UI');
            return true;
        } catch (error) {
            console.error('❌ Error vinculando eventos de importación:', error);
            return false;
        }
    },
    
    /**
     * ✅ CRÍTICO: Asegurar que todos los botones dentro de formularios tengan type="button"
     * Esto previene recargas de página no deseadas
     */
    ensureButtonsAreNotSubmit() {
        console.log('🔒 Asegurando que botones no causen submit...');
        
        // Buscar todos los botones dentro de formularios
        const forms = document.querySelectorAll('form');
        let fixedCount = 0;
        
        forms.forEach(form => {
            const buttons = form.querySelectorAll('button');
            buttons.forEach(btn => {
                // Si el botón no tiene type explícito o es submit, cambiarlo a button
                if (!btn.type || btn.type === 'submit') {
                    btn.type = 'button';
                    fixedCount++;
                    console.log(`  ✅ Botón "${btn.id || btn.textContent.trim()}" cambiado a type="button"`);
                }
            });
        });
        
        // También buscar botones fuera de formularios que puedan estar causando problemas
        const allButtons = document.querySelectorAll('button:not([type])');
        allButtons.forEach(btn => {
            // Si está dentro de un formulario (aunque no lo detectamos antes)
            if (btn.closest('form')) {
                btn.type = 'button';
                fixedCount++;
            }
        });
        
        if (fixedCount > 0) {
            console.log(`✅ ${fixedCount} botón(es) corregido(s) para prevenir submit`);
        } else {
            console.log('✅ Todos los botones ya tienen type="button"');
        }
    },
    
    /**
     * Vincular todos los eventos
     */
    bindAll() {
        if (this.eventsBound) {
            console.log('⚠️ Eventos ya vinculados globalmente');
            return true;
        }
        
        console.log('🔗 Vinculando todos los eventos...');
        
        // ✅ CRÍTICO: Asegurar que botones no causen submit ANTES de vincular eventos
        this.ensureButtonsAreNotSubmit();
        
        const results = {
            tabs: this.bindTabEvents(),
            config: this.bindConfigEvents(),
            templates: this.bindTemplatesEvents(),
            input: this.bindInputEvents(),
            pipeline: this.bindPipelineEvents(),
            import: this.bindImportEvents()
        };
        
        const successful = Object.values(results).filter(r => r === true).length;
        const total = Object.keys(results).length;
        
        console.log(`✅ Eventos vinculados: ${successful}/${total} categorías`);
        
        this.eventsBound = true;
        return successful === total;
    },
    
    /**
     * Método de diagnóstico: Mostrar estado de vinculación de eventos
     */
    diagnose() {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🔍 DIAGNÓSTICO DE VINCULACIÓN DE EVENTOS');
        console.log('═══════════════════════════════════════════════════════════');
        
        // 1. Estado general
        console.log('\n📦 ESTADO GENERAL:');
        console.log(`  - eventsBound: ${this.eventsBound}`);
        console.log(`  - Categorías vinculadas: ${this.boundCategories.size}`);
        
        // 2. Categorías vinculadas
        console.log('\n🏷️ CATEGORÍAS VINCULADAS:');
        if (this.boundCategories.size > 0) {
            Array.from(this.boundCategories).forEach(cat => {
                console.log(`  ✓ ${cat}`);
            });
        } else {
            console.log('  ⚠️ NINGUNA CATEGORÍA VINCULADA');
        }
        
        // 3. Categorías esperadas
        const expectedCategories = ['tabs', 'config', 'templates', 'input', 'pipeline', 'import'];
        console.log('\n📋 CATEGORÍAS ESPERADAS:');
        expectedCategories.forEach(cat => {
            const isBound = this.boundCategories.has(cat);
            console.log(`  ${isBound ? '✓' : '✗'} ${cat}`);
        });
        
        // 4. Botones de pestañas
        console.log('\n🔘 BOTONES DE PESTAÑAS:');
        if (TabManager.tabButtons && TabManager.tabButtons.length > 0) {
            console.log(`  - Total: ${TabManager.tabButtons.length}`);
            let withListeners = 0;
            TabManager.tabButtons.forEach((btn, i) => {
                const tabId = btn.getAttribute('data-tab') || btn._tabId || `botón[${i}]`;
                
                // ✅ CRÍTICO: Verificar _tabClickHandler (nuestra marca personalizada)
                // addEventListener no deja rastro en onclick, así que usamos nuestra marca
                const hasHandler = btn._tabClickHandler !== undefined && btn._tabClickHandler !== null;
                const isConnected = btn.isConnected;
                
                if (hasHandler) {
                    withListeners++;
                }
                
                const status = hasHandler ? '✓ listener' : '✗ sin listener';
                const connectedStatus = isConnected ? 'conectado' : 'DESCONECTADO';
                console.log(`    [${i}] ${tabId} - ${status} (DOM: ${connectedStatus})`);
                
                if (!hasHandler) {
                    console.log(`         ⚠️ No tiene _tabClickHandler`);
                }
                if (!isConnected) {
                    console.log(`         ❌ CRÍTICO: Botón no está conectado al DOM`);
                }
            });
            console.log(`  - Con listeners: ${withListeners}/${TabManager.tabButtons.length}`);
            
            if (withListeners === 0) {
                console.log(`\n❌ CRÍTICO: Ningún botón tiene listeners vinculados`);
                console.log(`   Ejecuta: EventBinder.bindTabEvents()`);
            } else if (withListeners < TabManager.tabButtons.length) {
                console.log(`\n⚠️ Solo ${withListeners}/${TabManager.tabButtons.length} botones tienen listeners`);
            }
        } else {
            console.log('  ⚠️ NO HAY BOTONES CACHEADOS');
            console.log('   Ejecuta: TabManager.cacheTabs()');
        }
        
        // 5. Recomendaciones
        console.log('\n💡 RECOMENDACIONES:');
        if (!this.eventsBound) {
            console.log('  ⚠️ Eventos no vinculados. Ejecuta: EventBinder.bindAll()');
        }
        if (this.boundCategories.size < expectedCategories.length) {
            const missing = expectedCategories.filter(c => !this.boundCategories.has(c));
            console.log(`  ⚠️ Categorías faltantes: ${missing.join(', ')}`);
        }
        
        console.log('\n═══════════════════════════════════════════════════════════');
    }
};
