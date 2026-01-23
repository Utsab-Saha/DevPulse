#!/bin/bash

# DevPulse Setup Script
# This script helps you set up DevPulse quickly

echo "🚀 DevPulse Setup Script"
echo "========================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null
then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file with your credentials:"
    echo "   - GitHub OAuth Client ID & Secret"
    echo "   - Groq API Key"
    echo "   - GitHub Personal Access Token"
    echo "   - Random JWT Secret"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Generate JWT secret if needed
echo "🔐 Need a JWT secret? Here's a random one:"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
echo ""

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Edit .env file with your credentials"
echo "   2. Run 'npm run dev' to start development server"
echo "   3. Open http://localhost:3000 in your browser"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Full documentation"
echo "   - QUICKSTART.md - Quick setup guide"
echo "   - DEPLOYMENT.md - Deployment guide"
echo ""
echo "🎉 Happy coding!"
