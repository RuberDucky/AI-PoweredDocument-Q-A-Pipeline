# AI-Powered Document Q&A Pipeline

A production-ready document question-answering system built with Node.js, featuring RAG (Retrieval-Augmented Generation) using Claude, Pinecone vector database, and PostgreSQL.

## 🏗️ Architecture Overview

````
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Node.js App   │
│   (Client)      │───▶│   (Nginx)       │───▶│   (Express)     │
└─────────────────┘    └───────────────2. **OpenAI API Error**

    ```
    Error: Invalid API key
    ```

    - Verify `OPENAI_API_KEY` in `.env`
    - Ensure sufficient API credits─────────────────┘
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
````

## ✨ Features

-   **ES Modules**: Modern JavaScript with ES module syntax
-   **Node.js 22**: Latest LTS version with enhanced performance
-   **Authentication**: JWT-based authentication with signup/login
-   **Document Processing**: Support for PDF, DOCX, TXT, and JSON files
-   **Vector Search**: Semantic search using Pinecone vector database with user isolation
-   **RAG Pipeline**: Retrieval-Augmented Generation with OpenAI GPT-4o-mini
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
    -   OpenAI (GPT-4o-mini)
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
PORT=3001
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

# OpenAI API
OPENAI_API_KEY=your-openai-api-key

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

The application will be available at `http://localhost:3001`

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

```http
POST /api/v1/auth/google
Content-Type: application/json

{
  "idToken": "GOOGLE_ID_TOKEN_FROM_FRONTEND"
}
```

Google flow:

1. Frontend obtains Google ID token via Google Identity Services.
2. Sends ID token to backend endpoint `/api/v1/auth/google`.
3. Backend verifies token, creates or links user, returns JWT.
4. Frontend stores JWT (same as normal login) and uses it for subsequent API calls.

Stored user profile fields now include:

- `fullName`
- `firstName` (parsed or from Google `given_name`)
- `lastName` (parsed or from Google `family_name`)
- `pictureUrl` (from Google `picture` claim if available)
- `email`
- `authProvider`

### Google OAuth Authorization Code Flow (Alternative)

This repository also supports the full OAuth authorization code flow if you prefer redirect-based login instead of directly sending an ID token from the frontend.

Endpoints:

```http
GET /api/v1/auth/google/start
```
Returns a JSON payload containing the `url` you should redirect the user to.

```http
GET /api/v1/auth/google/callback?code=...&state=...
```
Handles the Google redirect. It will exchange the code, create/link the user, and return JSON with the JWT. If opened in a popup it will also attempt to `postMessage` the token to the opener window.

Environment variables required for this flow (already added to `.env.example`):

```
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/v1/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

Sample frontend (popup) snippet:

```js
async function startGoogleOAuth() {
  const res = await fetch('http://localhost:3001/api/v1/auth/google/start');
  const { data } = await res.json();
  const popup = window.open(data.url, 'google_oauth', 'width=500,height=600');
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'google-auth-success') {
      localStorage.setItem('token', event.data.token);
      popup && popup.close();
    }
  });
}
```

Security recommendation: prefer delivering the JWT via an HTTP-only, Secure cookie instead of returning it in JSON if you want stronger protection against XSS. (See Security section note.)

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

## 📄 Supported File Types

The application now supports multiple document formats with advanced text extraction:

### TXT Files

-   Plain text files with UTF-8 encoding
-   Direct content extraction
-   Maximum size: 25MB

### PDF Files

-   Adobe PDF documents (all versions)
-   Text extraction using pdf-parse library
-   Handles encrypted PDFs (if no password required)
-   Maximum size: 25MB

### DOCX Files

-   Microsoft Word documents (.docx format)
-   Text extraction using mammoth library
-   Preserves document structure
-   Maximum size: 25MB

### JSON Files

-   Structured JSON data
-   Automatic conversion to readable text format
-   Validation for proper JSON syntax
-   Nested objects and arrays supported
-   Maximum size: 25MB

## 🏃‍♂️ Usage Examples

### Google Login (Frontend Integration Guide)

React (using Google Identity Services):

```jsx
import { useEffect } from 'react';

function GoogleLoginButton() {
    useEffect(() => {
        /* global google */
        if (!window.google) return;
        google.accounts.id.initialize({
            client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
            callback: async (response) => {
                try {
                    const res = await fetch(
                        'http://localhost:3001/api/v1/auth/google',
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                idToken: response.credential,
                            }),
                        },
                    );
                    const data = await res.json();
                    if (data.success) {
                        localStorage.setItem('token', data.data.token);
                        // proceed with authenticated flow
                    }
                } catch (e) {
                    console.error('Google auth failed', e);
                }
            },
        });
        google.accounts.id.renderButton(
            document.getElementById('google-signin'),
            { theme: 'outline', size: 'large' },
        );
    }, []);

    return <div id="google-signin" />;
}

export default GoogleLoginButton;
```

Add script in `public/index.html`:

```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

Environment variable (`.env` in React app):

```
REACT_APP_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

After successful backend response store `token` and use it in Authorization header:

```js
const token = localStorage.getItem('token');
fetch('/api/v1/documents', { headers: { Authorization: `Bearer ${token}` } });

#### Using HTTP-only Cookies (Optional Hardening)

Instead of returning the JWT in JSON, you can set it server-side in the callback handler:

```js
res.cookie('auth_token', result.token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000,
});
```

Then the frontend omits manual storage and just sends credentials implicitly if same-site. For cross-site or different subdomains configure CORS and `withCredentials`.
```

### 1. Register a new user

```bash
curl -X POST http://localhost:3001/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Alice Johnson",
    "email": "alice@spamok.com",
    "password": "12345678"
  }'
```

### 2. Login and get token

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@spamok.com",
    "password": "12345678"
  }'
```

### 3. Upload a document

```bash
curl -X POST http://localhost:3001/api/v1/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "document=@/path/to/your/document.pdf"
```

### 4. Ask a question

```bash
curl -X POST http://localhost:3001/api/v1/qa/ask \
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
│   │   ├── claudeService.js     # AI service (OpenAI integration)
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
| `PORT`                 | Server port          | No       | 3001              |
| `NODE_ENV`             | Environment          | No       | development       |
| `DB_HOST`              | Database host        | Yes      | localhost         |
| `DB_PORT`              | Database port        | No       | 5432              |
| `DB_NAME`              | Database name        | Yes      | ragPipeline       |
| `DB_USER`              | Database user        | Yes      | postgres          |
| `DB_PASSWORD`          | Database password    | Yes      | root              |
| `JWT_SECRET`           | JWT signing secret   | Yes      | -                 |
| `JWT_EXPIRES_IN`       | Token expiration     | No       | 24h               |
| `OPENAI_API_KEY`       | OpenAI API key       | Yes      | -                 |
| `PINECONE_API_KEY`     | Pinecone API key     | Yes      | -                 |
| `PINECONE_ENVIRONMENT` | Pinecone environment | Yes      | -                 |
| `PINECONE_INDEX_NAME`  | Pinecone index name  | No       | qa-pipeline-index |

### Rate Limiting

-   General API: 100 requests per 15 minutes
-   Authentication: 5 requests per 15 minutes
-   Q&A: 10 requests per minute

### File Upload Limits

-   Maximum file size: 25MB
-   Supported formats: PDF, DOCX, TXT, JSON
-   Maximum files per upload: 1
-   User isolation: Users can only access their own documents

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
curl http://localhost:3001/api/v1/health
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

    - Check file size (max 25MB)
    - Verify file format (PDF, DOCX, TXT, JSON only)
    - For PDF: Ensure file is not corrupted
    - For DOCX: Ensure file is valid Microsoft Word format
    - For JSON: Ensure valid JSON syntax

5. **User Isolation Error**
    ```
    Error: Document not found or access denied
    ```
    - Users can only access their own documents
    - Verify JWT token is valid and belongs to correct user
    - Check document ownership in database

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

-   [OpenAI](https://openai.com/) for GPT-4o-mini API
-   [Pinecone](https://www.pinecone.io/) for vector database
-   [LangChain](https://langchain.com/) for AI frameworks
-   [Express.js](https://expressjs.com/) for web framework
