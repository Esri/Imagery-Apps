#!/bin/bash

echo "Update JS API submodules"

git submodule update --init --remote

SCRIPT_PARENT_DIR=$(cd $(dirname "${BASH_SOURCE[0]}") && pwd)
SUBMODULE_DIR_PATH=$(cd "${SCRIPT_PARENT_DIR}/../arcgis-js-api" && pwd)

pushd ${SUBMODULE_DIR_PATH} > /dev/null 2>&1

git submodule update --init --recursive

popd > /dev/null 2>&1

exit 0


