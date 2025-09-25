const multer = require('multer');
const csv = require('csv-parse');
const scoring = require('../services/scoringService').default;
const storage = require('../storage');
const upload = multer();

exports.uploadLeads = [
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'CSV file required' });
      const text = req.file.buffer.toString();
      const records = [];
      csv.parse(text, { columns: true, trim: true }, (err, rows) => {
        if (err) return res.status(400).json({ error: 'CSV parse error', details: err.message });
        rows.forEach(r => records.push({
          name: r.name || '',
          role: r.role || '',
          company: r.company || '',
          industry: r.industry || '',
          location: r.location || '',
          linkedin_bio: r.linkedin_bio || ''
        }));
        storage.saveLeads(records);
        res.json({ success: true, count: records.length });
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'server error' });
    }
  }
];

exports.scoreLeads = async (req, res) => {
  try {
    const offer = storage.getOffer();
    if (!offer) return res.status(400).json({ error: 'No offer set. POST /api/offer first.' });
    const leads = storage.getLeads();
    const results = [];
    for (const lead of leads) {
      const result = await scoring.scoreLead(offer, lead);
      results.push(result);
    }
    storage.saveResults(results);
    res.json({ success: true, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};

exports.getResults = (req, res) => {
  try {
    const results = storage.getResults();
    res.json({ success: true, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};
