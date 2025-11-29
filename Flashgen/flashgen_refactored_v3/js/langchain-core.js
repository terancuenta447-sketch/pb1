

// No external dependencies

export class ChainNode {
    constructor(id, name, handler, config = {}) {
        this.id = id;
        this.name = name;
        this.handler = handler;
        this.config = config;
        this.timeout = config.timeout || 30000; // ✅ FIX #2: timeout configurable
    }
    
    async execute(state, context) {
        let timeoutId;
        try {
            // DebugLogger no disponible directamente aqui si es un modulo aislado
            // Usaremos console.log o pasaremos un logger en el contexto
            if (context.logger) context.logger.log(`🔄 Ejecutando nodo: ${this.name} (timeout: ${this.timeout}ms)`, 'info');
            
            const startTime = Date.now();
            
            // ✅ FIX #8: Implementar timeout con cleanup
            const timeoutPromise = new Promise((_, reject) => 
                timeoutId = setTimeout(() => reject(new Error(`Timeout en nodo ${this.id} (${this.timeout}ms)`)), this.timeout)
            );
            
            const result = await Promise.race([
                this.handler(state, this.config, context),
                timeoutPromise
            ]);
            
            // Limpiar timeout si la ejecución fue exitosa
            clearTimeout(timeoutId);
            
            context.executionLog.push({
                nodeId: this.id,
                nodeName: this.name,
                duration: Date.now() - startTime,
                timestamp: new Date().toISOString(),
                status: 'success'
            });
            
            return result;
        } catch (error) {
            // ✅ FIX #8: Limpiar timeout en caso de error
            if (timeoutId) clearTimeout(timeoutId);
            
            // Detectar si es timeout
            const isTimeout = error.message.includes('Timeout');
            if (context.logger) {
                context.logger.log(
                    `${isTimeout ? '⏱️' : '❌'} ${isTimeout ? 'Timeout' : 'Error'} en nodo ${this.name}: ${error.message}`, 
                    'error'
                );
            }
            context.executionLog.push({
                nodeId: this.id,
                nodeName: this.name,
                error: error.message,
                timestamp: new Date().toISOString(),
                status: 'error'
            });
            throw error;
        }
    }
}

export class TrueLangChain {
    constructor() {
        this.nodes = new Map();
        this.edges = [];
        this.conditionalEdges = new Map();
        this.entryPoint = null;
        this.context = {
            executionLog: [],
            apiCallCount: 0,
            totalLatency: 0,
            logger: null // Se inyectaro al ejecutar
        };
    }
    
    setLogger(logger) {
        this.context.logger = logger;
        return this;
    }
    
    addNode(id, name, handler, config = {}) {
        this.nodes.set(id, new ChainNode(id, name, handler, config));
        return this;
    }
    
    addEdge(from, to) {
        // ✅ FIX #6: Validar que los nodos existen
        if (!this.nodes.has(from)) {
            throw new Error(`❌ Nodo origen "${from}" no existe`);
        }
        if (!this.nodes.has(to)) {
            throw new Error(`❌ Nodo destino "${to}" no existe`);
        }
        this.edges.push({ from, to, type: 'direct' });
        return this;
    }
    
    addConditionalEdge(from, conditionFn, targets) {
        this.conditionalEdges.set(from, { conditionFn, targets });
        return this;
    }
    
    setEntryPoint(nodeId) {
        // ✅ FIX #5: Validar que el nodo existe
        if (!this.nodes.has(nodeId)) {
            throw new Error(`❌ Nodo de entrada "${nodeId}" no existe en la cadena`);
        }
        this.entryPoint = nodeId;
        return this;
    }
    
    async run(initialState) {
        this.context.executionLog = [];
        this.context.apiCallCount = 0;
        this.context.totalLatency = 0;
        this.context.startTime = Date.now();
        
        let currentNodeId = this.entryPoint;
        let state = initialState;
        let lastValidState = state; // ✅ FIX #4: Guardar ultimo estado volido
        let terminatedDueToNullState = false;
        
        // ✅ FIX #3: Deteccion de loops con hash de estado
        const stateHashes = new Map();
        const maxIterations = 50; // Prevenir loops infinitos
        let iterations = 0;
        
        while (currentNodeId && iterations < maxIterations) {
            iterations++;
            
            // ✅ FIX #3: Generar hash del estado (solo campos relevantes)
            const stateHash = JSON.stringify({
                generation: state.generation,
                qualityScore: state.qualityScore,
                flashcard: state.flashcard ? {
                    question: state.flashcard.question?.substring(0, 50),
                    answer: state.flashcard.answer?.substring(0, 50)
                } : null
            });
            
            const cycleKey = `${currentNodeId}:${stateHash}`;
            
            if (stateHashes.has(cycleKey)) {
                if (this.context.logger) {
                    this.context.logger.log(
                        `🔁 Loop infinito detectado en nodo "${currentNodeId}" (estado repetido)`,
                        'error'
                    );
                }
                throw new Error(`Loop infinito detectado en nodo "${currentNodeId}"`);
            }
            
            // ✅ FIX #5: Memory leak - límite duro con rotación
            if (stateHashes.size > 50) {
                const entries = Array.from(stateHashes.entries());
                stateHashes.clear();
                // Mantener últimas 25 entradas
                entries.slice(-25).forEach(([k, v]) => stateHashes.set(k, v));
                if (this.context.logger) {
                    this.context.logger.log('🧹 stateHashes rotado (límite: 50, mantenidas: 25)', 'info');
                }
            }
            
            stateHashes.set(cycleKey, true);
            
            const node = this.nodes.get(currentNodeId);
            if (!node) {
                if (this.context.logger) this.context.logger.log(`❌ Nodo no encontrado: ${currentNodeId}`, 'error');
                break;
            }
            
            // Ejecutar nodo actual
            state = await node.execute(state, this.context);
            
            // FIX #2: Incrementar metricas si el handler las devuelve
            if (state && typeof state === 'object') {
                if (state.apiCall) this.context.apiCallCount++;
                if (state.latency) this.context.totalLatency += state.latency;
            }
            
            // ✅ FIX #7: Validar estado con fallback en cascada
            if (!state) {
                if (this.context.logger) {
                    this.context.logger.log(
                        '⚠️ Nodo devolvió estado nulo, restaurando estado válido',
                        'warning'
                    );
                }
                terminatedDueToNullState = true;
                // Cascada de fallbacks: último válido → inicial → objeto vacío
                state = lastValidState || initialState || {};
                break;
            }
            
            // Actualizar ultimo estado volido
            lastValidState = state;
            
            // Determinar siguiente nodo
            currentNodeId = this.getNextNode(currentNodeId, state);
        }
        
        this.context.endTime = Date.now();
        this.context.totalDuration = this.context.endTime - this.context.startTime;
        
        const completionLog = terminatedDueToNullState
            ? '⚠️ Cadena finalizada anticipadamente por estado nulo'
            : `✅ Cadena completada: ${iterations} iteraciones, ${this.context.apiCallCount} llamadas API`;
            
        if (this.context.logger) this.context.logger.log(completionLog, terminatedDueToNullState ? 'warning' : 'success');
        
        return {
            state,
            executionLog: this.context.executionLog,
            metrics: {
                apiCalls: this.context.apiCallCount,
                totalLatency: this.context.totalLatency,
                totalDuration: this.context.totalDuration
            }
        };
    }
    
    getNextNode(currentNodeId, state) {
        // 1. Verificar edges condicionales
        const conditional = this.conditionalEdges.get(currentNodeId);
        if (conditional) {
            // ✅ FIX #7: Wrap conditionFn en try-catch
            try {
                const result = conditional.conditionFn(state);
                const nextNodeId = conditional.targets[result];
                
                if (this.context.logger) this.context.logger.log(`🔀 Condicional: ${currentNodeId} → ${nextNodeId} (resultado: ${result})`, 'info');
                return nextNodeId;
            } catch (error) {
                if (this.context.logger) {
                    this.context.logger.log(
                        `⚠️ Error evaluando condicion de edge ${currentNodeId}: ${error.message}. Continuando con siguiente edge.`,
                        'warning'
                    );
                }
                // Continuar con edge directo si falla el condicional
            }
        }
        
        // 2. Buscar edge directo
        const edge = this.edges.find(e => e.from === currentNodeId);
        if (edge) {
            return edge.to;
        }
        
        // 3. Sin siguiente nodo = fin de cadena
        return null;
    }
    
    visualize() {
        const graph = [];
        
        this.edges.forEach(edge => {
            graph.push(`${edge.from} → ${edge.to}`);
        });
        
        this.conditionalEdges.forEach((config, from) => {
            Object.entries(config.targets).forEach(([condition, to]) => {
                graph.push(`${from} --[${condition}]--> ${to}`);
            });
        });
        
        return graph.join('\n');
    }
}

// Exponer al ombito global para Flashgen.js (no-modulo)
if (typeof window !== 'undefined') {
    window.ChainNode = ChainNode;
    window.TrueLangChain = TrueLangChain;
    console.log('✅ LangChain Core cargado en ombito global');
}
