/**
 * Modulo: Parser Manager
 * Categoria: managers
 * Extraido de: Flashgen.js (lineas 656-730)
 * Generado: 2025-11-28 09:48:59
 * 
 * Metodos: init, test, getConfig, parse, loadConfig
 * Dependencias: UI
 */

import { UI } from '../ui/ui.js';

    const ParserManager = {
        init() {
            const testBtn = document.getElementById('testParserBtn');
            testBtn?.addEventListener('click', () => this.test());
        },
        
        test() {
            const input = document.getElementById('parserTestInput')?.value;
            const output = document.getElementById('parserTestOutput');
            if (!output) return;
            
            if (!input) {
                UI.toast('⚠️ Ingresa texto de prueba', 'warning');
                return;
            }
            
            const qPattern = document.getElementById('parserQuestionPattern')?.value || 'Q:|Pregunta:';
            const aPattern = document.getElementById('parserAnswerPattern')?.value || 'A:|Respuesta:';
            
            const result = this.parse(input, qPattern, aPattern);
            
            if (!result || !result.question || !result.answer) {
                output.innerHTML = '<div style="color: var(--color-error);">❌ No se pudo parsear el contenido</div>';
            } else {
                output.innerHTML = `
                    <div style="color: var(--color-success); margin-bottom: 8px;">✅ Parser exitoso</div>
                    <div><strong>Pregunta:</strong> ${result.question}</div>
                    <div><strong>Respuesta:</strong> ${result.answer}</div>
                `;
            }
            output.style.display = 'block';
        },
        
        parse(content, qPattern, aPattern) {
            const qPatterns = qPattern.split('|').map(p => p.trim());
            const aPatterns = aPattern.split('|').map(p => p.trim());
            
            let question, answer;
            
            // ✅ FIX #10: Escapar patrones de usuario antes de construir regex
            for (const pattern of qPatterns) {
                const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const escapedAPatterns = aPatterns.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
                const regex = new RegExp(`${escapedPattern}\\s*(.+?)(?=${escapedAPatterns.join('|')}|$)`, 'is');
                const match = content.match(regex);
                if (match) {
                    question = match[1].trim();
                    break;
                }
            }
            
            for (const pattern of aPatterns) {
                const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`${escapedPattern}\\s*(.+)$`, 'is');
                const match = content.match(regex);
                if (match) {
                    answer = match[1].trim();
                    break;
                }
            }
            
            return { question, answer };
        },
        
        getConfig() {
            return {
                questionPattern: document.getElementById('parserQuestionPattern')?.value || 'Q:|Pregunta:',
                answerPattern: document.getElementById('parserAnswerPattern')?.value || 'A:|Respuesta:'
            };
        },
        
        loadConfig(config) {
            if (!config) return;
            const qInput = document.getElementById('parserQuestionPattern');
            const aInput = document.getElementById('parserAnswerPattern');
            if (qInput && config.questionPattern) qInput.value = config.questionPattern;
            if (aInput && config.answerPattern) aInput.value = config.answerPattern;
        }
    };


// Exponer globalmente
if (typeof window !== 'undefined') {
    window.ParserManager = ParserManager;
}

// Exports
export { ParserManager };
export default ParserManager;
