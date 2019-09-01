@ECHO OFF

SETLOCAL

ECHO --- Update JS API submodules ---

git submodule update --init --remote

SET _submoduleDirPath=%~dp0..\arcgis-js-api\

PUSHD %_submoduleDirPath%

git submodule update --init --recursive

POPD

ENDLOCAL

EXIT /b
