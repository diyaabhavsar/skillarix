# Skillarix - Technical Architecture

## System Architecture Overview

Skillarix follows a modern three-tier architecture with AI services integration:

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  React SPA (Vite + TypeScript)                       │  │
│  │  - UI Components (Shadcn/ui)                         │  │
│  │  - State Management (React Context)                  │  │
│  │  - Real-time Communication (WebSocket)               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/WS
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  FastAPI Backend                                     │  │
│  │  - RESTful API Endpoints                             │  │
│  │  - WebSocket Server                                  │  │
│  │  - Business Logic Services                           │  │
│  │  - JWT Authentication                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  MongoDB                                             │  │
│  │  - Users, Products, Conversations                    │  │
│  │  - Test Configurations, Prompts                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   External AI Services                      │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  ElevenLabs  │  │  Groq        │  │  OpenAI         │  │
│  │  Voice AI    │  │  LLaMA 4     │  │  GPT-4          │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Frontend Architecture

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base Shadcn components
│   ├── products/       # Product-specific components
│   ├── testconfig/     # Test configuration components
│   └── Navbar.tsx      # Navigation component
│
├── pages/              # Route-level components
│   ├── Dashboard.tsx
│   ├── Products.tsx
│   ├── TestSetup.tsx
│   ├── Practice.tsx
│   └── admin/
│       ├── AdminDashboard.tsx
│       └── ManageUsers.tsx
│
├── hooks/              # Custom React hooks
│   ├── useAuth.ts
│   ├── useProducts.ts
│   ├── useTests.ts
│   ├── useElevenLabs.ts
│   └── chat/
│       ├── useStartConversation.ts
│       └── useEvaluateConversation.ts
│
├── contexts/           # React Context providers
│   └── AuthContext.tsx
│
├── utils/              # Utility functions
│   ├── api.ts
│   └── dateUtils.ts
│
└── config/             # Configuration
    └── env.ts
```

### Backend Architecture

```
app/
├── api/
│   └── v1/
│       ├── api.py              # API router aggregator
│       └── endpoints/
│           ├── auth.py
│           ├── products.py
│           ├── test_configurations.py
│           ├── conversations.py
│           ├── elevenlabs.py
│           ├── prompt.py
│           └── websocket.py
│
├── models/                     # Domain models
│   ├── user.py
│   ├── product.py
│   ├── test_configuration.py
│   └── conversation.py
│
├── schemas/                    # Pydantic schemas
│   ├── user.py
│   ├── product.py
│   ├── test_configuration.py
│   ├── conversation.py
│   └── prompts.py
│
├── services/                   # Business logic
│   ├── auth.py
│   ├── product.py
│   ├── test_configuration.py
│   ├── conversation.py         # Core AI evaluation logic
│   ├── prompt.py
│   ├── reports.py
│   └── websocket.py
│
├── utils/                      # Utilities
│   └── constants.py
│
├── config.py                   # Configuration management
├── database.py                 # MongoDB connection
├── dependencies.py             # FastAPI dependencies
└── main.py                     # Application entry point
```

---

## Data Flow Diagrams

### 1. Training Session Initialization

```
User selects Product & Test Config
         ↓
Frontend: useStartConversation hook
         ↓
Fetch Product details (useProducts)
Fetch Test Config details (useTests)
         ↓
Build conversation config with dynamic variables:
  - product_name
  - product_knowledge
  - technical_expertise
  - key_challenges
  - etc.
         ↓
useElevenLabs.updateAgentConfig()
         ↓
PATCH request to ElevenLabs API
         ↓
conversation.startSession()
         ↓
ElevenLabs conversation begins
```

### 2. Real-time Evaluation Flow

```
User speaks → ElevenLabs captures audio
         ↓
ElevenLabs STT → Text transcript
         ↓
Frontend receives transcript via WebSocket
         ↓
Backend: POST /conversations/evaluate
         ↓
services/conversation.py:
  1. generate_answer_rag()
     - Builds ideal reference answer
     - Uses product context + persona
     - LLaMA 4 / GPT-4 generation
         ↓
  2. evaluate_individual_answer()
     - Compares salesperson vs reference
     - Strict scoring rubric
     - Returns JSON with scores
         ↓
  3. Save to MongoDB
     - Update conversation history
     - Store evaluation data
         ↓
Frontend receives evaluation
         ↓
Display scores and feedback in UI
```

### 3. Complete Conversation Evaluation

```
Conversation ends
         ↓
Frontend: POST /conversations/evaluate-complete
         ↓
Backend: evaluate_complete_conversation()
         ↓
Fetch prompt from DB (title: "Conversation Evaluation Main")
         ↓
Replace placeholders:
  - {{Visitor_persona}}
  - {{Product_detail}}
  - {{Conversion_history}}
         ↓
LLM generates comprehensive evaluation:
  - Summary
  - Strengths (list)
  - Weaknesses (list)
  - Ratings:
    * Overall Progress (0-3)
    * Sales Strategy (0-3)
    * Customer Journey (0-2)
    * Technical Accuracy (0-2)
    * Total (0-10)
         ↓
Save to MongoDB
         ↓
Return to frontend
         ↓
Display detailed report
```

---

## AI Integration Architecture

### ElevenLabs Integration

**Purpose**: Conversational AI for realistic buyer personas

**Flow**:
1. Frontend configures agent via `useElevenLabs.ts`
2. Dynamic variables injected into agent prompt
3. Agent initialized with persona-specific behavior
4. Real-time voice conversation
5. Transcript streamed to frontend

**Key Files**:
- `frontend/src/hooks/useElevenLabs.ts`
- `frontend/src/hooks/chat/useStartConversation.ts`

### LLM Integration (Groq / OpenAI)

**Purpose**: 
- Generate ideal reference answers
- Evaluate salesperson responses
- Provide coaching recommendations

**Model Selection**:
```python
# backend/app/services/conversation.py
FLAG = settings.MODEL  # 0 = Groq, 1 = OpenAI

if FLAG == 1:
    # OpenAI GPT-4
    response = openai_client.chat.completions.create(...)
else:
    # Groq LLaMA 4
    response = client.chat.completions.create(...)
```

**Key Functions**:
- `generate_answer_rag()` - Creates reference answers
- `evaluate_individual_answer()` - Scores each exchange
- `evaluate_mid_conversation()` - Progress checks
- `evaluate_complete_conversation()` - Final analysis
- `evaluate_additional_criteria()` - Specialized scoring

---

## Authentication & Authorization

### JWT-based Authentication

**Flow**:
```
1. User submits credentials
   ↓
2. Backend validates (bcrypt password check)
   ↓
3. Generate JWT token with user data
   ↓
4. Return token to frontend
   ↓
5. Frontend stores in localStorage
   ↓
6. All subsequent requests include:
   Authorization: Bearer <token>
   ↓
7. Backend validates token via verify_bearer_token()
```

**Implementation**:
- `backend/app/services/auth.py` - Token generation/validation
- `frontend/src/contexts/AuthContext.tsx` - Client-side auth state
- `frontend/src/utils/api.ts` - Automatic token injection

### Role-Based Access Control

**Roles**:
- `admin` - Full system access
- `user` - Standard sales rep access

**Protected Routes**:
- Frontend: `ProtectedRoute` component
- Backend: `verify_bearer_token` dependency

---

## WebSocket Architecture

### Real-time Communication

**Purpose**: Live conversation updates and evaluations

**Endpoint**: `ws://localhost:8070/api/v1/websocket`

**Message Types**:
```typescript
// Client → Server
{
  type: "conversation_update",
  data: {
    conversation_id: string,
    exchange: {
      visitor_text: string,
      salesperson_text: string
    }
  }
}

// Server → Client
{
  type: "evaluation_result",
  data: {
    score: number,
    evaluation: string,
    rating: {
      question_relevance: { score: number, max: number },
      technical_accuracy: { score: number, max: number },
      sales_effectiveness: { score: number, max: number }
    }
  }
}
```

**Implementation**:
- `backend/app/api/v1/endpoints/websocket.py`
- `backend/app/services/websocket.py`

---

## Prompt Management System

### Dynamic Prompt Architecture

**Concept**: Store prompts in database for easy updates without code changes

**Structure**:
```javascript
{
  title: "ElevenLabs Agent System",
  prompt: [
    {
      condition: "main",
      prompt: "You are a customer... {{product_name}}..."
    },
    {
      condition: "fallback",
      prompt: "Alternative prompt..."
    }
  ]
}
```

**Variable Substitution**:
```python
# Backend replaces placeholders
prompt = prompt.replace("{{product_name}}", product.name)
prompt = prompt.replace("{{key_challenges}}", persona.key_challenges)
```

**Frontend Fetch**:
```typescript
// frontend/src/hooks/useElevenLabs.ts
const fetchCurrentPrompt = async () => {
  const title = env.ELEVENLABS_PROMPT_TITLE;
  const response = await api.get(`/prompts?title=${title}`);
  return response.prompt[0].prompt;
}
```

---

## Evaluation Scoring System

### Multi-Dimensional Rubric

**Per-Exchange Scoring**:
```
Question Relevance (0-3)
+ Technical Accuracy (0-3)
+ Sales Effectiveness (0-4)
= Total Score (0-10)
```

**Complete Conversation Scoring**:
```
Overall Progress (0-3)
+ Sales Strategy (0-3)
+ Customer Journey (0-2)
+ Technical Accuracy (0-2)
= Total Score (0-10)
```

### Scoring Philosophy

**Strict Evaluation**:
- High scores (9-10) reserved for exceptional performance
- Generic responses receive low scores (2-4)
- Factual errors result in 0 for technical accuracy
- Persona-awareness is critical for sales effectiveness

**Implementation**:
```python
# backend/app/services/conversation.py
def evaluate_individual_answer(...):
    prompt = f"""
    SCORING RUBRIC (BE STRICT):
    - Question Relevance (0-3):
      * 0: Completely irrelevant
      * 1: Vague response
      * 2: Addresses question but lacks depth
      * 3: Perfectly addresses question
    ...
    """
```

---

## Performance Considerations

### Frontend Optimization

1. **Code Splitting**: Route-based lazy loading
2. **Memoization**: React.memo for expensive components
3. **Debouncing**: Search inputs debounced
4. **Pagination**: Large lists paginated server-side

### Backend Optimization

1. **Streaming Responses**: LLM responses streamed to reduce latency
2. **Connection Pooling**: MongoDB connection reuse
3. **Async Operations**: FastAPI async/await throughout
4. **Caching**: Prompt caching to reduce DB queries

### Database Optimization

1. **Indexing**: 
   - `users.email` (unique)
   - `products.category_id`
   - `conversations.user_id`
   - `conversations.created_at`

2. **Soft Deletes**: `is_deleted` flag instead of hard deletes

3. **Pagination**: Skip/limit queries for large datasets

---

## Security Architecture

### Security Measures

1. **Password Hashing**: bcrypt with salt
2. **JWT Tokens**: Short expiration (30 minutes)
3. **CORS**: Configured origins only
4. **Input Validation**: Pydantic schemas
5. **SQL Injection**: N/A (MongoDB, no raw queries)
6. **XSS Protection**: React auto-escaping

### Environment Variables

**Never commit**:
- API keys
- Secret keys
- Database credentials

**Use**:
- `.env` files (gitignored)
- Environment-specific configs

---

## Error Handling

### Frontend Error Handling

```typescript
try {
  await api.post('/endpoint', data);
  toast.success('Success!');
} catch (error: any) {
  toast.error(error.message || 'An error occurred');
  console.error('Error details:', error);
}
```

### Backend Error Handling

```python
try:
    result = perform_operation()
    return {"message": "Success"}
except HTTPException as e:
    raise e
except Exception as e:
    logger.error(f"Unexpected error: {e}")
    raise HTTPException(status_code=500, detail=str(e))
```

---

## Deployment Architecture

### Production Setup

```
┌─────────────────────────────────────────┐
│  CDN / Static Hosting (Frontend)        │
│  - Vercel / Netlify / Cloudflare        │
└─────────────────────────────────────────┘
                ↓ API Calls
┌─────────────────────────────────────────┐
│  Application Server (Backend)           │
│  - Docker Container                     │
│  - Uvicorn (4 workers)                  │
│  - Reverse Proxy (Nginx)                │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│  MongoDB Atlas (Database)               │
│  - Replica Set                          │
│  - Automated Backups                    │
└─────────────────────────────────────────┘
```

### Environment-Specific Configs

**Development**:
- Local MongoDB
- Debug logging
- Hot reload enabled

**Production**:
- MongoDB Atlas
- Error-level logging
- Multiple workers
- HTTPS enforced

---

## Monitoring & Logging

### Logging Strategy

**Backend**:
```python
import logging

logger = logging.getLogger(__name__)
logger.info("Conversation started")
logger.error("Evaluation failed", exc_info=True)
```

**Frontend**:
```typescript
console.log("Debug info");
console.error("Error occurred", error);
```

### Metrics to Track

1. **Performance**:
   - API response times
   - LLM generation latency
   - WebSocket connection stability

2. **Business**:
   - Active users
   - Conversations per day
   - Average scores
   - Completion rates

3. **Errors**:
   - API error rates
   - Failed evaluations
   - Authentication failures

---

## Testing Strategy

### Frontend Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

**Test Coverage**:
- Component rendering
- Hook behavior
- API integration
- User flows

### Backend Testing

```bash
# Unit tests
pytest

# Integration tests
pytest tests/integration/
```

**Test Coverage**:
- Endpoint responses
- Service logic
- Database operations
- Authentication

---

## Future Architecture Enhancements

### Planned Improvements

1. **Vector Database Integration**
   ```
   Product Content → OpenAI Embeddings → Pinecone/Weaviate
                                              ↓
                                    Semantic Search for RAG
   ```

2. **Microservices Architecture**
   - Separate evaluation service
   - Dedicated prompt service
   - Independent scaling

3. **Caching Layer**
   - Redis for session data
   - Prompt caching
   - API response caching

4. **Advanced Analytics**
   - Time-series data (InfluxDB)
   - Real-time dashboards (Grafana)
   - Predictive insights

---

**Document Version**: 1.0  
**Last Updated**: January 2026
