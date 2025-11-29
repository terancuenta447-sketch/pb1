/**
 * TabComponent - Clase base para componentes de pestañas
 *
 * Implementa un lifecycle garantizado:
 * - constructor: Inicialización básica
 * - mount: Vinculación con DOM
 * - render: Renderizado de contenido
 * - unmount: Limpieza
 *
 * GARANTIZA que cada tab siempre tenga contenido visible
 */

import { StateManager } from '../core/state_manager.js';

export class TabComponent {
    constructor(tabId, containerSelector) {
        this.tabId = tabId;
        this.containerSelector = containerSelector;
        this.container = null;
        this.isMounted = false;
        this.subscriptions = [];

        console.log(`📦 TabComponent[${tabId}] creado`);
    }

    /**
     * Montar componente en el DOM
     * GARANTIZA que el container existe y es visible
     */
    mount() {
        if (this.isMounted) {
            console.warn(`⚠️ TabComponent[${this.tabId}] ya está montado`);
            return;
        }

        // Buscar container
        this.container = document.querySelector(this.containerSelector);

        if (!this.container) {
            throw new Error(`❌ Container "${this.containerSelector}" no encontrado para tab "${this.tabId}"`);
        }

        // ✅ GARANTIZAR altura mínima
        this.container.style.minHeight = '400px';

        // ✅ GARANTIZAR visibilidad
        const computedStyle = window.getComputedStyle(this.container);
        if (computedStyle.display === 'none') {
            console.warn(`⚠️ TabComponent[${this.tabId}] container tiene display:none, forzando block`);
            this.container.style.display = 'block';
        }

        this.isMounted = true;
        console.log(`✅ TabComponent[${this.tabId}] montado`);

        // Renderizar contenido inicial
        this.render();
    }

    /**
     * Renderizar contenido
     * DEBE ser implementado por cada componente específico
     */
    render() {
        if (!this.isMounted) {
            console.error(`❌ TabComponent[${this.tabId}].render() llamado antes de mount()`);
            return;
        }

        // Implementación por defecto: mostrar mensaje
        this.container.innerHTML = `
            <div class="card" style="min-height: 300px;">
                <h3>⚠️ Componente no implementado</h3>
                <p class="empty-state">
                    Este tab (${this.tabId}) no tiene un componente específico implementado.
                </p>
            </div>
        `;

        console.log(`📊 TabComponent[${this.tabId}] renderizado (default)`);
    }

    /**
     * Desmontar componente
     * Limpia subscripciones y referencias
     */
    unmount() {
        if (!this.isMounted) {
            return;
        }

        // Limpiar subscripciones
        this.subscriptions.forEach(unsubscribe => unsubscribe());
        this.subscriptions = [];

        this.isMounted = false;
        console.log(`🗑️ TabComponent[${this.tabId}] desmontado`);
    }

    /**
     * Actualizar componente (re-renderizar)
     */
    update() {
        if (!this.isMounted) {
            console.warn(`⚠️ TabComponent[${this.tabId}].update() llamado antes de mount()`);
            return;
        }

        this.render();
    }

    /**
     * Subscribir a cambios de estado
     */
    subscribe(stateKey, callback) {
        const unsubscribe = StateManager.subscribe(stateKey, callback);
        this.subscriptions.push(unsubscribe);
        return unsubscribe;
    }

    /**
     * Renderizar estado vacío con estructura garantizada
     */
    renderEmpty(title, message, icon = '📭') {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="card" style="min-height: 300px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <div style="font-size: 48px; margin-bottom: 16px;">${icon}</div>
                <h3 style="margin-bottom: 12px; text-align: center;">${title}</h3>
                <p class="empty-state" style="text-align: center; max-width: 500px;">
                    ${message}
                </p>
            </div>
        `;
    }

    /**
     * Renderizar estado de carga
     */
    renderLoading(message = 'Cargando...') {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="card" style="min-height: 300px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
                <p style="font-size: 16px; color: var(--color-text-secondary);">${message}</p>
            </div>
        `;
    }

    /**
     * Renderizar estado de error
     */
    renderError(title, error) {
        if (!this.container) return;

        const errorMessage = error?.message || String(error) || 'Error desconocido';

        this.container.innerHTML = `
            <div class="card" style="min-height: 300px; background: var(--color-danger-bg);">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                    <span style="font-size: 32px;">❌</span>
                    <h3 style="color: var(--color-error); margin: 0;">${title}</h3>
                </div>
                <p style="color: var(--color-text); background: var(--color-background); padding: 12px; border-radius: var(--radius-base); font-family: var(--font-family-mono); font-size: 13px;">
                    ${this.escape(errorMessage)}
                </p>
            </div>
        `;
    }

    /**
     * Escapar HTML
     */
    escape(str) {
        const div = document.createElement('div');
        div.textContent = String(str ?? '');
        return div.innerHTML;
    }
}

// Exponer globalmente
if (typeof window !== 'undefined') {
    window.TabComponent = TabComponent;
}

export default TabComponent;
