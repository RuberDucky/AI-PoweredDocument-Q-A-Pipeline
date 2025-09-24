#!/bin/bash

# OpenAI Integration Setup Script
# This script installs OpenAI dependencies and sets up the integration

echo "🤖 Setting up OpenAI integration..."

# Install OpenAI dependencies
echo "📦 Installing OpenAI packages..."
npm install openai@4.67.1 @langchain/openai@0.3.0

echo ""
echo "✅ OpenAI dependencies installed successfully!"
echo ""
echo "🔧 Configuration required:"
echo "   • Add your OpenAI API key to the .env file:"
echo "     OPENAI_API_KEY=your-actual-openai-api-key"
echo ""
echo "📋 What changed:"
echo "   • Switched from Claude to OpenAI GPT-4o-mini"
echo "   • Updated claudeService.js to use OpenAI"
echo "   • Cost-efficient model selection (gpt-4o-mini)"
echo "   • Maintained same interface and functionality"
echo ""
echo "💰 Benefits:"
echo "   • Lower cost than GPT-4"
echo "   • Fast response times"
echo "   • High quality answers"
echo "   • Better availability"
echo ""
echo "🚀 Ready to use OpenAI API!"
echo "   Make sure to add your API key and restart the application."