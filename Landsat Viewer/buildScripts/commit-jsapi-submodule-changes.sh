#!/bin/sh

echo "Update JS API submodule"

SCRIPT_PARENT_DIR=$(cd $(dirname "${BASH_SOURCE[0]}") && pwd)
SUBMODULE_DIR_PATH=$(cd "${SCRIPT_PARENT_DIR}/../arcgis-js-api" && pwd)

git add "${SUBMODULE_DIR_PATH}"
git commit -m "Update JS API submodule"
git push origin HEAD

exit 0
