# 📋 DOCUMENTACIÓN COMPLETA DEL PIPELINE

## 🎯 Descripción General

El **Pipeline de Flashgen** es un sistema modular de procesamiento que transforma texto crudo en flashcards de alta calidad mediante una serie de pasos configurables. Cada paso puede ser habilitado/deshabilitado y configurado individualmente.

---

## 🔄 FASES DEL PIPELINE

### FASE 1: PRE-PROCESAMIENTO
Prepara el texto para la generación de flashcards.

### FASE 2: GENERACIÓN
Genera las flashcards usando el modelo de IA.

### FASE 3: POST-PROCESAMIENTO
Refina y mejora las flashcards generadas.

---

## 📦 PASOS DEL PIPELINE (DETALLADO)

### 1️⃣ EXTRACT-ENTITIES (Extracción de Entidades)

**Categoría**: Pre-procesamiento  
**Propósito**: Identificar y extraer entidades importantes del texto (personas, lugares, fechas, citas).

**¿Cuándo usarlo?**
- ✅ Textos históricos o biográficos
- ✅ Documentos con muchos nombres propios
- ✅ Material con fechas y eventos importantes
- ❌ Código fuente o contenido técnico abstracto
- ❌ Listas de vocabulario simple

**Configuración**:
```json
{
  "extractPeople": true,        // Extraer nombres de personas
  "extractPlaces": true,         // Extraer nombres de lugares
  "extractDates": true,          // Extraer fechas y períodos
  "extractQuotes": true,         // Extraer citas textuales
  "minQuoteLength": 30          // Longitud mínima de citas (caracteres)
}
```

**Ejemplo de uso**:
- **Entrada**: "En 1492, Cristóbal Colón llegó a América..."
- **Salida**: Identifica "1492" (fecha), "Cristóbal Colón" (persona), "América" (lugar)

**Impacto en generación**:
- Las entidades extraídas se pueden usar para contextualizar preguntas
- Ayuda a crear flashcards más específicas y precisas

---

### 2️⃣ PREPROCESS (Preprocesamiento)

**Categoría**: Pre-procesamiento  
**Propósito**: Limpiar y normalizar el texto eliminando elementos no deseados.

**¿Cuándo usarlo?**
- ✅ Siempre recomendado (paso fundamental)
- ✅ Textos con referencias bibliográficas
- ✅ Contenido web con URLs
- ✅ Documentos académicos con notas al pie

**Configuración**:
```json
{
  "removeReferences": true,      // Eliminar referencias [1], [2], etc.
  "filterUrls": true,            // Eliminar URLs completas
  "normalizeSpaces": true,       // Normalizar espacios múltiples
  "excludeBiblio": true          // Excluir secciones de bibliografía
}
```

**Ejemplo de uso**:
- **Entrada**: "La fotosíntesis [1] es el proceso...  Ver más en https://..."
- **Salida**: "La fotosíntesis es el proceso..."

**Impacto en generación**:
- Texto más limpio = flashcards más claras
- Evita que el modelo genere preguntas sobre referencias o URLs
- Reduce ruido en el procesamiento

---

### 3️⃣ CHUNK (División en Fragmentos)

**Categoría**: Pre-procesamiento  
**Propósito**: Dividir el texto en fragmentos manejables para el modelo de IA.

**¿Cuándo usarlo?**
- ✅ Siempre necesario para textos largos (>1000 palabras)
- ✅ Documentos estructurados (libros, artículos)
- ⚠️ Ajustar método según tipo de contenido

**Métodos disponibles**:

#### 📖 **chapter** (Por Capítulos)
- **Uso**: Libros, documentos largos con estructura de capítulos
- **Detecta**: "Capítulo 1", "Chapter 2", números romanos
- **Ventaja**: Mantiene coherencia temática
- **Desventaja**: Solo funciona con contenido estructurado

#### 📄 **paragraph** (Por Párrafos)
- **Uso**: Artículos, ensayos, contenido general
- **Detecta**: Dobles saltos de línea (\n\n)
- **Ventaja**: Balance entre contexto y tamaño
- **Desventaja**: Puede separar ideas relacionadas

#### 📝 **sentence** (Por Oraciones)
- **Uso**: Contenido denso, definiciones, conceptos cortos
- **Detecta**: Puntos, signos de exclamación/interrogación
- **Ventaja**: Máxima granularidad
- **Desventaja**: Puede perder contexto

#### 🧠 **semantic** (Por Similitud Semántica)
- **Uso**: Contenido técnico, papers académicos
- **Detecta**: Similitud de significado entre oraciones
- **Ventaja**: Agrupa ideas relacionadas
- **Desventaja**: Más lento, requiere procesamiento

#### 📋 **wordlist** (Lista de Palabras)
- **Uso**: Vocabulario, glosarios, listas
- **Detecta**: Una palabra/frase por línea
- **Ventaja**: Perfecto para vocabulario
- **Desventaja**: Solo para listas simples

#### ⚡ **none** (Sin División)
- **Uso**: Textos muy cortos (<500 palabras)
- **Ventaja**: Mantiene todo el contexto
- **Desventaja**: Puede exceder límite del modelo

**Configuración**:
```json
{
  "chunkSize": 500,              // Tamaño objetivo en palabras
  "chunkOverlap": 50,            // Palabras de solapamiento entre chunks
  "minChunkSize": 100,           // Tamaño mínimo de chunk
  "semanticThreshold": 0.75      // Umbral de similitud (solo semantic)
}
```

**Ejemplo de uso**:
- **Entrada**: Texto de 5000 palabras
- **Salida**: 10 chunks de ~500 palabras con 50 palabras de overlap

**Impacto en generación**:
- Chunks más pequeños = flashcards más específicas
- Overlap ayuda a mantener contexto entre chunks
- Método correcto = mejor calidad de flashcards

---

### 4️⃣ CONTEXT-INJECT (Inyección de Contexto)

**Categoría**: Pre-procesamiento  
**Propósito**: Agregar contexto adicional a cada chunk para mejorar la generación.

**¿Cuándo usarlo?**
- ✅ Libros con múltiples capítulos
- ✅ Series de documentos relacionados
- ✅ Contenido que requiere contexto previo
- ❌ Textos independientes sin relación

**Configuración**:
```json
{
  "contextWindow": 2,            // Número de chunks previos a considerar
  "includeCharacters": true,     // Incluir personajes mencionados
  "includeEvents": true,         // Incluir eventos previos
  "includeThemes": false         // Incluir temas identificados
}
```

**Ejemplo de uso**:
- **Chunk actual**: "Él decidió atacar al amanecer"
- **Contexto inyectado**: "Napoleón (mencionado en chunk anterior)"
- **Resultado**: Pregunta más clara sobre quién atacó

**Impacto en generación**:
- Flashcards más claras y específicas
- Reduce ambigüedad en pronombres
- Mejora coherencia entre flashcards relacionadas

---

### 5️⃣ GENERATE (Generación de Flashcards)

**Categoría**: Generación  
**Propósito**: Llamar al modelo de IA para generar las flashcards.

**¿Cuándo usarlo?**
- ✅ Siempre (paso obligatorio)
- ⚠️ Asegurar que API esté configurada

**Configuración**:
```json
{
  "temperature": 0.7,            // Creatividad (0.0-1.0)
                                 // 0.0 = Muy determinista
                                 // 0.7 = Balance (recomendado)
                                 // 1.0 = Muy creativo
  
  "topP": 0.9,                   // Nucleus sampling (0.0-1.0)
                                 // Controla diversidad de tokens
                                 // 0.9 = Recomendado
  
  "topK": 40,                    // Top-K sampling
                                 // Limita tokens candidatos
                                 // 40 = Recomendado
  
  "maxTokens": 150,              // Tokens máximos por respuesta
                                 // 150 = ~100 palabras
                                 // Ajustar según complejidad
  
  "outputType": "template",      // Tipo de salida
                                 // "template" = Usar plantilla activa
                                 // "json" = Formato JSON estructurado
  
  "sourceLanguage": "Español",   // Idioma del contenido
  
  "ankiFormat": "basic",         // Formato Anki
                                 // "basic" = Pregunta/Respuesta
                                 // "cloze" = Texto con huecos
  
  "enableChain": false,          // Activar Chain Mode
                                 // true = Refinamiento iterativo
                                 // false = Generación directa
  
  "enableMemory": false,         // Activar sistema de memoria
                                 // true = Recordar contexto previo
                                 // false = Cada chunk independiente
  
  "enableAgent": false           // Activar modo agente
                                 // true = Usar herramientas externas
                                 // false = Solo generación
}
```

**Hiperparámetros explicados**:

- **Temperature (Temperatura)**:
  - Controla la aleatoriedad de la generación
  - Valores bajos (0.1-0.3): Respuestas más predecibles y conservadoras
  - Valores medios (0.5-0.7): Balance entre creatividad y coherencia
  - Valores altos (0.8-1.0): Respuestas más creativas pero menos predecibles
  - **Recomendación**: 0.7 para flashcards educativas

- **Top-P (Nucleus Sampling)**:
  - Controla la diversidad considerando probabilidad acumulada
  - 0.9 significa considerar tokens que suman 90% de probabilidad
  - Valores más bajos = más conservador
  - **Recomendación**: 0.9 para buena diversidad

- **Top-K**:
  - Limita la selección a los K tokens más probables
  - Valores más bajos = más determinista
  - **Recomendación**: 40 para balance

- **Max Tokens**:
  - Limita la longitud de la respuesta
  - 1 token ≈ 0.75 palabras en español
  - **Recomendación**: 150 tokens para respuestas concisas

**Ejemplo de uso**:
- **Entrada**: "La fotosíntesis es el proceso por el cual las plantas..."
- **Salida**: 
  ```json
  {
    "question": "¿Qué es la fotosíntesis?",
    "answer": "Es el proceso por el cual las plantas convierten luz solar en energía química"
  }
  ```

**Impacto en generación**:
- Este es el paso más crítico del pipeline
- La calidad de las flashcards depende directamente de esta configuración
- Ajustar hiperparámetros según el tipo de contenido

---

### 6️⃣ QUALITY (Control de Calidad)

**Categoría**: Post-procesamiento  
**Propósito**: Filtrar flashcards de baja calidad.

**¿Cuándo usarlo?**
- ✅ Siempre recomendado para mantener alta calidad
- ✅ Especialmente con temperature alta
- ⚠️ Puede reducir cantidad de flashcards

**Configuración**:
```json
{
  "threshold": 70,               // Umbral de calidad (0-100)
                                 // 70 = Recomendado
                                 // 80+ = Muy estricto
                                 // 60- = Más permisivo
  
  "strict": true,                // Modo estricto
                                 // true = Aplicar todas las reglas
                                 // false = Más permisivo
  
  "requireCitations": false,     // Requiere citas del texto
  
  "avoidGeneralizations": true,  // Evitar respuestas genéricas
  
  "checkRelevance": true         // Verificar relevancia con texto
}
```

**Criterios de evaluación**:
1. **Claridad**: ¿La pregunta es clara y específica?
2. **Relevancia**: ¿La respuesta está en el texto fuente?
3. **Concisión**: ¿La respuesta es concisa pero completa?
4. **Especificidad**: ¿Evita generalizaciones vagas?

**Ejemplo de uso**:
- **Flashcard rechazada**: 
  - Q: "¿Qué es importante?"
  - A: "Muchas cosas son importantes"
  - Razón: Muy genérica
  
- **Flashcard aceptada**:
  - Q: "¿Cuál es la función principal de la clorofila?"
  - A: "Absorber luz solar para la fotosíntesis"
  - Razón: Específica y relevante

**Impacto en generación**:
- Mejora significativa en calidad final
- Reduce tiempo de revisión manual
- Puede reducir cantidad (pero aumenta calidad)

---

### 7️⃣ DIFFICULTY-BALANCE (Balance de Dificultad)

**Categoría**: Post-procesamiento  
**Propósito**: Asignar nivel de dificultad a cada flashcard.

**¿Cuándo usarlo?**
- ✅ Para sistemas de repaso espaciado (Anki)
- ✅ Cuando quieres graduar dificultad
- ✅ Para análisis de complejidad del contenido

**Configuración**:
```json
{
  "targetDistribution": {        // Distribución objetivo
    "easy": 0.3,                 // 30% fáciles
    "medium": 0.5,               // 50% medias
    "hard": 0.2                  // 20% difíciles
  },
  "considerLength": true,        // Considerar longitud de respuesta
  "considerComplexity": true     // Considerar complejidad léxica
}
```

**Factores de dificultad**:
1. **Longitud de respuesta**: Respuestas más largas = más difícil
2. **Complejidad léxica**: Palabras técnicas = más difícil
3. **Especificidad**: Detalles específicos = más difícil
4. **Contexto requerido**: Requiere conocimiento previo = más difícil

**Niveles de dificultad**:
- **1-2 (Fácil)**: Definiciones básicas, hechos simples
- **3 (Medio)**: Conceptos que requieren comprensión
- **4-5 (Difícil)**: Análisis, síntesis, aplicación

**Ejemplo de uso**:
- **Fácil**: "¿Qué es H2O?" → "Agua"
- **Medio**: "¿Por qué el agua es polar?" → "Porque tiene carga asimétrica..."
- **Difícil**: "¿Cómo afecta la polaridad del agua a sus propiedades?" → "La polaridad permite..."

**Impacto en generación**:
- Mejor experiencia de aprendizaje
- Permite repaso espaciado más efectivo
- Ayuda a identificar conceptos complejos

---

### 8️⃣ CLOZE-GENERATOR (Generador de Cloze)

**Categoría**: Post-procesamiento  
**Propósito**: Convertir algunas flashcards a formato cloze (texto con huecos).

**¿Cuándo usarlo?**
- ✅ Contenido con datos específicos (fechas, nombres, números)
- ✅ Definiciones con términos clave
- ✅ Fórmulas o ecuaciones
- ❌ Preguntas conceptuales abiertas

**Configuración**:
```json
{
  "clozeEntities": true,         // Convertir entidades (nombres, lugares)
  "clozeNumbers": true,          // Convertir números y fechas
  "clozeDates": true,            // Convertir fechas específicas
  "clozeKeywords": false,        // Convertir palabras clave
  "maxVariantsPerCard": 2        // Máximo de variantes por flashcard
}
```

**Formato Cloze**:
```
Texto original: "Napoleón nació en 1769 en Córcega"

Variante 1: "{{c1::Napoleón}} nació en 1769 en Córcega"
Variante 2: "Napoleón nació en {{c1::1769}} en Córcega"
Variante 3: "Napoleón nació en 1769 en {{c1::Córcega}}"
```

**Ejemplo de uso**:
- **Entrada**: 
  - Q: "¿Cuándo nació Napoleón?"
  - A: "Napoleón nació en 1769"
  
- **Salida Cloze**:
  - "Napoleón nació en {{c1::1769}}"

**Impacto en generación**:
- Variedad en tipos de flashcards
- Mejor para memorización de datos específicos
- Más efectivo para fechas, nombres, números

---

### 9️⃣ SCORE (Re-ranking / Puntuación)

**Categoría**: Post-procesamiento  
**Propósito**: Puntuar y reordenar flashcards por relevancia/calidad.

**¿Cuándo usarlo?**
- ✅ Cuando generas muchas flashcards
- ✅ Para priorizar las más importantes
- ✅ Cuando quieres limitar cantidad final

**Configuración**:
```json
{
  "criteria": {
    "relevance": 0.4,            // Peso de relevancia (40%)
    "clarity": 0.3,              // Peso de claridad (30%)
    "uniqueness": 0.2,           // Peso de unicidad (20%)
    "difficulty": 0.1            // Peso de dificultad (10%)
  },
  "topN": 50,                    // Mantener solo top 50
  "minScore": 0.6                // Puntuación mínima (0-1)
}
```

**Criterios de puntuación**:
1. **Relevancia**: ¿Qué tan relevante es para el texto?
2. **Claridad**: ¿Qué tan clara es la pregunta/respuesta?
3. **Unicidad**: ¿Es información única o redundante?
4. **Dificultad**: ¿Está en el nivel de dificultad deseado?

**Ejemplo de uso**:
- **Entrada**: 100 flashcards generadas
- **Proceso**: Puntuar cada una según criterios
- **Salida**: Top 50 flashcards mejor puntuadas

**Impacto en generación**:
- Reduce cantidad manteniendo calidad
- Prioriza información más importante
- Elimina redundancia

---

### 🔟 DEDUPE (Deduplicación)

**Categoría**: Post-procesamiento  
**Propósito**: Eliminar flashcards duplicadas o muy similares.

**¿Cuándo usarlo?**
- ✅ Siempre recomendado (paso final)
- ✅ Especialmente con textos repetitivos
- ✅ Cuando se generan muchas flashcards

**Configuración**:
```json
{
  "similarityThreshold": 0.85,   // Umbral de similitud (0-1)
                                 // 0.85 = Recomendado
                                 // 0.9+ = Más estricto
                                 // 0.7- = Más permisivo
  
  "compareQuestions": true,      // Comparar preguntas
  "compareAnswers": true,        // Comparar respuestas
  "caseSensitive": false         // Sensible a mayúsculas
}
```

**Métodos de detección**:
1. **Exacta**: Preguntas idénticas
2. **Similitud léxica**: Palabras muy similares
3. **Similitud semántica**: Significado similar

**Ejemplo de uso**:
- **Duplicado detectado**:
  - Card 1: "¿Qué es la fotosíntesis?"
  - Card 2: "¿Qué es el proceso de fotosíntesis?"
  - Acción: Mantener solo Card 1
  
- **No duplicado**:
  - Card 1: "¿Qué es la fotosíntesis?"
  - Card 2: "¿Dónde ocurre la fotosíntesis?"
  - Acción: Mantener ambas

**Impacto en generación**:
- Elimina redundancia
- Mejora eficiencia de estudio
- Reduce tiempo de revisión

---

## 🎛️ CONFIGURACIONES RECOMENDADAS POR TIPO DE CONTENIDO

### 📚 Libros de Historia
```json
{
  "extract-entities": { "enabled": true, "extractDates": true, "extractPeople": true },
  "preprocess": { "enabled": true },
  "chunk": { "enabled": true, "method": "chapter", "chunkSize": 800 },
  "context-inject": { "enabled": true, "contextWindow": 2 },
  "generate": { "enabled": true, "temperature": 0.6 },
  "quality": { "enabled": true, "threshold": 75 },
  "difficulty-balance": { "enabled": true },
  "cloze-generator": { "enabled": true, "clozeDates": true },
  "dedupe": { "enabled": true }
}
```

### 🔬 Contenido Científico/Técnico
```json
{
  "preprocess": { "enabled": true },
  "chunk": { "enabled": true, "method": "semantic", "chunkSize": 400 },
  "generate": { "enabled": true, "temperature": 0.5, "maxTokens": 200 },
  "quality": { "enabled": true, "threshold": 80, "strict": true },
  "difficulty-balance": { "enabled": true },
  "dedupe": { "enabled": true }
}
```

### 📖 Vocabulario/Idiomas
```json
{
  "chunk": { "enabled": true, "method": "wordlist" },
  "generate": { "enabled": true, "temperature": 0.3 },
  "cloze-generator": { "enabled": true },
  "dedupe": { "enabled": true }
}
```

### 💻 Código/Programación
```json
{
  "preprocess": { "enabled": false },
  "chunk": { "enabled": true, "method": "none" },
  "generate": { "enabled": true, "temperature": 0.4 },
  "quality": { "enabled": true, "threshold": 70 },
  "dedupe": { "enabled": true }
}
```

---

## 🚨 SOLUCIÓN DE PROBLEMAS

### Problema: "No se generan flashcards"
**Causas posibles**:
1. ✅ Verificar que paso `generate` esté habilitado
2. ✅ Verificar configuración de API (endpoint, modelo)
3. ✅ Verificar que haya texto en input
4. ✅ Revisar logs de debug para errores

**Solución**:
- Activar Debug Log (Ctrl+Shift+D)
- Verificar mensajes de error
- Comprobar que API responde

### Problema: "Flashcards de baja calidad"
**Causas posibles**:
1. ✅ Temperature muy alta
2. ✅ Paso `quality` deshabilitado
3. ✅ Chunks muy grandes o muy pequeños

**Solución**:
- Reducir temperature a 0.6-0.7
- Habilitar paso `quality` con threshold 75+
- Ajustar chunkSize según contenido

### Problema: "Muchas flashcards duplicadas"
**Causas posibles**:
1. ✅ Paso `dedupe` deshabilitado
2. ✅ Texto muy repetitivo
3. ✅ Chunks con mucho overlap

**Solución**:
- Habilitar paso `dedupe`
- Reducir `chunkOverlap`
- Usar paso `score` para filtrar

### Problema: "Pipeline muy lento"
**Causas posibles**:
1. ✅ Chunks muy pequeños (muchas llamadas API)
2. ✅ Método `semantic` en textos largos
3. ✅ Chain mode activado

**Solución**:
- Aumentar chunkSize a 600-800
- Usar método `paragraph` en lugar de `semantic`
- Desactivar chain mode si no es necesario

---

## 📊 MÉTRICAS Y MONITOREO

El pipeline registra las siguientes métricas:

1. **Tiempo de ejecución**: Por fase y total
2. **Cantidad de flashcards**: Por paso
3. **Tasa de filtrado**: Flashcards eliminadas por calidad
4. **Llamadas API**: Número y duración
5. **Errores**: Tipo y frecuencia

**Acceder a métricas**:
- Activar Debug Log (Ctrl+Shift+D)
- Ver logs en tiempo real
- Revisar estadísticas finales

---

## 🎓 MEJORES PRÁCTICAS

1. **Siempre activar**:
   - `preprocess`
   - `generate`
   - `dedupe`

2. **Activar según contenido**:
   - `extract-entities`: Textos históricos/biográficos
   - `context-inject`: Libros largos
   - `quality`: Siempre recomendado
   - `cloze-generator`: Datos específicos

3. **Ajustar hiperparámetros**:
   - Temperature: 0.6-0.7 para balance
   - ChunkSize: 400-600 para contenido general
   - Quality threshold: 70-75 para buen balance

4. **Monitorear resultados**:
   - Revisar primeras flashcards generadas
   - Ajustar configuración según calidad
   - Iterar hasta obtener resultados deseados

---

**Última actualización**: 2025-11-28  
**Versión del pipeline**: 3.0  
**Autor**: Flashgen AI System
