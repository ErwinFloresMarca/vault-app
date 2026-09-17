#!/usr/bin/env bash
set -euo pipefail

# Release + deploy en un solo comando:
#
#   pnpm release [patch|minor|major|X.Y.Z] [--yes] [--skip-checks] [--no-push]
#
# Condiciones (gates) antes de liberar:
#   - rama `main`
#   - árbol de trabajo limpio (sin cambios en archivos rastreados)
#   - al día con `origin/main`
#   - `lint` OK, `typecheck` OK y `build` OK   (omitibles con --skip-checks)
#
# Luego sube la versión en package.json, crea commit + tag anotado vX.Y.Z y hace
# push; la CI (.github/workflows/build-release.yml) construye y despliega la VPS.

usage() {
  cat <<'EOF'
Uso: pnpm release [patch|minor|major|X.Y.Z] [opciones]

Opciones:
  --yes, -y      no preguntar (usar el nivel/versión indicado)
  --skip-checks  omitir lint/typecheck/build
  --no-push      crear commit+tag local sin hacer push
  -h, --help     mostrar esta ayuda
EOF
}

LEVEL=""; SKIP_CHECKS=0; NO_PUSH=0; ASSUME_YES=0
for arg in "$@"; do
  case "$arg" in
    patch|minor|major) LEVEL="$arg" ;;
    --yes|-y) ASSUME_YES=1 ;;
    --skip-checks) SKIP_CHECKS=1 ;;
    --no-push) NO_PUSH=1 ;;
    -h|--help) usage; exit 0 ;;
    *)
      if [[ "$arg" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then LEVEL="$arg"; else echo "Argumento inválido: $arg"; usage; exit 1; fi
      ;;
  esac
done

ROOT="$(git rev-parse --show-toplevel)"; cd "$ROOT"

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
[ "$BRANCH" = "main" ] || { echo "✗ Debes estar en 'main' (estás en '$BRANCH')."; exit 1; }

if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "✗ Hay cambios sin commitear. Commitea o stashea antes de liberar."; exit 1
fi

git fetch origin --tags --quiet
BEHIND="$(git rev-list --count "HEAD..origin/$BRANCH")"
[ "$BEHIND" = "0" ] || { echo "✗ Estás $BEHIND commit(s) detrás de origin/$BRANCH. Haz pull primero."; exit 1; }

CURRENT="$(node -p "require('./package.json').version")"

bump_version() {
  node -e '
    const c = process.argv[1].split(".").map(Number);
    const level = process.argv[2];
    let v;
    if (level === "major") v = [c[0] + 1, 0, 0];
    else if (level === "minor") v = [c[0], c[1] + 1, 0];
    else v = [c[0], c[1], c[2] + 1];
    process.stdout.write(v.join("."));
  ' "$1" "$2"
}

# --- Selección de versión (menú si no se pasó) ---
if [ -z "$LEVEL" ]; then
  if [ "$ASSUME_YES" -eq 1 ]; then echo "✗ Con --yes hay que indicar el nivel (patch|minor|major|X.Y.Z)."; exit 1; fi
  echo "Versión actual: $CURRENT"
  echo "  1) patch  → $(bump_version "$CURRENT" patch)"
  echo "  2) minor  → $(bump_version "$CURRENT" minor)"
  echo "  3) major  → $(bump_version "$CURRENT" major)"
  echo "  4) personalizada"
  echo "  q) cancelar"
  read -r -p "Elegí una opción: " OPT
  case "$OPT" in
    1) LEVEL="patch" ;; 2) LEVEL="minor" ;; 3) LEVEL="major" ;;
    4) read -r -p "Nueva versión (X.Y.Z): " LEVEL ;;
    q|Q|"") echo "Cancelado."; exit 0 ;; *) echo "Opción inválida."; exit 1 ;;
  esac
fi

if [[ "$LEVEL" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then NEXT="$LEVEL"; else NEXT="$(bump_version "$CURRENT" "$LEVEL")"; fi
TAG="v$NEXT"

git rev-parse -q --verify "refs/tags/$TAG" >/dev/null && { echo "✗ El tag $TAG ya existe."; exit 1; }

if [ "$ASSUME_YES" -eq 0 ]; then
  echo; echo "  Versión actual : $CURRENT"; echo "  Versión nueva  : $NEXT"; echo "  Tag            : $TAG"; echo
  read -r -p "¿Crear commit + tag $TAG y desplegar? [y/N] " CONFIRM
  case "$CONFIRM" in y|Y|yes|YES) ;; *) echo "Cancelado."; exit 0 ;; esac
fi

if [ "$SKIP_CHECKS" -eq 0 ]; then
  echo "> Lint...";       pnpm exec eslint .
  echo "> Typecheck...";  pnpm typecheck
  echo "> Build...";      pnpm build
else
  echo "> Checks omitidos (--skip-checks)"
fi

echo "> Bump a $NEXT + commit + tag..."
npm version "$NEXT" -m "chore(release): v%s"

if [ "$NO_PUSH" -eq 0 ]; then
  echo "> Push de $BRANCH + $TAG..."
  git push origin "$BRANCH"
  git push origin "$TAG"
  echo "✓ Release $TAG enviado. La CI construirá y desplegará en la VPS."
  echo "  Workflow: https://github.com/ErwinFloresMarca/vault-app/actions/workflows/build-release.yml"
else
  echo "✓ Release $TAG creado localmente (--no-push)."
  echo "  Push manual: git push origin $BRANCH && git push origin $TAG"
fi
