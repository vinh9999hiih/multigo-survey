@echo off
chcp 65001 >nul
title Đẩy Trang Web Khảo Sát Multigo Lên GitHub
color 0A

echo =====================================================================
echo       TOOL TỰ ĐỘNG ĐẨY DỰ ÁN KHẢO SÁT MULTIGO LÊN GITHUB
echo =====================================================================
echo.

where git >nul 2>nul
if %ERRORLEVEL% neq 0 (
    color 0C
    echo [LOI] May tinh cua ban chua cai dat Git!
    echo Vui long tai va cai dat Git tai: https://git-scm.com/downloads
    pause
    exit /b
)

echo [1/5] Kiem tra cau hinh Git...
git config user.name >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Ban chua cau hinh Ten va Email cho Git.
    set /p GIT_NAME="Nhap Ho Ten cua ban (vi du: Nguyen Van A): "
    set /p GIT_EMAIL="Nhap Email GitHub cua ban: "
    git config --global user.name "%GIT_NAME%"
    git config --global user.email "%GIT_EMAIL%"
)

echo.
echo [2/5] Nhap thong tin GitHub Repository:
echo (Neu chua tao, hay vao https://github.com/new de tao mot Repository moi, de Public)
echo.
set /p REPO_URL="Dan link Repository GitHub cua ban vao day (vi du: https://github.com/username/multigo-survey.git): "

if "%REPO_URL%"=="" (
    color 0C
    echo [LOI] Ban chua nhap link GitHub Repository!
    pause
    exit /b
)

echo.
echo [3/5] Khoi tao va dong goi ma nguon...
if not exist .git (
    git init
)

git branch -M main
git add .
git commit -m "Khoi tao website khao sat Multigo phan nhanh thong minh"

echo.
echo [4/5] Ket noi voi GitHub Remote...
git remote remove origin >nul 2>nul
git remote add origin %REPO_URL%

echo.
echo [5/5] Dang day ma nguon len GitHub (git push)...
git push -u origin main --force

if %ERRORLEVEL% equ 0 (
    echo.
    echo =====================================================================
    echo            DA DAY THANH CONG LEN GITHUB!
    echo =====================================================================
    echo.
    echo [HUONG DAN BAT GITHUB PAGES DE TRUY CAP WEB ONLINE MIEN PHI]:
    echo 1. Truy cap vao Repository GitHub vua tao tren trinh duyet.
    echo 2. Nhan vao tab "Settings" (Cai dat).
    echo 3. O cot ben trai, chon muc "Pages".
    echo 4. Tai muc "Branch", chon nhánh "main" va thu muc "/(root)", sau do bam "Save".
    echo 5. Doi 1-2 phut, link web cua ban se co dang:
    echo    https://<tai-khoan-cua-ban>.github.io/<ten-repo>/
    echo =====================================================================
) else (
    color 0C
    echo.
    echo [LOI] Qua trinh day len GitHub gap loi!
    echo Vui long kiem tra lai:
    echo 1. Link Repository da dung chua?
    echo 2. Ban da dang nhap dung tai khoan GitHub co quyen push chua?
)

echo.
pause
