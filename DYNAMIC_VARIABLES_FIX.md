How Dynamic Prompts Work in Skillarix
The Flow:
1. User Creates Test Configuration (Frontend)
User fills out form with:
├── Visitor Name: "Sarah Chen"
├── Role: "CTO"
├── Background: "Leading tech team at FinTech startup"
├── Pain Points: "Struggling with scalability"
├── Product Knowledge: "very-familiar"
├── Technical Expertise: "expert"
├── Budget Range: "high"
└── ... (12+ other fields)
2. User Clicks "Start Assessment"
Frontend → Backend API: POST /elevenlabs/agent/update
Payload: { test_config_id: "abc123" }
3. Backend Generates Dynamic Prompt
python
# In elevenlabs_service.py (line 108):
system_prompt = PersonaPromptGenerator.generate_prompt(persona, product)
4. PersonaPromptGenerator Magic ✨
The 
PersonaPromptGenerator
 class:

A. Maps User Selections to Behaviors
python
# Example: If user selects technical_expertise = "expert"
EXPERTISE_LEVEL = {
    'expert': 'You challenge technical claims and ask for proof, 
               certifications, benchmarks.'
}
B. Builds Comprehensive Prompt
python
prompt = f"""
# CHARACTER PROFILE
You are {visitor_name}, a {role_title}.
## Background
{background}
## Your Current Situation
**Pain Points**: {pain_points}
**Goals**: {goals}
# PRODUCT CONTEXT
**Your Product Knowledge**: {KNOWLEDGE_LEVEL[product_knowledge]}
**Your Technical Level**: {EXPERTISE_LEVEL[technical_expertise]}
# CONVERSATION BEHAVIOR
**Key Challenge**: {CHALLENGE_FOCUS[key_challenges]}
**Budget**: {BUDGET_ATTITUDE[budget_range]}
**Your Authority**: {AUTHORITY_STYLE[decision_authority]}
# CONVERSATION FLOW INSTRUCTIONS
[Detailed phase-by-phase instructions]
# REALISTIC BEHAVIORS
[Natural objections, buying signals, skepticism]
# IMPORTANT RULES
1. Stay in character as {visitor_name}
2. Be realistic - don't be overly enthusiastic
3. Ask specific questions based on expertise level
...
"""
5. Prompt Sent to ElevenLabs
python
# In elevenlabs_service.py (lines 125-138):
payload = {
    "conversation_config": {
        "agent": {
            "prompt": {
                "prompt": system_prompt,  # ← Dynamic prompt here!
                "llm": "gpt-4o-mini"
            },
            "first_message": first_message,
            "language": "en"
        },
        "tts": {
            "voice_id": voice_id  # Also dynamic!
        }
    }
}
# PATCH to ElevenLabs API
requests.patch(f"https://api.elevenlabs.io/v1/convai/agents/{agent_id}", 
               json=payload)
6. AI Persona Comes Alive 🎭
The ElevenLabs agent now:

Thinks it's Sarah Chen, a CTO
Knows it's struggling with scalability
Acts like an expert (challenges claims, asks for proof)
Behaves according to high budget (focuses on quality)
Speaks with the selected voice
Key Dynamic Variables:
Frontend Field	Maps To	Behavior Impact
product_knowledge	KNOWLEDGE_LEVEL	How much they know about product
technical_expertise	EXPERTISE_LEVEL	Question complexity level
key_challenges	CHALLENGE_FOCUS	What they care about most
budget_range	BUDGET_ATTITUDE	Price sensitivity
decision_authority	AUTHORITY_STYLE	How they make decisions
exhibition_objective	OBJECTIVE_GOAL	What they want from conversation
Example Transformation:
Input (Test Config):
json
{
  "name": "Sarah Chen",
  "visitor_type": "CTO",
  "technical_expertise": "expert",
  "budget_range": "high",
  "key_challenges": "compliance"
}
Output (Dynamic Prompt Excerpt):
You are Sarah Chen, a CTO.
**Your Technical Level**: You challenge technical claims and ask for 
proof, certifications, benchmarks.
**Key Challenge**: compliance
You ask about certifications, standards, regulatory compliance.
**Budget**: You focus on quality over price but still want good value.
## Natural Objections
- "What certifications do you have? Does this meet industry standards?"
- "Can you provide compliance documentation for GDPR/HIPAA?"
Why This Works:
✅ 12+ persona dimensions combine to create unique characters
✅ Behavioral instructions guide conversation flow
✅ Realistic objections based on persona attributes
✅ Dynamic first message matches exhibition objective
✅ Voice selection adapts to role (CEO = deep voice, etc.)

Result: Every assessment feels like talking to a different, realistic customer! 🎯