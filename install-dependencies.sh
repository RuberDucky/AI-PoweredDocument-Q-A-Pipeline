#!/bin/bash

# Enhanced Document Processing Setup Script
# This script installs the necessary dependencies for PDF, DOCX, and JSON support

echo "🔧 Installing enhanced document processing dependencies..."

# Install PDF processing dependencies
echo "📄 Installing PDF processing libraries..."
npm install pdf-parse@1.1.1

# Install DOCX processing dependencies  
echo "📝 Installing DOCX processing libraries..."
npm install mammoth@1.6.0

# Install development dependencies for testing
echo "🧪 Installing testing dependencies..."
npm install --save-dev form-data@4.0.0 node-fetch@3.3.2

echo ""
echo "✅ All dependencies installed successfully!"
echo ""
echo "📋 Supported file formats:"
echo "   • TXT  - Plain text files"
echo "   • PDF  - Adobe PDF documents"
echo "   • DOCX - Microsoft Word documents"
echo "   • JSON - Structured JSON data"
echo ""
echo "🔒 User isolation has been implemented:"
echo "   • Documents are filtered by user ID"
echo "   • Q&A responses only use user's own documents"
echo "   • Vector search includes user filtering"
echo ""
echo "🚀 Ready to test enhanced functionality!"
echo "   Run: node test-file-upload.js"