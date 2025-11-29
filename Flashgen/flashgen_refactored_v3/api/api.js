/**
 * Modulo: API
 * Categoria: api
 * Extraido de: Flashgen.js (lineas 8834-9051)
 * Generado: 2025-11-28 09:48:59
 * 
 * Metodos: call, test, updateMemoryUI
 * Dependencias: DebugLogger, Results, State, UI
 */

import { DebugLogger } from '../ui/debug_logger.js';
import { Results } from '../ui/results.js';
import { State } from '../core/state.js';

const API = {
        async call(systemPrompt, userPrompt, overrides = {}) {
            const startTime = Date.now();
            
            // ✅ Validar endpoint antes de llamar
            const endpoint = State.config.api.endpoint;
            if (!endpoint || !endpoint.trim()) {
                DebugLogger.log('❌ Endpoint vacío o inválido', 'error');
                return {
                    success: false,
                    error: 'Endpoint no configurado. Configura la API en la pestaña Configuración.',
                    latency: 0
                };
            }
            
            DebugLogger.log('🌐 API.call iniciado', 'api');
            DebugLogger.log(`Endpoint: ${endpoint}`, 'info');
            
            // Add memory context if enabled (but limit to avoid context overflow)
            const messages = [];
            
            if (State.config.features.memory && State.memory.length > 0) {
                // Only include last 4 messages (2 exchanges) to avoid exceeding context
                const recentMemory = State.memory.slice(-4);
                messages.push(...recentMemory);
                DebugLogger.log(`Memoria incluida: ${recentMemory.length} mensajes (limitado)`, 'info');
            }
            
            messages.push(
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            );
            
            DebugLogger.log(`Mensajes totales: ${messages.length}`, 'info');
            
            // Estimate token count (rough: 1 token ≈ 4 chars)
            const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
            const estimatedTokens = Math.ceil(totalChars / 4);
            DebugLogger.log(`Tokens estimados: ${estimatedTokens}`, 'info');
            
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(State.config.api.key && { 'Authorization': `Bearer ${State.config.api.key}` })
                    },
                    body: JSON.stringify({
                        model: State.config.api.model,
                        messages: messages,
                        temperature: overrides.temperature ?? State.config.hyperparams.temperature,
                        top_p: overrides.top_p ?? State.config.hyperparams.top_p,
                        top_k: overrides.top_k ?? State.config.hyperparams.top_k,
                        ...(State.config.features.jsonSchema && {
                            response_format: {
                                type: "json_object",
                                schema: {
                                    type: "object",
                                    properties: {
                                        question: { type: "string", description: "La pregunta de la flashcard" },
                                        answer: { type: "string", description: "La respuesta de la flashcard" }
                                    },
                                    required: ["question", "answer"]
                                }
                            }
                        })
                    })
                });

                DebugLogger.log(`API response status: ${response.status}`, 'api');

                const data = await response.json();
                const latency = Date.now() - startTime;
                
                DebugLogger.log(`API latencia: ${latency}ms`, 'success');
                
                // Handle API errors (context overflow, etc)
                if (data.error) {
                    DebugLogger.log(`❌ Error API: ${data.error.message}`, 'error');
                    if (data.error.type === 'exceed_context_size_error') {
                        DebugLogger.log(`⚠️ Contexto excedido: ${data.error.n_prompt_tokens}/${data.error.n_ctx} tokens`, 'warning');
                        return {
                            success: false,
                            error: `Contexto excedido (${data.error.n_prompt_tokens}/${data.error.n_ctx} tokens). Reduce el tamaño del chunk o desactiva la memoria.`,
                            latency,
                            contextOverflow: true
                        };
                    }
                    return {
                        success: false,
                        error: data.error.message,
                        latency
                    };
                }
                
                const content = data.choices?.[0]?.message?.content || '';
                
                if (!content) {
                    DebugLogger.log('⚠️ API devolvio contenido vacio', 'warning');
                    DebugLogger.log(`Respuesta completa: ${JSON.stringify(data)}`, 'warning');
                }
                
                // Store in memory if enabled
                if (State.config.features.memory && content) {
                    State.memory.push({ role: 'user', content: userPrompt });
                    State.memory.push({ role: 'assistant', content: content });
                    
                    // Keep only last 10 exchanges (20 messages)
                    if (State.memory.length > 20) {
                        State.memory = State.memory.slice(-20);
                    }
                    
                    this.updateMemoryUI();
                }
                
                DebugLogger.log(`✅ API call exitoso: ${content.length} chars`, 'success');
                
                return {
                    success: true,
                    content: content,
                    latency
                };
            } catch (error) {
                DebugLogger.log(`❌ Error en API.call: ${error.message}`, 'error');
                DebugLogger.log(`Stack: ${error.stack}`, 'error');
                
                return {
                    success: false,
                    error: error.message,
                    latency: Date.now() - startTime
                };
            }
        },

        async test() {
            // ✅ Validar endpoint antes de probar
            const endpoint = State.config.api.endpoint;
            if (!endpoint || !endpoint.trim()) {
                DebugLogger.log('❌ No se puede probar: endpoint vacío', 'error');
                if (typeof window !== 'undefined' && window.UIInstance && window.UIInstance.toast) {
                    window.UIInstance.toast('❌ Configura un endpoint válido primero', 'error');
                }
                return;
            }
            
            const statusEl = document.getElementById('apiStatus');
            if (statusEl) {
                statusEl.innerHTML = `
                    <div class="stat-item">
                        <span class="stat-label">Estado</span>
                        <span class="stat-value" style="font-size: 14px;">Probando...</span>
                    </div>
                `;
            }
            DebugLogger.log(`📡 Probando conexion con API: ${endpoint}`, 'api');
            const startTime = Date.now();
            
            try {
                // Probar con un mensaje simple
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(State.config.api.key && { 'Authorization': `Bearer ${State.config.api.key}` })
                    },
                    body: JSON.stringify({
                        model: State.config.api.model || 'local-model',
                        messages: [
                            { role: 'system', content: 'You are a helpful assistant.' },
                            { role: 'user', content: 'Say "test successful"' }
                        ],
                        temperature: 0.7,
                        max_tokens: 50
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                const latency = Date.now() - startTime;
                
                // Verificar si la respuesta tiene el formato esperado
                const content = data.choices?.[0]?.message?.content || data.content || '';
                
                if (content || data.choices) {
                    const statusEl = document.getElementById('apiStatus');
                    if (statusEl) {
                        statusEl.innerHTML = `
                            <div class="stat-item">
                                <span class="stat-label">Estado</span>
                                <span class="stat-value" style="font-size: 14px; color: var(--color-success);">✅ Conectado</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Latencia</span>
                                <span class="stat-value" style="font-size: 14px;">${latency}ms</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Modelo</span>
                                <span class="stat-value" style="font-size: 14px;">${State.config.api.model || 'local-model'}</span>
                            </div>
                        `;
                    }
                    if (typeof window !== 'undefined' && window.UIInstance && window.UIInstance.toast) {
                        window.UIInstance.toast('✅ Conexion exitosa con la API');
                    }
                    DebugLogger.log(`🌐 API conectada exitosamente (latencia ${latency}ms)`, 'success');
                    DebugLogger.log(`📝 Respuesta de prueba: ${content.substring(0, 100)}...`, 'info');
                } else {
                    throw new Error('Respuesta invalida de la API');
                }
            } catch (error) {
                const latency = Date.now() - startTime;
                const statusEl = document.getElementById('apiStatus');
                if (statusEl) {
                    statusEl.innerHTML = `
                        <div class="stat-item">
                            <span class="stat-label">Estado</span>
                            <span class="stat-value" style="font-size: 14px; color: var(--color-error);">❌ Error</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Latencia</span>
                            <span class="stat-value" style="font-size: 14px;">${latency}ms</span>
                        </div>
                    `;
                }
                if (typeof window !== 'undefined' && window.UIInstance && window.UIInstance.toast) {
                    window.UIInstance.toast('❌ Error de conexion con la API', 'error');
                }
                DebugLogger.log(`❌ Error al conectar: ${error.message}`, 'error');
                DebugLogger.log(`💡 Verifica que el endpoint sea correcto: ${endpoint}`, 'warning');
                DebugLogger.log('💡 Para Llama.cpp: http://127.0.0.1:8080/v1/chat/completions', 'info');
            }
        },

        updateMemoryUI() {
            const container = document.getElementById('memoryHistory');
            if (!container) return; // ✅ Validar DOM
            
            if (State.memory.length === 0) {
                container.innerHTML = '<p class="empty-state">No hay conversaciones previas</p>';
                return;
            }
            
            container.innerHTML = State.memory.map((msg, i) => `
                <div class="memory-item ${msg.role}">
                    <strong>${msg.role === 'user' ? '👤 Usuario' : '🤖 Asistente'}:</strong><br>
                    ${Results.escape(msg.content.substring(0, 200))}${msg.content.length > 200 ? '...' : ''}
                </div>
            `).join('');
        }
    };


// Exponer globalmente
if (typeof window !== 'undefined') {
    window.API = API;
}

// Exports
export { API };
export default API;
