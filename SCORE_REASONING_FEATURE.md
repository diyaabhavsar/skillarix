# Score Reasoning Feature

## Overview

The Score Reasoning feature provides detailed explanations for why each category in the Overall Performance evaluation received its specific score. This helps users understand their strengths and areas for improvement with concrete, actionable feedback.

---

## 🎯 Feature Description

### What It Does

For each scoring category (Overall Progress, Sales Strategy, Customer Journey, Technical Accuracy), users can now:

1. **See an info icon** (ℹ️) next to each category name
2. **Click the icon** to expand/collapse the reasoning
3. **Read detailed explanations** of why they received that specific score
4. **Get actionable feedback** with specific examples from their conversation

---

## 🎨 User Interface

### Visual Design

**Collapsed State:**
- Small blue info icon (ℹ️) next to category name
- Hover shows "View reasoning" tooltip

**Expanded State:**
- Info icon changes to chevron-up (^) icon
- Light blue reasoning box appears below the category
- Smooth animation when expanding/collapsing
- Box contains:
  - **Header**: "Why this score?"
  - **Content**: 1-2 sentence explanation with specific examples

### Color Coding

- **Info Icon**: Blue (`text-primary`)
- **Reasoning Box**: Light blue background (`bg-blue-50`)
- **Border**: Blue (`border-blue-200`)
- **Text**: Dark blue (`text-blue-800`)

---

## 🔧 Implementation Details

### Backend Changes

**File**: `backend/app/services/conversation.py`

**Modified Function**: `evaluate_complete_conversation()`

**Changes**:
1. Updated prompt to request `reasoning` field for each category
2. Added reasoning requirements to scoring guidelines
3. Example reasoning format provided to LLM

**New JSON Structure**:
```json
{
  "complete_rating": {
    "overall_progress": {
      "score": 2,
      "max": 3,
      "reasoning": "Scored 2/3 because the salesperson moved the conversation forward and addressed key questions, but didn't establish a clear next step or timeline."
    },
    "sales_strategy": {
      "score": 1,
      "max": 3,
      "reasoning": "Scored 1/3 because the approach was reactive rather than consultative. Missed opportunities to ask qualifying questions about budget and decision authority."
    },
    "customer_journey": {
      "score": 2,
      "max": 2,
      "reasoning": "Scored 2/2 for maintaining a warm, engaging tone throughout and building good rapport with the customer."
    },
    "technical_accuracy": {
      "score": 2,
      "max": 2,
      "reasoning": "Scored 2/2 for accurately describing all product features and adding relevant details about integration capabilities."
    },
    "total": {
      "score": 7,
      "max": 10
    }
  }
}
```

### Frontend Changes

**File**: `frontend/src/components/feedback/OverallPerformance.tsx`

**New Features**:
1. **State Management**: `expandedReasoning` state to track which category is expanded
2. **Toggle Function**: `toggleReasoning()` to expand/collapse reasoning
3. **Conditional Rendering**: Show info icon only if reasoning exists
4. **Animation**: Smooth expand/collapse with Framer Motion

**File**: `frontend/src/types/conversations.ts`

**Type Update**:
```typescript
export interface Rating {
  score: number;
  max: number;
  reasoning?: string; // New optional field
}
```

---

## 📋 Reasoning Requirements

### What Makes Good Reasoning

The AI is instructed to provide reasoning that:

1. **References Specific Examples**: Mentions actual moments from the conversation
2. **Explains What Was Done Well/Poorly**: Not just "good" or "bad"
3. **Justifies the Exact Score**: Explains why 2/3 instead of 3/3
4. **Is Actionable**: Tells user what to improve

### Example Reasoning

**Good Reasoning** ✅:
> "Scored 2/3 because the salesperson addressed the customer's budget concerns and suggested alternatives, but missed the opportunity to ask qualifying questions about timeline and decision-making process."

**Bad Reasoning** ❌:
> "The salesperson did okay."

---

## 🎬 User Flow

### Step-by-Step Experience

1. **User completes a training session**
2. **Navigates to Session Feedback**
3. **Clicks "Overall Performance" tab**
4. **Sees scores with info icons** next to each category
5. **Clicks info icon** on a category (e.g., "Sales Strategy")
6. **Reasoning box expands** with smooth animation
7. **Reads detailed explanation** of why they got 1/3
8. **Understands what to improve** for next session
9. **Clicks icon again** to collapse reasoning
10. **Repeats for other categories** as needed

---

## 💡 Benefits

### For Users

1. **Transparency**: Understand exactly why they received each score
2. **Learning**: Get specific, actionable feedback
3. **Motivation**: See what they did well and what to improve
4. **Context**: Understand scoring criteria better

### For Training

1. **Better Coaching**: AI provides detailed, personalized feedback
2. **Consistency**: Same evaluation criteria applied to all users
3. **Scalability**: Automated reasoning for every session
4. **Accountability**: Clear justification for every score

---

## 🧪 Testing

### Manual Testing Steps

1. **Complete a training session** with varied performance
2. **Go to Session Feedback** → **Overall Performance**
3. **Verify info icons** appear next to each category
4. **Click each info icon** and verify:
   - Reasoning box expands smoothly
   - Text is readable and relevant
   - Icon changes to chevron-up
   - Box has proper styling
5. **Click again** to collapse
6. **Test multiple categories** simultaneously

### Expected Behavior

- ✅ Info icon only shows if reasoning exists
- ✅ Smooth expand/collapse animation
- ✅ Only one category can be expanded at a time
- ✅ Reasoning text is specific to that category
- ✅ Styling is consistent across all categories

---

## 🎨 Design Specifications

### Component Structure

```tsx
<div className="space-y-2">
  {/* Category Header */}
  <div className="flex justify-between items-center">
    <div className="flex items-center gap-2">
      <span>Category Name</span>
      {hasReasoning && (
        <Button onClick={toggleReasoning}>
          <Info icon />
        </Button>
      )}
    </div>
    <Badge>Score</Badge>
  </div>

  {/* Reasoning Box (Conditional) */}
  <AnimatePresence>
    {isExpanded && (
      <motion.div>
        <div className="reasoning-box">
          <Info icon />
          <div>
            <p>Why this score?</p>
            <p>{reasoning}</p>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>

  {/* Progress Bar */}
  <div className="progress-bar">...</div>
</div>
```

### Styling Classes

```css
/* Info Button */
.h-6 .w-6 .p-0 .hover:bg-primary/10

/* Reasoning Box */
.bg-blue-50 .border .border-blue-200 .rounded-lg .p-3

/* Reasoning Text */
.text-sm .text-blue-800 .leading-relaxed
```

---

## 🔮 Future Enhancements

### Potential Improvements

1. **Highlight Keywords**: Bold important terms in reasoning
2. **Comparison View**: Show reasoning for multiple sessions side-by-side
3. **Export Reasoning**: Include in PDF reports
4. **Voice Feedback**: Text-to-speech for reasoning
5. **Interactive Examples**: Click to see exact conversation moment
6. **Reasoning History**: Track how reasoning changes over time
7. **Custom Prompts**: Allow admins to customize reasoning style

---

## 📊 Example Scenarios

### Scenario 1: Low Sales Strategy Score

**Score**: 1/3

**Reasoning**:
> "Scored 1/3 because the salesperson was reactive rather than proactive. They answered questions but didn't ask qualifying questions about budget, timeline, or decision authority. Missed opportunity to uncover the customer's real pain points."

**User Action**: Learns to ask more qualifying questions in next session

### Scenario 2: High Customer Journey Score

**Score**: 2/2

**Reasoning**:
> "Scored 2/2 for maintaining a warm, professional tone throughout. Used the customer's name, showed empathy when they mentioned budget concerns, and built excellent rapport."

**User Action**: Feels validated and continues this approach

### Scenario 3: Medium Overall Progress Score

**Score**: 2/3

**Reasoning**:
> "Scored 2/3 because the conversation moved forward and key features were discussed, but no clear next step was established. The customer left without a demo scheduled or follow-up plan."

**User Action**: Learns to always establish next steps

---

## 🐛 Troubleshooting

### Issue: No Reasoning Showing

**Possible Causes**:
1. Backend not returning `reasoning` field
2. Reasoning is empty string
3. Frontend type mismatch

**Solution**:
- Check backend response in Network tab
- Verify LLM is including reasoning in response
- Check `hasReasoning` condition in component

### Issue: Reasoning Not Specific

**Possible Causes**:
1. LLM prompt not clear enough
2. Conversation too short for meaningful analysis
3. Temperature too high (too creative)

**Solution**:
- Review and improve prompt instructions
- Ensure minimum conversation length
- Adjust temperature to 0.7 or lower

---

## 📝 Code Examples

### Backend: Prompt Update

```python
fallback_prompt = """
...
- "complete_rating": {
    "overall_progress": { 
        "score": X, 
        "max": 3,
        "reasoning": "1-2 sentence explanation of why this specific score was given"
    },
    ...
  }

REASONING REQUIREMENTS:
For each category, you MUST provide a "reasoning" field that:
1. References specific examples from the conversation
2. Explains what was done well or poorly
3. Justifies the exact score given
4. Is actionable and specific
"""
```

### Frontend: Reasoning Display

```tsx
{hasReasoning && isExpanded && (
  <motion.div
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: "auto" }}
    exit={{ opacity: 0, height: 0 }}
  >
    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start gap-2">
        <Info className="h-4 w-4 text-blue-600" />
        <div>
          <p className="text-xs font-semibold text-blue-900">
            Why this score?
          </p>
          <p className="text-sm text-blue-800">
            {value.reasoning}
          </p>
        </div>
      </div>
    </div>
  </motion.div>
)}
```

---

## ✅ Checklist

### Implementation Checklist

- [x] Backend: Updated evaluation prompt
- [x] Backend: Added reasoning field to JSON structure
- [x] Frontend: Updated TypeScript types
- [x] Frontend: Added info icon button
- [x] Frontend: Implemented expand/collapse logic
- [x] Frontend: Added reasoning box UI
- [x] Frontend: Added animations
- [x] Testing: Manual testing completed
- [x] Documentation: Feature documented

---

**Feature Status**: ✅ Implemented  
**Version**: 1.0  
**Last Updated**: January 2026
