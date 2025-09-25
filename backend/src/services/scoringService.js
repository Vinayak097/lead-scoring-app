import { OpenAI } from 'openai';


console.log(process.env.OPENAI_API_KEY , " HELLO")
const client = new OpenAI();



/**
 * Rules Layer: up to 50 points
 * - Role relevance (up to 25)
 * - Industry match (up to 15)
 * - Data completeness (up to 10)
 *
 * AI Layer: up to 50 points
 * - Model must return High/Medium/Low with brief reason
 * - map to 50/30/10
 */

function rulesScore(offer, lead) {
  let points = 0;
  const roleText = (lead.role || '').toLowerCase();
  const company = (lead.company || '').toLowerCase();
  const industry = (lead.industry || '').toLowerCase();

  // Role relevance (25)
  const keywords = (offer.ideal_use_cases || []).join(' ').toLowerCase().split(/\W+/).filter(Boolean);
  let roleMatch = 0;
  for (const kw of keywords) {
    if (roleText.includes(kw)) roleMatch++;
  }
  // scale: >3 -> 25, 2->18, 1->10, 0->0
  if (roleMatch >= 3) points += 25;
  else if (roleMatch === 2) points += 18;
  else if (roleMatch === 1) points += 10;

  // Industry match (15)
  const industryKeywords = (offer.value_props || []).join(' ').toLowerCase();
  if (industry && industryKeywords.includes(industry)) points += 15;
  else if (industry && industryKeywords.split(/\W+/).some(w => industry.includes(w))) points += 7;

  // Data completeness (10)
  let completeness = 0;
  if (lead.name) completeness++;
  if (lead.role) completeness++;
  if (lead.linkedin_bio) completeness++;
  if (lead.company) completeness++;
  if (lead.industry) completeness++;
  // 5 fields -> 10 points -> each 2 points
  points += Math.round((completeness / 5) * 10);

  return points; // 0-50
}

async function aiScore(offer, lead) {
  // If no OpenAI key, fallback to a simple heuristic
  if (!client) {
    // simple heuristic based on keywords & company size guess
    const lText = `${lead.role} ${lead.linkedin_bio} ${lead.industry} ${lead.company}`.toLowerCase();
    const offerText = `${offer.name} ${offer.value_props.join(' ')} ${offer.ideal_use_cases.join(' ')}`.toLowerCase();
    const common = offerText.split(/\W+/).filter(Boolean).some(t => lText.includes(t));
    const result = common ? 'High' : 'Low';
    const reason = common ? 'Role and use-case keywords found in lead bio' : 'No clear keyword match';
    const scoreMap = { High: 50, Medium: 30, Low: 10 };
    return { label: result, ai_points: scoreMap[result], reasoning: reason };
  }

  // Build prompt
  const prompt = buildPrompt(offer, lead);

  try {
    const resp = await client.responses.create({
      model: 'gpt-4o-mini',
      input: [
        { role: 'system', content: 'You classify buying intent for a lead given product/offer context.' },
        { role: 'user', content: prompt }
      ],
      
      
    });
    console.log(resp)
    const text = resp.output_text;
    // Expecting something like: "Intent: High\nReason: ... "
    const parsed = parseAiResponse(text);
    return parsed;
  } catch (err) {
    console.error('AI call failed:', err?.response?.data || err.message);
    // fallback heuristic
    return { label: 'Medium', ai_points: 30, reasoning: 'AI unavailable — defaulted to Medium' };
  }
}

function buildPrompt(offer, lead) {
  const offerBlock = `Offer:
Name: ${offer.name}
Value props: ${Array.isArray(offer.value_props) ? offer.value_props.join('; ') : offer.value_props}
Ideal use cases: ${Array.isArray(offer.ideal_use_cases) ? offer.ideal_use_cases.join('; ') : offer.ideal_use_cases}`;

  const leadBlock = `Lead:
Name: ${lead.name}
Role: ${lead.role}
Company: ${lead.company}
Industry: ${lead.industry}
Location: ${lead.location}
LinkedIn bio: ${lead.linkedin_bio}`;

  return `${offerBlock}\n\n${leadBlock}\n\nTask: Based on the Offer and the Lead info, classify buying intent as one of: High, Medium, Low. Give a one-sentence reasoning. Output strictly as JSON: {"intent":"High|Medium|Low","reason":"..."} and nothing else.`;
}

function parseAiResponse(text){
  try {
    // find first JSON in text
    const match = text.match(/\{[\s\S]*\}/);
    const jsonStr = match ? match[0] : null;
    if (!jsonStr) throw new Error('no json');
    const obj = JSON.parse(jsonStr);
    const map = { High: 50, Medium: 30, Low: 10 };
    return { label: obj.intent, ai_points: map[obj.intent] || 0, reasoning: obj.reason };
  } catch (e) {
    // fallback: try simple extraction
    const intent = /High|Medium|Low/i.exec(text);
    const label = intent ? intent[0].charAt(0).toUpperCase() + intent[0].slice(1).toLowerCase() : 'Medium';
    const map = { High: 50, Medium: 30, Low: 10 };
    return { label, ai_points: map[label] || 30, reasoning: text.split('\n')[0] || 'Could not parse AI response' };
  }
}

async function scoreLead(offer, lead) {
  const rPoints = rulesScore(offer, lead);
  const ai = await aiScore(offer, lead);
  console.log(" ai scores is here " , ai)
  const final = Math.min(100, rPoints + ai.ai_points);
  return {
    ...lead,
    rules_points: rPoints,
    ai_points: ai.ai_points,
    score: final,  
    intent: ai.label,
    reasoning: ai.reasoning
  };
}

export default { rulesScore, aiScore, scoreLead };
