from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import spacy
from typing import Optional
import os

class TextPayload(BaseModel):
    text: str
    lang: str  # "en", "es" o "fr"
    strategy: Optional[str] = "sentences"  # "sentences", "entities", "noun_chunks", "semantic_similarity"

app = FastAPI()

# Configurar CORS para permitir peticiones desde el navegador
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En produccion, especificar dominios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cargar modelos LG con vectores word2vec
print("🔄 Cargando modelos spaCy...")
models = {
    "en": spacy.load("en_core_web_lg"),
    "es": spacy.load("es_core_news_lg"),
    "fr": spacy.load("fr_core_news_lg")
}
print("✅ Modelos cargados correctamente")

def segment_by_sentences(doc):
    """Segmentacion por oraciones (doc.sents)"""
    return [sent.text.strip() for sent in doc.sents if sent.text.strip()]

def segment_by_entities(doc):
    """Segmentacion agrupando por entidades nombradas"""
    chunks = []
    current_chunk = []
    
    for token in doc:
        current_chunk.append(token.text)
        if token.ent_iob_ == "B" and len(current_chunk) > 1:
            chunks.append(" ".join(current_chunk[:-1]))
            current_chunk = [token.text]
    
    if current_chunk:
        chunks.append(" ".join(current_chunk))
    
    return [c.strip() for c in chunks if c.strip()]

def segment_by_noun_chunks(doc):
    """Segmentacion por sintagmas nominales (noun chunks)"""
    chunks = []
    for nc in doc.noun_chunks:
        # Agregar contexto: noun chunk + verbo siguiente si existe
        start = nc.start
        end = min(nc.end + 3, len(doc))  # +3 tokens de contexto
        chunk_text = doc[start:end].text
        chunks.append(chunk_text.strip())
    
    return [c for c in chunks if c]

def segment_by_semantic_similarity(doc, threshold=0.7):
    """Segmentacion usando similitud semantica con vectores"""
    if not doc.has_vector:
        # Fallback a oraciones si no hay vectores
        return segment_by_sentences(doc)
    
    sentences = list(doc.sents)
    if len(sentences) <= 1:
        return [s.text for s in sentences]
    
    chunks = []
    current_chunk = [sentences[0]]
    
    for i in range(1, len(sentences)):
        prev_sent = current_chunk[-1]
        curr_sent = sentences[i]
        
        # Calcular similitud coseno entre vectores de oraciones
        if prev_sent.has_vector and curr_sent.has_vector:
            similarity = prev_sent.similarity(curr_sent)
            
            if similarity >= threshold:
                # Alta similitud -> agregar a chunk actual
                current_chunk.append(curr_sent)
            else:
                # Baja similitud -> crear nuevo chunk
                chunks.append(" ".join([s.text for s in current_chunk]))
                current_chunk = [curr_sent]
        else:
            # Sin vectores, agrupar por defecto
            current_chunk.append(curr_sent)
    
    # Agregar ultimo chunk
    if current_chunk:
        chunks.append(" ".join([s.text for s in current_chunk]))
    
    return [c.strip() for c in chunks if c.strip()]

def detect_chapters(text):
    """Detecta capitulos en el texto usando patrones comunes"""
    import re
    chapters = []
    
    # Patrones para detectar capitulos (multiidioma)
    patterns = [
        r'^(Chapter|CHAPTER|Capitulo|CAPiTULO|Chapitre|CHAPITRE)\s+(\d+|[IVXLCDM]+)',
        r'^(\d+)\.\s+[A-Z]',  # "1. Introduccion"
        r'^[IVXLCDM]+\.\s+[A-Z]'  # "I. Introduction"
    ]
    
    lines = text.split('\n')
    current_chapter = {'title': 'Inicio', 'start': 0, 'text': ''}
    
    for i, line in enumerate(lines):
        line_stripped = line.strip()
        if not line_stripped:
            continue
            
        # Verificar si es un titulo de capitulo
        is_chapter = False
        for pattern in patterns:
            if re.match(pattern, line_stripped):
                is_chapter = True
                break
        
        if is_chapter and current_chapter['text']:
            # Guardar capitulo anterior
            chapters.append(current_chapter)
            # Iniciar nuevo capitulo
            current_chapter = {'title': line_stripped, 'start': i, 'text': ''}
        else:
            current_chapter['text'] += line + '\n'
    
    # Agregar ultimo capitulo
    if current_chapter['text']:
        chapters.append(current_chapter)
    
    return chapters if len(chapters) > 1 else [{'title': 'Documento completo', 'text': text, 'start': 0}]

def segment_chapter_sents(text, doc, chunk_size=500, lang='es'):
    """
    CHAPTER_SENTS: Para libros tecnicos/estudio
    Respeta estructura de capitulos + segmentacion fina por oraciones
    """
    chapters = detect_chapters(text)
    chunks = []
    
    for chapter in chapters:
        # Procesar texto del capitulo con spaCy usando el idioma especificado
        chapter_doc = models.get(lang, models.get('es'))(chapter['text'])
        
        # Agrupar oraciones hasta chunk_size
        current_chunk = []
        current_size = 0
        
        for sent in chapter_doc.sents:
            sent_text = sent.text.strip()
            if not sent_text:
                continue
                
            sent_size = len(sent_text)
            
            if current_size + sent_size > chunk_size and current_chunk:
                chunks.append({
                    'text': ' '.join(current_chunk),
                    'metadata': {'chapter': chapter['title'], 'type': 'chapter_sents'}
                })
                current_chunk = [sent_text]
                current_size = sent_size
            else:
                current_chunk.append(sent_text)
                current_size += sent_size
        
        if current_chunk:
            chunks.append({
                'text': ' '.join(current_chunk),
                'metadata': {'chapter': chapter['title'], 'type': 'chapter_sents'}
            })
    
    return chunks

def segment_entity_context(doc, context_window=1):
    """
    ENTITY_CONTEXT: Para biografias/historia/noticias
    Segmenta por entidades + contexto (oraciones vecinas)
    """
    chunks = []
    processed_sents = set()
    sentences = list(doc.sents)
    
    for ent in doc.ents:
        # Filtrar solo entidades relevantes
        if ent.label_ not in ['PERSON', 'ORG', 'GPE', 'LOC', 'DATE', 'EVENT', 'NORP']:
            continue
        
        # Encontrar indice de la oracion de la entidad
        sent = ent.sent
        try:
            sent_idx = sentences.index(sent)
        except ValueError:
            continue
        
        if sent_idx in processed_sents:
            continue
        
        # Contexto: oracion anterior + actual + siguiente
        start = max(0, sent_idx - context_window)
        end = min(len(sentences), sent_idx + context_window + 1)
        
        context_sents = sentences[start:end]
        chunk_text = ' '.join(s.text.strip() for s in context_sents)
        
        chunks.append({
            'text': chunk_text,
            'metadata': {
                'entity': ent.text,
                'entity_type': ent.label_,
                'main_sentence': sent.text.strip(),
                'type': 'entity_context'
            }
        })
        
        # Marcar oraciones como procesadas
        processed_sents.update(range(start, end))
    
    return chunks

def segment_semantic_blocks(doc, similarity_threshold=0.3):
    """
    SEMANTIC_BLOCKS: Para filosofia/ensayos densos
    Segmentacion semantica real con vectores (corta en cambios de tema)
    """
    sentences = list(doc.sents)
    if len(sentences) < 2:
        return [{'text': doc.text, 'metadata': {'type': 'semantic_blocks'}}]
    
    if not doc.has_vector:
        # Fallback a oraciones si no hay vectores
        return [{'text': s.text, 'metadata': {'type': 'semantic_blocks'}} for s in sentences]
    
    chunks = []
    current_block = [sentences[0]]
    
    for i in range(1, len(sentences)):
        prev_sent = sentences[i-1]
        curr_sent = sentences[i]
        
        # Calcular similitud semantica
        if prev_sent.has_vector and curr_sent.has_vector:
            similarity = prev_sent.similarity(curr_sent)
        else:
            similarity = 1.0  # Asumir alta similitud si no hay vectores
        
        current_length = sum(len(s.text) for s in current_block)
        
        # Cortar si: baja similitud O chunk muy largo (>600 chars)
        if similarity < similarity_threshold or current_length > 600:
            # Calcular similitud promedio del bloque
            avg_sim = 0.0
            if len(current_block) > 1:
                sims = []
                for j in range(len(current_block) - 1):
                    if current_block[j].has_vector and current_block[j+1].has_vector:
                        sims.append(current_block[j].similarity(current_block[j+1]))
                avg_sim = sum(sims) / len(sims) if sims else 0.0
            
            chunks.append({
                'text': ' '.join(s.text.strip() for s in current_block),
                'metadata': {
                    'avg_similarity': round(avg_sim, 3),
                    'num_sentences': len(current_block),
                    'type': 'semantic_blocks'
                }
            })
            current_block = [curr_sent]
        else:
            current_block.append(curr_sent)
    
    # Agregar ultimo bloque
    if current_block:
        chunks.append({
            'text': ' '.join(s.text.strip() for s in current_block),
            'metadata': {'type': 'semantic_blocks'}
        })
    
    return chunks

def segment_vocab_extract(doc, min_freq=2):
    """
    VOCAB_EXTRACT: Para aprendizaje de idiomas
    Extrae vocabulario clave (noun chunks + verbos) + contexto
    """
    chunks = []
    
    # 1. Extraer noun_chunks como terminos clave
    vocab_terms = {}
    for chunk in doc.noun_chunks:
        term = chunk.text.lower().strip()
        # Solo frases de 2+ palabras
        if len(term.split()) >= 2:
            if term not in vocab_terms:
                vocab_terms[term] = []
            vocab_terms[term].append(chunk.sent.text.strip())
    
    # 2. Extraer verbos importantes
    important_verbs = [token for token in doc 
                      if token.pos_ == 'VERB' 
                      and not token.is_stop
                      and len(token.text) > 4]
    
    # Chunks de vocabulario (terminos repetidos)
    for term, contexts in vocab_terms.items():
        if len(contexts) >= min_freq:
            chunks.append({
                'text': contexts[0],  # Primera aparicion
                'metadata': {
                    'term': term,
                    'vocab_type': 'noun_phrase',
                    'frequency': len(contexts),
                    'examples': contexts[:3],
                    'type': 'vocab_extract'
                }
            })
    
    # Chunks de verbos (acciones clave) - Top 20
    verb_chunks = {}
    for verb in important_verbs:
        lemma = verb.lemma_
        if lemma not in verb_chunks:
            verb_chunks[lemma] = verb.sent.text.strip()
    
    for lemma, sent_text in list(verb_chunks.items())[:20]:
        chunks.append({
            'text': sent_text,
            'metadata': {
                'term': lemma,
                'vocab_type': 'verb',
                'type': 'vocab_extract'
            }
        })
    
    return chunks

def extract_clause(verb):
    """
    Extrae todos los tokens que dependen del verbo (clausula completa)
    Recorre el subarbol de dependencias excluyendo conjunciones coordinantes
    """
    clause = [verb]
    
    def get_subtree(token):
        for child in token.children:
            # Excluir conjunciones coordinantes que inician nueva clausula
            if child.dep_ in ['cc', 'conj'] and child.pos_ == 'CCONJ':
                continue
            clause.append(child)
            get_subtree(child)
    
    get_subtree(verb)
    return clause

def split_by_conjunctions(tokens):
    """
    Si una clausula es muy larga, dividir por conjunciones coordinantes
    Busca: 'y', 'pero', 'mas', 'sino', 'o' (español) y 'and', 'but', 'or' (ingles)
    """
    sub_clauses = []
    current = []
    
    conjunctions = ['y', 'pero', 'mas', 'sino', 'o', 'and', 'but', 'or', 'yet']
    
    for token in sorted(tokens, key=lambda x: x.i):
        if token.text.lower() in conjunctions and len(current) > 5:
            sub_clauses.append(current)
            current = []
        else:
            current.append(token)
    
    if current:
        sub_clauses.append(current)
    
    return sub_clauses if len(sub_clauses) > 1 else [tokens]

def segment_clause(doc, max_tokens=15):
    """
    CLAUSE_SEGMENT: Para analisis sintactico profundo
    Segmenta en clausulas sintacticas (cada una con verbo principal)
    Usa el arbol de dependencias para extraer clausulas completas
    """
    chunks = []
    
    for sent in doc.sents:
        # Encontrar verbos principales (ROOT del arbol de dependencias)
        root_verbs = [token for token in sent if token.dep_ == 'ROOT']
        
        if not root_verbs:
            # Sin verbo principal, chunk completo
            chunks.append({
                'text': sent.text.strip(),
                'metadata': {
                    'type': 'complete',
                    'clause_type': 'no_verb'
                }
            })
            continue
        
        # Para cada verbo principal, extraer su clausula
        for verb in root_verbs:
            clause_tokens = extract_clause(verb)
            clause_text = ' '.join(t.text for t in sorted(clause_tokens, key=lambda x: x.i))
            
            # Si la clausula es muy larga, subdividir por conjunciones
            if len(clause_tokens) > max_tokens:
                sub_clauses = split_by_conjunctions(clause_tokens)
                for sub in sub_clauses:
                    sub_text = ' '.join(t.text for t in sorted(sub, key=lambda x: x.i))
                    chunks.append({
                        'text': sub_text.strip(),
                        'metadata': {
                            'type': 'sub_clause',
                            'verb': verb.lemma_,
                            'verb_pos': verb.pos_,
                            'num_tokens': len(sub)
                        }
                    })
            else:
                chunks.append({
                    'text': clause_text.strip(),
                    'metadata': {
                        'type': 'clause',
                        'verb': verb.lemma_,
                        'verb_pos': verb.pos_,
                        'num_tokens': len(clause_tokens)
                    }
                })
    
    return chunks

def segment_verb_phrase(doc, min_words=3):
    """
    VERB_PHRASE_SEGMENT: Para chunks pequeños con sentido
    Extrae sintagmas verbales (verbo + objeto directo + complementos basicos)
    Ideal para flashcards de acciones especificas
    """
    chunks = []
    processed_verbs = set()
    
    for sent in doc.sents:
        for token in sent:
            # Solo procesar verbos
            if token.pos_ != 'VERB':
                continue
            
            # Evitar duplicados
            verb_key = (token.i, token.text)
            if verb_key in processed_verbs:
                continue
            processed_verbs.add(verb_key)
            
            # Verbo + sus dependencias directas
            vp_tokens = [token]
            
            for child in token.children:
                # Objeto directo, indirecto, complementos, adverbios, negacion
                if child.dep_ in ['obj', 'dobj', 'iobj', 'obl', 'advmod', 'neg', 'aux', 'auxpass']:
                    vp_tokens.append(child)
                    # Añadir dependencias del objeto (articulos, adjetivos, etc.)
                    vp_tokens.extend(list(child.subtree))
            
            # Ordenar por posicion en el texto
            vp_tokens_unique = sorted(set(vp_tokens), key=lambda x: x.i)
            vp_text = ' '.join(t.text for t in vp_tokens_unique)
            
            # Filtrar por longitud minima
            if len(vp_text.split()) >= min_words:
                chunks.append({
                    'text': vp_text.strip(),
                    'metadata': {
                        'type': 'verb_phrase',
                        'verb': token.lemma_,
                        'verb_text': token.text,
                        'verb_pos': token.pos_,
                        'num_words': len(vp_text.split())
                    }
                })
    
    return chunks

@app.get("/")
def read_root():
    return {
        "service": "Flashgen spaCy NLP Server",
        "version": "3.0.0",
        "models": list(models.keys()),
        "model_details": {
            "en": "en_core_web_lg (transformer-based, 560MB)",
            "es": "es_core_news_lg (transformer-based, 560MB)",
            "fr": "fr_core_news_lg (transformer-based, 560MB)"
        },
        "endpoints": {
            "process": "Segmentacion avanzada con multiples estrategias",
            "enhance": "Enriquecimiento lingüistico neuronal (NER, sintaxis, semantica)",
            "validate": "Validacion de flashcards con analisis neuronal",
            "generate_cloze": "Generacion de ejercicios cloze con analisis sintactico"
        },
        "strategies": {
            "basic": ["sentences", "entities", "noun_chunks", "semantic_similarity"],
            "advanced": ["chapter_sents", "entity_context", "semantic_blocks", "vocab_extract", "clause_segment", "verb_phrase_segment"]
        },
        "descriptions": {
            "sentences": "Segmentacion por oraciones (doc.sents)",
            "entities": "Agrupacion por entidades nombradas",
            "noun_chunks": "Segmentacion por sintagmas nominales",
            "semantic_similarity": "Similitud semantica con vectores word2vec",
            "chapter_sents": "Capitulos + oraciones (libros tecnicos/estudio)",
            "entity_context": "Entidades + contexto (biografias/historia/noticias)",
            "semantic_blocks": "Bloques semanticos con vectores (filosofia/ensayos densos)",
            "vocab_extract": "Extraccion de vocabulario (aprendizaje de idiomas)",
            "clause_segment": "Clausulas sintacticas con arbol de dependencias",
            "verb_phrase_segment": "Sintagmas verbales con analisis sintactico profundo"
        },
        "neural_features": {
            "ner": "Named Entity Recognition con redes neuronales",
            "pos_tagging": "Part-of-Speech tagging con transformers",
            "dependency_parsing": "Analisis de dependencias sintacticas neuronal",
            "word_vectors": "Word embeddings (word2vec) para similitud semantica",
            "lemmatization": "Lematizacion basada en reglas + contexto neuronal"
        }
    }

@app.get("/test-connection")
def test_connection():
    """
    Endpoint de prueba para verificar la conexion con el servidor spaCy
    """
    return {
        "success": True,
        "message": "Conexion exitosa con el servidor spaCy",
        "version": "3.0.0",
        "models_loaded": list(models.keys()),
        "status": "online"
    }

@app.post("/process")
def process_text(payload: TextPayload):
    """
    Procesa texto con spaCy usando diferentes estrategias de segmentacion
    
    Estrategias basicas:
    - sentences: Segmentacion por oraciones (doc.sents)
    - entities: Segmentacion agrupando por entidades nombradas
    - noun_chunks: Segmentacion por sintagmas nominales
    - semantic_similarity: Segmentacion por similitud semantica (requiere vectores)
    
    Estrategias avanzadas:
    - chapter_sents: Capitulos + oraciones (libros tecnicos)
    - entity_context: Entidades + contexto (biografias/historia)
    - semantic_blocks: Bloques semanticos (filosofia/ensayos)
    - vocab_extract: Extraccion de vocabulario (idiomas)
    - clause_segment: Clausulas sintacticas (analisis gramatical profundo)
    - verb_phrase_segment: Sintagmas verbales (acciones especificas)
    """
    nlp = models.get(payload.lang)
    if not nlp:
        return {"error": f"Idioma no soportado: {payload.lang}. Disponibles: {list(models.keys())}"}
    
    try:
        # Procesar texto con spaCy
        doc = nlp(payload.text)
        
        # Extraer informacion base
        sentences = [s.text.strip() for s in doc.sents if s.text.strip()]
        entities = [(e.text, e.label_) for e in doc.ents]
        noun_chunks_list = [nc.text for nc in doc.noun_chunks]
        
        # Aplicar estrategia de segmentacion
        strategy = payload.strategy or "sentences"
        chunks_data = []
        
        # Estrategias basicas (retornan lista de strings)
        if strategy == "sentences":
            chunks_data = segment_by_sentences(doc)
        elif strategy == "entities":
            chunks_data = segment_by_entities(doc)
        elif strategy == "noun_chunks":
            chunks_data = segment_by_noun_chunks(doc)
        elif strategy == "semantic_similarity":
            chunks_data = segment_by_semantic_similarity(doc, threshold=0.7)
        
        # Estrategias avanzadas (retornan lista de dicts con text + metadata)
        elif strategy == "chapter_sents":
            chunks_data = segment_chapter_sents(payload.text, doc, chunk_size=500)
        elif strategy == "entity_context":
            chunks_data = segment_entity_context(doc, context_window=1)
        elif strategy == "semantic_blocks":
            chunks_data = segment_semantic_blocks(doc, similarity_threshold=0.3)
        elif strategy == "vocab_extract":
            chunks_data = segment_vocab_extract(doc, min_freq=2)
        elif strategy == "clause_segment":
            chunks_data = segment_clause(doc, max_tokens=15)
        elif strategy == "verb_phrase_segment":
            chunks_data = segment_verb_phrase(doc, min_words=3)
        else:
            chunks_data = segment_by_sentences(doc)  # Fallback
        
        # Normalizar formato de chunks
        if chunks_data and isinstance(chunks_data[0], dict):
            # Estrategias avanzadas: extraer texto y metadata
            chunks = [c['text'] for c in chunks_data]
            chunks_metadata = [c.get('metadata', {}) for c in chunks_data]
        else:
            # Estrategias basicas: solo texto
            chunks = chunks_data
            chunks_metadata = [{}] * len(chunks)
        
        return {
            "chunks": chunks,
            "chunks_metadata": chunks_metadata,
            "sentences": sentences,
            "entities": entities,
            "noun_chunks": noun_chunks_list,
            "stats": {
                "total_chunks": len(chunks),
                "total_sentences": len(sentences),
                "total_entities": len(entities),
                "total_tokens": len(doc),
                "has_vectors": doc.has_vector,
                "strategy_used": strategy
            }
        }
    
    except Exception as e:
        return {"error": f"Error al procesar texto: {str(e)}"}

@app.post("/enhance")
def enhance_text(payload: TextPayload):
    """
    Enriquecimiento lingüistico avanzado usando analisis neuronal de spaCy
    Extrae entidades, relaciones sintacticas, analisis morfologico y semantico
    """
    nlp = models.get(payload.lang)
    if not nlp:
        return {"error": f"Idioma no soportado: {payload.lang}"}
    
    try:
        doc = nlp(payload.text)
        
        # 1. ANaLISIS DE ENTIDADES (NER neuronal)
        entities_enriched = []
        for ent in doc.ents:
            entities_enriched.append({
                "text": ent.text,
                "label": ent.label_,
                "start": ent.start_char,
                "end": ent.end_char,
                "description": spacy.explain(ent.label_),
                "vector_norm": float(ent.vector_norm) if ent.has_vector else 0.0
            })
        
        # 2. ANaLISIS SINTaCTICO (dependencias neuronales)
        syntax_analysis = []
        for sent in doc.sents:
            root = [token for token in sent if token.dep_ == "ROOT"]
            if root:
                root_token = root[0]
                syntax_analysis.append({
                    "sentence": sent.text,
                    "root_verb": root_token.lemma_,
                    "root_pos": root_token.pos_,
                    "dependencies": [
                        {
                            "text": token.text,
                            "dep": token.dep_,
                            "pos": token.pos_,
                            "head": token.head.text
                        }
                        for token in sent
                    ]
                })
        
        # 3. NOUN PHRASES (sintagmas nominales con analisis)
        noun_phrases = []
        for chunk in doc.noun_chunks:
            noun_phrases.append({
                "text": chunk.text,
                "root": chunk.root.text,
                "root_pos": chunk.root.pos_,
                "root_dep": chunk.root.dep_,
                "lemma": chunk.root.lemma_
            })
        
        # 4. VERB PHRASES (acciones con complementos)
        verb_phrases = []
        for token in doc:
            if token.pos_ == "VERB":
                # Extraer verbo + objeto directo + complementos
                vp_components = [token]
                for child in token.children:
                    if child.dep_ in ["obj", "dobj", "iobj", "obl", "advmod"]:
                        vp_components.extend(list(child.subtree))
                
                vp_text = " ".join(t.text for t in sorted(set(vp_components), key=lambda x: x.i))
                verb_phrases.append({
                    "text": vp_text,
                    "verb": token.lemma_,
                    "tense": token.morph.get("Tense"),
                    "mood": token.morph.get("Mood")
                })
        
        # 5. ANaLISIS SEMaNTICO (similitud entre oraciones)
        semantic_clusters = []
        sentences = list(doc.sents)
        if len(sentences) > 1 and doc.has_vector:
            for i, sent in enumerate(sentences):
                if sent.has_vector:
                    similarities = []
                    for j, other_sent in enumerate(sentences):
                        if i != j and other_sent.has_vector:
                            sim = sent.similarity(other_sent)
                            if sim > 0.5:  # Alta similitud
                                similarities.append({"sentence_idx": j, "similarity": round(float(sim), 3)})
                    
                    if similarities:
                        semantic_clusters.append({
                            "sentence": sent.text,
                            "sentence_idx": i,
                            "related_sentences": similarities
                        })
        
        return {
            "entities": entities_enriched,
            "syntax_analysis": syntax_analysis,
            "noun_phrases": noun_phrases,
            "verb_phrases": verb_phrases,
            "semantic_clusters": semantic_clusters,
            "stats": {
                "total_entities": len(entities_enriched),
                "total_sentences": len(syntax_analysis),
                "total_noun_phrases": len(noun_phrases),
                "total_verb_phrases": len(verb_phrases),
                "has_vectors": doc.has_vector
            }
        }
    
    except Exception as e:
        return {"error": f"Error en enriquecimiento: {str(e)}"}

@app.post("/validate")
def validate_flashcards(payload: dict):
    """
    Validacion lingüistica de flashcards usando analisis neuronal de spaCy
    Verifica gramatica, coherencia semantica, consistencia de entidades
    """
    cards = payload.get("cards", [])
    lang = payload.get("lang", "es")
    
    nlp = models.get(lang)
    if not nlp:
        return {"error": f"Idioma no soportado: {lang}"}
    
    validated_cards = []
    
    for card in cards:
        question = card.get("question", "")
        answer = card.get("answer", "")
        
        issues = []
        
        # Procesar con spaCy
        q_doc = nlp(question)
        a_doc = nlp(answer)
        
        # 1. VALIDACIoN GRAMATICAL
        # Verificar que preguntas terminen con signos de interrogacion
        if question and not question.strip().endswith(("?", "¿")):
            issues.append({"type": "grammar", "message": "Pregunta sin signo de interrogacion"})
        
        # Verificar longitud minima de respuesta
        if len(answer.split()) < 3:
            issues.append({"type": "coherence", "message": "Respuesta demasiado corta"})
        
        # 2. CONSISTENCIA DE ENTIDADES
        q_entities = {ent.text.lower(): ent.label_ for ent in q_doc.ents}
        a_entities = {ent.text.lower(): ent.label_ for ent in a_doc.ents}
        
        # Verificar que entidades en pregunta aparezcan en respuesta
        for ent_text, ent_label in q_entities.items():
            if ent_text not in a_entities and ent_text not in answer.lower():
                issues.append({
                    "type": "entity_consistency",
                    "message": f"Entidad '{ent_text}' en pregunta no aparece en respuesta"
                })
        
        # 3. COHERENCIA SEMaNTICA (si hay vectores)
        semantic_coherence = 0.0
        if q_doc.has_vector and a_doc.has_vector:
            semantic_coherence = float(q_doc.similarity(a_doc))
            if semantic_coherence < 0.3:
                issues.append({
                    "type": "semantic_coherence",
                    "message": f"Baja coherencia semantica ({semantic_coherence:.2f})"
                })
        
        # 4. ANaLISIS SINTaCTICO
        # Verificar que respuesta tenga estructura completa (sujeto + verbo)
        has_verb = any(token.pos_ == "VERB" for token in a_doc)
        if not has_verb and len(answer.split()) > 5:
            issues.append({"type": "syntax", "message": "Respuesta sin verbo principal"})
        
        validated_cards.append({
            **card,
            "validation": {
                "is_valid": len(issues) == 0,
                "issues": issues,
                "semantic_coherence": round(semantic_coherence, 3),
                "question_entities": list(q_entities.keys()),
                "answer_entities": list(a_entities.keys())
            }
        })
    
    return {
        "validated_cards": validated_cards,
        "stats": {
            "total_cards": len(validated_cards),
            "valid_cards": sum(1 for c in validated_cards if c["validation"]["is_valid"]),
            "cards_with_issues": sum(1 for c in validated_cards if not c["validation"]["is_valid"])
        }
    }

@app.post("/generate_cloze")
def generate_cloze(payload: dict):
    """
    Generacion de ejercicios cloze usando analisis sintactico neuronal de spaCy
    Identifica noun phrases, verb phrases, entidades y nucleos sintacticos
    """
    cards = payload.get("cards", [])
    lang = payload.get("lang", "es")
    config = payload.get("config", {
        "noun_phrases": True,
        "verb_phrases": True,
        "named_entities": True,
        "syntactic_heads": False
    })
    
    nlp = models.get(lang)
    if not nlp:
        return {"error": f"Idioma no soportado: {lang}"}
    
    cloze_cards = []
    
    for card in cards:
        answer = card.get("answer", "")
        if not answer:
            continue
        
        doc = nlp(answer)
        variants = []
        
        # 1. NAMED ENTITIES (entidades nombradas)
        if config.get("named_entities", True):
            for ent in doc.ents:
                if ent.label_ in ["PERSON", "ORG", "GPE", "LOC", "DATE", "EVENT"]:
                    cloze_text = answer.replace(ent.text, "{{c1::" + ent.text + "}}", 1)
                    variants.append({
                        "text": cloze_text,
                        "type": "named_entity",
                        "target": ent.text,
                        "entity_type": ent.label_
                    })
        
        # 2. NOUN PHRASES (sintagmas nominales)
        if config.get("noun_phrases", True):
            for chunk in doc.noun_chunks:
                # Solo frases de 2+ palabras
                if len(chunk.text.split()) >= 2:
                    cloze_text = answer.replace(chunk.text, "{{c1::" + chunk.text + "}}", 1)
                    variants.append({
                        "text": cloze_text,
                        "type": "noun_phrase",
                        "target": chunk.text,
                        "root": chunk.root.lemma_
                    })
        
        # 3. VERB PHRASES (sintagmas verbales)
        if config.get("verb_phrases", True):
            for token in doc:
                if token.pos_ == "VERB":
                    # Extraer verbo + objeto directo
                    vp_tokens = [token]
                    for child in token.children:
                        if child.dep_ in ["obj", "dobj"]:
                            vp_tokens.extend(list(child.subtree))
                    
                    if len(vp_tokens) > 1:
                        vp_text = " ".join(t.text for t in sorted(set(vp_tokens), key=lambda x: x.i))
                        cloze_text = answer.replace(vp_text, "{{c1::" + vp_text + "}}", 1)
                        variants.append({
                            "text": cloze_text,
                            "type": "verb_phrase",
                            "target": vp_text,
                            "verb": token.lemma_
                        })
        
        # 4. SYNTACTIC HEADS (nucleos sintacticos)
        if config.get("syntactic_heads", False):
            for sent in doc.sents:
                root = [token for token in sent if token.dep_ == "ROOT"]
                if root:
                    root_token = root[0]
                    # Extraer nucleo + dependencias principales
                    head_tokens = [root_token]
                    for child in root_token.children:
                        if child.dep_ in ["nsubj", "obj", "dobj"]:
                            head_tokens.append(child)
                    
                    head_text = " ".join(t.text for t in sorted(head_tokens, key=lambda x: x.i))
                    cloze_text = answer.replace(head_text, "{{c1::" + head_text + "}}", 1)
                    variants.append({
                        "text": cloze_text,
                        "type": "syntactic_head",
                        "target": head_text,
                        "root": root_token.lemma_
                    })
        
        # Limitar a 3 variantes por card
        variants = variants[:3]
        
        # Crear cards cloze
        for variant in variants:
            cloze_cards.append({
                "question": card.get("question", "") + f" (Cloze - {variant['type']})",
                "answer": variant["text"],
                "type": "cloze",
                "metadata": {
                    "original_card": card,
                    "cloze_type": variant["type"],
                    "target": variant["target"],
                    "generated_by": "spacy_neural"
                }
            })
    
    return {
        "cloze_cards": cloze_cards,
        "stats": {
            "original_cards": len(cards),
            "generated_cloze": len(cloze_cards),
            "variants_per_card": round(len(cloze_cards) / len(cards), 2) if cards else 0
        }
    }

if __name__ == "__main__":
    import uvicorn
    import webbrowser
    import threading
    import time

    should_open_browser = os.environ.get("FLASHGEN_NO_AUTO_BROWSER") != "1"

    if should_open_browser:
        def open_browser():
            time.sleep(2)  # Esperar a que el servidor inicie
            html_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'Flashgen.html')
            webbrowser.open(f'file://{html_path}')

        print("🚀 Iniciando servidor Flashgen spaCy NLP...")
        print("📍 URL: http://localhost:8000")
        print("📖 Documentacion: http://localhost:8000/docs")
        print("🌐 Abriendo Flashgen.html en navegador...")

        browser_thread = threading.Thread(target=open_browser)
        browser_thread.daemon = True
        browser_thread.start()
    else:
        print("🚀 Iniciando servidor Flashgen spaCy NLP (sin auto navegador)...")
        print("📍 URL: http://localhost:8000")
        print("📖 Documentacion: http://localhost:8000/docs")

    uvicorn.run(app, host="0.0.0.0", port=8000)