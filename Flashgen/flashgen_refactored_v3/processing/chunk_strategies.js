/**
 * Modulo: Chunk Strategies
 * Categoria: processing
 * Extraido de: Flashgen.js (lineas 9056-9677)
 * Generado: 2025-11-28 09:48:59
 * 
 * Metodos: computeSimilarity, buildInjectedContext, paragraph, buildChunkMetadata, none
 * Dependencias: API, Processing, State, UI
 */

import { API } from '../api/api.js';
import { ChainVisualization } from '../ui/chain_visualization.js';
import { Processing } from './processing.js';
import { Results } from '../ui/results.js';
import { State } from '../core/state.js';
import { Templates } from '../core/templates.js';
import { UI } from '../ui/ui.js';

const chunkMethodMetadata = {
    langchain: {
        id: 'langchain',
        name: '⭐ LangChain Recursivo',
        func: 'langchain()',
        desc: '⭐ RecursiveCharacterTextSplitter de LangChain. Segmentación recursiva con separadores priorizados. RECOMENDADO para uso general.',
        lib: '@langchain/textsplitters',
        use: 'Uso general robusto'
    },
    chapter: {
        id: 'chapter',
        name: '📖 Por capítulos',
        func: 'chapter()',
        desc: '📖 Detecta capítulos con patrones multiidioma (Capítulo, Chapter, etc.). Usa detectChapters() con regex avanzados.',
        lib: 'Nativo',
        use: 'Libros largos, novelas'
    },
    scene: {
        id: 'scene',
        name: '🎬 Por escenas',
        func: 'scene()',
        desc: '🎬 Identifica cambios de escena por pausas largas o encabezados. Útil para narrativa.',
        lib: 'Nativo',
        use: 'Narrativa con escenas claras'
    },
    dialogue: {
        id: 'dialogue',
        name: '💬 Diálogos',
        func: 'dialogue()',
        desc: '💬 Segmenta por diálogos y cambios de speaker. Detecta patrones "Nombre:" y comillas.',
        lib: 'Nativo',
        use: 'Conversaciones, guiones'
    },
    paragraph: {
        id: 'paragraph',
        name: '📄 Por párrafos',
        func: 'paragraph()',
        desc: '📄 División por párrafos (doble salto de línea). Método simple y efectivo.',
        lib: 'Nativo',
        use: 'Artículos, ensayos'
    },
    sentence: {
        id: 'sentence',
        name: '✏️ Por oraciones',
        func: 'sentence()',
        desc: '✏️ Divide por oraciones usando puntuación (.!?).',
        lib: 'compromise.js / Nativo',
        use: 'Textos cortos, Q/A'
    },
    headers: {
        id: 'headers',
        name: '📑 Encabezados',
        func: 'headers()',
        desc: '📑 Usa encabezados Markdown (#, ##) para estructurar el contenido.',
        lib: 'Nativo',
        use: 'Documentación, apuntes'
    },
    semantic: {
        id: 'semantic',
        name: '🔍 Semántico',
        func: 'semantic()',
        desc: '🔍 Similitud Jaccard (intersección/unión de palabras) para mantener cohesión temática.',
        lib: 'Nativo',
        use: 'Textos con temas cambiantes'
    },
    tfidf: {
        id: 'tfidf',
        name: '🧮 TF-IDF',
        func: 'tfidf()',
        desc: '🧮 TF-IDF + Cosine Similarity para detectar cambios semánticos reales.',
        lib: 'Nativo',
        use: 'Artículos complejos'
    },
    topic: {
        id: 'topic',
        name: '🎯 Tópicos',
        func: 'topic()',
        desc: '🎯 Agrupa por keywords compartidas (overlap) para mantener temas.',
        lib: 'Nativo',
        use: 'Contenido temático'
    },
    nlp: {
        id: 'nlp',
        name: '🧠 NLP (Compromise)',
        func: 'nlp()',
        desc: '🧠 Usa compromise.js para análisis lingüístico con entidades y contexto.',
        lib: 'compromise.js',
        use: 'Textos con entidades relevantes'
    },
    fixed: {
        id: 'fixed',
        name: '📏 Tamaño fijo',
        func: 'fixed()',
        desc: '📏 Corta estrictamente cada N caracteres. Puede romper oraciones.',
        lib: 'Nativo',
        use: 'APIs con límites estrictos'
    },
    wordlist: {
        id: 'wordlist',
        name: '📝 Wordlist',
        func: 'wordlist()',
        desc: '📝 Una línea = un término. Ideal para vocabulario.',
        lib: 'Nativo',
        use: 'Listas de palabras'
    },
    none: {
        id: 'none',
        name: '📋 JSON externo',
        func: 'none()',
        desc: '📋 JSON pre-segmentado con estructura {chunks: [...]}.',
        lib: 'Nativo',
        use: 'Datos ya chunkedos'
    }
};

const ChunkStrategies = {
        chapter(text, options) {
            // Detectar capitulos usando patterns multiidioma
            const lines = text.split('\n');
            const chapters = [];
            const patterns = [
                /^Cap[ii]tulo\s+\d+/i,
                /^Cap[ii]tulo\s+[IVXLCDM]+/i,
                /^CAPiTULO\s+\d+/i,
                /^Chapter\s+\d+/i,
                /^CHAPTER\s+\d+/i,
                /^Chapter\s+[IVXLCDM]+/i,
                /^\d+\.\s+[A-Z]/,
                /^[A-ZaeiouÑ][A-ZaeiouÑ\s]{3,30}$/
            ];
            
            let currentChapter = [];
            let chapterTitle = '';
            
            lines.forEach((line, idx) => {
                const trimmed = line.trim();
                const isChapterStart = patterns.some(p => p.test(trimmed)) && trimmed.length < 100;
                
                if (isChapterStart) {
                    if (currentChapter.length > 0) {
                        chapters.push({
                            title: chapterTitle,
                            text: currentChapter.join('\n').trim()
                        });
                    }
                    chapterTitle = trimmed;
                    currentChapter = [];
                } else {
                    currentChapter.push(line);
                }
            });
            
            if (currentChapter.length > 0) {
                chapters.push({
                    title: chapterTitle || 'Capitulo sin titulo',
                    text: currentChapter.join('\n').trim()
                });
            }
            
            return chapters.length > 0 ? chapters.map(c => c.text) : [text];
        },
        
        sentence(text, options) {
            let sentences = [];
            
            // 1. Obtener oraciones usando compromise.js o regex
            if (typeof nlp !== 'undefined') {
                try {
                    const doc = nlp(text);
                    sentences = doc.sentences().out('array');
                } catch (e) {
                    console.warn('Error en compromise.js, fallback a regex', e);
                }
            }
            
            if (!sentences || sentences.length === 0) {
                 sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)/g)?.map(s => s.trim()) || [text];
            }
            
            if (sentences.length === 0) return [text];

            // 2. Agrupar oraciones hasta alcanzar chunkSize
            const chunks = [];
            let currentChunk = [];
            let currentLength = 0;
            const targetSize = options.chunkSize || 1000;
            
            // Calcular overlap en caracteres aproximado para decidir cuanto retroceder
            // O mas simple: overlap en numero de oraciones si son cortas?
            // El usuario pide overlap en %, asumimos % de caracteres.
            
            // Estrategia simple de agrupacion secuencial
            for (let i = 0; i < sentences.length; i++) {
                const sent = sentences[i];
                
                // Si una sola oracion es gigante, la partimos (usando fixed o paragraph logic como fallback para esa oracion)
                if (sent.length > targetSize * 1.5) {
                    if (currentChunk.length > 0) {
                        chunks.push(currentChunk.join(' '));
                        currentChunk = [];
                        currentLength = 0;
                    }
                    // Partir oracion gigante
                    chunks.push(...this.fixed(sent, options));
                    continue;
                }

                if (currentLength + sent.length > targetSize && currentChunk.length > 0) {
                    // Cerrar chunk actual
                    const chunkText = currentChunk.join(' ');
                    chunks.push(chunkText);
                    
                    // Manejar solapamiento para el siguiente chunk
                    const overlapPercent = (options.chunkOverlap || 0) / 100;
                    if (overlapPercent > 0) {
                         // Mantener las ultimas oraciones que sumen aprox overlapPercent * targetSize
                         const overlapTarget = targetSize * overlapPercent;
                         let overlapCurrent = 0;
                         let overlapSentences = [];
                         
                         // Retroceder desde el final del chunk actual
                         for (let j = currentChunk.length - 1; j >= 0; j--) {
                             if (overlapCurrent + currentChunk[j].length < overlapTarget) {
                                 overlapSentences.unshift(currentChunk[j]);
                                 overlapCurrent += currentChunk[j].length;
                             } else {
                                 // Incluir al menos una si cabe o si overlap es muy grande
                                 if (overlapSentences.length === 0) overlapSentences.unshift(currentChunk[j]);
                                 break;
                             }
                         }
                         currentChunk = overlapSentences;
                         currentLength = overlapCurrent;
                    } else {
                        currentChunk = [];
                        currentLength = 0;
                    }
                }
                
                currentChunk.push(sent);
                currentLength += sent.length + 1; // +1 por espacio
            }
            
            if (currentChunk.length > 0) {
                chunks.push(currentChunk.join(' '));
            }
            
            return chunks;
        },
        
        scene(text, options) {
            // Detect scene changes in narrative
            const lines = text.split('\n');
            const scenes = [];
            
            // Chapter detection patterns
            const patterns = [
                // Spanish
                /^Cap[ii]tulo\s+\d+/i,
                /^Cap[ii]tulo\s+[IVXLCDM]+/i,
                /^CAPiTULO\s+\d+/i,
                // English
                /^Chapter\s+\d+/i,
                /^CHAPTER\s+\d+/i,
                /^Chapter\s+[IVXLCDM]+/i,
                // Numbered sections
                /^\d+\.\s+[A-Z]/,
                // All caps titles (short, likely headings)
                /^[A-ZaeiouÑ][A-ZaeiouÑ\s]{3,30}$/
            ];
            
            let currentScene = null;
            let chapterLines = [];

            lines.forEach((line, idx) => {
                const trimmed = line.trim();
                
                // Check for explicit scene markers
                const isSceneBreak = patterns.some(pattern => pattern.test(trimmed));
                
                if (isSceneBreak && trimmed.length < 100) {
                    // Save previous scene
                    if (currentScene) {
                        scenes.push(currentScene.join('\n').trim());
                    }

                    // Start new scene
                    currentScene = [trimmed];
                    chapterLines = [];
                } else {
                    if (!currentScene) {
                        currentScene = [];
                    }
                    currentScene.push(line);

                    // Detect long pauses that might indicate scene change
                    if (currentScene.length > 10 && !trimmed && idx > 0) {
                        const chunkText = currentScene.join('\n').trim();
                        if (chunkText.length >= options.chunkSize * 0.8) {
                            scenes.push(chunkText);
                            currentScene = [];
                        }
                    }
                }
            });

            if (Array.isArray(currentScene) && currentScene.length > 0) {
                scenes.push(currentScene.join('\n').trim());
            }
            
            return scenes.filter(s => s.length >= (options.minChunkSize || 100));
        },
        
        topic(text, options) {
            // Advanced topic-based chunking using keyword extraction
            const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)/g)?.map(s => s.trim()) || [text];
            
            if (sentences.length < 2) return sentences;
            
            // Extract keywords from each sentence (content words > 4 chars)
            const getKeywords = (sent) => {
                const words = sent.toLowerCase().match(/\b\w{5,}\b/g) || [];
                const stopwords = new Set(['sobre', 'despues', 'entonces', 'ademas', 'tambien', 'about', 'after', 'then', 'however', 'therefore']);
                return new Set(words.filter(w => !stopwords.has(w)));
            };
            
            const topics = [];
            let currentTopic = {
                sentences: [sentences[0]],
                keywords: getKeywords(sentences[0])
            };
            
            for (let i = 1; i < sentences.length; i++) {
                const sentKeywords = getKeywords(sentences[i]);
                
                // Calculate keyword overlap with current topic
                const overlap = [...currentTopic.keywords].filter(k => sentKeywords.has(k)).length;
                const totalKeywords = Math.max(currentTopic.keywords.size, sentKeywords.size);
                const similarity = totalKeywords > 0 ? overlap / totalKeywords : 0;
                
                // Check if current chunk is getting too long
                const currentLength = currentTopic.sentences.join(' ').length;
                
                if (similarity >= 0.15 && currentLength < options.chunkSize * 1.5) {
                    // Same topic, add to current
                    currentTopic.sentences.push(sentences[i]);
                    currentTopic.keywords = new Set([...currentTopic.keywords, ...sentKeywords]);
                } else {
                    // New topic or chunk too long
                    if (currentTopic.sentences.length > 0) {
                        topics.push(currentTopic.sentences.join(' '));
                    }
                    currentTopic = {
                        sentences: [sentences[i]],
                        keywords: sentKeywords
                    };
                }
            }
            
            if (currentTopic.sentences.length > 0) {
                topics.push(currentTopic.sentences.join(' '));
            }
            
            return topics.filter(t => t.length >= (options.minChunkSize || 100));
        },

        nlp(text, options) {
            // Validar que Compromise.js esta cargado
            if (typeof window.nlp === 'undefined' || !window.nlp) {
                console.warn('Compromise.js no disponible, usando fallback');
                return this.paragraph(text, options);
            }
            const nlp = window.nlp;
            
            const doc = nlp(text);
            const sentences = doc.sentences().out('array');
            
            if (sentences.length < 2) return sentences;
            
            const chunks = [];
            let current = {
                sentences: [sentences[0]],
                entities: new Set(nlp(sentences[0]).people().concat(nlp(sentences[0]).places()).out('array'))
            };
            
            for (let i = 1; i < sentences.length; i++) {
                const sentDoc = nlp(sentences[i]);
                const sentEntities = new Set(sentDoc.people().concat(sentDoc.places()).out('array'));
                
                // Si comparte entidades, mismo chunk
                const sharedEntities = [...current.entities].filter(e => sentEntities.has(e));
                const currentLength = current.sentences.join(' ').length;
                
                if (sharedEntities.length > 0 && currentLength < options.chunkSize * 1.5) {
                    current.sentences.push(sentences[i]);
                    sentEntities.forEach(e => current.entities.add(e));
                } else {
                    // Nuevo chunk
                    if (current.sentences.length > 0) {
                        chunks.push(current.sentences.join(' '));
                    }
                    current = {
                        sentences: [sentences[i]],
                        entities: sentEntities
                    };
                }
            }
            
            if (current.sentences.length > 0) {
                chunks.push(current.sentences.join(' '));
            }
            
            return chunks.filter(c => c.length >= (options.minChunkSize || 100));
        },
        
        paragraph(text, options) {
            const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
            
            // Subdivide giant paragraphs
            return paragraphs.flatMap(para => {
                if (para.length <= options.chunkSize * 2) return [para];
                
                const chunks = [];
                const overlapChars = Math.floor(options.chunkSize * (options.chunkOverlap / 100));
                const step = Math.max(1, options.chunkSize - overlapChars);
                
                for (let i = 0; i < para.length; i += step) {
                    chunks.push(para.substring(i, i + options.chunkSize));
                }
                return chunks;
            });
        },
        
        headers(text, options) {
            // Split by markdown headers or caps headings
            return text.split(/(?=^#{1,6}\s|^[A-Z][A-Z\s]+$)/m).filter(p => p.trim());
        },
        
        fixed(text, options) {
            const chunks = [];
            const overlapChars = Math.floor(options.chunkSize * (options.chunkOverlap / 100));
            const step = Math.max(1, options.chunkSize - overlapChars);
            
            for (let i = 0; i < text.length; i += step) {
                chunks.push(text.substring(i, i + options.chunkSize));
            }
            return chunks;
        },
        
        async langchain(text, options) {
            // Verificar que LangChain este cargado
            if (typeof window.LangChainSplitter === 'undefined') {
                console.warn('LangChain no disponible, usando metodo paragraph como fallback');
                return this.paragraph(text, options);
            }
            
            try {
                const overlapChars = Math.floor(options.chunkSize * (options.chunkOverlap / 100));
                
                // Crear splitter con separadores priorizados
                const splitter = new window.LangChainSplitter({
                    chunkSize: options.chunkSize || 500,
                    chunkOverlap: overlapChars || 50,
                    separators: ["\n\n", "\n", ". ", "! ", "? ", "; ", ", ", " ", ""]
                });
                
                // splitText es async en LangChain
                const chunks = await splitter.splitText(text);
                return chunks.filter(c => c.trim().length >= (options.minChunkSize || 50));
            } catch (error) {
                console.error('Error en LangChain splitter:', error);
                return this.paragraph(text, options);
            }
        },

        async prepareChunks(text, template, executionContext, runtimeMetadata) {
            const originalOptions = { ...State.pipeline.options };
            State.pipeline.options.chunkMethod = executionContext.options.chunkMethod || originalOptions.chunkMethod;
            State.pipeline.options.chunkSize = executionContext.options.chunkSize || originalOptions.chunkSize;
            State.pipeline.options.chunkOverlap = executionContext.options.chunkOverlap || originalOptions.chunkOverlap;

            const chunkTexts = (await this.chunk(text)).map(chunk => chunk.trim()).filter(Boolean);
            Object.assign(State.pipeline.options, originalOptions);

            const totalChunks = chunkTexts.length || 1;
            const contextConfig = State.pipelineRuntime?.contextInjectConfig;

            return chunkTexts.map((chunkText, index) => {
                const metadata = this.buildChunkMetadata(template, runtimeMetadata, index, totalChunks, executionContext);
                const contextualText = this.composeChunkText(chunkTexts, index, chunkText, metadata, contextConfig);
                return {
                    text: contextualText,
                    rawText: chunkText,
                    metadata
                };
            });
        },

        buildChunkMetadata(template, runtimeMetadata, index, totalChunks, executionContext) {
            const baseVariables = JSON.parse(JSON.stringify(template?.variables || {}));
            const metadata = {
                ...baseVariables,
                ...runtimeMetadata,
                chunkIndex: index + 1,
                totalChunks,
                templateName: template?.name,
                source: executionContext.profile,
                manualContext: baseVariables.manualContext || runtimeMetadata?.manualContext || '',
                generatedAt: new Date().toISOString()
            };

            if (!metadata.bookTitle && runtimeMetadata?.bookTitle) {
                metadata.bookTitle = runtimeMetadata.bookTitle;
            }

            metadata.chunkPreview = metadata.chunkPreview || '';
            metadata.manualContext = metadata.manualContext || '';
            return metadata;
        },

        composeChunkText(chunkTexts, index, chunkText, metadata, contextConfig) {
            const sections = [];
            if (metadata.manualContext) {
                sections.push(`Contexto manual:\n${metadata.manualContext}`);
            }

            const injected = this.buildInjectedContext(chunkTexts, index, contextConfig);
            if (injected) {
                metadata.injectedContext = injected;
                sections.push(injected);
            }

            sections.push(`Fragmento:\n${chunkText}`);
            return sections.join('\n\n').trim();
        },

        buildInjectedContext(chunkTexts, index, contextConfig) {
            if (!contextConfig) return '';
            const window = typeof contextConfig.contextWindow === 'number' ? contextConfig.contextWindow : 2;
            const start = Math.max(0, index - window);
            const contextSlices = chunkTexts.slice(start, index).filter(Boolean);
            if (!contextSlices.length) return '';
            const label = contextConfig.template || 'Contexto relevante:';
            const summary = contextSlices.join('\n').trim();
            if (!summary) return '';
            return `${label}\n${summary}`;
        },

        async runChainForChunk(chainInstance, descriptor) {
            const chainResult = await chainInstance.run({
                chunkText: descriptor.text,
                chunkIndex: descriptor.metadata.chunkIndex,
                metadata: descriptor.metadata
            });

            if (chainResult?.metrics) {
                Results.recordChainMetrics(chainResult.metrics);
            }

            ChainVisualization.recordRun({
                chunkIndex: descriptor.metadata.chunkIndex,
                chunkTitle: descriptor.metadata.chapterTitle || descriptor.metadata.templateName || `Chunk ${descriptor.metadata.chunkIndex}`,
                textPreview: descriptor.text.substring(0, 200),
                executionLog: chainResult.executionLog || [],
                metrics: chainResult.metrics || {}
            });

            return this.normalizeChainOutput(chainResult.state);
        },

        async runSingleShotChunk(descriptor, executionContext, template) {
            const metadata = descriptor.metadata;
            const systemPrompt = Templates.interpolate(template.systemPrompt, metadata);
            const userPrompt = Templates.interpolate(template.userPrompt, {
                ...metadata,
                text: descriptor.text
            });

            const overrides = {
                temperature: executionContext.options.temperature,
                top_p: State.config.hyperparams.top_p,
                top_k: State.config.hyperparams.top_k
            };

            const result = await API.call(systemPrompt, userPrompt, overrides);
            if (!result.success) {
                throw new Error(result.error || 'API call failed');
            }

            const flashcard = Processing.parseFlashcard(result.content, metadata.chunkIndex, metadata);
            flashcard.metadata = {
                ...(flashcard.metadata || {}),
                ...metadata
            };

            return [flashcard];
        },

        normalizeChainOutput(state) {
            if (!state) return [];
            if (Array.isArray(state)) return state;
            if (Array.isArray(state.flashcards)) return state.flashcards;
            if (state.flashcard) return [state.flashcard];
            return [];
        },

        getMethodInfo(method) {
            return chunkMethodMetadata[method] || null;
        },

        getMethods() {
            return Object.values(chunkMethodMetadata);
        },

        wordlist(text, options) {
            return text.split(/\n/).map(w => w.trim()).filter(w => w);
        },
        
        none(text, options) {
            try {
                const parsed = JSON.parse(text);
                if (parsed.chunks && Array.isArray(parsed.chunks)) {
                    return parsed.chunks.map(c => typeof c === 'string' ? c : c.text);
                }
            } catch (e) {
                UI.toast('❌ Error parseando JSON', 'error');
            }
            return [text];
        },
        
        semantic(text, options) {
            const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)/g)?.map(s => s.trim()) || [text];
            const threshold = options.semanticThreshold || 0.75;
            
            if (sentences.length < 2) return sentences;
            
            const chunks = [];
            let currentChunk = [sentences[0]];
            
            for (let i = 1; i < sentences.length; i++) {
                const similarity = this.computeSimilarity(
                    currentChunk[currentChunk.length - 1],
                    sentences[i]
                );
                
                if (similarity >= threshold) {
                    currentChunk.push(sentences[i]);
                } else {
                    chunks.push(currentChunk.join(' '));
                    currentChunk = [sentences[i]];
                }
            }
            if (currentChunk.length > 0) chunks.push(currentChunk.join(' '));
            
            return chunks;
        },
        
        computeSimilarity(text1, text2) {
            const words1 = new Set(text1.toLowerCase().match(/\b\w+\b/g) || []);
            const words2 = new Set(text2.toLowerCase().match(/\b\w+\b/g) || []);
            
            const intersection = new Set([...words1].filter(x => words2.has(x)));
            const union = new Set([...words1, ...words2]);
            
            return union.size > 0 ? intersection.size / union.size : 0;
        },
        
        tfidf(text, options) {
            const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)/g)?.map(s => s.trim()) || [text];
            if (sentences.length < 3) return sentences;

            // TF-IDF simplificado
            const getTermFreq = (sent) => {
                const words = sent.toLowerCase().match(/\b[a-zaeiouñ]{4,}\b/g) || [];
                const freq = {};
                words.forEach(w => freq[w] = (freq[w] || 0) + 1);
                return freq;
            };

            const allTerms = new Set();
            const sentTerms = sentences.map(s => {
                const tf = getTermFreq(s);
                Object.keys(tf).forEach(t => allTerms.add(t));
                return tf;
            });

            // IDF
            const idf = {};
            allTerms.forEach(term => {
                const docsWithTerm = sentTerms.filter(st => st[term]).length;
                idf[term] = Math.log(sentences.length / (docsWithTerm + 1));
            });

            // TF-IDF vectors
            const vectors = sentTerms.map(tf => {
                const vec = {};
                Object.keys(tf).forEach(term => {
                    vec[term] = tf[term] * idf[term];
                });
                return vec;
            });

            // Cosine similarity entre vectores consecutivos
            const cosineSim = (v1, v2) => {
                const terms = new Set([...Object.keys(v1), ...Object.keys(v2)]);
                let dot = 0, mag1 = 0, mag2 = 0;
                terms.forEach(t => {
                    const val1 = v1[t] || 0;
                    const val2 = v2[t] || 0;
                    dot += val1 * val2;
                    mag1 += val1 * val1;
                    mag2 += val2 * val2;
                });
                return dot / (Math.sqrt(mag1) * Math.sqrt(mag2) + 1e-10);
            };

            // Detectar cambios de tema por drops en similaridad
            const chunks = [];
            let current = [sentences[0]];
            
            for (let i = 1; i < sentences.length; i++) {
                const sim = cosineSim(vectors[i-1], vectors[i]);
                const currentLen = current.join(' ').length;
                
                // Threshold adaptativo basado en longitud
                const threshold = currentLen > options.chunkSize * 0.5 ? 0.3 : 0.2;
                
                if (sim < threshold || currentLen > options.chunkSize * 1.5) {
                    chunks.push(current.join(' '));
                    current = [sentences[i]];
                } else {
                    current.push(sentences[i]);
                }
            }
            
            if (current.length) chunks.push(current.join(' '));
            
            return chunks.filter(c => c.length >= options.minChunkSize);
        }
    };


// Exponer globalmente
if (typeof window !== 'undefined') {
    window.ChunkStrategies = ChunkStrategies;
}

// Exports
export { ChunkStrategies };
export default ChunkStrategies;
