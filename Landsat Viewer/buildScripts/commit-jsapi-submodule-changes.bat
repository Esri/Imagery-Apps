@ECHO OFF

SETLOCAL

ECHO --- Update JS API submodule ---

SET _submoduleDirPath=%~dp0..\arcgis-js-api\

git add %_submoduleDirPath%
git commit -m "Update JS API submodule"
git push origin HEAD

ENDLOCAL
