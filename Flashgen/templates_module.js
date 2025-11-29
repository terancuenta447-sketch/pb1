const Templates = {
        defaults: {

            // LIBROS - Eventos específicos
            book_events: {
                name: '📚 Eventos (Libro)',
                systemPrompt: `Analista literario. Extrae SOLO del fragmento dado.
            PROHIBIDO: Generalizar o añadir info externa.
            Respuesta: 15-40 palabras máximo.`,
                userPrompt: `Libro: {bookTitle} | Cap: {chapter}
            Contexto previo: {chapterSummary}

            FRAGMENTO:
            {text}

            Crea 1 flashcard sobre un evento concreto DEL FRAGMENTO:

            Pregunta: "En {chapter}, ¿[acción específica de personaje]?"
            Respuesta: [Lo que hace + resultado inmediato. Cita si es relevante: "..."]

            REGLAS:
            - Pregunta: 10-20 palabras
            - Respuesta: 15-40 palabras
            - Datos SOLO del fragmento dado`,
                variables: { bookTitle: '', chapter: '', chapterSummary: '' },
                defaultChunkMethod: 'scene'
            },

        async generateQuickMode(text, template) {
            DebugLogger.log('⚡ Iniciando Quick Mode', 'success');

            const words = text.split('\n').map(w => w.trim()).filter(Boolean);
            DebugLogger.log(`📝 ${words.length} palabras detectadas`, 'info');

            UI.updateProgress(0, words.length);
            
            // Mejorar inicialización conectando con estado de GUI
            const previousFlashcards = State.flashcards || [];
            State.flashcards = [];
            
            // Notificar a UI sobre el cambio de estado
            if (typeof UI !== 'undefined' && UI.onStateChange) {
                UI.onStateChange('flashcards_reset', { previousCount: previousFlashcards.length });
            }

            let successCount = 0;
            let errorCount = 0;

            for (let i = 0; i < words.length; i++) {
                if (State.cancelGeneration) {
                    this.handleGenerationCancel();
                    return;
                }

                const word = words[i];

                try {
                    const systemPrompt = template.systemPrompt || 'Traductor breve.';
                    const userPrompt = word;

                    const result = await API.call(systemPrompt, userPrompt);

                    if (result.success && result.content) {
                        let card = template.customParser
                            ? template.customParser(result.content, word)
                            : {
                                question: word,
                                answer: result.content.trim(),
                                type: 'basic',
                                quality: { clarity: 100, relevance: 100, conciseness: 100 }
                            };

                        card = {
                            id: card.id || `quick_${Date.now()}_${i}`,
                            status: card.status || 'pending',
                            metadata: {
                                ...(card.metadata || {}),
                                quickMode: true,
                                chunkIndex: i
                            },
                            ...card
                        };

                        // Feature: lexicalFilter - Filtrar si <40% tokens del texto
                        if (State.config.features.lexicalFilter) {
                            const sourceTokens = word.toLowerCase().split(/\s+/).filter(Boolean);
                            const answerTokens = card.answer.toLowerCase().split(/\s+/).filter(Boolean);
                            const overlap = answerTokens.filter(t => sourceTokens.includes(t)).length;
                            const overlapRatio = answerTokens.length > 0 ? overlap / answerTokens.length : 0;
                            
                            if (overlapRatio < 0.4) {
                                DebugLogger.log(`⚠️ Palabra ${i + 1} filtrada: solo ${Math.round(overlapRatio * 100)}% tokens del texto`, 'warning');
                                errorCount++;
                                continue;
                            }
                        }

                        State.flashcards.push(card);
                        successCount++;
                    } else {
                        errorCount++;
                        DebugLogger.log(`⚠️ Palabra ${i + 1} falló: ${result.error || 'Respuesta vacía'}`, 'warning');
                    }
                } catch (error) {
                    errorCount++;
                    DebugLogger.log(`❌ Error palabra ${i + 1}: ${error.message}`, 'error');
                }

                UI.updateProgress(i + 1, words.length);
                document.getElementById('progressStatus').textContent =
                    `⚡ Quick Mode: ${i + 1}/${words.length} • ✓${successCount} ✗${errorCount}`;

                const lastLatency = State.recentLatencies ? State.recentLatencies[State.recentLatencies.length - 1] : 0;
                if (lastLatency && lastLatency > 2000) {
                    // Mejorar manejo de errores conectando con GUI
                    await new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            clearTimeout(timeout);
                            resolve();
                        }, 200);
                        
                        // Conectar con sistema de notificaciones si hay error
                        timeout.onerror = () => {
                            DebugLogger.log('Error en timeout de carga', 'error');
                            reject(new Error('Timeout error'));
                        };
                    }).catch(error => {
                        DebugLogger.log(`Error en promesa de carga: ${error.message}`, 'warning');
                        // Conectar con UI de notificaciones sin modificar lógica existente
                        if (typeof UI !== 'undefined' && UI.showToast) {
                            UI.showToast('Error en carga de interfaz', 'warning');
                        }
                    });
                }
            }

            UI.updateProgress(words.length, words.length);
            document.getElementById('progressStatus').textContent =
                `✅ Quick Mode: ${successCount} tarjetas en tiempo récord`;

            DebugLogger.log(`⚡ Quick Mode completado: ${successCount}/${words.length} (${errorCount} errores)`, 'success');

            Results.updateUI();
            Learning.updateUI();
            UI.switchTab('results');
            UI.toast(`⚡ ${successCount} tarjetas generadas en modo rápido`);
        },

        async generateFastMode(text) {
            const template = State.templates[State.activeTemplate];
            if (!template) {
                DebugLogger.log('❌ No hay template activo para Fast Mode', 'error');
                return null;
            }
            if (!template.quickMode) {
                DebugLogger.log('⚠️ Fast Mode requiere plantilla tipo vocabulario (quickMode)', 'warning');
            }
            return this.generateQuickMode(text, template);
        },

            // HISTORIA - Causa directa
            history_cause: {
                name: '⚡ Causa-Efecto (Historia)',
                systemPrompt: `Historiador. Respuestas concisas basadas en el texto.
            Máximo 30 palabras por respuesta.`,
                userPrompt: `Período: {subject}

            TEXTO BASE:
            {text}

            Del texto, identifica 1 relación causa-efecto:

            Pregunta: "¿Por qué [evento específico del texto]?"
            Respuesta: [1-2 causas directas mencionadas en el texto, 20-30 palabras]

            NO inventar causas no mencionadas.`,
                variables: { subject: '' },
                defaultChunkMethod: 'paragraph'
            },

            // MANUALES - Paso único
            manual_step: {
                name: '🔧 Paso Único (Manual)',
                systemPrompt: `Técnico. Instrucción específica del manual.
            Respuesta: lista numerada, máx 3 pasos.`,
                userPrompt: `Manual: {bookTitle}

            INSTRUCCIÓN ORIGINAL:
            {text}

            Pregunta: "¿Cómo [acción específica del texto]?"
            Respuesta: 1) [...] 2) [...] 3) [...]

            Precaución: [UNA advertencia si el texto la menciona]

            Máx 40 palabras totales.`,
                variables: { bookTitle: '' },
                defaultChunkMethod: 'headers'
            },

            // ADMIN - Requisito específico
            admin_requirement: {
                name: '📋 Requisito (Admin)',
                systemPrompt: `Gestor. Extrae requisitos exactos del documento.
            Lista concisa, sin elaborar.`,
                userPrompt: `Documento: {text}

            Pregunta: "¿Qué se requiere para [trámite mencionado]?"
            Respuesta: • [Doc 1] • [Doc 2] • [Doc 3]

            Plazo: [si se menciona en el texto]

            Máx 35 palabras.`,
                variables: {},
                defaultChunkMethod: 'headers'
            },

            // IDIOMAS - Traducción fiel
            vocab_exact: {
                name: '🎯 Traducción Exacta',
                systemPrompt: `Traductor. SOLO significados reales que conozcas con certeza.
            Si tiene 1 → dar 1. Si tiene 4 → dar 4.`,
                userPrompt: `{language}: {text}

            Traducciones: [acepción1] | [acepción2] | [etc]
            Ejemplo: [oración simple en {language}]
            Traducción: [traducción del ejemplo]

            NUNCA inventar significados inexistentes.
            Respuesta máx 40 palabras.`,
                variables: { language: 'Inglés' },
                defaultChunkMethod: 'wordlist',
                fewShotExamples: [
                    'Q: bank\nA: banco (dinero) | orilla (río)\nEj: I went to the bank\nTrad: Fui al banco'
                ]
            },

            vocab_usage: {
                name: '💡 Uso Contextual',
                systemPrompt: `Profesor. Palabra + contexto donde usarla.
            30 palabras máx.`,
                userPrompt: `{language}: {text}

            Significado: [español, 1-2 palabras]
            Se usa para: [contexto específico]
            Ejemplo: [oración 8-12 palabras en {language}]

            Total máx 30 palabras.`,
                variables: { language: 'Inglés' },
                defaultChunkMethod: 'wordlist'
            },

            quick_vocab: {
                name: '⚡ Vocabulario Rápido (Palabra → Traducciones)',
                systemPrompt: 'Traductor. Responde SOLO con las traducciones separadas por comas. Sin explicaciones.',
                userPrompt: '{text}',
                variables: {
                    language: 'Inglés',
                    targetLanguage: 'Español'
                },
                defaultChunkMethod: 'wordlist',
                quickMode: true,
                customParser(content, word) {
                    let cleaned = (content || '')
                        .replace(/^(traducción|translation|traducciones|translations|significa|means):?\s*/i, '')
                        .replace(/["'`]/g, '')
                        .trim();

                    if (cleaned.toLowerCase().startsWith((word || '').toLowerCase())) {
                        cleaned = cleaned.substring(word.length).replace(/^[:\-–—]\s*/, '').trim();
                    }

                    const translations = cleaned.split(/[,;|]/).map(t => t.trim()).filter(Boolean);
                    if (translations.length > 3) {
                        cleaned = translations.slice(0, 3).join(', ');
                    } else {
                        cleaned = translations.join(', ');
                    }

                    const answer = cleaned || (content || '').substring(0, 50);

                    return {
                        id: `quick_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                        question: word,
                        answer,
                        type: 'basic',
                        status: 'pending',
                        metadata: {
                            quickMode: true,
                            rawResponse: (content || '').substring(0, 100)
                        },
                        quality: { clarity: 100, relevance: 100, conciseness: 100 }
                    };
                }
            },

            quick_reverse_en: {
                name: '⚡ Inverso (Español → Inglés)',
                systemPrompt: 'Traduce al inglés. Solo la palabra/frase, sin explicaciones.',
                userPrompt: '{text}',
                variables: {
                    targetLanguage: 'Inglés'
                },
                defaultChunkMethod: 'wordlist',
                quickMode: true,
                customParser(content, word) {
                    const cleaned = (content || '')
                        .replace(/^[^:]*:\s*/, '')
                        .replace(/["'`]/g, '')
                        .trim();
                    return {
                        id: `quick_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                        question: word,
                        answer: cleaned,
                        type: 'basic',
                        status: 'pending',
                        metadata: {
                            quickMode: true,
                            reverse: true
                        },
                        quality: { clarity: 100, relevance: 100, conciseness: 100 }
                    };
                }
            },

            quick_reverse_fr: {
                name: '⚡ Inverso (Español → Francés)',
                systemPrompt: 'Traduce al francés. Solo la palabra/frase, sin explicaciones.',
                userPrompt: '{text}',
                variables: {
                    targetLanguage: 'Francés'
                },
                defaultChunkMethod: 'wordlist',
                quickMode: true,
                customParser(content, word) {
                    const cleaned = (content || '')
                        .replace(/^[^:]*:\s*/, '')
                        .replace(/["'`]/g, '')
                        .trim();
                    return {
                        id: `quick_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                        question: word,
                        answer: cleaned,
                        type: 'basic',
                        status: 'pending',
                        metadata: {
                            quickMode: true,
                            reverse: true
                        },
                        quality: { clarity: 100, relevance: 100, conciseness: 100 }
                    };
                }
            },

            // JS - Sintaxis mínima
            code_js_what: {
                name: '⚡ Qué hace (JS)',
                systemPrompt: `JS dev. Código + explicación ultra-breve.
            Código: 2-4 líneas. Texto: 15 palabras máx.`,
                userPrompt: `Concepto del texto: {text}

            Pregunta: "¿Qué hace [concepto]?"
            Código:
            \`\`\`js
            [ejemplo mínimo 2-4 líneas]
            \`\`\`
            Hace: [explicación 10-15 palabras]

            Sin introducción ni conclusión.`,
                variables: { language: 'JavaScript' },
                defaultChunkMethod: 'paragraph'
            },

            code_js_when: {
                name: '🎯 Cuándo usar (JS)',
                systemPrompt: `Arquitecto JS. Caso de uso específico.
            20 palabras máx.`,
                userPrompt: `Del texto: {text}

            Pregunta: "¿Cuándo usar [patrón/método]?"
            Respuesta: [caso específico, 15-20 palabras]

            Evitar si: [1 antipatrón, 10 palabras]

            Total máx 30 palabras.`,
                variables: { language: 'JavaScript' },
                defaultChunkMethod: 'paragraph'
            },

            // PYTHON - Operación única
            code_py_how: {
                name: '🐍 Cómo hacer X (Python)',
                systemPrompt: `Python dev. Código funcional mínimo.
            Código: 2-5 líneas. Texto: 20 palabras máx.`,
                userPrompt: `Del texto: {text}

            Pregunta: "¿Cómo [operación específica]?"
            \`\`\`python
            [código mínimo que funcione]
            \`\`\`
            Qué hace: [15 palabras]

            Solo código del texto, sin variaciones.`,
                variables: { language: 'Python' },
                defaultChunkMethod: 'paragraph'
            },

            code_py_method: {
                name: '🔍 Método único (Python)',
                systemPrompt: `Python expert. Método + parámetro clave.
            25 palabras máx.`,
                userPrompt: `Del texto: {text}

            Pregunta: "[objeto].[método]() - ¿qué hace?"
            Respuesta: [función, 10 palabras] + parámetro crítico: [uno solo]

            Ejemplo: [1 línea código]

            Máx 25 palabras totales.`,
                variables: { language: 'Python' },
                defaultChunkMethod: 'paragraph'
            },

            language: {
                name: 'Idiomas (EN→ES)',
                systemPrompt: 'Eres un experto en enseñanza de {language} para hispanohablantes.',
                userPrompt: `Analiza esta oración:\n\n**Original:** {text}\n\nIdentifica 1-3 palabras clave y genera:\n- Pregunta: formulación clara en formato pregunta\n- Respuesta: explicación concisa con contexto\n- Dificultad: {difficulty}`,
                variables: { language: 'Inglés', subject: '', difficulty: 'intermedio', bookTitle: '', chapter: '', chapterSummary: '', manualContext: '' },
                defaultChunkMethod: 'wordlist',
                fewShotExamples: [
                    '✅ CORRECTO:\nQ: En el párrafo, ¿cómo describe el autor la relación entre los ríos y los asentamientos?\nA: Explica que los pueblos crecieron a la orilla del río Nilo por el riego. Cita: "La crecida fertilizaba la tierra"'
                ],
                fewShotExamplesNegative: [
                    '❌ INCORRECTO:\nQ: ¿Qué es la felicidad?\nA: Un estado emocional positivo.\n[Problema: genérica, no cita el fragmento]'
                ]
            },
            knowledge: {
                name: 'Conocimiento General',
                systemPrompt: 'Eres un experto pedagogo que crea flashcards de conceptos complejos en {subject}.',
                userPrompt: `Del siguiente texto:\n{text}\n\nExtrae:\n- Concepto principal (título breve)\n- Pregunta que evalúe comprensión profunda\n- Respuesta completa pero concisa\n- Nivel: {difficulty}`,
                variables: { language: '', subject: 'Filosofía', difficulty: 'intermedio', bookTitle: '', chapter: '', chapterSummary: '', manualContext: '' },
                defaultChunkMethod: 'paragraph',
                fewShotExamples: [
                    '✅ CORRECTO:\nQ: Según el fragmento, ¿por qué Sócrates compara la filosofía con una partera?\nA: Porque ayuda a "dar a luz" ideas mediante preguntas guiadas. Cita: "mi arte consiste en parir pensamientos"'
                ],
                fewShotExamplesNegative: [
                    '❌ INCORRECTO:\nQ: ¿Qué es el existencialismo?\nA: Una corriente filosófica del siglo XX.\n[Problema: genérico, no basado en el texto]'
                ]
            },
            book: {
                name: 'Libros (Contexto Enriquecido)',
                systemPrompt: 'Eres un experto en análisis literario y pedagogía. Creas flashcards que capturan la esencia de textos literarios manteniendo el contexto del libro. NUNCA generes preguntas filosóficas genéricas. SIEMPRE verifica que la pregunta sea sobre el contenido específico del fragmento.',
                userPrompt: `**CONTEXTO DEL LIBRO:**
    - Título: {bookTitle}
    - Capítulo: {chapter}
    - Resumen del capítulo: {chapterSummary}
    {manualContext}

    **FRAGMENTO A ANALIZAR:**
    {text}

    **INSTRUCCIONES CRÍTICAS:**
    1. La pregunta DEBE ser sobre eventos, personajes, o ideas ESPECÍFICAS del fragmento
    2. NO generes preguntas filosóficas generales tipo "¿Cuál es la relación entre el tiempo y el recuerdo?"
    3. Incluye detalles concretos del fragmento en la pregunta (nombres, acciones, lugares)
    4. La respuesta debe citar o parafrasear el fragmento cuando sea posible
    5. Si el fragmento habla de un evento específico, pregunta sobre ESE evento, no sobre conceptos abstractos

    **FORMATO REQUERIDO:**
    - Pregunta: En {bookTitle}, {chapter}, ¿[pregunta específica sobre el fragmento con detalles concretos]?
    - Respuesta: [Respuesta con detalles del fragmento] [Cita textual si es relevante: "..."]
    - Relevancia: [Por qué este detalle específico es importante para la narrativa]

    **EJEMPLO CORRECTO:**
    Pregunta: En El Extranjero, ¿qué hace Meursault después de recibir la noticia de la muerte de su madre?
    Respuesta: Meursault viaja al asilo donde vivía su madre para asistir al velorio y funeral.

    **EJEMPLO INCORRECTO (EVITAR):**
    Pregunta: ¿Cuál es la relación entre el tiempo y el recuerdo de un evento pasado?
    Respuesta: El tiempo es un concepto abstracto...`,
                variables: { 
                    language: '', 
                    subject: 'Literatura', 
                    difficulty: 'intermedio',
                    bookTitle: 'Título del Libro',
                    chapter: 'Capítulo 1',
                    chapterSummary: '',
                    manualContext: ''
                },
                defaultChunkMethod: 'chapter',
                fewShotExamples: [
                    '✅ CORRECTO:\nQ: En Cap. 3, ¿qué hace Meursault al despertar?\nA: Se levanta y nota el calor sofocante. Dice: "Hacía mucho calor"'
                ],
                fewShotExamplesNegative: [
                    '❌ INCORRECTO:\nQ: ¿Qué es el existencialismo?\nA: Una corriente filosófica del siglo XX.\n[Problema: pregunta genérica, no del capítulo]'
                ]
            }
        },

        init() {
            State.templates = { ...this.defaults };
            State.activeTemplate = 'language';
            this.updateUI();
        },

        updateUI() {
            const select = document.getElementById('templateSelect');
            if (select) {
                select.innerHTML = '';
                Object.keys(State.templates).forEach(key => {
                    const opt = document.createElement('option');
                    opt.value = key;
                    opt.textContent = State.templates[key].name;
                    select.appendChild(opt);
                });
                select.value = State.activeTemplate;
            }
            
            this.load(State.activeTemplate);
        },

        load(key) {
            const t = State.templates[key];
            if (!t) {
                DebugLogger.log(`❌ Template not found: ${key}`, 'error');
                return;
            }
            
            State.activeTemplate = key;
            document.getElementById('templateName').value = t.name;
            document.getElementById('systemPrompt').value = t.systemPrompt;
            document.getElementById('userPrompt').value = t.userPrompt;
            
            // Ensure variables object exists
            if (!t.variables) {
                t.variables = { language: '', subject: '', difficulty: 'intermedio', bookTitle: '', chapter: '', chapterSummary: '', manualContext: '', targetLanguage: '' };
            }
            
            document.getElementById('varLanguage').value = t.variables.language || '';
            document.getElementById('varSubject').value = t.variables.subject || '';
            document.getElementById('varDifficulty').value = t.variables.difficulty || '';
            document.getElementById('varBookTitle').value = t.variables.bookTitle || '';
            document.getElementById('varChapter').value = t.variables.chapter || '';
            document.getElementById('varChapterSummary').value = t.variables.chapterSummary || '';
            document.getElementById('varTargetLanguage').value = t.variables.targetLanguage || '';
            
            // Apply default chunk method if template has one and user hasn't modified it
            if (t.defaultChunkMethod && !State.userModifiedChunkMethod) {
                State.pipeline.options.chunkMethod = t.defaultChunkMethod;
                document.getElementById('chunkMethod').value = t.defaultChunkMethod;
                UI.updateChunkMethodHelp(t.defaultChunkMethod);
                UI.updateChunkControls();
                DebugLogger.log(`📋 Plantilla aplicó método de chunking: ${t.defaultChunkMethod}`, 'info');
            } else if (State.userModifiedChunkMethod) {
                DebugLogger.log(`🔒 Manteniendo método de chunking del usuario (ignorando plantilla)`, 'warning');
            }
            
            // Update manual context field
            const manualContextEl = document.getElementById('manualContext');
            if (manualContextEl) {
                manualContextEl.value = t.variables.manualContext || '';
            }
            
            // Load quickMode checkbox
            const quickModeEl = document.getElementById('templateQuickMode');
            if (quickModeEl) {
                quickModeEl.checked = !!t.quickMode;
            }
            
            // Load few-shot examples
            FewShotManager.load(
                t.fewShotExamples || [], 
                t.fewShotExamplesNegative || [],
                t.fewShotEnabled || { positive: true, negative: false }
            );
            
            // Load parser config
            ParserManager.loadConfig(t.parserConfig);
            
            // Load prompt enhancements
            if (t.promptEnhancements) {
                const fewShotEl = document.getElementById('templateEnableFewShot');
                const fewShotNegEl = document.getElementById('templateEnableFewShotNegatives');
                const inlineEl = document.getElementById('templateNegativeExamplesInline');
                const cotEl = document.getElementById('templateChainOfThought');
                
                if (fewShotEl) fewShotEl.checked = !!t.promptEnhancements.enableFewShot;
                if (fewShotNegEl) fewShotNegEl.checked = !!t.promptEnhancements.enableFewShotNegatives;
                if (inlineEl) inlineEl.checked = !!t.promptEnhancements.negativeExamplesInline;
                if (cotEl) cotEl.checked = !!t.promptEnhancements.chainOfThought;
            } else {
                // Valores por defecto si no existen
                const fewShotEl = document.getElementById('templateEnableFewShot');
                const fewShotNegEl = document.getElementById('templateEnableFewShotNegatives');
                const inlineEl = document.getElementById('templateNegativeExamplesInline');
                const cotEl = document.getElementById('templateChainOfThought');
                
                if (fewShotEl) fewShotEl.checked = false;
                if (fewShotNegEl) fewShotNegEl.checked = false;
                if (inlineEl) inlineEl.checked = false;
                if (cotEl) cotEl.checked = false;
            }
            
            this.updatePreview();
        },

        save() {
            const currentTemplate = State.templates[State.activeTemplate];
            const variables = this.getCurrentVariables();
            const quickModeEl = document.getElementById('templateQuickMode');
            
            const t = {
                name: document.getElementById('templateName').value,
                systemPrompt: document.getElementById('systemPrompt').value,
                userPrompt: document.getElementById('userPrompt').value,
                variables,
                defaultChunkMethod: currentTemplate?.defaultChunkMethod || '',  // Preservar si existe
                quickMode: quickModeEl?.checked || false,
                customParser: currentTemplate?.customParser,
                fewShotExamples: FewShotManager.collect('positive'),
                fewShotExamplesNegative: FewShotManager.collect('negative'),
                fewShotEnabled: FewShotManager.getEnabledState(),
                parserConfig: ParserManager.getConfig(),
                // Nuevas opciones de mejora de prompts
                promptEnhancements: {
                    enableFewShot: document.getElementById('templateEnableFewShot')?.checked || false,
                    enableFewShotNegatives: document.getElementById('templateEnableFewShotNegatives')?.checked || false,
                    negativeExamplesInline: document.getElementById('templateNegativeExamplesInline')?.checked || false,
                    chainOfThought: document.getElementById('templateChainOfThought')?.checked || false
                }
            };
            State.templates[State.activeTemplate] = t;
            Storage.save();
            this.updateUI();
            UI.toast('✅ Plantilla guardada');
        },
        
        createNew() {
            const name = prompt('Nombre de la nueva plantilla:');
            if (!name) return;
            
            const key = name.toLowerCase().replace(/\s+/g, '_');
            if (State.templates[key]) {
                UI.toast('❌ Ya existe una plantilla con ese nombre', 'error');
                return;
            }
            
            State.templates[key] = {
                name: name,
                systemPrompt: 'Eres un experto asistente.',
                userPrompt: 'Analiza el siguiente texto:\n\n{text}',
                variables: {
                    language: '',
                    subject: '',
                    difficulty: 'intermedio',
                    bookTitle: '',
                    chapter: '',
                    chapterSummary: '',
                    targetLanguage: '',
                    manualContext: ''
                },
                defaultChunkMethod: 'paragraph',
                quickMode: false,
                fewShotExamples: [],
                fewShotExamplesNegative: []
            };
            
            State.activeTemplate = key;
            this.updateUI();
            this.load(key);
            
            const select = document.getElementById('templateSelect');
            if (select) select.value = key;
            
            UI.toast('✅ Plantilla creada');
            DebugLogger.log(`✅ Nueva plantilla creada: ${name}`, 'success');
        },
        
        deleteActive() {
            if (!State.activeTemplate) {
                UI.toast('❌ No hay plantilla activa', 'error');
                return;
            }
            
            // No permitir eliminar plantillas por defecto
            if (this.defaults[State.activeTemplate]) {
                UI.toast('❌ No se pueden eliminar plantillas predeterminadas', 'error');
                return;
            }
            
            const templateName = State.templates[State.activeTemplate]?.name || State.activeTemplate;
            if (!confirm(`¿Eliminar plantilla "${templateName}"?`)) {
                return;
            }
            
            delete State.templates[State.activeTemplate];
            
            // Cambiar a la primera plantilla disponible
            const firstKey = Object.keys(State.templates)[0] || Object.keys(this.defaults)[0];
            State.activeTemplate = firstKey;
            
            this.updateUI();
            this.load(firstKey);
            
            const select = document.getElementById('templateSelect');
            if (select) select.value = firstKey;
            
            UI.toast('✅ Plantilla eliminada');
            DebugLogger.log(`🗑️ Plantilla eliminada: ${templateName}`, 'info');
        },

        updatePreview() {
            const system = document.getElementById('systemPrompt').value;
            const user = document.getElementById('userPrompt').value;
            const vars = this.getCurrentVariables({ text: 'The quick brown fox jumps over the lazy dog.' });

            const processed = `[SYSTEM]\n${this.interpolate(system, vars)}\n\n[USER]\n${this.interpolate(user, vars)}`;
            document.getElementById('templatePreview').textContent = processed;
        },

        getCurrentVariables(extra = {}) {
            const manualContextEl = document.getElementById('manualContext');
            const base = {
                language: document.getElementById('varLanguage')?.value || '',
                subject: document.getElementById('varSubject')?.value || '',
                difficulty: document.getElementById('varDifficulty')?.value || 'intermedio',
                bookTitle: document.getElementById('varBookTitle')?.value || '',
                chapter: document.getElementById('varChapter')?.value || '',
                chapterSummary: document.getElementById('varChapterSummary')?.value || '',
                targetLanguage: document.getElementById('varTargetLanguage')?.value || '',
                manualContext: manualContextEl?.value || ''
            };
            return { ...base, ...extra };
        },

        testWithSample() {
            const button = document.getElementById('testTemplateBtn');
            const activeTemplate = State.templates[State.activeTemplate];
            if (!activeTemplate) {
                UI.toast('❌ No hay plantilla activa para probar', 'error');
                return;
            }

            const sampleSource = document.getElementById('inputText');
            const sampleText = sampleSource?.value?.trim() || 'Este es un breve texto de ejemplo para probar la plantilla.';
            const vars = this.getCurrentVariables({ text: sampleText });
            const systemPrompt = document.getElementById('systemPrompt')?.value || '';
            const userPrompt = document.getElementById('userPrompt')?.value || '';
            const preview = document.getElementById('templatePreview');

            if (!preview) return;
            if (button) button.disabled = true;

            try {
                const compiledSystem = this.interpolate(systemPrompt, vars);
                const compiledUser = this.interpolate(userPrompt, vars);
                preview.textContent = `[SYSTEM]\n${compiledSystem}\n\n[USER]\n${compiledUser}`;
                UI.toast(sampleSource?.value?.trim()
                    ? '✅ Plantilla probada con tu texto actual'
                    : '✅ Plantilla probada con texto de ejemplo');
            } finally {
                if (button) button.disabled = false;
            }
        },

        interpolate(template, variables) {
            let result = template;
            Object.keys(variables).forEach(key => {
                const value = variables[key] || '';
                result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
            });
            result = result
                .split('\n')
                .filter(line => !line.match(/^\s*\{\w+\}\s*$/))
                .join('\n');
            
            // Feature: negativePrompt - Agregar bloque PROHIBIDO/OBLIGATORIO
            if (State.config.features.negativePrompt) {
                result += '\n\nPROHIBIDO:\n- Inventar información no presente en el texto\n- Generalizar sin evidencia\n- Usar conocimiento externo\n\nOBLIGATORIO:\n- Citar el texto cuando sea relevante\n- Ser específico y concreto\n- Mantener brevedad (máx 40 palabras)';
            }
            
            // Feature: chainOfThought - Forzar reflexión previa
            if (State.config.features.chainOfThought) {
                result = 'Piensa paso a paso antes de responder:\n1. Identifica la información clave del texto\n2. Determina qué pregunta sería más útil\n3. Formula una respuesta concisa\n\n' + result;
            }
            
            return result;
        },

        exportAll() {
            const json = JSON.stringify(State.templates, null, 2);
            UI.download('flashgen_templates.json', json, 'application/json');
            UI.toast('✅ Plantillas exportadas');
        },

        importAll(file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const imported = JSON.parse(e.target.result);
                    State.templates = { ...State.templates, ...imported };
                    this.updateUI();
                    UI.toast('✅ Plantillas importadas');
                } catch (err) {
                    UI.toast('❌ Error al importar', 'error');
                }
            };
            reader.readAsText(file);
        }
    }