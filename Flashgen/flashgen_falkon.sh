#!/bin/bash
set -euo pipefail

PROJECT_DIR="/home/luis/Aplicaciones/Flashgen"
HTML_PATH="${PROJECT_DIR}/Flashgen.html"
STATIC_PORT="${STATIC_PORT:-8060}"
SERVER_CMD=(env FLASHGEN_NO_AUTO_BROWSER=1 python server.py)
STATIC_SERVER_CMD=(python -m http.server "${STATIC_PORT}")
BROWSER_CMD="falkon"

if ! command -v "${BROWSER_CMD}" >/dev/null 2>&1; then
    echo "❌ No se encontro Falkon. Instolalo (p. ej. sudo apt install falkon) o ajusta BROWSER_CMD."
    exit 1
fi

cleanup() {
    if [[ -n "${SERVER_PID:-}" ]] && ps -p "${SERVER_PID}" >/dev/null 2>&1; then
        echo "🛑 Deteniendo servidor FastAPI (PID ${SERVER_PID})..."
        kill "${SERVER_PID}" 2>/dev/null || true
        wait "${SERVER_PID}" 2>/dev/null || true
    fi

    if [[ -n "${STATIC_PID:-}" ]] && ps -p "${STATIC_PID}" >/dev/null 2>&1; then
        echo "🛑 Deteniendo servidor estotico (PID ${STATIC_PID})..."
        kill "${STATIC_PID}" 2>/dev/null || true
        wait "${STATIC_PID}" 2>/dev/null || true
    fi
}

trap cleanup EXIT INT TERM

cd "${PROJECT_DIR}"

echo "🚀 Iniciando servidor Flashgen spaCy NLP..."
"${SERVER_CMD[@]}" &
SERVER_PID=$!

echo "🌐 Iniciando servidor estotico para assets..."
"${STATIC_SERVER_CMD[@]}" >/dev/null 2>&1 &
STATIC_PID=$!

echo "📍 FastAPI: http://localhost:8000"
echo "📂 Static:  http://localhost:${STATIC_PORT}/"
BROWSER_URL="http://localhost:${STATIC_PORT}/Flashgen.html"

echo "⏳ Esperando a que ambos servidores esten listos..."
sleep 3

echo "🌐 Abriendo ${BROWSER_CMD} con ${BROWSER_URL}"
"${BROWSER_CMD}" "${BROWSER_URL}"

echo "👋 Falkon se cerro; deteniendo servidor..."
cleanup
