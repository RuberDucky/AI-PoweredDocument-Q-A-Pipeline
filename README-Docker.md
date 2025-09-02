# AI-Powered Document Q&A Pipeline

A comprehensive document Q&A system using AI, built with Node.js, Claude, Pinecone, and PostgreSQL.

## Features

-   🤖 **AI-Powered Q&A**: Uses Anthropic Claude for intelligent document question answering
-   📄 **Document Processing**: Upload and process text documents with vector embeddings
-   🔍 **Vector Search**: Fast semantic search using Pinecone vector database
-   🗄️ **Database Integration**: PostgreSQL for data persistence and Redis for caching
-   🔐 **Authentication**: JWT-based user authentication and authorization
-   🐳 **Docker Ready**: Full containerization with Docker Compose
-   🚀 **Production Ready**: Rate limiting, logging, error handling, and health checks

## Quick Start with Docker (Recommended)

### Prerequisites

-   **Node.js 22+**
-   **Docker Desktop** (Install from: https://www.docker.com/products/docker-desktop/)
-   **API Keys**: Anthropic Claude API key and Pinecone API key

### Installation

1. **Clone the repository**

    ```bash
    git clone https://github.com/RuberDucky/AI-PoweredDocument-Q-A-Pipeline
    cd AI-PoweredDocument-Q-A-Pipeline
    ```

2. **Install Docker Desktop**

    ```bash
    # Using Homebrew (macOS)
    brew install --cask docker

    # Or download from: https://www.docker.com/products/docker-desktop/
    ```

3. **Start Docker Desktop**

    - Open Docker Desktop application
    - Wait for it to start (Docker icon in menu bar)

4. **Run the setup script**

    ```bash
    ./setup-docker.sh
    ```

    This script will:

    - Check prerequisites
    - Copy `.env.example` to `.env`
    - Install dependencies
    - Build and start Docker containers
    - Run the pipeline test

5. **Update your API keys**

    ```bash
    # Edit .env file with your actual API keys
    nano .env
    ```

    Required variables:

    ```env
    ANTHROPIC_API_KEY=your-anthropic-api-key
    PINECONE_API_KEY=your-pinecone-api-key
    PINECONE_INDEX_NAME=qapipeline
    ```

6. **Restart the application**
    ```bash
    docker-compose restart app
    ```

## Local Development (Without Docker)

If you prefer to run without Docker:

### Prerequisites

-   **Node.js 22+**
-   **PostgreSQL 16+** running locally
-   **Redis 7+** (optional, for caching)

### Setup

1. **Start local services**

    ```bash
    # Start PostgreSQL
    brew services start postgresql@16

    # Start Redis (optional)
    brew services start redis
    ```

2. **Create database**

    ```bash
    createdb ragPipeline
    ```

3. **Run local setup**
    ```bash
    ./setup-local.sh
    ```

## Usage

### API Endpoints

-   **Health Check**: `GET /api/v1/health`
-   **Register**: `POST /api/v1/auth/signup`
-   **Login**: `POST /api/v1/auth/login`
-   **Upload Document**: `POST /api/v1/documents/upload`
-   **Ask Question**: `POST /api/v1/qa/ask`

### Example Usage

1. **Register a user**

    ```bash
    curl -X POST http://localhost:3000/api/v1/auth/signup \
      -H "Content-Type: application/json" \
      -d '{
        "fullName": "John Doe",
        "email": "john@example.com",
        "password": "securepassword"
      }'
    ```

2. **Login**

    ```bash
    curl -X POST http://localhost:3000/api/v1/auth/login \
      -H "Content-Type: application/json" \
      -d '{
        "email": "john@example.com",
        "password": "securepassword"
      }'
    ```

3. **Upload a document**

    ```bash
    curl -X POST http://localhost:3000/api/v1/documents/upload \
      -H "Authorization: Bearer YOUR_JWT_TOKEN" \
      -F "document=@your-document.txt"
    ```

4. **Ask a question**
    ```bash
    curl -X POST http://localhost:3000/api/v1/qa/ask \
      -H "Authorization: Bearer YOUR_JWT_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "question": "What is this document about?"
      }'
    ```

## Docker Commands

### Common Operations

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f app

# Restart application
docker-compose restart app

# Check service status
docker-compose ps

# Enter application container
docker-compose exec app sh

# Rebuild application
docker-compose build --no-cache app
docker-compose up -d app
```

### Development with Docker

```bash
# Start only database and Redis
docker-compose up -d postgres redis

# Run app locally (connects to Docker DB)
npm run dev
```

## Project Structure

```
qa_pipeline/
├── src/
│   ├── app.js                 # Main application entry point
│   ├── config/                # Configuration files
│   ├── controllers/           # Route controllers
│   ├── middleware/            # Express middleware
│   ├── models/                # Database models
│   ├── routes/                # API routes
│   ├── services/              # Business logic services
│   └── utils/                 # Utility functions
├── docker-compose.yml         # Docker services configuration
├── Dockerfile                 # Application container
├── setup-docker.sh           # Docker setup script
├── setup-local.sh            # Local development setup
├── test-pipeline.sh          # Pipeline testing script
└── README.md                 # This file
```

## Services

### PostgreSQL Database

-   **Port**: 5432
-   **Database**: ragPipeline
-   **User**: postgres
-   **Password**: root

### Redis Cache

-   **Port**: 6379
-   **Usage**: Session storage and caching

### Application

-   **Port**: 3000
-   **Health Check**: http://localhost:3000/api/v1/health

## Environment Variables

Key environment variables (set in `.env`):

```env
# Database
POSTGRES_DB=ragPipeline
POSTGRES_USER=postgres
POSTGRES_PASSWORD=root

# API Keys (Required)
ANTHROPIC_API_KEY=your-anthropic-api-key
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX_NAME=qapipeline

# JWT
JWT_SECRET=your-jwt-secret

# Optional
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
```

## Troubleshooting

### Docker Issues

1. **Docker not running**

    ```bash
    # Start Docker Desktop application
    open -a Docker
    ```

2. **Port conflicts**

    ```bash
    # Stop conflicting services
    docker-compose down

    # Check what's using ports
    lsof -i :3000
    lsof -i :5432
    ```

3. **Database connection issues**

    ```bash
    # Check database logs
    docker-compose logs postgres

    # Restart database
    docker-compose restart postgres
    ```

### Application Issues

1. **Check application logs**

    ```bash
    docker-compose logs -f app
    ```

2. **Environment variables not set**

    ```bash
    # Verify .env file exists and has correct values
    cat .env
    ```

3. **API key issues**
    - Verify Anthropic API key is valid
    - Check Pinecone API key and index name
    - Restart application after updating keys

## Development

### Adding Features

1. Create feature branch
2. Make changes
3. Test with `./test-pipeline.sh`
4. Build and test with Docker: `docker-compose build app`

### Running Tests

```bash
# Run pipeline test
./test-pipeline.sh

# Run unit tests (if available)
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.
