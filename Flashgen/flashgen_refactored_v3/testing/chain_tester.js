/**
 * Modulo: Chain Tester
 * Categoria: testing
 * Extraido de: Flashgen.js (lineas 176-214)
 * Generado: 2025-11-28 09:48:59
 * 
 * Metodos: N/A
 * Dependencias: DebugLogger, Processing, State, UI
 */

import { DebugLogger } from '../ui/debug_logger.js';
import { Processing } from '../processing/processing.js';
import { State } from '../core/state.js';
import { Templates } from '../core/templates.js';
import { UI } from '../ui/ui.js';

const ChainTester = {
    sampleText: `La Revolucion Industrial transformo la produccion mediante la mecanizacion y el uso del vapor. Esto permitio aumentar la escala de manufactura, reduciendo costos y creando nuevas ciudades industriales. Sin embargo, tambien genero explotacion laboral infantil y jornadas de mas de 14 horas.`,

    async runSample() {
        try {
            DebugLogger.log('🧪 Ejecutando cadena con texto de ejemplo...', 'info');

            if (!Templates) {
                DebugLogger.log('⚠️ Templates no disponible, no se puede ejecutar la cadena de prueba', 'warning');
                UI.toast('Templates no disponible en este entorno', 'warning');
                return;
            }

            const inputEl = document.getElementById('inputText');
            const originalInput = inputEl?.value ?? '';
            const originalTemplate = State.activeTemplate;

            if (inputEl) {
                inputEl.value = this.sampleText;
            }

            if (!State.activeTemplate && Templates && typeof Templates.select === 'function') {
                const templateKeys = Object.keys(State.templates || {});
                const defaultTemplate = templateKeys[0] || Object.keys(Templates.defaults || {})[0];
                if (defaultTemplate) {
                    Templates.select(defaultTemplate);
                }
            }

            await Processing.generate(this.sampleText);

            UI.toast('✅ Cadena ejecutada con texto de ejemplo');
            DebugLogger.log('✅ Cadena de prueba completada', 'success');

            if (inputEl) {
                inputEl.value = originalInput;
            }
            if (originalTemplate && Templates && typeof Templates.select === 'function') {
                Templates.select(originalTemplate);
            }
        } catch (error) {
            DebugLogger.log(`❌ Error probando cadena: ${error.message}`, 'error');
            UI.toast('❌ No se pudo ejecutar la cadena de prueba', 'error');
        }
    }
};


// Exports
export { ChainTester };
export default ChainTester;
