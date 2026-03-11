# Skillarix - AI-Powered Sales Training Platform

## Overview

Skillarix is an advanced AI-powered sales training platform that uses realistic buyer personas and live AI analysis to help sales professionals improve their pitch delivery, product knowledge, and customer engagement skills.

## 🎯 Key Features

### ✅ Fully Implemented

1. **Interactive Simulations**
   - Realistic Q&A with AI buyer personas powered by ElevenLabs
   - Voice-based conversational AI for natural interactions
   - Dynamic persona adaptation based on test configurations

2. **Automated Coaching**
   - Real-time AI-powered feedback using LLaMA 4 / OpenAI GPT
   - Personalized training recommendations based on behavior
   - Detailed scoring across multiple dimensions

3. **Instant Feedback**
   - Comprehensive evaluation reports with strengths and weaknesses
   - Multi-dimensional scoring system:
     - Question Relevance (0-3)
     - Technical Accuracy (0-3)
     - Sales Effectiveness (0-4)
   - Exchange-by-exchange analysis

4. **Performance Dashboard**
   - Aggregated skill scores and progress tracking
   - User management for administrators
   - Historical conversation analytics

5. **Modular AI Stack**
   - Switchable LLM providers (OpenAI / Groq)
   - Easy model upgrades without code changes
   - Configurable via environment variables

### ⚠️ Partially Implemented

6. **Live Analysis**
   - ✅ LLaMA 4 embeddings for delivery quality tracking
   - ❌ Deepgram transcription (currently using ElevenLabs built-in STT)

7. **Collateral Indexing**
   - ✅ Product content injection into AI context
   - ❌ Vector database for scalable content retrieval
   - ❌ OpenAI embeddings for semantic search

### ❌ Not Implemented

8. **Customer Data Platform Integration**
   - No enterprise CDP API integration (Salesforce, HubSpot, etc.)
   - Currently uses local product and persona definitions

---

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS + Shadcn/ui for styling
- React Router for navigation
- ElevenLabs React SDK for voice AI

**Backend:**
- FastAPI (Python)
- MongoDB for data persistence
- Groq (LLaMA 4) / OpenAI for AI analysis
- WebSocket for real-time communication
- JWT for authentication

**AI Services:**
- ElevenLabs Conversational AI
- OpenAI GPT-4 / Groq LLaMA 4
- Dynamic prompt management system

---

## 📁 Project Structure

```
skillarix/
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # React contexts (Auth, etc.)
│   │   ├── utils/           # Utility functions
│   │   └── config/          # Configuration files
│   └── .env                 # Frontend environment variables
│
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   │   └── v1/
│   │   │       └── endpoints/
│   │   ├── models/         # Data models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   └── .env                # Backend environment variables
│
└── README.md               # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+
- **MongoDB** instance (local or cloud)
- **API Keys:**
  - ElevenLabs API key
  - OpenAI API key (optional)
  - Groq API key (optional)

### Installation

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd skillarix
```

#### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r app/requirements.txt

# Configure environment variables
# Copy .env.example to .env and fill in your values
cp .env.example .env
```

**Backend Environment Variables (.env):**

```env
# Project Settings
PROJECT_NAME=Skillarix API
API_V1_STR=/api/v1
BACKEND_URL=http://localhost:8070

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI Model Selection
MODEL=0                    # 0 = Groq, 1 = OpenAI
MODEL_NAME=meta-llama/llama-4-scout-17b-16e-instruct

# API Keys
GROQ_API_KEY=your-groq-api-key
OPENAI_API_KEY=your-openai-api-key

# MongoDB
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=skillarix

# CORS
CORS_ORIGINS=["http://localhost:5173"]
```

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
# Copy .env.example to .env and fill in your values
cp .env.example .env
```

**Frontend Environment Variables (.env):**

```env
# API Configuration
VITE_API_URL=http://localhost:8070/api/v1
VITE_TOKEN_KEY=skillarix_token
VITE_WS_URL=ws://localhost:8070

# ElevenLabs Configuration
VITE_ELEVENLABS_AGENT_ID=your-agent-id
VITE_ELEVENLABS_API_KEY=your-api-key
VITE_ELEVENLABS_API_URL=https://api.elevenlabs.io/v1/convai/agents
VITE_ELEVENLABS_TITLE=ElevenLabs Agent System

# Evaluation Configuration
VITE_EVALUTION_TITLE=[Complete Evaluation,Additional Criteria Evaluation]
```

### Running the Application

#### Start Backend (Port 8070)

```bash
cd backend
uvicorn app.main:app --reload --port 8070
```

#### Start Frontend (Port 5173)

```bash
cd frontend
npm run dev
```

Access the application at: **http://localhost:5173**

---

## 🔑 Core Concepts

### 1. Products

Products represent the items or services your sales team will be trained on. Each product includes:
- Name and description
- Category assignment
- Product content (detailed specifications)
- Optional file attachments

### 2. Test Configurations

Test configurations define the buyer persona and scenario for each training session:

**Visitor Persona Fields:**
- **Product Knowledge**: None, Name-only, Saw ad/brochure, Peer-heard, Very familiar
- **Product Familiarity**: Never seen, Handled briefly, Tried sample, Similar user, Loyal user
- **Technical Expertise**: General, Basic, Moderate, Advanced, Expert
- **Key Challenges**: Cost control, Quality/reliability, Compliance, Simplicity, Trust in vendor, Sustainability
- **Buying Objective**: Save money, Boost quality, Meet standards, Upgrade, Future planning
- **Budget Range**: Very low, Low, Mid, High, Very high
- **Decision Authority**: User, Influencer, Evaluator, Approver, Final sign-off
- **Exhibition Objective**: Info gathering, Spec comparison, Pricing talk, Terms/warranty, Partnership, Demo booking

**Additional Criteria:**
- Distraction Handling
- Communication Simplicity

### 3. Conversations

Each training session creates a conversation record with:
- Full transcript (visitor + salesperson exchanges)
- Real-time evaluations
- Complete conversation analysis
- Scoring metrics

### 4. Dynamic Prompts

The system uses a dynamic prompt system that:
- Fetches prompts from the database by title
- Supports fallback prompts
- Allows runtime variable substitution
- Enables prompt versioning and A/B testing

---

## 🎓 How It Works

### Training Session Flow

1. **Setup Phase**
   - User selects a Product
   - User selects a Test Configuration (buyer persona)
   - System loads product details and persona parameters

2. **Conversation Phase**
   - ElevenLabs agent is configured with dynamic variables:
     - `{{product_name}}`
     - `{{product_knowledge}}`
     - `{{technical_expertise}}`
     - `{{key_challenges}}`
     - `{{buying_objective}}`
     - etc.
   - AI buyer persona initiates conversation
   - Salesperson responds via voice/text
   - System captures full transcript

3. **Evaluation Phase**
   - **Per-Exchange Evaluation**: Each response is scored individually
   - **Mid-Conversation Check**: Periodic progress assessments
   - **Complete Evaluation**: Final comprehensive analysis
   - **Additional Criteria**: Specialized scoring (distraction handling, simplicity)

4. **Feedback Phase**
   - Detailed report generation
   - Strengths and weaknesses identification
   - Actionable recommendations
   - Score visualization

### AI Evaluation System

The platform uses a strict, multi-dimensional scoring rubric:

**Question Relevance (0-3)**
- 0: Completely irrelevant or "I don't know"
- 1: Vague response, misses main point
- 2: Addresses question but lacks depth
- 3: Perfectly addresses the specific question

**Technical Accuracy (0-3)**
- 0: Factually incorrect or contradicts product info
- 1: Mostly correct but misses key details
- 2: Accurate
- 3: Accurate with deep product knowledge

**Sales Effectiveness (0-4)**
- 0: Rude, dismissive, or unprofessional
- 1: Generic/robotic, lacks empathy
- 2: Polite but standard
- 3: Persuasive, persona-aware
- 4: Exceptional, perfectly tailored

**Total Score: 0-10** (sum of all dimensions)

---

## 🔌 API Documentation

### Authentication

All API endpoints (except `/auth/login`) require JWT authentication:

```bash
Authorization: Bearer <your-jwt-token>
```

### Key Endpoints

#### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration

#### Products
- `GET /api/v1/products` - List all products (paginated)
- `POST /api/v1/products` - Create new product
- `GET /api/v1/products/{id}` - Get product details
- `PUT /api/v1/products/{id}` - Update product
- `DELETE /api/v1/products/{id}` - Delete product

#### Test Configurations
- `GET /api/v1/test-configurations` - List all test configs (paginated)
- `POST /api/v1/test-configurations` - Create new test config
- `GET /api/v1/test-configurations/{id}` - Get test config details
- `PUT /api/v1/test-configurations/{id}` - Update test config
- `DELETE /api/v1/test-configurations/{id}` - Delete test config

#### Conversations
- `POST /api/v1/conversations/evaluate` - Evaluate a conversation
- `GET /api/v1/conversations/{id}` - Get conversation details
- `GET /api/v1/conversations` - List all conversations

#### Prompts
- `GET /api/v1/prompts` - List all prompts
- `GET /api/v1/prompts?title={title}` - Get prompt by title
- `POST /api/v1/prompts` - Create new prompt
- `PUT /api/v1/prompts/{id}` - Update prompt

#### WebSocket
- `WS /api/v1/websocket` - Real-time conversation updates

---

## 🎨 Frontend Components

### Key Hooks

**`useElevenLabs.ts`**
- Manages ElevenLabs agent configuration
- Handles dynamic variable injection
- Fetches and applies prompts

**`useStartConversation.ts`**
- Orchestrates conversation initialization
- Combines product and persona data
- Starts ElevenLabs session

**`useProducts.ts`**
- Product CRUD operations
- Product listing and filtering

**`useTests.ts`**
- Test configuration management
- Persona data handling

### Key Pages

- **Dashboard**: Overview of user performance
- **Products**: Product management interface
- **TestSetup**: Test configuration management
- **Practice**: Training session interface
- **Settings**: User preferences and theme

---

## 🔧 Configuration Guide

### Switching AI Models

To switch between OpenAI and Groq:

1. Update `backend/.env`:
   ```env
   MODEL=0  # 0 = Groq, 1 = OpenAI
   ```

2. Ensure the corresponding API key is set:
   ```env
   GROQ_API_KEY=your-key      # If MODEL=0
   OPENAI_API_KEY=your-key    # If MODEL=1
   ```

3. Restart the backend server

### Customizing Prompts

1. Navigate to the Prompts section in the admin panel
2. Create or edit a prompt with title: `ElevenLabs Agent System`
3. Use Handlebars syntax for variables: `{{product_name}}`
4. Save and test

### Adding New Persona Fields

1. Update `backend/app/schemas/test_configuration.py`:
   ```python
   class VisitorPersona(BaseModel):
       # ... existing fields
       new_field: str
   ```

2. Update `frontend/src/hooks/useElevenLabs.ts`:
   ```typescript
   dynamic_variable_placeholders: {
       // ... existing variables
       new_field: personaObj.new_field || 'default'
   }
   ```

3. Update your prompt template to use `{{new_field}}`

---

## 🐛 Troubleshooting

### Common Issues

**Issue: "ELEVENLABS_PROMPT_TITLE is not defined"**
- **Solution**: Ensure `VITE_ELEVENLABS_TITLE` is set in `frontend/.env`

**Issue: Backend returns 500 on evaluation**
- **Solution**: Check that `GROQ_API_KEY` or `OPENAI_API_KEY` is valid
- Verify `MODEL` setting matches available API key

**Issue: Conversation not starting**
- **Solution**: 
  - Verify ElevenLabs agent ID and API key
  - Check browser console for errors
  - Ensure product and test config are selected

**Issue: MongoDB connection failed**
- **Solution**: 
  - Verify MongoDB is running
  - Check `MONGODB_URL` in backend `.env`
  - Ensure database name is correct

---

## 📊 Database Schema

### Collections

**users**
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  role: String,
  created_at: DateTime,
  is_deleted: Boolean
}
```

**products**
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  category_id: ObjectId,
  content: String,
  file_url: String,
  file_name: String,
  created_by: ObjectId,
  created_at: DateTime,
  updated_at: DateTime,
  is_deleted: Boolean
}
```

**test_configurations**
```javascript
{
  _id: ObjectId,
  product_id: ObjectId,
  category_id: ObjectId,
  name: String,
  visitorPersona: {
    product_knowledge: String,
    product_familiarity: String,
    technical_expertise: String,
    key_challenges: String,
    buying_objective: String,
    budget_range: String,
    decision_authority: String,
    exhibition_objective: String
  },
  additionalCriteria: {
    distraction_handling: Boolean,
    communication_simplicity: Boolean
  },
  assessment: Boolean,
  created_by: ObjectId,
  created_at: DateTime,
  is_deleted: Boolean
}
```

**conversations**
```javascript
{
  _id: ObjectId,
  product_id: ObjectId,
  category_id: ObjectId,
  user_id: ObjectId,
  conversation_data: {
    history: [
      {
        visitor_text: String,
        salesperson_text: String,
        evaluation: String,
        score: Number,
        timestamp: DateTime
      }
    ]
  },
  evaluation_data: {
    complete_evaluation: Object,
    complete_rating: Object,
    additional_criteria: Array
  },
  test_name: String,
  prod_name: String,
  cat_name: String,
  created_at: DateTime,
  updated_at: DateTime,
  is_deleted: Boolean
}
```

**prompts**
```javascript
{
  _id: ObjectId,
  title: String,
  prompt: [
    {
      condition: String,
      prompt: String
    }
  ],
  created_by: ObjectId,
  created_at: DateTime,
  updated_at: DateTime,
  is_deleted: Boolean
}
```

---

## 🚀 Deployment

### Backend Deployment

1. Set up a production MongoDB instance
2. Configure environment variables for production
3. Use a production WSGI server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8070 --workers 4
   ```

### Frontend Deployment

1. Build the production bundle:
   ```bash
   npm run build
   ```

2. Serve the `dist` folder using a static file server (Nginx, Vercel, Netlify, etc.)

3. Update `VITE_API_URL` to point to your production backend

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📝 License

[Add your license information here]

---

## 📧 Support

For support, please contact: [Add contact information]

---

## 🗺️ Roadmap

### Planned Features

- [ ] Deepgram integration for advanced transcription
- [ ] Vector database for scalable content retrieval
- [ ] OpenAI embeddings for semantic search
- [ ] Enterprise CDP integration (Salesforce, HubSpot)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Mobile app
- [ ] Team collaboration features
- [ ] Custom scoring rubrics
- [ ] Video-based training sessions

---

**Version**: 1.0.0  
**Last Updated**: January 2026
