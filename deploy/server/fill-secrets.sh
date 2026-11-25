#!/usr/bin/env bash
# Fills every secret in /opt/youmart/.env that can be generated (database passwords, Typesense key,
# signing secrets, the JWT key pair) with fresh random values, and sets the YouMart-specific
# values. Prints only the NAMES of what is left for you to fill by hand (Razorpay, MSG91, Zoho,
# business details). Never prints a secret. Only replaces values that are still CHANGE_ME, so it
# is safe to run again.   Usage (on the server):  bash /opt/youmart/server/fill-secrets.sh
set -euo pipefail
ENV="${YOUMART_ENV:-/opt/youmart/.env}"
[ -f "$ENV" ] || { echo "missing $ENV - copy .env.production.example there first" >&2; exit 1; }
umask 077
cp "$ENV" "$ENV.bak.$(date +%s)"

rand() { openssl rand -hex 24; }                       # letters and digits only (safe in URLs)
set_value() {                                          # set_value KEY VALUE (only if still CHANGE_ME)
  local key="$1" val="$2"
  if grep -qE "^${key}=(CHANGE_ME|changeme_[a-z_]*)$" "$ENV"; then
    local tmp; tmp="$(mktemp)"
    awk -v k="$key" -v v="$val" 'BEGIN{FS=OFS="="} $1==k{print k "=" v; next} {print}' "$ENV" > "$tmp"
    cat "$tmp" > "$ENV"; rm -f "$tmp"
    echo "set   $key"
  fi
}

# YouMart-specific (not secret)
sed -i 's#^BACKEND_IMAGE=ghcr.io/CHANGE_ME/#BACKEND_IMAGE=ghcr.io/vijeshkumar112003/#; s#^WEB_IMAGE=ghcr.io/CHANGE_ME/#WEB_IMAGE=ghcr.io/vijeshkumar112003/#' "$ENV"
sed -i 's#^BACKUP_S3_URI=s3://CHANGE_ME-youmart-backups/postgres#BACKUP_S3_URI=s3://youmart-prod-backups-793854110046/postgres#' "$ENV"
set_value DEFAULT_SELLER_ID 01a085ce-8a92-7078-bb6f-4ed2476e4064

# Database passwords: ONE password per database login (several services may share a login).
declare -A PW
ADMIN_USER="$(grep -E '^POSTGRES_USER=' "$ENV" | cut -d= -f2-)"
if grep -qE '^POSTGRES_PASSWORD=CHANGE_ME$' "$ENV"; then PW[$ADMIN_USER]="$(rand)"; set_value POSTGRES_PASSWORD "${PW[$ADMIN_USER]}"; fi
while IFS= read -r line; do
  key="${line%%=*}"; url="${line#*=}"
  creds="${url#postgresql://}"; creds="${creds%%@*}"; user="${creds%%:*}"
  [ "${creds#*:}" = "CHANGE_ME" ] || continue
  [ -n "${PW[$user]:-}" ] || PW[$user]="$(rand)"
  tmp="$(mktemp)"
  awk -v k="$key" -v v="${url/:CHANGE_ME@/:${PW[$user]}@}" 'index($0, k "=")==1{print k "=" v; next} {print}' "$ENV" > "$tmp"
  cat "$tmp" > "$ENV"; rm -f "$tmp"
  echo "set   $key"
done < <(grep -E '^[A-Z_]*DATABASE_URL=postgresql://' "$ENV")

# Other generated secrets
for k in TYPESENSE_API_KEY SERVICE_JWT_SECRET OTP_HASH_SECRET BANK_ACCOUNT_HASH_SECRET INITIAL_ADMIN_PASSWORD; do
  set_value "$k" "$(rand)"
done

# JWT signing key pair (RSA 2048, each PEM base64-encoded onto one line)
if grep -qE '^JWT_PRIVATE_KEY=CHANGE_ME$' "$ENV"; then
  d="$(mktemp -d)"
  openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out "$d/priv.pem" 2>/dev/null
  openssl pkey -in "$d/priv.pem" -pubout -out "$d/pub.pem"
  set_value JWT_PRIVATE_KEY "$(base64 -w0 "$d/priv.pem")"
  set_value JWT_PUBLIC_KEY "$(base64 -w0 "$d/pub.pem")"
  rm -rf "$d"
fi

# Values exported from the local .env (scripts/launch/export-secrets.ps1), pasted on the server as
# /opt/youmart/secrets-import.env. Each KEY=value replaces that key's line; the file is then destroyed.
IMPORT="$(dirname "$ENV")/secrets-import.env"
if [ -f "$IMPORT" ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%$'\r'}"
    [[ "$line" =~ ^[A-Z][A-Z0-9_]*= ]] || continue
    key="${line%%=*}"; val="${line#*=}"
    grep -qE "^${key}=" "$ENV" || { echo "skip  $key (not in .env)"; continue; }
    tmp="$(mktemp)"
    awk -v k="$key" -v v="$val" 'index($0, k "=")==1{print k "=" v; next} {print}' "$ENV" > "$tmp"
    cat "$tmp" > "$ENV"; rm -f "$tmp"
    echo "import $key"
  done < "$IMPORT"
  shred -u "$IMPORT" 2>/dev/null || rm -f "$IMPORT"
fi

chmod 600 "$ENV"
echo
echo "Still to fill by hand (nano $ENV):"
grep -nE '^[A-Z_0-9]+=.*(CHANGE_ME|changeme_)' "$ENV" | cut -d= -f1 || echo "  nothing - all set"
