#!/bin/bash

echo "🚀 Q&A Pipeline Local Development Setup"
echo "======================================="

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

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔧 Local Development Mode"
echo "This will start the application locally without Docker."
echo "Make sure you have PostgreSQL and Redis running locally."
echo ""
echo "🗄️  Required local services:"
echo "- PostgreSQL 16 running on localhost:5432"
echo "- Redis 7 running on localhost:6379 (optional)"
echo ""

read -p "Do you want to continue? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "Setup cancelled."
    exit 0
fi

# Check if local PostgreSQL is available
echo ""
echo "📋 Checking PostgreSQL connection..."
if command -v psql &> /dev/null; then
    # Try to connect using .env variables
    source .env 2>/dev/null
    DB_HOST=${DB_HOST:-localhost}
    DB_PORT=${DB_PORT:-5432}
    DB_USER=${POSTGRES_USER:-postgres}
    DB_NAME=${POSTGRES_DB:-ragPipeline}
    
    if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c '\q' 2>/dev/null; then
        echo "✅ PostgreSQL connection successful"
    else
        echo "❌ Cannot connect to PostgreSQL. Please check:"
        echo "  - PostgreSQL is running on $DB_HOST:$DB_PORT"
        echo "  - Database '$DB_NAME' exists"
        echo "  - User '$DB_USER' has access"
        echo ""
        echo "To create the database:"
        echo "  createdb -U $DB_USER $DB_NAME"
        exit 1
    fi
else
    echo "❌ PostgreSQL CLI (psql) not found."
    echo "Please install PostgreSQL or use Docker setup instead:"
    echo "  ./setup-docker.sh"
    exit 1
fi

# Start the application
echo ""
echo "🚀 Starting application in development mode..."
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
