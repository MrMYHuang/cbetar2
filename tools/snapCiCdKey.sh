#!/bin/sh
sudo rm -f credentials
snapcraft export-login credentials
gh secret set SNAPCRAFT_STORE_CREDENTIALS --repo MrMYHuang/cbetar2 < credentials
echo "SNAPCRAFT_STORE_CREDENTIALS has been updated in GitHub Secrets."