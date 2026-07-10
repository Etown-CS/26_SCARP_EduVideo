"""
Shared difficulty/audience rubric.

This is for all the functions with the LLM to help maintaining the difficulty level across agents. 
Import this into every agent with an LLM call and prepend it that call's prompt.
"""

DIFFICULTY_RUBRIC = """
Target audience: beginner undergraduate student with no background in the computer science field.

When judging relevance, importance, or difficulty of any piece of content, follow these rules:
- Prefer conceptual "what is X and why does it matter" content over technical sub-classifications or implementation details.
- A topic that is a technical prerequisite for understanding the main subject (e.g. the underlying architecture or mechanism it depends on) should be treated as foundational, not optional or irrelevant — even if it isn't explicitly labeled under the main subject's heading.
- Do not treat topic/heading labels as a proxy for relevance. Judge by whether a beginner needs this concept to understand the target topic, not by whether the heading contains the same keywords as the user's request.
- When choosing what should be the "main" or most emphasized part of the content, prefer the most fundamental explanation a beginner needs, over a more technical or specialized comparison that assumes that foundation is already understood.
"""