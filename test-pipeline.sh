#!/bin/bash

# Test script to verify document processing

echo "🧪 Testing Document Q&A Pipeline"
echo "================================="

# Check if server is running
if ! curl -s http://localhost:3000/api/v1/health > /dev/null; then
    echo "❌ Server is not running. Please start it first with: npm run dev"
    exit 1
fi

echo "✅ Server is running"

# Test registration
echo ""
echo "📝 Testing user registration..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "password": "testpass123"
  }')

echo "Registration response: $REGISTER_RESPONSE"

# Test login
echo ""
echo "🔐 Testing user login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }')

echo "Login response: $LOGIN_RESPONSE"

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get authentication token"
    exit 1
fi

echo "✅ Got authentication token"

# Create a test document
echo ""
echo "📄 Creating test document..."
echo "This is a test document about artificial intelligence and machine learning. AI systems can perform various tasks including natural language processing, computer vision, and decision making." > test_document.txt

# Upload document
echo ""
echo "📤 Testing document upload..."
UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "document=@test_document.txt")

echo "Upload response: $UPLOAD_RESPONSE"

# Extract document ID
DOCUMENT_ID=$(echo $UPLOAD_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$DOCUMENT_ID" ]; then
    echo "❌ Failed to upload document"
    exit 1
fi

echo "✅ Document uploaded with ID: $DOCUMENT_ID"

# Wait for processing
echo ""
echo "⏳ Waiting for document processing..."
sleep 3

# Check document status
echo ""
echo "📋 Checking document status..."
DOC_STATUS=$(curl -s -X GET "http://localhost:3000/api/v1/documents/$DOCUMENT_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "Document status: $DOC_STATUS"

# Reprocess document if needed
echo ""
echo "🔄 Reprocessing document to ensure it's in vector DB..."
REPROCESS_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/v1/documents/$DOCUMENT_ID/reprocess" \
  -H "Authorization: Bearer $TOKEN")

echo "Reprocess response: $REPROCESS_RESPONSE"

# Wait for reprocessing
sleep 2

# Test Q&A
echo ""
echo "❓ Testing Q&A functionality..."
QA_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/qa/ask \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is artificial intelligence?"
  }')

echo "Q&A response: $QA_RESPONSE"

# Check if answer contains relevant information
if echo "$QA_RESPONSE" | grep -q "artificial intelligence\|AI\|machine learning"; then
    echo "✅ Q&A system found relevant information!"
else
    echo "⚠️  Q&A system may not be finding document content"
fi

# Cleanup
rm -f test_document.txt

echo ""
echo "🎉 Test completed!"
echo ""
echo "Next steps:"
echo "1. Check the logs with: docker-compose logs -f app"
echo "2. Verify Pinecone dashboard for vector entries"
echo "3. Test more complex documents and questions"
