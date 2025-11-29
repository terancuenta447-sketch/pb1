# Arquitectura V2 - TabManager Refactorizado

## 📋 Problema Original

Los tabs Input, Chain, Results, Export colapsaban en altura y quedaban fuera del viewport cuando solo tenían mensajes de "estado vacío".

**Causa raíz:**
- Arquitectura frágil sin lifecycle garantizado
- Inicialización lazy sin validación de visibilidad
- State sin observabilidad
- No había separación clara entre GUI y lógica

## 🏗️ Solución Arquitectónica

### 1. **StateManager** (`core/state_manager.js`)
- **Patrón Observer** para notificar cambios de estado
- Estado centralizado y observable
- Reduce complejidad cognitiva

```javascript
// USO:
StateManager.set('flashcards', newFlashcards);
StateManager.subscribe('flashcards', (newValue) => {
    // React to changes
});
```

### 2. **TabComponent** (`ui/tab_component.js`)
- **Clase base** con lifecycle garantizado
- Métodos: `mount()`, `render()`, `unmount()`, `update()`
- **GARANTIZA altura mínima y visibilidad**

```javascript
class MyTabComponent extends TabComponent {
    constructor() {
        super('myTab', '#myTab');
    }

    render() {
        // Custom rendering logic
    }
}
```

### 3. **Componentes Específicos** (`ui/tabs/`)
- `ResultsTabComponent`: Pestaña de resultados
- `ExportTabComponent`: Pestaña de exportación
- `ChainTabComponent`: Pestaña de cadena
- `InputTabComponent`: Pestaña de entrada

Cada componente:
- Hereda de `TabComponent`
- Implementa `render()` con contenido garantizado
- Se subscribe a cambios de estado relevantes

### 4. **TabManagerV2** (`ui/tab_manager_v2.js`)
- **Patrón Component** para gestión de tabs
- Registra componentes por tabId
- **Verifica visibilidad** después de cada cambio
- **GARANTIZA** que cada tab siempre sea visible

## 🚀 Integración

### Opción A: Usar init_tabs_v2.js (Recomendado)

En `Flashgen.html`, después de cargar módulos:

```html
<script type="module">
    import './flashgen_refactored_v3/init_tabs_v2.js';
</script>
```

### Opción B: Inicialización manual

```javascript
import { TabManagerV2 } from './flashgen_refactored_v3/ui/tab_manager_v2.js';

// Después de DOMContentLoaded
TabManagerV2.init();
```

## 📊 Beneficios

1. **Robustez**: Lifecycle garantizado, no más tabs invisibles
2. **Mantenibilidad**: Código modular con responsabilidades claras
3. **Observabilidad**: StateManager centraliza y notifica cambios
4. **Extensibilidad**: Fácil agregar nuevos tabs con TabComponent
5. **Debugging**: Verificación automática de visibilidad

## 🔄 Migración desde arquitectura anterior

1. **State antiguo** sigue funcionando (compatibilidad)
2. **TabManager antiguo** puede coexistir temporalmente
3. **Módulos UI antiguos** (Results, Exporter, etc.) se integran gradualmente

## 📁 Estructura de Archivos

```
flashgen_refactored_v3/
├── core/
│   ├── state_manager.js        # StateManager con Observer pattern
│   └── state.js                 # State legacy (compatible)
├── ui/
│   ├── tab_component.js         # Clase base TabComponent
│   ├── tab_manager_v2.js        # TabManager refactorizado
│   ├── tabs/                    # Componentes específicos de tabs
│   │   ├── results_tab.js
│   │   ├── export_tab.js
│   │   ├── chain_tab.js
│   │   └── input_tab.js
│   └── ...                      # Módulos UI antiguos
└── init_tabs_v2.js              # Script de inicialización
```

## ✅ Garantías

- **Cada tab SIEMPRE tendrá altura mínima de 400px**
- **Cada tab SIEMPRE será visible cuando esté activo**
- **Cada componente SIEMPRE renderizará contenido (aunque sea empty-state)**
- **Verificación automática post-cambio de visibilidad**

## 🎯 Próximos Pasos

1. Integrar TabManagerV2 en Flashgen.html
2. Migrar tabs restantes (Learning, Comparison) a componentes
3. Deprecar TabManager v1 gradualmente
4. Añadir tests unitarios para componentes
