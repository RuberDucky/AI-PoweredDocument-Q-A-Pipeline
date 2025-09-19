#!/bin/bash


echo "🚀 Testing Q&A Pipeline Setup"
echo "=============================="

# Check Node.js version
echo "📋 Checking Node.js version..."
node_version=$(node -v)
echo "Node.js version: $node_version"
if [[ "$node_version" < "v22" ]]; then
    echo "❌ Node.js 22+ required. Please upgrade."
    exit 1
fi

# Check if .env exists
echo ""
echo "📋 Checking environment configuration..."
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "🔧 Please update .env with your actual API keys!"
fi

# Check required environment variables
REQUIRED_VARS=("PINECONE_API_KEY" "PINECONE_INDEX_NAME" "ANTHROPIC_API_KEY" "POSTGRES_DB" "POSTGRES_USER" "POSTGRES_PASSWORD" "REDIS_URL")
MISSING_VARS=()
for VAR in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^$VAR=" .env; then
        MISSING_VARS+=("$VAR")
    fi
done
if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "❌ Missing required environment variables in .env: ${MISSING_VARS[*]}"
    echo "Please update your .env file before continuing."
    exit 1
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Run database migrations (if available)
echo ""
if [ -f ./node_modules/.bin/sequelize ]; then
    echo "📋 Running database migrations..."
    npx sequelize db:migrate || echo "⚠️  No migrations found or failed"
fi

# Start Docker services
echo ""
echo "🐳 Starting services with Docker..."
docker-compose up -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run pipeline test
echo ""
echo "🧪 Running pipeline test..."
chmod +x ./test-pipeline.sh
./test-pipeline.sh

echo ""
echo "✅ Setup and pipeline test complete!"
echo ""
echo "🌐 Application will be available at: http://localhost:3001"
echo "🏥 Health check: http://localhost:3001/api/v1/health"
echo ""
echo "📚 Next steps:"
echo "1. Update .env with your API keys if needed"
echo "2. Visit http://localhost:3001 to test the API"
echo "3. Check logs with: docker-compose logs -f app"
echo "4. Verify Pinecone dashboard for vector entries"
echo ""
echo "🛑 To stop: docker-compose down"
