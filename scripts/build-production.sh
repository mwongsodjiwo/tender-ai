#!/usr/bin/env bash
# ============================================================
# TenderManager AI — Production Build Script
# Runs all quality checks and builds the SvelteKit application.
# Exit immediately on any failure (strict mode).
# ============================================================

set -euo pipefail

# ----------------------------------------------------------
# Configuration
# ----------------------------------------------------------
BUILD_DIR="build"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${PROJECT_ROOT}"

# ----------------------------------------------------------
# Helper functions
# ----------------------------------------------------------
step_counter=0

print_step() {
  step_counter=$((step_counter + 1))
  echo ""
  echo "========================================"
  echo "  Step ${step_counter}: $1"
  echo "========================================"
  echo ""
}

print_success() {
  echo "  -> $1"
}

print_error() {
  echo "  ERROR: $1" >&2
}

# Track timing
start_time=$(date +%s)

echo "============================================"
echo "  TenderManager AI — Production Build"
echo "  $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "============================================"

# ----------------------------------------------------------
# Step 1: Type checking
# ----------------------------------------------------------
print_step "Type checking (svelte-check)"

if npm run check; then
  print_success "Type checking passed"
else
  print_error "Type checking failed — fix TypeScript errors before building"
  exit 1
fi

# ----------------------------------------------------------
# Step 2: Linting
# ----------------------------------------------------------
print_step "Linting (eslint)"

if npm run lint; then
  print_success "Linting passed"
else
  print_error "Linting failed — fix lint errors before building"
  exit 1
fi

# ----------------------------------------------------------
# Step 3: Unit tests
# ----------------------------------------------------------
print_step "Unit tests (vitest)"

if npm run test:unit; then
  print_success "Unit tests passed"
else
  print_error "Unit tests failed — fix failing tests before building"
  exit 1
fi

# ----------------------------------------------------------
# Step 4: Build the SvelteKit application
# ----------------------------------------------------------
print_step "Building SvelteKit application"

if npm run build; then
  print_success "SvelteKit build completed"
else
  print_error "Build failed"
  exit 1
fi

# ----------------------------------------------------------
# Step 5: Validate build output
# ----------------------------------------------------------
print_step "Validating build output"

if [ ! -d "${BUILD_DIR}" ]; then
  print_error "Build directory '${BUILD_DIR}' does not exist"
  exit 1
fi

if [ ! -f "${BUILD_DIR}/index.js" ]; then
  print_error "Build entry point '${BUILD_DIR}/index.js' not found"
  exit 1
fi

# Count build artifacts
file_count=$(find "${BUILD_DIR}" -type f | wc -l | tr -d ' ')
dir_size=$(du -sh "${BUILD_DIR}" | cut -f1)

print_success "Build directory exists: ${BUILD_DIR}/"
print_success "Total files: ${file_count}"
print_success "Total size: ${dir_size}"

# ----------------------------------------------------------
# Build summary
# ----------------------------------------------------------
end_time=$(date +%s)
duration=$((end_time - start_time))

echo ""
echo "============================================"
echo "  BUILD SUCCESSFUL"
echo "============================================"
echo ""
echo "  Project:    TenderManager AI"
echo "  Output:     ${BUILD_DIR}/"
echo "  Files:      ${file_count}"
echo "  Size:       ${dir_size}"
echo "  Duration:   ${duration}s"
echo "  Timestamp:  $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo ""
echo "  Run in production:"
echo "    NODE_ENV=production node ${BUILD_DIR}"
echo ""
echo "  Or via Docker:"
echo "    npm run docker:build"
echo "    npm run docker:run"
echo ""
echo "============================================"
