# RAG Implementation in Skillarix

## Overview

RAG (Retrieval-Augmented Generation) is implemented in Skillarix to generate **ideal reference answers** that are used to evaluate the salesperson's responses. The system retrieves product knowledge and uses it to generate context-aware, persona-tailored answers.

---

## 🎯 Purpose of RAG

RAG serves two critical functions:

1. **Generate Reference Answers**: Create ideal responses based on product knowledge
2. **Enable Fair Evaluation**: Compare salesperson answers against expert-level responses

---

## 📍 Where RAG is Implemented

### Core RAG Function

**Location**: `backend/app/services/conversation.py`

**Function**: `generate_answer_rag()` (Lines 84-161)

```python
def generate_answer_rag(
    context: str,           # Product content/description
    question: str,          # Customer's question
    persona: dict,          # Visitor persona details
    is_first_exchange: bool = False,
    conversation_history: List[dict] = None
) -> str:
    """
    Generate reference (ideal) answer using RAG-style prompt.
    Keeps persona and product context in the prompt.
    Returns string response (plain text).
    """
```

---

## 🔄 RAG Workflow

### Step 1: Context Retrieval

**Function**: `build_product_context()` (Lines 40-51)

```python
def build_product_context(product: dict) -> str:
    """Build combined product context from content and description"""
    product_content_str = product.get("content", "")
    product_description_str = product.get("description", "")
    
    if product_content_str and product_description_str:
        return f"Product Content: {product_content_str}\nProduct Description: {product_description_str}"
    elif product_content_str:
        return f"Product Content: {product_content_str}"
    elif product_description_str:
        return f"Product Description: {product_description_str}"
    return ""
```

**What it does**:
- Retrieves product content from database
- Combines product content + description
- Creates unified context string

### Step 2: Prompt Construction

The RAG function builds a comprehensive prompt:

```python
prompt = f"""
You are a model producing an ideal reference answer for a salesperson at a product exhibition. 
The output must be a short, human-friendly paragraph (1-3 sentences) that a top-performing 
salesperson would give in response to the customer's question.

GUIDELINES:
- Tailor the answer to the visitor persona below.
- Lead with benefits, then mention key features only if necessary.
- Keep the answer concise and actionable.
- If is_first_exchange is true, begin with a warm greeting.
- End with a short follow-up that helps the salesperson continue the conversation.

Visitor Persona:
{json.dumps(persona, indent=2)}

Product Context:
{context}

{conversation_context}

Customer Question:
{question}

RETURN:
A single short paragraph (1-3 sentences). No JSON, no lists, just the human-readable reference answer.
"""
```

### Step 3: LLM Generation

The prompt is sent to either **OpenAI GPT-4** or **Groq LLaMA 4**:

```python
if FLAG == 1:
    # OpenAI path (streaming)
    response_stream = openai_client.chat.completions.create(
        model=MODEL_NAME,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.6,
        top_p=1,
        max_tokens=512,
        stream=True,
    )
else:
    # Groq path (streaming)
    completion = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.6,
        max_completion_tokens=512,
        top_p=1,
        stream=True,
    )
```

### Step 4: Response Streaming

The LLM response is streamed back:

```python
full_response = ""
for chunk in response_stream:
    if getattr(chunk.choices[0].delta, "content", None):
        full_response += chunk.choices[0].delta.content
return full_response.strip()
```

---

## 🔌 Where RAG is Called

### 1. **Conversation Evaluation Endpoint**

**File**: `backend/app/api/v1/endpoints/conversations.py`

**Endpoint**: `POST /api/v1/conversations`

**Lines**: 51-57

```python
# Generate ideal answer using RAG
rag_answer = generate_answer_rag(
    context=context,                    # Product knowledge
    question=last_exchange["visitor_text"],  # Customer question
    persona={},                         # Visitor persona
    is_first_exchange=len(conversation) == 1,
    conversation_history=conversation_dict[:-1]
)

# Compare salesperson answer vs RAG answer
individual_evaluation = evaluate_individual_answer(
    rag_answer=rag_answer,
    salesperson_answer=last_exchange["salesperson_text"],
    customer_question=last_exchange["visitor_text"],
    persona={},
    is_first_exchange=len(conversation) == 1,
    conversation_history=conversation_dict[:-1]
)
```

### 2. **WebSocket Real-time Evaluation**

**File**: `backend/app/api/v1/endpoints/websocket.py`

**Line**: 337

```python
rag_answer = generate_answer_rag(
    context=product_context,
    question=visitor_text,
    persona=persona_dict,
    is_first_exchange=is_first,
    conversation_history=history_for_context
)
```

### 3. **Internal Conversation Service**

**File**: `backend/app/services/conversation.py`

**Line**: 955

Used internally for batch evaluations and testing.

---

## 📊 RAG Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  1. Customer asks question                              │
│     "What are the key features?"                        │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  2. Retrieve Product Context                            │
│     - Fetch from MongoDB                                │
│     - Product content + description                     │
│     Context: "Industrial robot with 6-axis..."          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  3. Build RAG Prompt                                    │
│     - Include product context                           │
│     - Include visitor persona                           │
│     - Include conversation history                      │
│     - Include customer question                         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  4. Send to LLM (OpenAI/Groq)                          │
│     Model: GPT-4 or LLaMA 4                            │
│     Temperature: 0.6                                    │
│     Max tokens: 512                                     │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  5. Generate Reference Answer                           │
│     "Our robot features 6-axis movement for precision,  │
│      payload capacity of 10kg, and integrates with      │
│      existing systems. Would you like to see a demo?"   │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  6. Compare with Salesperson Answer                     │
│     Salesperson: "It has 6 axes and can lift stuff."   │
│     ↓                                                   │
│     Evaluation: "Good start but lacks detail..."        │
│     Score: 6/10                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🧩 RAG Components

### Input Components

1. **Product Context** (Retrieved)
   - Source: MongoDB `products` collection
   - Fields: `content`, `description`
   - Example: "Industrial robot arm with 6-axis articulation, 10kg payload..."

2. **Visitor Persona** (Retrieved)
   - Source: Test Configuration
   - Fields: `technical_expertise`, `key_challenges`, `buying_objective`, etc.
   - Example: `{"technical_expertise": "Basic", "key_challenges": "Cost control"}`

3. **Conversation History** (Context)
   - Previous exchanges in the conversation
   - Helps maintain context and continuity

4. **Customer Question** (Input)
   - The current question from the AI customer
   - Example: "What are the key features?"

### Output

**Reference Answer** (Generated)
- Ideal response a top salesperson would give
- Tailored to persona and product
- Used as benchmark for evaluation

---

## 🎨 RAG vs Traditional Approach

### Traditional Chatbot
```
User Question → Static Response Template → Answer
```

### RAG-Powered System
```
User Question → Retrieve Product Knowledge → Generate Context-Aware Answer → Answer
```

**Benefits**:
- ✅ Answers are always up-to-date with product data
- ✅ Responses tailored to visitor persona
- ✅ Can handle questions not in predefined templates
- ✅ Maintains conversation context

---

## ⚙️ Configuration

### Model Selection

**Environment Variable**: `MODEL` in `backend/.env`

```env
MODEL=0  # 0 = Groq (LLaMA 4), 1 = OpenAI (GPT-4)
```

### Model Names

**Groq**:
```python
model="meta-llama/llama-4-scout-17b-16e-instruct"
```

**OpenAI**:
```python
model=MODEL_NAME  # From config (e.g., "gpt-4")
```

### Temperature

```python
temperature=0.6  # Balance between creativity and consistency
```

---

## 🚀 Current Implementation Status

### ✅ Implemented

1. **Context Retrieval**: Product content fetched from MongoDB
2. **Prompt Engineering**: Persona-aware, context-rich prompts
3. **LLM Integration**: Both OpenAI and Groq support
4. **Streaming Responses**: Real-time answer generation
5. **Conversation History**: Context-aware multi-turn conversations

### ⚠️ Basic Implementation (Not True RAG)

**Current Approach**: **Context Injection**
- Entire product content is inserted into the prompt
- Works well for small-to-medium product descriptions
- No semantic search or chunking

**Limitation**:
- Cannot scale to large product catalogs
- No similarity search
- Limited by LLM context window (~4K-8K tokens)

### ❌ Not Implemented (True RAG)

**Missing Components**:

1. **Vector Database**
   - No Pinecone, Weaviate, or Chroma integration
   - No embedding storage

2. **Embeddings**
   - No OpenAI embeddings generation
   - No semantic similarity search

3. **Chunking Strategy**
   - No document splitting
   - No chunk overlap management

4. **Retrieval Ranking**
   - No relevance scoring
   - No top-k retrieval

---

## 🔮 Future RAG Enhancements

### Phase 1: Vector Database Integration

```python
# Proposed implementation
from pinecone import Pinecone

def retrieve_relevant_chunks(question: str, product_id: str, top_k: int = 3):
    """Retrieve most relevant product chunks using vector search"""
    
    # Generate question embedding
    question_embedding = openai.embeddings.create(
        model="text-embedding-ada-002",
        input=question
    ).data[0].embedding
    
    # Search vector database
    results = pinecone_index.query(
        vector=question_embedding,
        filter={"product_id": product_id},
        top_k=top_k,
        include_metadata=True
    )
    
    # Combine relevant chunks
    context = "\n\n".join([match.metadata["text"] for match in results.matches])
    return context
```

### Phase 2: Hybrid Search

Combine:
- **Semantic search** (vector similarity)
- **Keyword search** (BM25)
- **Metadata filtering** (product category, tags)

### Phase 3: Advanced Retrieval

- **Re-ranking**: Use cross-encoder models
- **Query expansion**: Generate multiple query variations
- **Contextual compression**: Remove irrelevant parts from retrieved chunks

---

## 📈 Performance Metrics

### Current Performance

**Average Response Time**:
- Context retrieval: ~50ms (MongoDB query)
- LLM generation: ~2-4 seconds (streaming)
- Total: ~2-5 seconds per evaluation

**Accuracy**:
- Depends on product content quality
- Better with detailed product descriptions

### Optimization Opportunities

1. **Caching**: Cache frequently asked questions
2. **Parallel Processing**: Generate RAG answers in parallel
3. **Prompt Optimization**: Reduce token usage
4. **Model Selection**: Use faster models for simple questions

---

## 🧪 Testing RAG

### Manual Test

```bash
# Start backend
cd backend
uvicorn app.main:app --reload --port 8070

# Test RAG endpoint
curl -X POST http://localhost:8070/api/v1/conversations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "507f1f77bcf86cd799439011",
    "conversation": [
      {
        "visitor_text": "What are the key features?",
        "salesperson_text": "It has automation and analytics."
      }
    ],
    "is_complete": false
  }'
```

### Expected Response

```json
{
  "individual_evaluation": "{\"evaluation\": \"Good start...\", \"rating\": {...}}",
  "score": 7.5,
  "metrics": {...}
}
```

---

## 📚 Key Files Reference

| File | Purpose | Lines |
|------|---------|-------|
| `backend/app/services/conversation.py` | Core RAG implementation | 40-161 |
| `backend/app/api/v1/endpoints/conversations.py` | RAG API endpoint | 51-67 |
| `backend/app/api/v1/endpoints/websocket.py` | Real-time RAG | 337+ |
| `backend/app/services/product.py` | Product retrieval | - |

---

## 🎓 Summary

**Current RAG Implementation**:
- ✅ Context injection from MongoDB
- ✅ Persona-aware generation
- ✅ Conversation history support
- ✅ LLM-powered reference answers
- ⚠️ No vector database (yet)
- ⚠️ No semantic search (yet)

**Use Cases**:
1. Generate ideal salesperson responses
2. Evaluate actual responses against benchmarks
3. Provide coaching recommendations
4. Maintain conversation context

**Next Steps**:
1. Add vector database for scalability
2. Implement embeddings for semantic search
3. Add chunking for large documents
4. Optimize retrieval performance

---

**Document Version**: 1.0  
**Last Updated**: January 2026
