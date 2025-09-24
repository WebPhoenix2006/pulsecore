#!/bin/bash

echo "🚀 Setting up PulseCore..."

# Create virtual environment in services folder
echo "📦 Creating virtual environment in services folder..."
cd services
python -m venv env

# Activate virtual environment
echo "⚡ Activating virtual environment..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # Windows Git Bash
    source env/Scripts/activate
else
    # Linux/Mac
    source env/bin/activate
fi

# Create .env file in services folder
echo "🔧 Creating .env file..."
cat > .env << 'EOF'
SECRET_KEY=43xn(1qicnx$@kuv#t@-+cb5dd8b)_#zzdu#jo8baevx@#m-b^
DEBUG=True
EMAIL_HOST_USER=devsamuel0611@gmail.com
EMAIL_HOST_PASSWORD=wguv xsoc tgtu ijaq
PAYSTACK_SECRET_KEY=sk_test_c56e3275b3ed7d76c31b6ab408df873cb1ba5dab
EOF

# Install Python dependencies
echo "📚 Installing Python dependencies..."
pip install -r requirements.txt

# Navigate to frontend folder and install dependencies
echo "🎨 Installing frontend dependencies..."
cd ../admin-portal
npm install --force

echo "✅ Setup complete!"
echo "📝 To activate the virtual environment in the future, run:"
echo "   cd services && source env/bin/activate (Linux/Mac)"
echo "   cd services && source env/Scripts/activate (Windows)"