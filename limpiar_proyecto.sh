#!/bin/bash

# Archivos y patrones a eliminar
ARCHIVOS=(
  "app-final.js"
  "app-fixed.js"
  "app-simple.js"
  "app-ultra-simple.js"
  "debug-selector.html"
  "debug.html"
  "generador.py"
  "generar_productos.py"
  "index-final.html"
  "index-static.html"
  "index-working.html"
  "script.py"
  "solucion-completa.html"
  "styles.css"
  "test-imagenes.html"
  "test-simple.html"
)

# Eliminar archivos listados si existen
for file in "${ARCHIVOS[@]}"; do
  if [ -f "$file" ]; then
    rm "$file"
    echo "🗑️ Eliminado: $file"
  fi
done

echo "✅ Limpieza completada. Solo quedan los archivos esenciales."