#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
echo "Solo D1 LOCALE. L'admin viene creato esclusivamente se il database non contiene utenti."
read -r -p "Username locale [adminlocale]: " GYMTIME_LOCAL_USERNAME
export GYMTIME_LOCAL_USERNAME="${GYMTIME_LOCAL_USERNAME:-adminlocale}"
read -r -s -p "Password locale (almeno 8 caratteri, non usarne una reale): " GYMTIME_LOCAL_PASSWORD
echo
export GYMTIME_LOCAL_PASSWORD
node strumenti/crea-admin-locale.mjs
unset GYMTIME_LOCAL_PASSWORD
