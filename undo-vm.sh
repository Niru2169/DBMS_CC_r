#!/bin/bash
# =============================================================================
# undo-vm.sh — Undo changes made by setup-vm.sh on Debian
# Run as a non-root user with sudo privileges.
# Usage: bash undo-vm.sh
# =============================================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
done_() { echo -e "${GREEN}[DONE]${NC}  $*"; }

# ── 1. Remove UFW (was newly installed by setup-vm.sh) ───────────────────────
info "Removing UFW..."
if dpkg -s ufw &>/dev/null; then
  sudo ufw disable 2>/dev/null || true
  sudo apt-get remove --purge -y ufw
  sudo rm -rf /etc/ufw
  done_ "UFW removed."
else
  warn "UFW not installed — skipping."
fi

# ── 2. Remove broken Docker apt repo (Ubuntu repo was mistakenly added) ──────
info "Removing broken Docker apt repository..."
sudo rm -f /etc/apt/sources.list.d/docker.list
sudo rm -f /etc/apt/keyrings/docker.gpg
done_ "Docker apt repo removed."

# ── 3. Remove Docker packages if any were installed ───────────────────────────
info "Checking for Docker packages..."
DOCKER_PKGS="docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin"
INSTALLED=""
for pkg in $DOCKER_PKGS; do
  if dpkg -s "$pkg" &>/dev/null 2>&1; then
    INSTALLED="$INSTALLED $pkg"
  fi
done
if [[ -n "$INSTALLED" ]]; then
  info "Removing Docker packages:$INSTALLED"
  sudo apt-get remove --purge -y $INSTALLED
  done_ "Docker packages removed."
else
  warn "No Docker packages found — skipping."
fi

# ── 4. Refresh apt cache ──────────────────────────────────────────────────────
info "Refreshing apt cache..."
sudo apt-get update -y
done_ "Apt cache refreshed."

# ── 5. Autoremove orphaned dependencies ───────────────────────────────────────
info "Cleaning up orphaned packages..."
sudo apt-get autoremove -y
done_ "Cleanup done."

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Undo complete. Server is back to baseline.${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
warn "Note: google-chrome-stable was only UPGRADED (not newly installed)."
warn "      It was already on the server — not rolled back to save time."
warn "      If you want to downgrade: sudo apt-get install google-chrome-stable=153.0.8010.52-1"
echo ""
info "Now run:  bash setup-vm.sh   (after git pull to get the Debian fix)"
