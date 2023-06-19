@echo off

set printerName="CloudPrinter"
set url="http://127.0.0.1:8899/printer"

rundll32 printui.dll,PrintUIEntry /if /b %printerName% /r %url% /f MSCOL11.INF /m "Generic Color PS for Commercial Printing" /u /q && rundll32 printui.dll,PrintUIEntry /y /n %printerName% /q

if %errorlevel% neq 0 (
  echo fail
) else (
  echo success
)
