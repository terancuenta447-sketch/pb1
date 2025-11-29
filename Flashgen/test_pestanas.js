/**
 * Script de Test para Pestañas de Flashgen
 * 
 * Instrucciones:
 * 1. Abre Flashgen.html en tu navegador
 * 2. Abre la consola (F12)
 * 3. Copia y pega este script completo
 * 4. Presiona Enter
 */

console.log('🧪 Iniciando Test de Pestañas Flashgen...\n');

// ========== TEST 1: Verificar módulos cargados ==========
console.log('📦 TEST 1: Verificar que módulos están en window');
const modulesToTest = ['UI', 'Results', 'Exporter', 'Learning', 'Comparison', 'ChainVisualization'];
const moduleResults = {};

modulesToTest.forEach(moduleName => {
    const exists = typeof window[moduleName] !== 'undefined';
    const hasInit = exists && typeof window[moduleName].init === 'function';
    moduleResults[moduleName] = { exists, hasInit };
    
    const status = exists && hasInit ? '✅' : '❌';
    console.log(`${status} window.${moduleName}:`, exists ? 'existe' : 'NO EXISTE', 
                hasInit ? '(con init)' : '');
});

const allModulesOK = Object.values(moduleResults).every(r => r.exists && r.hasInit);
console.log(allModulesOK ? '\n✅ Todos los módulos cargados correctamente\n' : '\n❌ Faltan módulos\n');

// ========== TEST 2: Verificar pestañas en DOM ==========
console.log('📋 TEST 2: Verificar pestañas en el DOM');
const tabs = ['config', 'templates', 'pipeline', 'input', 'chain', 'results', 'learning', 'comparison', 'export'];
const tabsInDOM = {};

tabs.forEach(tabId => {
    const button = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    const content = document.getElementById(tabId);
    tabsInDOM[tabId] = { button: !!button, content: !!content };
    
    const status = button && content ? '✅' : '❌';
    console.log(`${status} Pestaña "${tabId}":`, 
                button ? 'botón OK' : 'SIN BOTÓN', 
                content ? 'contenido OK' : 'SIN CONTENIDO');
});

const allTabsOK = Object.values(tabsInDOM).every(t => t.button && t.content);
console.log(allTabsOK ? '\n✅ Todas las pestañas existen en el DOM\n' : '\n❌ Faltan pestañas en DOM\n');

// ========== TEST 3: Probar switchTab ==========
console.log('🔄 TEST 3: Probar cambio de pestañas');
const testTabs = ['input', 'chain', 'results', 'learning', 'comparison', 'export'];
const switchResults = {};

testTabs.forEach(tabId => {
    try {
        if (window.UI && typeof window.UI.switchTab === 'function') {
            window.UI.switchTab(tabId);
            const isActive = document.getElementById(tabId)?.classList.contains('active');
            switchResults[tabId] = isActive;
            
            const status = isActive ? '✅' : '❌';
            console.log(`${status} switchTab("${tabId}"):`, isActive ? 'ACTIVA' : 'NO ACTIVA');
            
            // Pequeña pausa para que se vea el cambio
            if (isActive) {
                // Esperar un momento para que se ejecute el tabInitializer
                setTimeout(() => {}, 50);
            }
        } else {
            console.log(`❌ window.UI.switchTab no disponible`);
            switchResults[tabId] = false;
        }
    } catch (error) {
        console.log(`❌ Error en switchTab("${tabId}"):`, error.message);
        switchResults[tabId] = false;
    }
});

const allSwitchesOK = Object.values(switchResults).every(r => r === true);
console.log(allSwitchesOK ? '\n✅ Todas las pestañas se activan correctamente\n' : '\n❌ Algunas pestañas fallan al activarse\n');

// ========== TEST 4: Verificar tabInitializers ==========
console.log('🔧 TEST 4: Verificar tabInitializers');
const initResults = {};

if (window.UI && window.UI.initializedTabs) {
    testTabs.forEach(tabId => {
        const isInitialized = window.UI.initializedTabs.has(tabId);
        initResults[tabId] = isInitialized;
        
        const status = isInitialized ? '✅' : '⚠️';
        console.log(`${status} Pestaña "${tabId}":`, isInitialized ? 'INICIALIZADA' : 'NO INICIALIZADA (normal si no se ha abierto)');
    });
} else {
    console.log('⚠️ window.UI.initializedTabs no disponible');
}

// ========== RESUMEN FINAL ==========
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN FINAL DEL TEST');
console.log('='.repeat(60));

const results = [
    { name: 'Módulos cargados', ok: allModulesOK },
    { name: 'Pestañas en DOM', ok: allTabsOK },
    { name: 'Switch de pestañas', ok: allSwitchesOK }
];

results.forEach(result => {
    const status = result.ok ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${result.name}`);
});

const allTestsPass = results.every(r => r.ok);

if (allTestsPass) {
    console.log('\n🎉 ¡TODOS LOS TESTS PASARON! Las pestañas funcionan correctamente.');
} else {
    console.log('\n⚠️ ALGUNOS TESTS FALLARON. Revisa los mensajes arriba.');
}

console.log('='.repeat(60) + '\n');

// ========== INFORMACIÓN ADICIONAL ==========
console.log('💡 COMANDOS ÚTILES:');
console.log('');
console.log('// Cambiar a una pestaña específica:');
console.log('window.UI.switchTab("results");');
console.log('');
console.log('// Ver qué pestañas están inicializadas:');
console.log('console.log(Array.from(window.UI.initializedTabs));');
console.log('');
console.log('// Verificar estado de UI:');
console.log('console.log({ initialized: window.UI.initialized, activeTab: window.UI.activeTab });');
console.log('');

// Volver a la pestaña de config
if (window.UI && typeof window.UI.switchTab === 'function') {
    setTimeout(() => {
        window.UI.switchTab('config');
        console.log('↩️ Vuelto a pestaña Config');
    }, 100);
}
