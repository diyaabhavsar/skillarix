# Skillarix — AI-Powered Sales Training Platform

Skillarix puts sales reps through realistic, voice-driven conversations with AI buyer personas and then delivers a detailed performance evaluation the moment the session ends. Instead of role-playing with a manager or reading static training material, reps talk to a live AI that adapts its personality, objections, and expertise level to a configured scenario — and every response gets scored.

---

## Core Pillars

### 1. AI Voice Training (ElevenLabs Conversational AI)

The primary training interface is a fully voice-based conversation between the rep and an AI buyer persona powered by **ElevenLabs Conversational AI**.

**How it works:**

1. An admin creates a **Test Configuration** — a buyer persona with fields like technical expertise, budget range, decision authority, buying objective, key challenges, and product familiarity.
2. Before the session starts, the backend builds a dynamic system prompt from these fields and pushes it to ElevenLabs via the agent API, injecting variables like `{{product_name}}`, `{{technical_expertise}}`, `{{buying_objective}}`, etc.
3. The ElevenLabs agent is assigned a voice that matches the persona's role (CEO, Engineer, Manager, etc.) and launches in the browser using the **ElevenLabs React SDK**.
4. The rep speaks naturally — ElevenLabs handles speech-to-text (STT) and text-to-speech (TTS) in real time.
5. Every exchange (visitor question + salesperson reply) is captured via WebSocket and saved to MongoDB.

**Key variables injected into the persona prompt:**

| Variable | Example values |
|---|---|
| `product_knowledge` | None, Saw ad, Very familiar |
| `product_familiarity` | Never seen, Tried sample, Loyal user |
| `technical_expertise` | General, Moderate, Expert |
| `key_challenges` | Cost control, Compliance, Trust in vendor |
| `buying_objective` | Save money, Boost quality, Meet standards |
| `budget_range` | Very low, Low, Mid, High, Very high |
| `decision_authority` | User, Influencer, Approver, Final sign-off |
| `exhibition_objective` | Info gathering, Demo booking, Pricing talk |

The persona behaves consistently throughout the conversation — it won't suddenly become an expert if configured as a novice, and it will press on the specific challenges defined in the scenario.

---

### 2. AI Sales Companion (Chatbot)

Alongside the voice training sessions, Skillarix includes an **AI Sales Companion** — a text-based coaching chatbot available at the `/ai-companion` route.

- The companion is powered by **Groq (LLaMA 4)** or **OpenAI GPT-4** (switchable via environment variable).
- Reps can ask it to explain product features, practice objection handling in text form, or get coaching on a past session.
- The companion has access to product content injected into its context, so answers are grounded in the actual product data rather than generic sales advice.
- Supports multi-turn conversation with full message history within a session.

This is useful for warm-up practice before a voice session, or for reviewing specific objections after a completed evaluation.

---

### 3. Post-Session Evaluation

After every voice training session ends, the platform runs a full automated evaluation using the LLM (Groq / OpenAI). Results are available immediately on the **Session Feedback** page.

#### Scoring Rubric (per exchange)

Each individual exchange — one visitor question + one salesperson reply — is scored across three dimensions:

| Dimension | Scale | What it measures |
|---|---|---|
| **Question Relevance** | 0 – 3 | Did the rep actually answer what was asked? |
| **Technical Accuracy** | 0 – 3 | Was the product information correct and complete? |
| **Sales Effectiveness** | 0 – 4 | Was the response persuasive, empathetic, and persona-aware? |
| **Total** | **0 – 10** | Sum of all three dimensions |

Score anchors:

- **Question Relevance 0** = "I don't know" or completely off-topic. **3** = directly and fully addresses the specific question.
- **Technical Accuracy 0** = contradicts product facts. **3** = accurate with demonstrated depth.
- **Sales Effectiveness 0** = rude or dismissive. **4** = perfectly tailored to this persona's role, challenges, and buying stage.

#### Evaluation Layers

The evaluation runs in three layers:

1. **Per-Exchange Evaluation** — runs during the session. Each reply is scored as the conversation progresses and the result is stored alongside the transcript entry.

2. **Complete Conversation Evaluation** — runs after the session ends. The LLM reviews the entire transcript holistically and produces:
   - Overall strengths and weaknesses
   - Reasoning for each dimension score
   - A RAG-generated reference answer showing what an ideal response would have looked like

3. **Additional Criteria Evaluation** — optional criteria that can be toggled per test configuration:
   - **Distraction Handling** — did the rep stay on track when the visitor went off-topic?
   - **Communication Simplicity** — did the rep avoid jargon and explain clearly?

#### Feedback Page Tabs

The `/feedback/{sessionId}` page presents results in three tabs:

- **Exchange-by-Exchange** — full transcript with per-message scores and reasoning
- **Overall Performance** — aggregate scores, strengths/weaknesses summary, and recommendations
- **Additional Criteria** — results for distraction handling and communication simplicity if enabled

---

## Technology Stack

**Frontend**
- React 18 + TypeScript
- Vite
- TailwindCSS + Shadcn/ui
- ElevenLabs React SDK (voice sessions)
- React Router, TanStack Query

**Backend**
- FastAPI (Python)
- MongoDB (conversations, products, prompts, users)
- WebSocket for real-time transcript streaming
- JWT authentication

**AI Services**
- ElevenLabs Conversational AI — voice persona engine
- Groq (LLaMA 4 Scout) — evaluation + chatbot (default)
- OpenAI GPT-4 — evaluation + chatbot (alternative)
- Dynamic prompt templates with Handlebars-style variable substitution

---

## Project Structure

```
skillarix/
├── frontend/
│   └── src/
│       ├── pages/          # Dashboard, Practice, Feedback, AI Companion, Settings
│       ├── components/     # Reusable UI
│       ├── hooks/          # useElevenLabs, useStartConversation, useProducts, useTests
│       ├── contexts/       # Auth context
│       └── config/
│
├── backend/
│   └── app/
│       ├── api/v1/endpoints/   # Auth, products, conversations, elevenlabs, companion
│       ├── services/
│       │   ├── conversation.py          # Evaluation engine
│       │   ├── elevenlabs_service.py    # Agent config & persona injection
│       │   ├── websocket.py             # Real-time transcript capture
│       │   ├── persona_prompt_generator.py
│       │   └── reports.py
│       ├── models/
│       └── schemas/
│
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- MongoDB (local or cloud)
- ElevenLabs account with a configured Conversational AI agent
- Groq API key (or OpenAI API key)

### Backend Setup

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# Linux / macOS
source venv/bin/activate

pip install -r app/requirements.txt
cp .env.example .env   # then fill in values
```

Backend `.env` reference:

```env
PROJECT_NAME=Skillarix API
API_V1_STR=/api/v1
BACKEND_URL=http://localhost:8070

SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

MODEL=0                  # 0 = Groq, 1 = OpenAI
MODEL_NAME=meta-llama/llama-4-scout-17b-16e-instruct
GROQ_API_KEY=your-groq-api-key
OPENAI_API_KEY=your-openai-api-key

ELEVENLABS_API_KEY=your-elevenlabs-api-key
AGENT_ID=your-elevenlabs-agent-id

MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=skillarix

CORS_ORIGINS=["http://localhost:5173"]
EVALUTION_TITLE=[Complete Evaluation,Additional Criteria Evaluation]
```

Start the backend:

```bash
uvicorn app.main:app --reload --port 8070
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env   # then fill in values
```

Frontend `.env` reference:

```env
VITE_API_URL=http://localhost:8070/api/v1
VITE_TOKEN_KEY=skillarix_token
VITE_WS_URL=ws://localhost:8070/api/v1/websocket

VITE_ELEVENLABS_AGENT_ID=your-agent-id
VITE_ELEVENLABS_API_KEY=your-elevenlabs-api-key
VITE_ELEVENLABS_API_URL=https://api.elevenlabs.io/v1/convai/agents
VITE_ELEVENLABS_TITLE=ElevenLabs Agent System

VITE_EVALUTION_TITLE=[Complete Evaluation,Additional Criteria Evaluation]
```

Start the frontend:

```bash
npm run dev
```

Access the app at **http://localhost:5173**

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/register` | Register |

### Voice Sessions (ElevenLabs)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/elevenlabs/agent` | Get current agent config |
| POST | `/api/v1/elevenlabs/update-agent` | Push persona prompt to agent |

### Conversations & Evaluation
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/conversations/evaluate` | Evaluate a completed conversation |
| GET | `/api/v1/conversations/{id}` | Get conversation + evaluation data |
| GET | `/api/v1/conversations` | List all conversations |
| WS | `/api/v1/websocket` | Real-time transcript streaming |

### AI Companion
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/companion/chat` | Send message to AI companion |

### Products & Test Configurations
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/v1/products` | List / create products |
| GET/PUT/DELETE | `/api/v1/products/{id}` | Read / update / delete |
| GET/POST | `/api/v1/test-configurations` | List / create test configs |
| GET/PUT/DELETE | `/api/v1/test-configurations/{id}` | Read / update / delete |

### Prompts
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/prompts?title={title}` | Fetch prompt by title |
| POST | `/api/v1/prompts` | Create prompt |
| PUT | `/api/v1/prompts/{id}` | Update prompt |

---

## Switching AI Models

Update `backend/.env`:

```env
MODEL=0   # Groq (LLaMA 4)
MODEL=1   # OpenAI GPT-4
```

Ensure the matching API key is set, then restart the backend. No code changes needed.

---

## Troubleshooting

**Voice session won't start**
- Check `VITE_ELEVENLABS_AGENT_ID` and `VITE_ELEVENLABS_API_KEY` in frontend `.env`
- Confirm the agent exists in your ElevenLabs dashboard
- Open the browser console for SDK errors

**Evaluation returns 500**
- Verify `GROQ_API_KEY` or `OPENAI_API_KEY` is valid and matches the `MODEL` setting
- Check backend logs for LLM response errors

**"ELEVENLABS_PROMPT_TITLE is not defined"**
- Set `VITE_ELEVENLABS_TITLE` in `frontend/.env`

**MongoDB connection failed**
- Confirm MongoDB is running and `MONGODB_URL` is correct
- Check `DATABASE_NAME` matches an existing or creatable database

---

## Roadmap

- [ ] Deepgram integration for advanced transcription analytics
- [ ] Vector database for scalable product content retrieval
- [ ] Video-based training sessions with facial expression analysis
- [ ] Multi-language persona support
- [ ] CRM integration (Salesforce, HubSpot)
- [ ] Team leaderboards and collaborative coaching
- [ ] Custom scoring rubric builder
- [ ] Mobile app

---

**Version:** 1.0.0
