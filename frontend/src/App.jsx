import { useState ,useRef} from "react";
import axios from "axios";

const API_URL = "https://lead-scoring-app-87bq.onrender.com/api";

export default function App() {
   const dashboardRef = useRef(null);
  const [offer, setOffer] = useState({
    name: "",
    value_props: "",
    ideal_use_cases: "",
  });
  const [file, setFile] = useState(null);
  const [results, setResults] = useState([]);
  const [upladed, setupladed]=useState();
  const [offerSaved, setOfferSaved]=useState()
  const [loading,setLoading]=useState()
  const scrollToDashboard = () => {
    if (dashboardRef.current) {
      dashboardRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };
  // Offer form submit
  const handleOfferSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/offer`, {
        ...offer,
        value_props: offer.value_props.split(","),
        ideal_use_cases: offer.ideal_use_cases.split(","),
      });
      setOfferSaved(true)
      alert("Offer saved ✅");
    } catch (err) {
      console.error(err);
      alert("Error saving offer ❌");
    }
  };

  // CSV upload
  const handleUpload = async () => {
    if (!file) return alert("Select a file first");
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axios.post(`${API_URL}/leads/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setupladed(true)
      
      alert("Leads uploaded ✅");
    } catch (err) {
      console.error(err);
      alert("Upload failed ❌");
    }
  };

  // Run scoring
  const handleScore = async () => {
    try {
      setLoading(true)
      await axios.post(`${API_URL}/score`);
      const res = await axios.get(`${API_URL}/results`);
      setResults(res.data.results);
      scrollToDashboard()
    } catch (err) {
      console.error(err);
      alert("Scoring failed ❌");
    }
    finally{
      setLoading(false)
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-center text-violet-400">
        Lead Qualification Dashboard
      </h1>

      {/* Offer Form */}
      <form
        onSubmit={handleOfferSubmit}
        className="bg-gray-900 p-6 rounded-2xl shadow-lg space-y-4"
      >
        <h2 className="text-xl font-semibold text-violet-300">Offer Details</h2>
        <input
          className="w-full p-2 rounded bg-gray-800"
          placeholder="Offer Name"
          value={offer.name}
          onChange={(e) => setOffer({ ...offer, name: e.target.value })}
        />
        <input
          className="w-full p-2 rounded bg-gray-800"
          placeholder="Value Props (comma separated)"
          value={offer.value_props}
          onChange={(e) => setOffer({ ...offer, value_props: e.target.value })}
        />
        <input
          className="w-full p-2 rounded bg-gray-800"
          placeholder="Ideal Use Cases (comma separated)"
          value={offer.ideal_use_cases}
          onChange={(e) =>
            setOffer({ ...offer, ideal_use_cases: e.target.value })
          }
        />
        <div className="flex gap-4 items-center">
        <button
          type="submit"
          className="bg-violet-600 px-4 py-2 rounded-lg font-semibold"
        >
          Save Offer
          
        </button>
        {offerSaved && <p className="text-green-500">Offer Saved</p>}
        </div>
      </form>

      {/* CSV Upload */}
      <div className="bg-gray-900 p-6 rounded-2xl shadow-lg space-y-4">
        <h2 className="text-xl font-semibold text-violet-300">Upload Leads</h2>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full text-gray-200 border p-2"
        />
        <div className="flex gap-4 items-center">
      <button
          onClick={handleUpload}
          className="bg-violet-600 px-4 py-2 rounded-lg font-semibold"
        >
          Upload CSV
        </button>
        {upladed && <p className="text-green-500">uploaded</p>}
        </div>
        
      </div>

      {/* Scoring */}
      <div className="text-center">
        <button
      onClick={handleScore}
      disabled={loading}
      className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-lg transition-all ${
        loading ? "bg-gray-600 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
      }`}
    >
      {loading && (
        <svg
          className="animate-spin h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          ></path>
        </svg>
      )}
      {loading ? "Processing..." : "Run Scoring 🚀"}
    </button>
      </div>

      {/* Results Dashboard */}
      {results.length > 0 && (
        <div ref={dashboardRef} className="bg-gray-900 p-6 rounded-2xl shadow-lg overflow-x-auto">
          <h2 className="text-xl font-semibold text-violet-300 mb-4">
            Results
          </h2>
         <div className="overflow-x-auto">
  <table className="min-w-full border border-gray-700 text-sm table-auto">
    <thead className="bg-gray-800">
      <tr>
        <th className="p-2 border border-gray-700">Name</th>
        <th className="p-2 border border-gray-700">Role</th>
        <th className="p-2 border border-gray-700">Company</th>
        <th className="p-2 border border-gray-700">Industry</th>
        <th className="p-2 border border-gray-700">Intent</th>
        <th className="p-2 border border-gray-700">Score</th>
        <th className="p-2 border border-gray-700">Reasoning</th>
      </tr>
    </thead>
    <tbody>
      {results.map((lead, i) => (
        <tr key={i} className="text-gray-300">
          <td className="p-2 border border-gray-700">{lead.name}</td>
          <td className="p-2 border border-gray-700">{lead.role}</td>
          <td className="p-2 border border-gray-700">{lead.company}</td>
          <td className="p-2 border border-gray-700">{lead.industry}</td>
          <td
            className={`p-2 border border-gray-700 font-bold ${
              lead.intent === "High"
                ? "text-green-500"
                : lead.intent === "Medium"
                ? "text-yellow-400"
                : "text-red-500"
            }`}
          >
            {lead.intent}
          </td>
          <td className="p-2 border border-gray-700">{lead.score}</td>
          <td className="p-2 border border-gray-700 break-words min-w-[250px] max-w-xs">
            {lead.reasoning}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

        </div>
      )}
    </div>
  );
}
