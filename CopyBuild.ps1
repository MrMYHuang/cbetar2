Set-Location .\MrMYHuang.github.io\
Get-Item * -Exclude .git,.well-known,.nojekyll | rm -Recurse
Copy-Item -Recurse ..\build\* . 
