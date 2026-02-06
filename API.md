# Skillarix - API Reference

## Base URL

**Development**: `http://localhost:8070/api/v1`  
**Production**: `https://your-domain.com/api/v1`

---

## Authentication

All endpoints except `/auth/login` and `/auth/register` require JWT authentication.

### Headers

```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

---

## Authentication Endpoints

### Login

**POST** `/auth/login`

Authenticate a user and receive a JWT token.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "user"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid credentials
- `400 Bad Request`: Missing fields

---

### Register

**POST** `/auth/register`

Create a new user account.

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "secure-password",
  "role": "user"
}
```

**Response** (200 OK):
```json
{
  "message": "User created successfully"
}
```

**Error Responses**:
- `400 Bad Request`: Email already exists
- `422 Unprocessable Entity`: Validation error

---

## Product Endpoints

### List Products

**GET** `/products`

Retrieve a paginated list of products.

**Query Parameters**:
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 10)
- `category_id` (string, optional): Filter by category

**Response** (200 OK):
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Product Name",
      "description": "Product description",
      "category_id": "507f1f77bcf86cd799439012",
      "content": "Detailed product information...",
      "file_url": "http://example.com/file.pdf",
      "file_name": "product-spec.pdf",
      "created_by": "507f1f77bcf86cd799439013",
      "created_at": "2026-01-22T10:00:00Z",
      "updated_at": "2026-01-22T10:00:00Z",
      "is_deleted": false
    }
  ],
  "page": 1,
  "limit": 10,
  "count": 1,
  "total_count": 25,
  "total_pages": 3
}
```

---

### Get Product by ID

**GET** `/products/{product_id}`

Retrieve a specific product.

**Path Parameters**:
- `product_id` (string): Product ID

**Response** (200 OK):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Product Name",
  "description": "Product description",
  "category_id": "507f1f77bcf86cd799439012",
  "content": "Detailed product information...",
  "file_url": "http://example.com/file.pdf",
  "file_name": "product-spec.pdf",
  "created_by": "507f1f77bcf86cd799439013",
  "created_at": "2026-01-22T10:00:00Z",
  "updated_at": "2026-01-22T10:00:00Z"
}
```

**Error Responses**:
- `404 Not Found`: Product not found

---

### Create Product

**POST** `/products`

Create a new product.

**Request Body**:
```json
{
  "name": "New Product",
  "description": "Product description",
  "category_id": "507f1f77bcf86cd799439012",
  "content": "Detailed product information...",
  "file_url": "http://example.com/file.pdf",
  "file_name": "product-spec.pdf"
}
```

**Response** (200 OK):
```json
{
  "message": "Product created successfully",
  "product_id": "507f1f77bcf86cd799439011"
}
```

---

### Update Product

**PUT** `/products/{product_id}`

Update an existing product.

**Path Parameters**:
- `product_id` (string): Product ID

**Request Body**:
```json
{
  "name": "Updated Product Name",
  "description": "Updated description",
  "content": "Updated content..."
}
```

**Response** (200 OK):
```json
{
  "message": "Product updated successfully"
}
```

---

### Delete Product

**DELETE** `/products/{product_id}`

Soft delete a product.

**Path Parameters**:
- `product_id` (string): Product ID

**Response** (200 OK):
```json
{
  "message": "Product deleted successfully"
}
```

---

## Test Configuration Endpoints

### List Test Configurations

**GET** `/test-configurations`

Retrieve a paginated list of test configurations.

**Query Parameters**:
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 10)
- `product_id` (string, optional): Filter by product

**Response** (200 OK):
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "product_id": "507f1f77bcf86cd799439012",
      "category_id": "507f1f77bcf86cd799439013",
      "name": "Test Config Name",
      "visitorPersona": {
        "product_knowledge": "Name-only",
        "product_familiarity": "Never seen",
        "technical_expertise": "Basic",
        "key_challenges": "Cost control",
        "buying_objective": "Save money",
        "budget_range": "Low",
        "decision_authority": "Influencer",
        "exhibition_objective": "Info gathering"
      },
      "additionalCriteria": {
        "distraction_handling": true,
        "communication_simplicity": true
      },
      "assessment": false,
      "created_by": "507f1f77bcf86cd799439014",
      "created_at": "2026-01-22T10:00:00Z",
      "is_deleted": false
    }
  ],
  "page": 1,
  "limit": 10,
  "count": 1,
  "total_count": 15,
  "total_pages": 2
}
```

---

### Create Test Configuration

**POST** `/test-configurations`

Create a new test configuration.

**Request Body**:
```json
{
  "product_id": "507f1f77bcf86cd799439012",
  "category_id": "507f1f77bcf86cd799439013",
  "name": "Budget-Conscious Buyer",
  "visitorPersona": {
    "product_knowledge": "Name-only",
    "product_familiarity": "Never seen",
    "technical_expertise": "Basic",
    "key_challenges": "Cost control",
    "buying_objective": "Save money",
    "budget_range": "Low",
    "decision_authority": "Influencer",
    "exhibition_objective": "Info gathering"
  },
  "additionalCriteria": {
    "distraction_handling": true,
    "communication_simplicity": true
  },
  "assessment": false
}
```

**Response** (200 OK):
```json
{
  "message": "Test configuration created successfully",
  "test_config_id": "507f1f77bcf86cd799439011"
}
```

---

### Update Test Configuration

**PUT** `/test-configurations/{test_config_id}`

Update an existing test configuration.

**Path Parameters**:
- `test_config_id` (string): Test configuration ID

**Request Body**: Same as Create Test Configuration

**Response** (200 OK):
```json
{
  "message": "Test configuration updated successfully"
}
```

---

### Delete Test Configuration

**DELETE** `/test-configurations/{test_config_id}`

Soft delete a test configuration.

**Response** (200 OK):
```json
{
  "message": "Test configuration deleted successfully"
}
```

---

## Conversation Endpoints

### Evaluate Conversation

**POST** `/conversations/evaluate`

Evaluate a single exchange in a conversation.

**Request Body**:
```json
{
  "product_id": "507f1f77bcf86cd799439011",
  "visitor_text": "What are the key features?",
  "salesperson_text": "Our product offers advanced automation, real-time analytics, and seamless integration with your existing tools.",
  "persona": {
    "product_knowledge": "Name-only",
    "technical_expertise": "Basic",
    "key_challenges": "Simplicity"
  },
  "conversation_history": [
    {
      "visitor_text": "Hi, tell me about this product.",
      "salesperson_text": "Hello! This is our flagship solution..."
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "evaluation": "Good response that addresses the question. Consider adding specific examples to make features more tangible for a non-technical buyer.",
  "rating": {
    "question_relevance": {
      "score": 3,
      "max": 3
    },
    "technical_accuracy": {
      "score": 2,
      "max": 3
    },
    "sales_effectiveness": {
      "score": 3,
      "max": 4
    },
    "total": {
      "score": 8,
      "max": 10
    }
  },
  "reference_answer": "Our product has three main features: automation that saves you 5 hours per week, real-time dashboards that show your progress instantly, and it works with tools you already use like Excel and Salesforce."
}
```

---

### Complete Conversation Evaluation

**POST** `/conversations/evaluate-complete`

Evaluate an entire conversation.

**Request Body**:
```json
{
  "product_id": "507f1f77bcf86cd799439011",
  "conversation_history": [
    {
      "visitor_text": "Hi, tell me about this product.",
      "salesperson_text": "Hello! This is our flagship solution..."
    },
    {
      "visitor_text": "What are the key features?",
      "salesperson_text": "Our product offers..."
    }
  ],
  "persona": {
    "product_knowledge": "Name-only",
    "technical_expertise": "Basic",
    "key_challenges": "Simplicity"
  }
}
```

**Response** (200 OK):
```json
{
  "complete_evaluation": {
    "summary": "The salesperson demonstrated good product knowledge and maintained a professional tone throughout. However, responses could be more tailored to the buyer's basic technical level.",
    "strengths": [
      "Clear and concise explanations",
      "Professional demeanor",
      "Addressed all customer questions"
    ],
    "weaknesses": [
      "Used some technical jargon for a non-technical buyer",
      "Missed opportunity to ask qualifying questions",
      "Could have provided more concrete examples"
    ]
  },
  "complete_rating": {
    "overall_progress": {
      "score": 2,
      "max": 3
    },
    "sales_strategy": {
      "score": 2,
      "max": 3
    },
    "customer_journey": {
      "score": 2,
      "max": 2
    },
    "technical_accuracy": {
      "score": 2,
      "max": 2
    },
    "total": {
      "score": 8,
      "max": 10
    }
  }
}
```

---

### List Conversations

**GET** `/conversations`

Retrieve user's conversation history.

**Query Parameters**:
- `page` (integer, optional): Page number
- `limit` (integer, optional): Items per page

**Response** (200 OK):
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "product_id": "507f1f77bcf86cd799439012",
      "user_id": "507f1f77bcf86cd799439013",
      "test_name": "Budget-Conscious Buyer",
      "prod_name": "Product Name",
      "conversation_data": {
        "history": [...]
      },
      "evaluation_data": {
        "complete_evaluation": {...},
        "complete_rating": {...}
      },
      "created_at": "2026-01-22T10:00:00Z"
    }
  ],
  "page": 1,
  "total_count": 10
}
```

---

## Prompt Endpoints

### List Prompts

**GET** `/prompts`

Retrieve all active prompts.

**Response** (200 OK):
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "ElevenLabs Agent System",
    "prompt": [
      {
        "condition": "main",
        "prompt": "You are a customer... {{product_name}}..."
      }
    ],
    "created_at": "2026-01-22T10:00:00Z"
  }
]
```

---

### Get Prompt by Title

**GET** `/prompts?title={title}`

Retrieve a specific prompt by title.

**Query Parameters**:
- `title` (string): Prompt title (URL encoded)

**Response** (200 OK):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "ElevenLabs Agent System",
  "prompt": [
    {
      "condition": "main",
      "prompt": "You are a customer interested in {{product_name}}..."
    }
  ]
}
```

---

### Create Prompt

**POST** `/prompts`

Create a new prompt.

**Request Body**:
```json
{
  "title": "Custom Prompt",
  "prompt": [
    {
      "condition": "main",
      "prompt": "Your prompt text with {{variables}}..."
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "message": "Prompt created successfully"
}
```

---

### Update Prompt

**PUT** `/prompts/{prompt_id}`

Update an existing prompt.

**Path Parameters**:
- `prompt_id` (string): Prompt ID

**Request Body**: Same as Create Prompt

**Response** (200 OK):
```json
{
  "message": "Prompt updated successfully"
}
```

---

## Category Endpoints

### List Categories

**GET** `/categories`

Retrieve all categories.

**Response** (200 OK):
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Software",
    "description": "Software products",
    "created_at": "2026-01-22T10:00:00Z"
  }
]
```

---

### Create Category

**POST** `/categories`

Create a new category.

**Request Body**:
```json
{
  "name": "Hardware",
  "description": "Hardware products"
}
```

**Response** (200 OK):
```json
{
  "message": "Category created successfully"
}
```

---

## User Management Endpoints (Admin Only)

### List Users

**GET** `/users`

Retrieve all users (admin only).

**Response** (200 OK):
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "created_at": "2026-01-22T10:00:00Z"
  }
]
```

---

### Update User Role

**PUT** `/users/{user_id}/role`

Update a user's role (admin only).

**Request Body**:
```json
{
  "role": "admin"
}
```

**Response** (200 OK):
```json
{
  "message": "User role updated successfully"
}
```

---

## WebSocket API

### Connection

**WS** `/websocket`

Establish a WebSocket connection for real-time updates.

**Connection URL**:
```
ws://localhost:8070/api/v1/websocket?token=<jwt-token>
```

### Message Types

#### Client → Server

**Conversation Update**:
```json
{
  "type": "conversation_update",
  "data": {
    "conversation_id": "507f1f77bcf86cd799439011",
    "exchange": {
      "visitor_text": "What are the features?",
      "salesperson_text": "Our product offers..."
    }
  }
}
```

#### Server → Client

**Evaluation Result**:
```json
{
  "type": "evaluation_result",
  "data": {
    "score": 8,
    "evaluation": "Good response...",
    "rating": {
      "question_relevance": { "score": 3, "max": 3 },
      "technical_accuracy": { "score": 2, "max": 3 },
      "sales_effectiveness": { "score": 3, "max": 4 }
    }
  }
}
```

**Error Message**:
```json
{
  "type": "error",
  "message": "Evaluation failed: ..."
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "detail": "Error message description"
}
```

### HTTP Status Codes

- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

---

## Rate Limiting

Currently, no rate limiting is implemented. For production, consider:
- 100 requests per minute per user
- 1000 requests per hour per user

---

## Pagination

All list endpoints support pagination:

**Query Parameters**:
- `page`: Page number (1-indexed)
- `limit`: Items per page (default: 10, max: 100)

**Response Format**:
```json
{
  "data": [...],
  "page": 1,
  "limit": 10,
  "count": 10,
  "total_count": 45,
  "total_pages": 5
}
```

---

## Examples

### Complete Training Session Flow

```bash
# 1. Login
curl -X POST http://localhost:8070/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Response: { "access_token": "eyJ...", ... }

# 2. Get Products
curl -X GET http://localhost:8070/api/v1/products \
  -H "Authorization: Bearer eyJ..."

# 3. Get Test Configurations
curl -X GET http://localhost:8070/api/v1/test-configurations \
  -H "Authorization: Bearer eyJ..."

# 4. Start Conversation (via WebSocket)
# Connect to ws://localhost:8070/api/v1/websocket?token=eyJ...

# 5. Evaluate Exchange
curl -X POST http://localhost:8070/api/v1/conversations/evaluate \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "507f...",
    "visitor_text": "What features does it have?",
    "salesperson_text": "It has automation, analytics, and integration.",
    "persona": {...}
  }'

# 6. Complete Evaluation
curl -X POST http://localhost:8070/api/v1/conversations/evaluate-complete \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "507f...",
    "conversation_history": [...],
    "persona": {...}
  }'
```

---

**API Version**: 1.0  
**Last Updated**: January 2026
