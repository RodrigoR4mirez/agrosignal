#!/bin/bash
ICLOUD='/Users/s/Library/Mobile Documents/com~apple~CloudDocs/PROYECTOS/agronomia'
DEST='/Users/s/agro-dashboard/data'

echo "Copiando datos actualizados..."
cp "$ICLOUD/riesgo_cosecha_actual.csv" "$DEST/"
cp "$ICLOUD/clima_vs_produccion.csv" "$DEST/"
cp "$ICLOUD/produccion_peru_30cultivos_historico.csv" "$DEST/"
echo "✓ Datos copiados"
echo "Ahora corre: git add . && git commit -m 'datos actualizados' && git push"
