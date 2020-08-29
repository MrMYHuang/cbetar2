Set-Location .\MrMYHuang.github.io\
Get-Item * -Exclude .git,.well-known,.nojekyll | Remove-Item -Recurse
Copy-Item -Recurse ..\build\* . 
