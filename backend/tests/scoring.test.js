const scoring = require('../src/services/scoringService');

describe('rulesScore', () => {
  it('gives full points for strong role & industry & completeness', () => {
    const offer = {
      name: 'Analytics',
      value_props: ['retail analytics', 'customer segmentation'],
      ideal_use_cases: ['Data Scientist', 'Analytics Manager', 'Head of Data']
    };
    const lead = {
      name: 'Alice',
      role: 'Head of Data & Analytics',
      company: 'RetailCorp',
      industry: 'retail analytics',
      linkedin_bio: 'Leading analytics for retail'
    };
    const points = scoring.rulesScore(offer, lead);
    expect(points).toBeGreaterThanOrEqual(40);
  });
});

describe('ai fallback', () => {
  it('returns fallback when no OpenAI key', async () => {
    const offer = { name: 'x', value_props: ['a'], ideal_use_cases: ['dev'] };
    const lead = { name: 'bob', role: 'dev', company: 'c', industry: '', linkedin_bio: '' };
    const ai = await scoring.aiScore(offer, lead);
    expect([50,30,10]).toContain(ai.ai_points);
  });
});
