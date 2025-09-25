const fs = require('fs');
const path = require('path');

let offer = null;
let leads = [];
let results = [];

const persistenceFile = process.env.PERSISTENCE_FILE;

function load(){
  if (!persistenceFile) return;
  const p = path.resolve(persistenceFile);
  if (fs.existsSync(p)){
    const raw = fs.readFileSync(p);
    try {
      const parsed = JSON.parse(raw);
      offer = parsed.offer || offer;
      leads = parsed.leads || leads;
      results = parsed.results || results;
    } catch(e) {
        console.log('error in load' , e)
    }
  }
}

function persist() {
  if (!persistenceFile) return;
  const p = path.resolve(persistenceFile);
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(p, JSON.stringify({ offer, leads, results }, null, 2));
}

load();

module.exports = {
  saveOffer: async (o) => { offer = o; persist(); return offer; },
  getOffer: () => offer,
  saveLeads: (rows) => { leads = rows; persist(); return leads; },
  getLeads: () => leads,
  saveResults: (r) => { results = r; persist(); return results; },
  getResults: () => results
};
