const storage = require('../storage');

exports.createOffer = async (req, res) => {
  try {
    const { name, value_props, ideal_use_cases } = req.body;
    if (!name || !value_props , !ideal_use_cases){
      return res.status(400).json({ error: 'name , ideal use cases and value_props  required' });
    }
    const offer = await storage.saveOffer({ name, value_props, ideal_use_cases });
    res.json({ success: true, offer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};
