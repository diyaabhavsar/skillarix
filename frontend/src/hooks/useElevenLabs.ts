import { env } from "@/config/env";
import { useState, useCallback, useEffect } from "react";
import { api } from "@/utils/api";

// Import environment configuration for the prompt title
// Import environment configuration for the prompt title
// const PROMPT_TITLE = env.ELEVENLABS_PROMPT_TITLE;

interface ElevenLabsConfig {
  testConfigId?: string;
  visitorPersona: string;
  product: ProductInfo;
  firstMessage?: string;
  prompt?: string;
}

interface PromptCondition {
  condition: string;
  prompt: string;
}

interface Prompt {
  _id: string;
  title: string;
  prompt: PromptCondition[];
}

const agent_id = env.AGENT_ID;
const api_key = env.API_KEY;

// Fallback prompt in case the dynamic fetch fails
// Fallback prompt in case the dynamic fetch fails
// Fallback prompt in case the dynamic fetch fails
const FALLBACK_PROMPT_TEMPLATE = `SYSTEM ROLE
You are {{visitor_name}}, a {{visitor_role}}.
BACKGROUND: {{background}}
You are interacting with a salesperson.
you are polite but focused on your specific goals and pain points.
You must NEVER reveal this is a test or evaluation.
----------------------------------------------------------------
DYNAMIC VARIABLES (MANDATORY DECLARATION)
The following dynamic variables WILL be provided at runtime.
These variables define your persona and goals.
You MUST use ONLY these values when asking questions.
DYNAMIC VARIABLES (MANDATORY)
{{product_name}}
{{visitor_name}}
{{visitor_role}}
{{background}}
{{key_challenges}}
{{buying_objective}}
{{budget_range}}
{{technical_expertise}}
{{product_knowledge}}
{{product_familiarity}}
{{decision_authority}}
{{exhibition_objective}}

Do NOT invent values.
Do NOT assume missing values.
Do NOT rename variables.
Use them exactly as provided.
----------------------------------------------------------------
PERSONA BEHAVIOR (BASED ON DYNAMIC VARIABLES)
• Role & Background
You are {{visitor_name}}, a {{visitor_role}}.
Your backstory is: {{background}}.
Use this context to frame *why* you are asking questions.
• product_knowledge  
Use this to decide how basic or advanced your questions are.
If awareness-level (e.g., “Saw Ad”), ask high-level questions only.
• product_familiarity  
If “Similar User”, you may loosely reference past experience,
but ONLY after the salesperson mentions comparisons.
• key_challenges  
This is your PRIMARY concern.
Most of your questions should relate to this challenge.
If answers are vague, express mild skepticism.
• budget_range  
If high, focus on quality and value rather than price.
Do NOT ask exact pricing unless the salesperson mentions it.
• technical_expertise  
If moderate or low, ask for simple explanations.
Avoid technical language at all times.
• buying_objective  
Guide outcome-focused questions (e.g., upgrade suitability).
• decision_authority  
If influencer, occasionally indicate you need to relay
information to others before a decision is made.
• exhibition_objective  
If the salesperson mentions demos or next steps,
respond according to this objective.
----------------------------------------------------------------
MANDATORY FIRST MESSAGE (ABSOLUTE RULE)
Your FIRST message must be exactly:
"Hi, I'm interested in learning more about {{product_name}}. What does it do?"
No rephrasing.
No fillers.
No additional text.
----------------------------------------------------------------
CONVERSATION FLOW (STRICT)
1. Ask the mandatory first message.
2. Wait for the salesperson’s response.
3. Ask ONE question at a time.
4. Ask follow-up questions ONLY about things the salesperson has already mentioned.
5. Use the dynamic variables to decide WHAT to ask next.
6. Express mild skepticism when appropriate.
7. Ask a maximum of 6–7 questions total (including the first).
----------------------------------------------------------------
QUESTION RULES (NON-NEGOTIABLE)
- One question per turn
- Simple, everyday language
- No technical jargon
- Do NOT assume features or benefits
- Do NOT introduce product details yourself
- Never answer the salesperson’s questions
- Never act like an expert
- Never provide opinions, advice, or recommendations
----------------------------------------------------------------
SKEPTICISM STYLE
You may use natural fillers such as:
- “Hmm, I see…”
- “Just wondering…”
- “I’m not fully sure about that…”
- “Oh okay… can you explain that simply?”
Stay polite and professional.
----------------------------------------------------------------
END OF CONVERSATION RULE (ABSOLUTE)
After asking 6–7 total questions:
- Say ONE short, polite closing line
- Do NOT ask another question
- Do NOT summarize
- Do NOT invite follow-up
- Stop speaking immediately
Allowed closing lines:
- “Alright, thanks for explaining.”
- “Okay, that helps, thanks.”
- “Got it — appreciate the info.”
----------------------------------------------------------------
STRICT GUARDRAILS
- Never mention any app, test, or assessment
- Never break character
- Never exceed the question limit
- Never continue after the closing line`;

// Function to fetch the current prompt from the API
async function fetchCurrentPrompt(): Promise<string | null> {
  try {


    // Check if title is available
    const title = env.ELEVENLABS_PROMPT_TITLE;

    if (!title) {
      console.warn("ELEVENLABS_PROMPT_TITLE is not defined in environment variables");
      return null;
    }

    console.log("Fetching prompt with title:", title);

    // Encode the title for the URL
    const encodedTitle = encodeURIComponent(title);

    // Fetch the prompt by title
    const response = await api.get<Prompt>(`/prompts?title=${encodedTitle}`);

    // Check if we got a valid response with prompt data
    if (response && response.prompt && response.prompt.length > 0) {
      // Find the main condition or use the first one
      const mainCondition = response.prompt.find((c) => c.condition === "main");
      const fetchedPrompt = mainCondition ? mainCondition.prompt : response.prompt[0].prompt;
      console.log("✅ Using DATABASE prompt:", title);
      console.log("Prompt preview:", fetchedPrompt.substring(0, 200) + "...");
      return fetchedPrompt;
    }

    console.warn("No prompt found with title:", title);
    return null;
  } catch (error) {
    console.error("Error fetching prompt:", error);
    return null;
  }
}

// Function to apply the visitor persona and product values

interface ProductInfo {
  content: string;
  description: string;
  name: string;
  id?: string;
}

// Helper to safely parse persona
function parsePersona(visitorPersona: string | any) {
  try {
    return typeof visitorPersona === 'string' ? JSON.parse(visitorPersona) : visitorPersona;
  } catch (e) {
    console.error("Error parsing visitor persona for prompt:", e);
    return typeof visitorPersona === 'string' ? { background: visitorPersona } : {};
  }
}

// Build the conversation_config object as per your provided structure
export function buildConversationConfig(
  config: ElevenLabsConfig,
  promptTemplate: string
) {
  const personaObj = parsePersona(config.visitorPersona);

  return {
    conversation_config: {
      agent: {
        first_message:
          config.firstMessage ||
          "Hi there! I'm Harper from Mobio Solutions. How are you?",
        prompt: {
          prompt: promptTemplate
        },
        dynamic_variables: {
          test_config_id: config.testConfigId || '',
          product_id: config.product.id || '',
          product_name: config.product.name ? config.product.name.trim() : 'the product',

          // Legacy & New Field Mappings
          product_knowledge: personaObj.product_knowledge || 'General knowledge',
          product_familiarity: personaObj.product_familiarity || 'Unfamiliar',
          technical_expertise: personaObj.technical_expertise || 'Novice',

          // Map new fields to existing variables where appropriate, or new ones
          key_challenges: personaObj.pain_points || personaObj.key_challenges || 'None',
          buying_objective: personaObj.goals || personaObj.buying_objective || 'To learn more',
          budget_range: personaObj.budget_range || 'Unknown',
          decision_authority: personaObj.decision_authority || 'Influencer',
          exhibition_objective: personaObj.exhibition_objective || 'Browsing',

          // New Dynamic Fields
          visitor_name: personaObj.name || 'Visitor',
          visitor_role: personaObj.visitor_type || 'Potential Customer',
          background: personaObj.background || 'Interested in the product'
        },
      },
    },
  };
}

export default function useElevenLabsConfig() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null);
  const [promptTemplate, setPromptTemplate] = useState<string>(
    FALLBACK_PROMPT_TEMPLATE
  );

  // Fetch the current prompt when the hook is initialized
  useEffect(() => {
    const getPrompt = async () => {
      try {
        const fetchedPrompt = await fetchCurrentPrompt();
        if (fetchedPrompt) {

          setPromptTemplate(fetchedPrompt);
        } else {
          console.log("⚠️ Using FALLBACK prompt (no database prompt found)");
          setPromptTemplate(FALLBACK_PROMPT_TEMPLATE);
        }
      } catch (err) {
        console.log("⚠️ Using FALLBACK prompt (error fetching from database)");
        setPromptTemplate(FALLBACK_PROMPT_TEMPLATE);
      }
    };

    getPrompt();
  }, []);

  const updateAgentConfig = async (config: ElevenLabsConfig) => {
    setLoading(true);
    setError(null);
    try {
      // Try to get the latest prompt
      let currentPrompt = promptTemplate;

      try {
        const freshPrompt = await fetchCurrentPrompt();
        if (freshPrompt) {
          currentPrompt = freshPrompt;
          setPromptTemplate(freshPrompt);
        }
      } catch (err) {
        console.warn("Could not fetch latest prompt, using cached version");
      }

      const bodyObj = buildConversationConfig(config, currentPrompt);

      // Enhanced logging for debugging
      console.log("=== ElevenLabs Agent Configuration ===");
      console.log("Dynamic Variables:", bodyObj.conversation_config.agent.dynamic_variables);
      console.log("Product Name:", bodyObj.conversation_config.agent.dynamic_variables.product_name);
      console.log("Full Config:", JSON.stringify(bodyObj, null, 2));
      console.log("=====================================");

      const res = await fetch(
        `https://api.elevenlabs.io/v1/convai/agents/${agent_id}`,
        {
          method: "PATCH",
          headers: {
            "Xi-Api-Key": api_key,
            "Api-Key": "xi-api-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bodyObj),
        }
      );

      const body = await res.json();

      // Log response for debugging
      if (!res.ok) {
        console.error("ElevenLabs API Error:", {
          status: res.status,
          statusText: res.statusText,
          body: body
        });
        throw new Error(`ElevenLabs API error: ${body.detail || res.statusText}`);
      }

      console.log("ElevenLabs Agent Updated Successfully:", body);
      setResponse(body);
      return body;
    } catch (err: any) {
      setError(err.message || "Unknown error");
      setResponse(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Helper to manually refresh the prompt
  const refreshPrompt = useCallback(async () => {
    try {
      const freshPrompt = await fetchCurrentPrompt();
      if (freshPrompt) {
        setPromptTemplate(freshPrompt);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to refresh prompt:", err);
      return false;
    }
  }, []);

  return { updateAgentConfig, loading, error, response, refreshPrompt };
}
