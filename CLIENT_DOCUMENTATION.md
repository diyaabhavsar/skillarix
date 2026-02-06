# Skillarix Platform Documentation
## Comprehensive User Guide & System Overview

---

### 1. Executive Summary

**Skillarix** is an advanced, AI-powered sales training platform designed to revolutionize how sales teams practice and perfect their pitches. By leveraging cutting-edge Generative AI and Voice Synthesis technologies, Skillarix creates realistic, real-time roleplay scenarios where sales representatives can interact with simulated buyer personas.

Unlike traditional roleplay which requires a human partner, Skillarix is always available, never gets tired, and provides objective, data-driven feedback instantly.

**Key Value Propositions:**
- **Realistic Simulations:** Voice-to-voice interaction with AI buyers that have distinct personalities, objections, and buying criteria.
- **Instant Coaching:** Real-time feedback on every response, ensuring immediate correction and learning.
- **Objective Scoring:** Standardized scoring on Sales Strategy, Technical Accuracy, and Customer Journey alignment.
- **Scalable Training:** Train 1 or 1,000 reps simultaneously without needing more managers.

---

### 2. The User Journey: End-to-End Walkthrough

This section outlines the typical workflow for a user on the Skillarix platform.

#### Phase 1: Access & Authentication
*   **Login/Registration:** The platform is secured via industry-standard authentication. Users log in with their credentials to access their personalized dashboard.
    *   *Security:* All sessions are encrypted and secured with JWT (JSON Web Tokens).

#### Phase 2: The Command Center (Dashboard)
Upon logging in, the user is greeted by the **Dashboard**, which serves as the central hub.
*   **Performance Overview:** Visual charts displaying recent performance trends, average scores, and improvement areas.
*   **Quick Actions:** One-click access to start a new practice session or review past calls.

#### Phase 3: System Configuration (Setup)
Before training begins, necessary context is defined to ensure the AI behaves correctly.

1.  **Product Management:** 
    *   Users (or Admins) upload details about the products or services being sold.
    *   **Details include:** Product Name, Category, Key Features, and Pricing.
    *   *Feature:* You can upload PDF specs or brochures so the AI "knows" the product inside out.

2.  **Test Configuration (Persona Creation):**
    *   This is where you define **"Who is the buyer?"**
    *   **Granular Controls:**
        *   **Role:** E.g., CEO (Decision Maker) vs. Engineer (Influencer).
        *   **Industry Knowledge:** Novice vs. Expert.
        *   **Personality:** Friendly, Skeptical, Budget-Conscious, or Aggressive.
        *   **Objectives:** Is their goal to cut costs? Improve quality? Or just browse?
    *   *Result:* A unique testing scenario that challenges the rep in specific ways.

#### Phase 4: The Training Session (Roleplay)
This is the core of Skillarix.

1.  **Initiation:** The user selects a **Product** and a **Test Configuration**.
2.  **The Conversation:**
    *   The user speaks into their microphone.
    *   The AI (powered by **ElevenLabs**) analyzes the speech and responds audibly in real-time.
    *   The conversation flows naturally. The AI will ask questions, raise objections, and react to the salesperson's tone and answers just like a real human would.
3.  **Real-Time Assistant:**
    *   As the conversation happens, an on-screen "Coach" analyzes each exchange.
    *   It offers live tips (e.g., "You missed the customer's concern about budget" or "Great job handling that objection").

#### Phase 5: Evaluation & Analytics
Once the call concludes, the system generates a comprehensive report.

*   **Scoring Rubric (0-10 Scale):**
    1.  **Question Relevance:** Did the rep answer what was asked?
    2.  **Technical Accuracy:** Was the information factually correct regarding the product?
    3.  **Sales Effectiveness:** Was the tone persuasive? Did they close the next step?
    4.  **Overall Progress:** How well did they move the deal forward?
*   **Detailed Feedback:**
    *   **Strengths:** "You built excellent rapport in the opening."
    *   **Weaknesses:** "You failed to ask for a follow-up meeting."
    *   **Transcript Review:** Users can read the full transcript of the call to pinpoint exact moments of success or failure.

#### Phase 6: History & Improvement
*   **Conversation History:** All past sessions are saved.
*   **Leaderboards & Tracking:** Managers can track team usage and improvement over time.

---

### 3. Detailed Feature Specifications

#### A. AI Persona Engine
The heart of Skillarix is its ability to simulate hundreds of different buyer types. The system uses **Dynamic Variable Injection** to adjust the AI's prompt instructions instantly.
*   **Variables:** Budget Range, Buying Authority, Exhibition Objectives, Key Challenges.
*   **Behavior:** The AI aims to be *consistent*. If configured as "Budget-Conscious," it will repeatedly circle back to price discussions until satisfied.

#### B. The Evaluation Engine
We utilize Large Language Models (LLMs) like **run on Groq (LLaMA 4) or OpenAI (GPT-4)** to act as the "Judge."
*   **Reference Answers Check:** The system generates an "Ideal Answer" for every customer question and compares the user's response to it.
*   **Semantic Analysis:** It doesn't just match keywords; it understands *intent* and *sentiment*.

#### C. Voice & Audio
*   **Low Latency:** Optimized for near-instant response times to maintain the illusion of a live conversation.
*   **Voice Customization:** The AI's voice can be changed to match different demographics (gender, age, accent).

#### D. Content Management
*   **Prompt Management:** Admins can tweak the "Brain" of the AI by editing the prompts directly in the interface. This allows for rapid iteration of training scenarios without code changes.

---

### 4. Technical Architecture Overview

Designed for security, scalability, and performance.

*   **Frontend Interface:** Built with **React** and **TypeScript** for a modern, responsive, and fast user experience. Styled with TailwindCSS for a premium look and feel.
*   **Backend Core:** Powered by **FastAPI (Python)**, known for its high speed and support for asynchronous tasks (crucial for real-time voice).
*   **Database:** **MongoDB** is used for flexible storage of complex conversation logs and varying product data structures.
*   **Real-time Communication:** Uses **WebSockets** to stream audio and text data instantly between the client and server.
*   **AI Integration:** Modular architecture allowing hot-swapping between different AI providers (OpenAI, Groq, Anthropic) ensures the platform is future-proof.

---

### 5. Why Skillarix?

For a client interested in this project, Skillarix represents a **turnkey solution** for sales enablement. It moves training from "passive learning" (watching videos) to "active learning" (doing).

*   **Reduce Onboarding Time:** New reps get conversation-ready faster.
*   **Standardize Messaging:** Ensure every rep pitches the product the exact same way.
*   **Identify Gaps:** Data clearly shows if the team struggles with "Closing" or "Technical Specs."

---

*This document serves as a high-level overview of the Skillarix platform's capabilities and workflows.*
