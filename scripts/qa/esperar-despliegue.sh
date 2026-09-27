#!/usr/bin/env bash
# Espera a que Vercel termine el despliegue de producción de un commit (vía GitHub Deployments).
# Uso: bash scripts/qa/esperar-despliegue.sh <sha> [minutos=10]
# Imprime la URL del despliegue y sale 0 si quedó "success"; 1 si falló o se agotó el tiempo.
set -euo pipefail
SHA="${1:?Indica el SHA del commit}"; MIN="${2:-10}"; REPO="RodrigoR4mirez/agrosignal"
for ((i = 0; i < MIN * 6; i++)); do
  ID=$(gh api "repos/$REPO/deployments?sha=$SHA&environment=Production" --jq '.[0].id // empty' 2>/dev/null || true)
  if [[ -n "$ID" ]]; then
    read -r ESTADO URL < <(gh api "repos/$REPO/deployments/$ID/statuses" --jq '.[0] | "\(.state) \(.environment_url // "")"')
    case "$ESTADO" in
      success) echo "Desplegado: $URL"; exit 0 ;;
      failure|error) echo "El despliegue falló ($ESTADO): $URL"; exit 1 ;;
    esac
  fi
  sleep 10
done
echo "Tiempo agotado esperando el despliegue de $SHA"; exit 1
