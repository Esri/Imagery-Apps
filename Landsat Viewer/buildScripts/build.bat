echo off

echo ########## BUILD START TIME: %date% - %time% ##########

SET APP_ROOT=..
SET BUILD_OUTPUT=%APP_ROOT%\buildOutput
SET APP_PACKAGES=%BUILD_OUTPUT%\app-packages
SET APP_OUTPUT=%BUILD_OUTPUT%\app

rmdir /S /Q %BUILD_OUTPUT%
mkdir %BUILD_OUTPUT%

cmd /c "npm install"

node startbuild.js load=build profile=app.profile.js
node startcopy.js %*
node startclean.js
echo ########## BUILD END TIME: %date% - %time% ##########

:END