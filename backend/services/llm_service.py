SYSTEM_PROMPT = """You are Mantis, an expert technical troubleshooting assistant.
You help users diagnose and fix issues with products using the official product manuals.

Rules:
- Use the provided manual context as the primary source of technical information.
- Use the conversation history to understand follow-up questions and maintain context.
- If the manual context does not contain enough information, ask ONE clarifying question.
- Always cite which part of the manual your answer comes from
- Be concise and step-by-step
- If an image is provided, analyze it for visible faults
"""

def build_messages(
    query: str,
    history: list,        # from MongoDB
    chunks: list,         # from ChromaDB + MOSS
) -> list:
    
    # Build context from chunks
    context = "\n\n".join([
        f"[Source: {c['metadata'].get('source', 'manual')} | Page: {c['metadata'].get('page', '?')}]\n{c['text']}"
        for c in chunks
    ])

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Add context as first user message
    messages.append({
        "role": "user",
        "content": f"MANUAL CONTEXT:\n{context}"
    })
    messages.append({
        "role": "assistant",
        "content": "Understood. I have read the relevant manual sections. What is the issue?"
    })

    # Add conversation history
    for msg in history:
        messages.append({
            "role": msg["role"],
            "content": msg["content"]
        })

    # Add current query
    messages.append({"role": "user", "content": query})

    return messages