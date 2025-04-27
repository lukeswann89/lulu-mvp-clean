export default async function handler(req, res) {
  const { text, editType, mode } = req.body;
  if (!text || !editType || !mode) {
    return res.status(400).json({ error: "Missing required fields: text, editType, or mode." });
  }
  // Build a strict prompt for GPT
  const prompt = mode === 'Rewrite'
    ? `You are Lulu, a world-class literary mentor.
You will rewrite the entire provided text to improve it according to ${editType} editing principles.
Preserve the writer's voice but strengthen the text meaningfully.
ONLY output the full rewritten text.
Do NOT explain anything. Do NOT output JSON. Just the improved text.
Text to rewrite: """${text}"""
`
    : `You are Lulu, a world-class literary mentor.
You will always return your response ONLY as a JSON array, following this format strictly:
[
  {
    "original": "original text here",
    "suggestion": "suggested improved text here",
    "why": "brief reason explaining the suggestion here"
  }
]
Do NOT explain anything outside JSON. Do NOT output any text before or after the JSON.
Task:
- Edit Type: ${editType}
- Mode: ${mode}
- Text to edit: """${text}"""
`;
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });
    const data = await response.json();
    const raw = data.choices[0].message.content;
    if (mode === 'Rewrite') {
      // Rewrite mode returns full text directly
      res.status(200).json({ rewrittenText: raw });
    } else {
      // Suggest Changes mode expects structured JSON
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        throw new Error('AI response is not a valid JSON array.');
      }
      res.status(200).json({ suggestions: parsed });
    }
  } catch (error) {
    console.error('Error handling GPT response:', error.message);
    res.status(500).json({ error: 'Sorry, Lulu could not process the suggestions. Please try again.' });
  }
}
