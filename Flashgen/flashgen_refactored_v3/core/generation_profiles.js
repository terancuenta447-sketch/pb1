/**
 * Módulo: GenerationProfiles
 * Categoría: core
 * Extraído de: Flashgen.js (líneas 3568-3673)
 * Generado: 2025-11-28
 * 
 * Descripción: Perfiles de generación predefinidos (ultra_quality, balanced, fast, custom)
 */

const GenerationProfiles = {
    ultra_quality: {
        name: '🏆 Ultra Quality',
        description: `
            <strong>Máxima precisión para contenido complejo</strong><br>
            ✓ Chain con evaluación de 3 métricas<br>
            ✓ Hasta 3 refinamientos por tarjeta<br>
            ✓ Inyección de contexto enriquecido<br>
            ✓ Few-shot examples<br>
            ✓ Variantes Cloze opcionales<br>
            ✓ Filtro léxico estricto<br>
            <br>
            ⏱️ Velocidad: ~2-4 tarjetas/min con 7B<br>
            🎯 Ideal para: Libros, filosofía, conceptos complejos
        `,
        config: {
            enableChain: true,
            enableQuality: true,
            enableRefinement: true,
            enableCloze: true,
            enableContextInjection: true,
            enableFewShot: true,
            enableLexicalFilter: true,
            qualityThreshold: 80,
            maxRefinements: 3,
            batchDelay: 500,
            chunkSize: 300,
            hyperparams: {
                temperature: 0.6,
                top_p: 0.85,
                top_k: 35
            }
        }
    },
    balanced: {
        name: '⚖️ Balanceado',
        description: `
            <strong>Equilibrio entre calidad y velocidad</strong><br>
            ✓ Chain con evaluación básica<br>
            ✓ 1-2 refinamientos si calidad < 70%<br>
            ✓ Few-shot desactivado (ahorra tokens)<br>
            ~ Contexto solo si template lo requiere<br>
            <br>
            ⏱️ Velocidad: ~5-8 tarjetas/min con 7B<br>
            🎯 Ideal para: Uso general, textos mixtos
        `,
        config: {
            enableChain: true,
            enableQuality: true,
            enableRefinement: true,
            enableCloze: false,
            enableContextInjection: false,
            enableFewShot: false,
            enableLexicalFilter: false,
            qualityThreshold: 70,
            maxRefinements: 2,
            batchDelay: 300,
            chunkSize: 400,
            hyperparams: {
                temperature: 0.7,
                top_p: 0.9,
                top_k: 40
            }
        }
    },
    fast: {
        name: '⚡ Rápido',
        description: `
            <strong>Velocidad máxima para vocabulario simple</strong><br>
            ✗ Sin chain ni evaluación de calidad<br>
            ✗ Sin refinamiento<br>
            ✗ Sin contexto adicional<br>
            ✓ Validación básica (longitud, palabras clave)<br>
            <br>
            ⏱️ Velocidad: ~15-25 tarjetas/min con 7B<br>
            🎯 Ideal para: Listas de vocabulario, flashcards simples
        `,
        config: {
            enableChain: false,
            enableQuality: false,
            enableRefinement: false,
            enableCloze: false,
            enableContextInjection: false,
            enableFewShot: false,
            enableLexicalFilter: false,
            qualityThreshold: 0,
            maxRefinements: 0,
            batchDelay: 100,
            chunkSize: 200,
            hyperparams: {
                temperature: 0.5,
                top_p: 0.85,
                top_k: 30
            }
        }
    },
    custom: {
        name: '🔧 Custom',
        description: `
            <strong>Configura manualmente cada parámetro</strong><br>
            Ajusta individualmente chain, calidad, refinamiento, etc.<br>
            Para usuarios avanzados que quieren control total.
        `,
        config: {}
    }
};

// Exportar
export { GenerationProfiles };
export default GenerationProfiles;

// Exponer globalmente para compatibilidad
if (typeof window !== 'undefined') {
    window.GenerationProfiles = GenerationProfiles;
}

