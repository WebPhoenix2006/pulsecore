@echo off
echo 🚀 Setting up PulseCore...

REM Create virtual environment in services folder
echo 📦 Creating virtual environment in services folder...
cd services
python -m venv env

REM Activate virtual environment
echo ⚡ Activating virtual environment...
call env\Scripts\activate.bat

REM Create .env file in services folder
echo 🔧 Creating .env file...
(
echo SECRET_KEY=43xn^(1qicnx$@kuv#t@-+cb5dd8b^)_#zzdu#jo8baevx@#m-b^
echo DEBUG=True
echo EMAIL_HOST_USER=devsamuel0611@gmail.com
echo EMAIL_HOST_PASSWORD=wguv xsoc tgtu ijaq
echo PAYSTACK_SECRET_KEY=sk_test_c56e3275b3ed7d76c31b6ab408df873cb1ba5dab
) > .env

REM Install Python dependencies
echo 📚 Installing Python dependencies...
pip install -r requirements.txt

REM Navigate to frontend folder and install dependencies
echo 🎨 Installing frontend dependencies...
cd ..\admin-portal
npm install --force

echo ✅ Setup complete!
echo 📝 To activate the virtual environment in the future, run:
echo    cd services ^&^& env\Scripts\activate.bat
pause