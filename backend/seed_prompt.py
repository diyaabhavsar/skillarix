import sys
import os
import datetime

# Ensure backend directory is in python path
sys.path.append(os.getcwd())

from app.database import db

def seed_prompt():
    prompts_collection = db["prompts"]
    
    title = "Conversation Evaluation Main"
    
    # The improved prompt text with standard string format
    prompt_text = """
You are an expert evaluator of sales conversations. Return ONLY a single valid JSON object.

The JSON must have two keys:
- "complete_evaluation": {
    "summary": "short paragraph (2-4 sentences)",
    "strengths": ["list of 2-4 strings"],
    "weaknesses": ["list of 2-4 strings"]
  }
- "complete_rating": {
    "overall_progress": { "score": X, "max": 3 },
    "sales_strategy": { "score": X, "max": 3 },
    "customer_journey": { "score": X, "max": 2 },
    "technical_accuracy": { "score": X, "max": 2 },
    "total": { "score": Y, "max": 10 }
  }

SCORING GUIDELINES (STRICT BUT FAIR):
- **Overall Progress (0-3)**: 
    * 0: No progress. 
    * 1: Weak/Slow. 
    * 2: Average/Competent (Moved conversation forward).
    * 3: Excellent (Clear outcome).
- **Sales Strategy (0-3)**: 
    * 0: Passive/Reactive. 
    * 1: Mechanical (Just asking Qs). 
    * 2: Competent (Good flow, handled basics). 
    * 3: Strategic/Persuasive (Consultative).
- **Customer Journey (0-2)**: 
    * 0: Poor/Robot-like. 
    * 1: Standard/Polite. 
    * 2: Engaging/Warm.
- **Technical Accuracy (0-2)**: 
    * 0: Errors/Contradictions. S
    * 1: Mostly Accurate (Stuck to script). 
    * 2: Expert (Covered all base points + added relevant extra features/value).

CRITICAL RULES:
- **Summation**: "total" MUST be the exact sum of the 4 partial scores.
- **Bonus for Improv**: If the salesman mentions ALL points from the description AND adds relevant, non-contradictory features, reward them with a max score (2/2) in Accuracy.
- **Target Scores**: 
    - **Weak**: 0-3
    - **Average/Deccent**: 5-6 (Expect '2's for Progress/Strategy if they did okay)
    - **Strong**: 7-8
    - **Perfect**: 9-10
- **Short Chat**: If the chat was short but they were polite and tried, give at least a 4-5. Do not punish valid short chats too harshly.

Visitor Persona:
{{Visitor_persona}}

Product Context:
{{Product_detail}}

Conversation:
{{Conversion_history}}
"""

    prompt_data = {
        "title": title,
        "prompt": [
            {
                "condition": "main",
                "prompt": prompt_text
            }
        ],
        "created_by": None,
        "updated_by": None,
        "created_at": datetime.datetime.now(),
        "updated_at": datetime.datetime.now(),
        "is_deleted": False
    }

    existing = prompts_collection.find_one({"title": title})
    if existing:
        print(f"Updating existing prompt: {title}")
        prompts_collection.update_one({"_id": existing["_id"]}, {"$set": prompt_data})
    else:
        print(f"Creating new prompt: {title}")
        prompts_collection.insert_one(prompt_data)
        
    print("Seed complete.")

if __name__ == "__main__":
    seed_prompt()
