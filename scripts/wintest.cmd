@echo off
@START /b node_modules\.bin\ganache-cli.cmd --gasLimit 8000000 --defaultBalanceEther 1000000000 --gasPrice 1 > %temp%\nul
@SET var=truffle test

for %%i in (test\*.js) do call :PushTest %%i
%var%

:PushTest
if NOT "%1" == "test\a_poly_oracle.js" (
    if NOT "%1" == "test\s_v130_to_v140_upgrade.js" (
        set var=%var% %1
    )
)
