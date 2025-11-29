/**
 * StateManager - Gestor de estado centralizado con observabilidad
 *
 * Implementa patrón Observer para notificar cambios de estado
 * Reduce complejidad cognitiva centralizando toda la lógica de estado
 */

class StateManager {
    constructor() {
        // Estado interno
        this._state = {
            flashcards: [],
            inputText: '',
            chunks: [],
            chainRuns: [],
            currentTab: 'config',
            loading: false,
            error: null
        };

        // Observadores por clave de estado
        this._observers = new Map();

        // Inicializar
        console.log('✅ StateManager inicializado');
    }

    /**
     * Obtener valor del estado
     */
    get(key) {
        return this._state[key];
    }

    /**
     * Establecer valor del estado y notificar observadores
     */
    set(key, value) {
        const oldValue = this._state[key];
        this._state[key] = value;

        // Notificar observadores si el valor cambió
        if (oldValue !== value) {
            this._notify(key, value, oldValue);
        }

        return value;
    }

    /**
     * Actualizar múltiples valores del estado
     */
    update(updates) {
        Object.entries(updates).forEach(([key, value]) => {
            this.set(key, value);
        });
    }

    /**
     * Subscribir observador a cambios de una clave de estado
     */
    subscribe(key, callback) {
        if (!this._observers.has(key)) {
            this._observers.set(key, new Set());
        }

        this._observers.get(key).add(callback);

        // Retornar función para desubscribir
        return () => {
            const observers = this._observers.get(key);
            if (observers) {
                observers.delete(callback);
            }
        };
    }

    /**
     * Notificar observadores de un cambio
     */
    _notify(key, newValue, oldValue) {
        const observers = this._observers.get(key);
        if (observers && observers.size > 0) {
            observers.forEach(callback => {
                try {
                    callback(newValue, oldValue);
                } catch (error) {
                    console.error(`❌ Error en observador de "${key}":`, error);
                }
            });
        }
    }

    /**
     * Obtener todo el estado (solo lectura)
     */
    getAll() {
        return { ...this._state };
    }

    /**
     * Reset completo del estado
     */
    reset() {
        const oldState = { ...this._state };

        this._state = {
            flashcards: [],
            inputText: '',
            chunks: [],
            chainRuns: [],
            currentTab: 'config',
            loading: false,
            error: null
        };

        // Notificar todos los cambios
        Object.keys(oldState).forEach(key => {
            if (oldState[key] !== this._state[key]) {
                this._notify(key, this._state[key], oldState[key]);
            }
        });

        console.log('🔄 StateManager reseteado');
    }
}

// Singleton - Una sola instancia en toda la aplicación
const stateManager = new StateManager();

// Exponer globalmente
if (typeof window !== 'undefined') {
    window.StateManager = stateManager;
}

export { stateManager as StateManager };
export default stateManager;
