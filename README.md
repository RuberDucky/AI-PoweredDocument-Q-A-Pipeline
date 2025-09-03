# AI-Powered Document Q&A Pipeline

A production-ready document question-answering system built with Node.js, featuring RAG (Retrieval-Augmented Generation) using Claude, Pinecone vector database, and PostgreSQL.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Node.js App   │
│   (Client)      │───▶│   (Nginx)       │───▶│   (Express)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                        ┌─────────────────┐            │
                        │   PostgreSQL    │◀───────────┤
                        │   (User Data)   │            │
                        └─────────────────┘            │
                                                        │
                        ┌─────────────────┐            │
                        │   Pinecone      │◀───────────┤
                        │   (Vectors)     │            │
                        └─────────────────┘            │
                                                        │
                        ┌─────────────────┐            │
                        │   Claude API    │◀───────────┘
                        │   (LLM)         │
                        └─────────────────┘
```

## ✨ Features

-   **ES Modules**: Modern JavaScript with ES module syntax
-   **Node.js 22**: Latest LTS version with enhanced performance
-   **Authentication**: JWT-based authentication with signup/login
-   **Document Processing**: Support for PDF, DOCX, and TXT files
-   **Vector Search**: Semantic search using Pinecone vector database
-   **RAG Pipeline**: Retrieval-Augmented Generation with Claude
-   **Rate Limiting**: API protection and abuse prevention
-   **Monitoring**: Comprehensive logging and analytics
-   **Containerization**: Docker and Docker Compose setup
-   **Production Ready**: Security headers, error handling, and health checks

## 🎥 Demo Video

Watch the complete demonstration of the AI-Powered Document Q&A Pipeline in action:

[![Demo Video](https://cdn.loom.com/assets/favicons-loom/mstile-150x150.png)](https://www.loom.com/share/eff417b6097f4bdfb69da3ee9417b636?sid=7ed6bc21-c1e9-43a1-ba40-92e3ead15e18)

[🔗 **Watch Demo Video**](https://www.loom.com/share/eff417b6097f4bdfb69da3ee9417b636?sid=7ed6bc21-c1e9-43a1-ba40-92e3ead15e18)

The demo showcases:

-   Complete Docker setup and deployment
-   User authentication and JWT token generation
-   Document upload and processing
-   AI-powered question answering with relevant context
-   Full API testing workflow

## 🚀 Quick Start

### Prerequisites

-   Node.js 22+
-   Docker and Docker Compose
-   PostgreSQL 16 (or use Docker)
-   Redis 7 (optional, for caching)
-   API Keys for:
    -   Anthropic Claude
    -   Pinecone

### 1. Clone and Setup

```bash
git clone https://github.com/RuberDucky/AI-PoweredDocument-Q-A-Pipeline.git
cd AI-PoweredDocument-Q-A-Pipeline
npm install
```

### 2. Environment Configuration

Copy the environment template:

```bash
cp .env.example .env
```

Update `.env` with your credentials:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=root

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Anthropic Claude API
ANTHROPIC_API_KEY=your-anthropic-api-key

# Pinecone Vector Database
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=your-pinecone-environment
PINECONE_INDEX_NAME=qa-pipeline-index
```

### 3. Using Docker (Recommended)

Start all services:

```bash
docker-compose up -d
```

The application will be available at `http://localhost:3000`

### 4. Manual Setup

If you prefer to run without Docker:

```bash
# Start PostgreSQL (ensure it's running on port 5432)
# Update .env with your database credentials

# Install dependencies
npm install

# Start the application
npm run dev
```

## 📡 API Endpoints

### Authentication

```http
POST /api/v1/auth/signup
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}
```

```http
GET /api/v1/auth/profile
Authorization: Bearer <token>
```

### Document Management

```http
POST /api/v1/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

document: <file>
```

```http
GET /api/v1/documents
Authorization: Bearer <token>
```

```http
DELETE /api/v1/documents/:id
Authorization: Bearer <token>
```

### Question & Answer

```http
POST /api/v1/qa/ask
Authorization: Bearer <token>
Content-Type: application/json

{
  "question": "What is artificial intelligence?"
}
```

```http
GET /api/v1/qa/history
Authorization: Bearer <token>
```

```http
POST /api/v1/qa/sessions/:id/feedback
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 5,
  "feedback": "Great answer!"
}
```

## 🏃‍♂️ Usage Examples

### 1. Register a new user

```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Alice Johnson",
    "email": "alice@spamok.com",
    "password": "12345678"
  }'
```

### 2. Login and get token

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@spamok.com",
    "password": "12345678"
  }'
```

### 3. Upload a document

```bash
curl -X POST http://localhost:3000/api/v1/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "document=@/path/to/your/document.pdf"
```

### 4. Ask a question

```bash
curl -X POST http://localhost:3000/api/v1/qa/ask \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are the main types of artificial intelligence?"
  }'
```

## 🗂️ Project Structure

```
qa_pipeline/
├── src/
│   ├── config/
│   │   ├── database.js          # Database configuration
│   │   └── logger.js            # Winston logger setup
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── documentController.js # Document management
│   │   └── qaController.js      # Q&A functionality
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── errorHandler.js      # Global error handling
│   │   ├── rateLimiter.js       # Rate limiting
│   │   └── validation.js        # Request validation
│   ├── models/
│   │   ├── User.js              # User model
│   │   ├── Document.js          # Document model
│   │   ├── QASession.js         # Q&A session model
│   │   └── index.js             # Model associations
│   ├── routes/
│   │   ├── authRoutes.js        # Auth endpoints
│   │   ├── documentRoutes.js    # Document endpoints
│   │   ├── qaRoutes.js          # Q&A endpoints
│   │   └── index.js             # Route aggregation
│   ├── services/
│   │   ├── authService.js       # Authentication service
│   │   ├── claudeService.js     # Claude API integration
│   │   ├── documentService.js   # Document processing
│   │   ├── pineconeService.js   # Vector database
│   │   └── qaService.js         # Q&A orchestration
│   ├── utils/
│   │   └── helpers.js           # Utility functions
│   └── app.js                   # Main application
├── data/
│   └── documents/               # Sample documents
├── nginx/
│   └── nginx.conf               # Nginx configuration
├── scripts/
│   └── init-db.sql              # Database initialization
├── docker-compose.yml           # Docker services
├── Dockerfile                   # Application container
└── README.md                    # This file
```

## 🛠️ Development

### Running Tests

```bash
npm test
```

### Database Migrations

```bash
npm run migrate
```

### Seeding Data

```bash
npm run seed
```

### Linting

```bash
npm run lint
```

## 🔧 Configuration

### Environment Variables

| Variable               | Description          | Required | Default           |
| ---------------------- | -------------------- | -------- | ----------------- |
| `PORT`                 | Server port          | No       | 3000              |
| `NODE_ENV`             | Environment          | No       | development       |
| `DB_HOST`              | Database host        | Yes      | localhost         |
| `DB_PORT`              | Database port        | No       | 5432              |
| `DB_NAME`              | Database name        | Yes      | ragPipeline       |
| `DB_USER`              | Database user        | Yes      | postgres          |
| `DB_PASSWORD`          | Database password    | Yes      | root              |
| `JWT_SECRET`           | JWT signing secret   | Yes      | -                 |
| `JWT_EXPIRES_IN`       | Token expiration     | No       | 24h               |
| `ANTHROPIC_API_KEY`    | Claude API key       | Yes      | -                 |
| `PINECONE_API_KEY`     | Pinecone API key     | Yes      | -                 |
| `PINECONE_ENVIRONMENT` | Pinecone environment | Yes      | -                 |
| `PINECONE_INDEX_NAME`  | Pinecone index name  | No       | qa-pipeline-index |

### Rate Limiting

-   General API: 100 requests per 15 minutes
-   Authentication: 5 requests per 15 minutes
-   Q&A: 10 requests per minute

### File Upload Limits

-   Maximum file size: 10MB
-   Supported formats: PDF, DOCX, TXT
-   Maximum files per upload: 1

## 🚀 Deployment

### Docker Deployment

1. Build and run with Docker Compose:

```bash
docker-compose up -d
```

2. Check service status:

```bash
docker-compose ps
```

3. View logs:

```bash
docker-compose logs -f app
```

### AWS Deployment

1. Use AWS ECS with the provided Dockerfile
2. Set up RDS PostgreSQL instance
3. Configure environment variables in ECS task definition
4. Use Application Load Balancer for SSL termination

### GCP Deployment

1. Use Google Cloud Run with the Dockerfile
2. Set up Cloud SQL PostgreSQL instance
3. Configure environment variables in Cloud Run
4. Use Cloud Load Balancing for traffic management

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:3000/api/v1/health
```

### Logs

Application logs are stored in:

-   `logs/combined.log` - All logs
-   `logs/error.log` - Error logs only

### Metrics

Available metrics:

-   Response times
-   Token usage
-   User ratings
-   Document processing status

## 🔒 Security

-   JWT-based authentication
-   Password hashing with bcrypt
-   Rate limiting on all endpoints
-   Input validation with Joi
-   Security headers with Helmet
-   CORS configuration
-   SQL injection prevention with Sequelize ORM

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**

    ```
    Error: connect ECONNREFUSED 127.0.0.1:5432
    ```

    - Ensure PostgreSQL is running
    - Check database credentials in `.env`

2. **Pinecone API Error**

    ```
    Error: Unauthorized
    ```

    - Verify `PINECONE_API_KEY` in `.env`
    - Check Pinecone dashboard for API key validity

3. **Claude API Error**

    ```
    Error: Invalid API key
    ```

    - Verify `ANTHROPIC_API_KEY` in `.env`
    - Ensure sufficient API credits

4. **File Upload Error**
    ```
    Error: File too large
    ```
    - Check file size (max 10MB)
    - Verify file format (PDF, DOCX, TXT only)

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

-   [Anthropic](https://www.anthropic.com/) for Claude API
-   [Pinecone](https://www.pinecone.io/) for vector database
-   [LangChain](https://langchain.com/) for AI frameworks
-   [Express.js](https://expressjs.com/) for web framework
