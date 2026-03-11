
from ..config import settings
from typing import Dict, Any
import requests
import json
from .persona_prompt_generator import PersonaPromptGenerator

ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1"

class ElevenLabsService:
    """
    Service for interacting with ElevenLabs Conversational AI API.
    """
    
    def __init__(self):
        # We use settings instead of os.getenv for consistency
        self.api_key = settings.ELEVENLABS_API_KEY
        self.base_url = ELEVENLABS_API_URL
        
    def create_persona_agent(self, config: Dict[str, Any], product: Dict[str, Any]) -> str:
        """
        Create a new conversational AI agent with dynamic persona.
        
        Args:
            config: Test configuration with persona details
            product: Product information
            
        Returns:
            agent_id: The created agent's ID
        """
        if not self.api_key:
             raise ValueError("ELEVENLABS_API_KEY is not set in configuration")
        
        # Generate dynamic system prompt using PersonaPromptGenerator
        system_prompt = PersonaPromptGenerator.generate_prompt(config, product)
        
        # Get first message
        first_message = PersonaPromptGenerator.get_first_message(config)
        
        # Select voice based on persona
        voice_id = self._select_voice_for_persona(config)
        
        visitor_name = config.get('name') or config.get('visitor_name', 'Visitor')
        role_title = config.get('visitor_type') or config.get('role_title', 'Professional')
        
        # Build agent configuration
        agent_config = {
            "name": f"{visitor_name} - {role_title}",
            "conversation_config": {
                "agent": {
                    "prompt": {
                        "prompt": system_prompt,  # ← THIS IS THE MAGIC
                        "llm": "gpt-4o-mini"
                    },
                    "first_message": first_message,
                    "language": "en"
                },
                "tts": {
                    "voice_id": voice_id,
                    "model_id": "eleven_turbo_v2_5",
                    "optimize_streaming_latency": 3,
                    "stability": 0.5,
                    "similarity_boost": 0.75
                },
                "asr": {
                    "provider": "deepgram",
                    "model": "nova-2"
                }
            }
        }
        
        # Call ElevenLabs API to create agent
        response = requests.post(
            f"{self.base_url}/convai/agents/create",
            headers={
                "xi-api-key": self.api_key,
                "Content-Type": "application/json"
            },
            json=agent_config
        )
        
        if response.status_code != 200:
            # Enhanced error logging
            print(f"Failed to create agent: {response.status_code} - {response.text}")
            raise Exception(f"Failed to create agent: {response.text}")
        
        agent_data = response.json()
        return agent_data['agent_id']
    
    def update_elevenlabs_agent(self, persona: Dict[str, Any], product: Dict[str, Any], agent_id: str = None) -> Dict[str, Any]:
        """
        Updates the ElevenLabs agent with the new persona configuration.
        """
        target_agent_id = agent_id or settings.AGENT_ID
        
        if not self.api_key:
             raise ValueError("ELEVENLABS_API_KEY is not set in configuration")
        
        # Debug: Print masked key to verify which one is being used
        masked_key = f"{self.api_key[:4]}...{self.api_key[-4:]}" if self.api_key else "None"
        print(f"🔑 Using ElevenLabs API Key: {masked_key}")
        print(f"🎯 Target Agent ID: {target_agent_id}")
        
        if not target_agent_id:
            raise ValueError("AGENT_ID is not set in configuration or passed as argument")

        # Generate the dynamic system prompt
        system_prompt = PersonaPromptGenerator.generate_prompt(persona, product)
        
        # --- DEBUG LOGGING ---
        print("\n" + "="*50)
        print("🤖 GENERATED DYNAMIC PERSONA PROMPT:")
        print("="*50)
        print(system_prompt)
        print("="*50 + "\n")
        # ---------------------
        
        # Select voice
        voice_id = self._select_voice_for_persona(persona)
        
        # Get first message
        first_message = PersonaPromptGenerator.get_first_message(persona)

        # Construct the payload
        payload = {
            "conversation_config": {
                "agent": {
                    "prompt": {
                        "prompt": system_prompt,
                        "llm": "gpt-4o-mini" 
                    },
                    "first_message": first_message,
                    "language": "en"
                },
                "tts": {
                    "voice_id": voice_id
                }
            }
        }
        
        url = f"{self.base_url}/convai/agents/{target_agent_id}"
        
        headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json"
        }
        
        # Debug: Print the actual key being used
        print(f"🔐 DEBUG: API Key in headers: {self.api_key[:15]}...{self.api_key[-10:]}")
        print(f"🎯 DEBUG: Target URL: {url}")
        
        try:
            response = requests.patch(url, json=payload, headers=headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error updating ElevenLabs agent: {e}")
            if e.response:
                 print(f"Response: {e.response.text}")
            raise e

    def _select_voice_for_persona(self, config: Dict[str, Any]) -> str:
        """
        Select appropriate ElevenLabs voice based on persona.
        """
        # Fallback to check both 'role_title' and 'visitor_type' for compatibility
        role = config.get('role_title', config.get('visitor_type', '')).lower()
        
        # Voice mapping (using provided ElevenLabs voice IDs)
        voice_mapping = {
            'cto': 'jP5jSWhfXz3nfQENMtf4',          # Custom Voice
            'ceo': 'jP5jSWhfXz3nfQENMtf4',          # Custom Voice
            'engineer': 'jP5jSWhfXz3nfQENMtf4',     # Custom Voice
            'manager': 'jP5jSWhfXz3nfQENMtf4',      # Custom Voice
            'director': 'jP5jSWhfXz3nfQENMtf4',     # Custom Voice
            'analyst': 'jP5jSWhfXz3nfQENMtf4',      # Custom Voice
            'default_male': 'jP5jSWhfXz3nfQENMtf4',  # Custom Voice
            'default_female': 'jP5jSWhfXz3nfQENMtf4' # Custom Voice
        }
        
        # Check if role matches any key
        for key in voice_mapping:
            if key in role:
                return voice_mapping[key]
        
        # Default fallback
        return voice_mapping['default_male']
    
    def start_conversation(self, agent_id: str) -> str:
        """
        Start a conversation with the created agent.
        
        Returns:
            conversation_id: The started conversation's ID
        """
        if not self.api_key:
             raise ValueError("ELEVENLABS_API_KEY is not set in configuration")
             
        response = requests.post(
            f"{self.base_url}/convai/conversation",
            headers={
                "xi-api-key": self.api_key,
                "Content-Type": "application/json"
            },
            json={"agent_id": agent_id}
        )
        
        if response.status_code != 200:
            raise Exception(f"Failed to start conversation: {response.text}")
        
        conversation_data = response.json()
        return conversation_data['conversation_id']

# Create a singleton instance for easy import if needed
elevenlabs_service = ElevenLabsService()

# Export standalone function for backward compatibility with existing code
# Note: The original function was async, so we keep it async here to avoid breaking callers
async def update_elevenlabs_agent(persona: Dict[str, Any], product: Dict[str, Any], agent_id: str = None) -> Dict[str, Any]:
    return elevenlabs_service.update_elevenlabs_agent(persona, product, agent_id)
