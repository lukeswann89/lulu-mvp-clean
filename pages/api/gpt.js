export default async function handler(req, res) {
  const { text, editType, mode } = req.body;
  if (!text || !editType || !mode) {
    return res.status(400).json({ error: "Missing required fields: text, editType, or mode." });
  }
  const prompt = mode === 'Rewrite'
    ? `You are Lulu, a world-class literary mentor. You will rewrite the entire provided text to improve it according to ${editType} editing principles. Preserve the writer's voice but strengthen the text meaningfully. Format your output like this: Rewritten Text: """(rewritten text here with [ADDED] and [REMOVED] tags)""" Justifications: - Point 1 - Point 2 - Point 3. Only output in this format. Text to rewrite: """${text}"""`
    : `You are Lulu, a world-class literary mentor. You will always return your response ONLY as a JSON array, following this format strictly: [{"original":"original text","suggestion":"new text","why":"reason for change"}] Do NOT explain anything outside JSON. Task: - Edit Type: ${editType} - Mode: ${mode} - Text to edit: """${text}"""`;
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
      const splitIndex = raw.indexOf('Justifications:');
      const rewrittenText = raw.slice(0, splitIndex).replace('Rewritten Text:', '').trim();
      const justificationsText = raw.slice(splitIndex + 'Justifications:'.length).trim();
      const justifications = justificationsText.split('-').filter(Boolean).map(j => j.trim());
      res.status(200).json({ rewrittenText, justifications });
    } else {
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
