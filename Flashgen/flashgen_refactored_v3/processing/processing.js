/**
 * Modulo: Processing
 * Categoria: processing
 * Extraido de: Flashgen.js (lineas 9682-9920)
 * Generado: 2025-11-28 09:49:00
 * 
 * Metodos: chunkSimple, tokenize, chunkWithSpacy, handleGenerationCancel, parseSchemaJson
 * Dependencias: ChunkStrategies, DebugLogger, State, UI
 */

import { ChunkStrategies } from './chunk_strategies.js';
import { DebugLogger } from '../ui/debug_logger.js';
import { State } from '../core/state.js';
import { UI } from '../ui/ui.js';

const Processing = {
        // ✅ FIX: Punto de entrada principal para generación
        async generate(text) {
            // Delegar al Pipeline principal
            const Pipeline = await import('../pipeline/pipeline.js').then(m => m.Pipeline || m.default);
            return await Pipeline.generate(text);
        },
        cleanJsonResponse(content = '') {
            return content
                .replace(/```json/gi, '```')
                .replace(/```/g, '')
                .trim();
        },
        parseSchemaJson(content) {
            if (!content) return null;
            try {
                return JSON.parse(this.cleanJsonResponse(content));
            } catch (error) {
                DebugLogger.log(`⚠️ JSON schema invalido: ${error.message}`, 'warning');
                return null;
            }
        },
        tokenize(text = '') {
            return text
                .toLowerCase()
                .split(/[^a-zaeiouüñ0-9]+/i)
                .filter(Boolean);
        },
        validateSourceFidelity(card, sourceText) {
            if (!card?.answer || !sourceText) return true;
            const sourceTokens = new Set(this.tokenize(sourceText));
            const answerTokens = this.tokenize(card.answer);
            if (!answerTokens.length || !sourceTokens.size) return true;
            const overlap = answerTokens.filter(token => sourceTokens.has(token)).length;
            const ratio = overlap / answerTokens.length;
            if (ratio < 0.4) {
                card.status = 'rejected';
                card.rejectReason = 'Alucinacion detectada (filtro lexico)';
                DebugLogger.log(`🚫 Filtro lexico rechazo card (${Math.round(ratio * 100)}% solapamiento)`, 'warning');
                return false;
            }
            return true;
        },
        handleGenerationCancel() {
            DebugLogger.log('⚠️ Generacion cancelada por usuario', 'warning');
            UI.toast('❌ Generacion cancelada');
            State.cancelGeneration = false;
            const cancelBtn = document.getElementById('cancelGenerationBtn');
            if (cancelBtn) cancelBtn.style.display = 'none';
            return true;
        },
        

        async chunk(text) {
            const method = State.pipeline.options.chunkMethod;
            
            // Validar que ChunkStrategies existe
            if (typeof ChunkStrategies === 'undefined') {
                console.error('ChunkStrategies no definido');
                return [];
            }
            
            const strategy = ChunkStrategies[method] || ChunkStrategies.paragraph;
            if (typeof strategy !== 'function') {
                console.error(`Estrategia de chunking no valida: ${method}`);
                return [];
            }
            
            // ✅ FIX #11: Asegurar que strategy se espera correctamente
            const rawChunks = await Promise.resolve(strategy(text, State.pipeline.options));
            return Array.isArray(rawChunks) ? rawChunks.map(chunk => chunk.trim()).filter(Boolean) : [];
        },

        chunkSimple(text, method, size) {
            switch (method) {
                case 'sentence':
                    return this.sentence(text, {
                        chunkSize: size,
                        chunkOverlap: State.pipeline.options.chunkOverlap || 0
                    });
                case 'paragraph':
                    return this.paragraph(text, {
                        chunkSize: size,
                        chunkOverlap: State.pipeline.options.chunkOverlap || 0
                    });
                case 'headers':
                    // Split by markdown headers or caps headings
                    return text.split(/(?=^#{1,6}\s|^[A-Z][A-Z\s]+$)/m).filter(p => p.trim());
                case 'wordlist':
                    return text.split(/\n/).map(w => w.trim()).filter(w => w);
                case 'none':
                    try {
                        const parsed = JSON.parse(text);
                        if (parsed.chunks && Array.isArray(parsed.chunks)) {
                            return parsed.chunks.map(c => typeof c === 'string' ? c : c.text);
                        }
                    } catch (e) {
                        UI.toast('❌ Error parseando JSON', 'error');
                    }
                    return [text];
                case 'fixed':
                    const chunks = [];
                    const overlapPercent = State.pipeline.options.chunkOverlap || 0;
                    const overlap = Math.floor(size * (overlapPercent / 100));
                    const step = Math.max(1, size - overlap);
                    for (let i = 0; i < text.length; i += step) {
                        chunks.push(text.substring(i, i + size));
                    }
                    return chunks;
                default:
                    return [text];
            }
        },

        chunkWithSpacy(text, method) {
            // Simulated spaCy-like chunking using linguistic patterns
            const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)/g)?.map(s => s.trim()) || [text];
            
            switch (method) {
                case 'sentence':
                    return sentences;
                case 'paragraph':
                    // Group sentences by topic transitions (capitalized words, conjunctions)
                    const paragraphs = [];
                    let current = [];
                    sentences.forEach((sent, i) => {
                        current.push(sent);
                        const nextSent = sentences[i + 1];
                        // Detect paragraph break: next starts with capital after period, or "However", "Furthermore", etc.
                        if (!nextSent || /^(However|Furthermore|Moreover|Additionally|In addition|Therefore|Thus)/i.test(nextSent)) {
                            paragraphs.push(current.join(' '));
                            current = [];
                        }
                    });
                    if (current.length > 0) paragraphs.push(current.join(' '));
                    return paragraphs;
                case 'entity':
                    // Group by named entity patterns (capitalized sequences)
                    return this.groupByEntities(text);
                case 'topic':
                    // Topic-based: group sentences with similar vocabulary
                    return this.groupByTopic(sentences);
                default:
                    return sentences;
            }
        },

        chunkWithBQN(text, method) {
            // BQN-inspired array-based chunking (fast splitting)
            const lines = text.split('\n');
            
            switch (method) {
                case 'paragraph':
                    const paragraphs = [];
                    let para = [];
                    lines.forEach(line => {
                        if (line.trim()) {
                            para.push(line);
                        } else if (para.length > 0) {
                            paragraphs.push(para.join('\n'));
                            para = [];
                        }
                    });
                    if (para.length > 0) paragraphs.push(para.join('\n'));
                    return paragraphs;
                case 'sentence':
                    return text.match(/[^.!?]+[.!?]+(?:\s|$)/g)?.map(s => s.trim()) || [text];
                default:
                    return this.chunkSimple(text, method, State.pipeline.options.chunkSize);
            }
        },

        async extractPdfText(file) {
            // PDF.js integration with structure preservation
            UI.showImportStatus('📕 Extrayendo texto del PDF...');
            
            try {
                // Check if PDF.js is loaded
                if (typeof pdfjsLib === 'undefined') {
                    await this.loadPdfJs();
                }
                
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                
                let fullText = '';
                const pageTexts = [];
                
                for (let i = 1; i <= pdf.numPages; i++) {
                    UI.showImportStatus(`📕 Procesando pagina ${i}/${pdf.numPages}...`);
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    
                    // Preserve line structure
                    let pageText = '';
                    let lastY = null;
                    
                    textContent.items.forEach((item, idx) => {
                        const y = item.transform[5];
                        
                        // Detect line breaks by Y position changes
                        if (lastY !== null && Math.abs(lastY - y) > 5) {
                            pageText += '\n';
                        } else if (idx > 0 && item.str.trim()) {
                            pageText += ' ';
                        }
                        
                        pageText += item.str;
                        lastY = y;
                    });
                    
                    pageTexts.push({
                        pageNum: i,
                        text: pageText.trim()
                    });
                    
                    fullText += pageText + '\n\n';
                }
                
                // Store page information for later use
                State.pdfMetadata = {
                    filename: file.name,
                    numPages: pdf.numPages,
                    pages: pageTexts
                };
                
                UI.showImportStatus(`✅ PDF procesado: ${pdf.numPages} paginas con estructura preservada`);
                return fullText;
            } catch (error) {
                UI.showImportStatus('❌ Error extrayendo PDF: ' + error.message);
                return `[PDF no soportado en este navegador. Usa herramienta externa para extraer texto]\n\nArchivo: ${file.name}`;
            }
        },

        async loadPdfJs() {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
                script.onload = () => {
                    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                    resolve();
                };
                script.onerror = reject;
                document.head.appendChild(script);
            });
        },

        async extractWordList(text) {
            // Extractor simple de listas de palabras
            // Formato esperado: una palabra por línea o separadas por comas
            DebugLogger.log('📝 Procesando lista de palabras', 'info');
            
            const words = text
                .split(/[\n,;]/)
                .map(word => word.trim())
                .filter(word => word.length > 0 && word.length < 100);
            
            DebugLogger.log(`✅ ${words.length} palabras detectadas`, 'success');
            return words.join('\n');
        },
        
        async extractDocxText(file) {
            UI.showImportStatus('📄 Extrayendo texto del DOCX...');
            
            try {
                if (typeof mammoth === 'undefined') {
                    await this.loadMammoth();
                }
                
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                
                UI.showImportStatus(`✅ DOCX procesado`);
                return result.value;
            } catch (error) {
                UI.showImportStatus('❌ Error extrayendo DOCX: ' + error.message);
                return `[DOCX no soportado]\n\nArchivo: ${file.name}`;
            }
        },

        async loadMammoth() {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

    };



// Exponer globalmente
if (typeof window !== 'undefined') {
    window.Processing = Processing;
}

// Exports
export { Processing };
export default Processing;
