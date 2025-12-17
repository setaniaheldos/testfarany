import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'https://heldosseva.duckdns.org'; 

const PaiementForm = () => {
  const [consultations, setConsultations] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [selectedConsult, setSelectedConsult] = useState('');
  const [modePaiement, setModePaiement] = useState('Espece');
  const [numeroClient, setNumeroClient] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
  try {
    const [nonPayeesRes, paiementsRes] = await Promise.all([
      axios.get(`${API_BASE}/api/consultations/non-payees`),
      axios.get(`${API_BASE}/api/paiements`)
    ]);
    setConsultations(nonPayeesRes.data || []);
    setPaiements(paiementsRes.data || []);
  } catch (err) {
    // AJOUTEZ CECI POUR VOIR L'ERREUR DANS F12
    console.error("Détails de l'erreur API:", err.response?.data || err.message);
    setMessage({ text: "Erreur de connexion au serveur", type: "error" });
  }
};

  // Trouver la consultation sélectionnée pour obtenir le prix
  const consultSelectionnee = consultations.find(
    c => c.idConsult === Number(selectedConsult)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    // 1. Validation Frontend (doit correspondre au point #2 du backend)
    if (!selectedConsult) {
      setMessage({ text: "Veuillez sélectionner une consultation", type: "error" });
      return;
    }

    const montant = consultSelectionnee?.prix;
    if (!montant || montant <= 0) {
      setMessage({ text: "Montant invalide pour cette consultation", type: "error" });
      return;
    }

    // 2. Préparation du numéro MVola (Regex aligné sur le backend : 032, 033, 034, 038)
    let cleanedNum = ""; 
    if (modePaiement === 'MVola') {
      cleanedNum = numeroClient.replace(/\s/g, '');
      const mvolaRegex = /^03[2348]\d{7}$/; 
      if (!mvolaRegex.test(cleanedNum)) {
        setMessage({ text: "Numéro MVola invalide (ex: 0341234567)", type: "error" });
        return;
      }
    }

    setLoading(true);

    try {
      // 3. Construction du Payload EXACT pour votre route app.post('/api/paiements')
      const payload = {
        idConsult: Number(selectedConsult),
        modePaiement: modePaiement,
        numeroClient: modePaiement === 'MVola' ? cleanedNum : "", // Évite 'null' si le backend attend une string
        montant: Number(montant)
      };

      const res = await axios.post(`${API_BASE}/api/paiements`, payload);

      // 4. Succès
      setMessage({
        text: res.data?.message || "Paiement enregistré avec succès",
        type: "success"
      });

      // Reset du formulaire et rafraîchissement des listes
      setSelectedConsult('');
      setNumeroClient('');
      await fetchData(); 

    } catch (err) {
      // 5. Gestion des erreurs (récupère le message du backend)
      const errorMsg = 
        err.response?.data?.error || 
        err.response?.data?.details || 
        "Erreur lors du traitement";
      
      setMessage({ text: errorMsg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg mt-10">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">Enregistrer un Paiement</h2>

      {message.text && (
        <div className={`p-4 mb-4 rounded border ${
          message.type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 mb-10">
        <div>
          <label className="block text-sm font-medium mb-2">Consultation à payer</label>
          <select
            value={selectedConsult}
            onChange={(e) => setSelectedConsult(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">-- Choisir une consultation --</option>
            {consultations.map(c => (
              <option key={c.idConsult} value={c.idConsult}>
                #{c.idConsult} - {c.nom} {c.prenom} - {c.prix?.toLocaleString()} Ar
              </option>
            ))}
          </select>
        </div>

        {consultSelectionnee && (
          <div className="bg-gray-50 p-4 rounded-md border-l-4 border-blue-500">
             <p className="text-lg font-bold text-gray-700">Prix : {consultSelectionnee.prix?.toLocaleString()} Ar</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium">Mode de paiement</label>
          <div className="flex gap-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="Espece"
                checked={modePaiement === 'Espece'}
                onChange={() => setModePaiement('Espece')}
                className="mr-2"
              />
              Espèces
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="MVola"
                checked={modePaiement === 'MVola'}
                onChange={() => setModePaiement('MVola')}
                className="mr-2"
              />
              MVola
            </label>
          </div>
        </div>

        {modePaiement === 'MVola' && (
          <div className="animate-pulse">
            <label className="block text-sm font-medium mb-2">Numéro MVola du patient</label>
            <input
              type="text"
              value={numeroClient}
              onChange={(e) => setNumeroClient(e.target.value)}
              placeholder="034 00 000 00"
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-yellow-500"
              required
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !selectedConsult}
          className={`w-full py-3 rounded-md text-white font-bold transition ${
            loading || !selectedConsult ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 shadow-md'
          }`}
        >
          {loading ? 'Traitement en cours...' : 'Enregistrer le paiement'}
        </button>
      </form>

      <hr className="my-8" />

      {/* Tables de visualisation (Paiements effectués) */}
      <h3 className="text-xl font-bold mb-4">Paiements effectués</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">ID</th>
              <th className="border p-2">Patient</th>
              <th className="border p-2">Montant</th>
              <th className="border p-2">Mode</th>
              <th className="border p-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {paiements.map(p => (
              <tr key={p.idPay || p.idConsult} className="text-center hover:bg-gray-50">
                <td className="border p-2">{p.idConsult}</td>
                <td className="border p-2 font-medium">{p.nom} {p.prenom}</td>
                <td className="border p-2 font-bold">{p.montant?.toLocaleString()} Ar</td>
                <td className="border p-2">{p.modePaiement}</td>
                <td className={`border p-2 font-bold ${p.statut === 'REUSSI' ? 'text-green-600' : 'text-orange-500'}`}>
                  {p.statut}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaiementForm;