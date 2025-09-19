#!/bin/bash

echo "🚀 Q&A Pipeline Docker Setup"
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
echo ""
echo "📋 Validating environment variables..."
REQUIRED_VARS=("PINECONE_API_KEY" "PINECONE_INDEX_NAME" "ANTHROPIC_API_KEY")
MISSING_VARS=()
for VAR in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^$VAR=" .env || grep -q "^$VAR=$" .env || grep -q "^$VAR=your" .env; then
        MISSING_VARS+=("$VAR")
    fi
done
if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "❌ Please set these environment variables in .env: ${MISSING_VARS[*]}"
    echo "📝 Edit .env file and add your API keys, then run this script again."
    exit 1
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check Docker
echo ""
echo "🐳 Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop first."
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

echo "✅ Docker is running"

# Clean up any existing containers
echo ""
echo "🧹 Cleaning up existing containers..."
docker-compose down --remove-orphans 2>/dev/null

# Build and start Docker services
echo ""
echo "🐳 Building and starting Docker services..."
docker-compose build --no-cache app
docker-compose up -d postgres redis

# Wait for database to be ready
echo ""
echo "⏳ Waiting for database to be ready..."
timeout=60
while [ $timeout -gt 0 ]; do
    if docker-compose exec -T postgres pg_isready -U postgres &>/dev/null; then
        echo "✅ Database is ready"
        break
    fi
    echo "Waiting for database... ($timeout seconds remaining)"
    sleep 2
    timeout=$((timeout - 2))
done

if [ $timeout -le 0 ]; then
    echo "❌ Database failed to start within 60 seconds"
    echo "Check logs with: docker-compose logs postgres"
    exit 1
fi

# Start the application
echo ""
echo "🚀 Starting the application..."
docker-compose up -d app

# Wait for app to be ready
echo ""
echo "⏳ Waiting for application to be ready..."
timeout=60
while [ $timeout -gt 0 ]; do
    if curl -s http://localhost:3001/api/v1/health &>/dev/null; then
        echo "✅ Application is ready"
        break
    fi
    echo "Waiting for application... ($timeout seconds remaining)"
    sleep 2
    timeout=$((timeout - 2))
done

if [ $timeout -le 0 ]; then
    echo "⚠️  Application may still be starting. Check logs with: docker-compose logs -f app"
fi

# Run pipeline test
echo ""
echo "🧪 Running pipeline test..."
sleep 5
chmod +x ./test-pipeline.sh
./test-pipeline.sh

echo ""
echo "✅ Docker setup complete!"
echo ""
echo "📊 Services Status:"
docker-compose ps
echo ""
echo "🌐 Application: http://localhost:3001"
echo "🏥 Health check: http://localhost:3001/api/v1/health"
echo "🗄️  Database: localhost:5432 (ragPipeline)"
echo "📦 Redis: localhost:6379"
echo ""
echo "📚 Useful commands:"
echo "- Check logs: docker-compose logs -f app"
echo "- Stop services: docker-compose down"
echo "- Restart: docker-compose restart app"
echo "- View all logs: docker-compose logs -f"
echo "- Enter app container: docker-compose exec app sh"
echo ""
echo "🛑 To stop all services: docker-compose down"
