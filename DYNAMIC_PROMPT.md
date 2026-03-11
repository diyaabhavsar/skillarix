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



1. ✅ Real-Time Buyer Interactions
Status: FULLY IMPLEMENTED

Your dynamic prompt includes:

python
# Lines 157-180: CONVERSATION FLOW INSTRUCTIONS
## Opening (First 30 seconds)
1. Approach the booth naturally
2. Start with: "Hi there! What products do you offer?"
3. Listen to their overview, then express interest
## Discovery Phase (2-3 minutes)
1. Ask questions aligned with technical expertise
2. Bring up key challenges naturally
3. Reference product familiarity
4. Ask how features address specific pain points
## Evaluation Phase (2-4 minutes)
1. Steer conversation based on exhibition objective
2. React to pricing based on budget range
3. Ask comparison questions
4. Challenge claims if expert level
## Closing Phase (1-2 minutes)
1. Request materials/next steps based on authority
2. Book demo or ask for business cards
3. Politely decline if not convinced
Evidence:

✅ Structured conversation flow (Opening → Discovery → Evaluation → Closing)
✅ Real-time responses based on salesperson's answers
✅ Natural progression through sales stages
✅ Context-aware interactions (references previous statements)
2. ✅ Handle Objections
Status: FULLY IMPLEMENTED

Your dynamic prompt includes:

python
# Lines 186-191: Natural Objections
Generate objections based on your persona:
- If budget-conscious: "That's more expensive than alternatives. 
  Why should I pay more?"
- If compliance-focused: "What certifications do you have? 
  Does this meet industry standards?"
- If technical expert: "How does this compare to [competitor] 
  on [specific metric]?"
- If trust-focused: "Can you share customer references 
  in my industry?"
Plus Dynamic Objection Triggers:

python
# Lines 32-39: CHALLENGE_FOCUS mapping
'cost-control': 'You frequently ask about pricing, ROI, 
                 and long-term costs.'
'quality': 'You want proof of durability, failure rates, 
            and warranties.'
'compliance': 'You ask about certifications, standards, 
               regulatory compliance.'
'trust': 'You ask about company history, customer reviews, 
          support quality.'
Evidence:

✅ Persona-specific objections (6 types: cost, quality, compliance, simplicity, trust, sustainability)
✅ Budget-based price objections (lines 49-55: BUDGET_ATTITUDE)
✅ Technical challenge objections (lines 24-30: EXPERTISE_LEVEL)
✅ Skepticism signals (lines 200-204)
3. ✅ Negotiate
Status: FULLY IMPLEMENTED

Your dynamic prompt includes:

python
# Lines 174-178: Closing Phase - Negotiation
1. Based on your decision authority, either:
   - Request materials to share with team (User/Influencer)
   - Ask about next steps for evaluation (Evaluator)
   - Discuss pricing and terms (Approver/Final sign-off)
Plus Budget-Based Negotiation Behavior:

python
# Lines 49-55: BUDGET_ATTITUDE
'very-low': 'You are extremely price-sensitive. 
             Challenge any costs above baseline.'
'low': 'You need strong value justification. 
        Ask about cheaper alternatives.'
'mid': 'You balance cost and quality. 
        Ask about the best value tier.'
'high': 'You focus on quality over price but still want good value.'
Plus Buying Objective Negotiation:

python
# Lines 57-64: OBJECTIVE_GOAL
'pricing-talk': 'You want to negotiate pricing and discuss 
                 volume discounts.'
'terms-warranty': 'You focus on contracts, warranties, 
                   and support terms.'
'partnership': 'You explore long-term collaboration opportunities.'
Evidence:

✅ Price negotiation based on budget range
✅ Terms negotiation (warranty, support, contracts)
✅ Volume discount discussions
✅ Authority-based negotiation power (lines 41-47)
✅ Buying signals when interested (lines 193-198)
4. ✅ Dynamic Virtual Exhibition Setting
Status: FULLY IMPLEMENTED

Your dynamic prompt includes:

python
# Line 118: Exhibition Context
You are at a trade show booth for "{product_name}" 
in the {product_category} category.
# Line 215: Exhibition Environment
**Maintain exhibition context** - You're at a busy trade show, 
might be distracted
# Lines 221-233: Exhibition-Appropriate Conversation Starters
- "Hi! I saw your booth and I'm really curious..."
- "Hello. What kind of products do you offer?"
- "Hi, what's this booth about? I'm just walking through the expo."
Plus Exhibition Objectives:

python
# Lines 57-64: OBJECTIVE_GOAL
'info-gathering': 'You are in research mode. 
                   Ask broad questions and take notes.'
'spec-comparison': 'You compare this directly to competitors.'
'demo-booking': 'You want to schedule a deeper demo or trial.'
Evidence:

✅ Trade show booth context explicitly mentioned
✅ Exhibition-appropriate greetings
✅ Distraction handling (lines 96, 151)
✅ Time-bound interactions (5-8 minutes, line 216)
✅ Natural booth approach behavior (line 158)
📊 Comprehensive Feature Coverage:
Requirement	Implementation	Status
Real-time buyer interactions	4-phase conversation flow with dynamic responses	✅ COMPLETE
Handle objections	6 objection types + persona-based triggers	✅ COMPLETE
Negotiate	Budget-based pricing, terms, authority-driven negotiation	✅ COMPLETE
Virtual exhibition setting	Trade show context, booth approach, exhibition objectives	✅ COMPLETE
🎯 Summary:
YES! ✅ Your dynamic prompt FULLY implements all required features:

Real-time interactions: Structured 4-phase conversation with context-aware responses
Objection handling: 6 challenge types × 5 expertise levels × 5 budget ranges = 150+ unique objection combinations
Negotiation: Authority-based negotiation power, budget-driven pricing discussions, terms negotiation
Exhibition setting: Trade show booth context, natural approach, time-b