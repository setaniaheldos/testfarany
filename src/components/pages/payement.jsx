import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'https://heldosseva.duckdns.org'; // ou avec :3000 si nécessaire

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
      setMessage({ text: "Erreur lors du chargement des données", type: "error" });
    }
  };

  const consultSelectionnee = consultations.find(
    c => c.idConsult === Number(selectedConsult)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (!selectedConsult) {
      setMessage({ text: "Veuillez sélectionner une consultation", type: "error" });
      return;
    }

    const montant = consultSelectionnee?.prix;
    if (!montant || montant <= 0) {
      setMessage({ text: "Prix de consultation invalide", type: "error" });
      return;
    }

    let cleanedNum = null;
    if (modePaiement === 'MVola') {
      cleanedNum = numeroClient.replace(/\s/g, '');
      if (!/^03[34]\d{7}$/.test(cleanedNum)) {
        setMessage({ text: "Numéro MVola invalide", type: "error" });
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        idConsult: Number(selectedConsult),
        montant,
        modePaiement,
        numeroClient: cleanedNum
      };

      const res = await axios.post(`${API_BASE}/api/paiements`, payload);

      setMessage({
        text: res.data?.message || "Paiement enregistré avec succès",
        type: "success"
      });

      // Recharger les données
      await fetchData();
      setSelectedConsult('');
      setNumeroClient('');
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.details?.message ||
        "Erreur lors du paiement";
      setMessage({ text: errorMsg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg mt-10">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Enregistrer un Paiement
      </h2>

      {message.text && (
        <div
          className={`p-4 mb-4 rounded ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 mb-8">
        {/* Consultation */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Consultation à payer
          </label>
          <select
            value={selectedConsult}
            onChange={(e) => setSelectedConsult(e.target.value)}
            className="w-full px-4 py-2 border rounded-md"
            required
          >
            <option value="">-- Choisir une consultation --</option>
            {consultations.map(c => (
              <option key={c.idConsult} value={c.idConsult}>
                #{c.idConsult} - {c.prenom} {c.nom} - {c.prix?.toLocaleString()} Ar
              </option>
            ))}
          </select>
        </div>

        {/* Prix */}
        {consultSelectionnee && (
          <div className="bg-blue-50 p-4 rounded">
            <strong>Prix :</strong> {consultSelectionnee.prix?.toLocaleString()} Ar
          </div>
        )}

        {/* Mode paiement */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Mode de paiement
          </label>
          <div className="flex gap-6">
            <label className="flex items-center">
              <input
                type="radio"
                value="Espece"
                checked={modePaiement === 'Espece'}
                onChange={() => setModePaiement('Espece')}
                className="mr-2"
              />
              Espèces
            </label>
            <label className="flex items-center">
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

        {/* Numéro MVola */}
        {modePaiement === 'MVola' && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Numéro MVola du patient
            </label>
            <input
              type="text"
              value={numeroClient}
              onChange={(e) => setNumeroClient(e.target.value)}
              placeholder="0341234567"
              className="w-full px-4 py-2 border rounded-md"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Format : 033xxxxxxx ou 034xxxxxxx
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !selectedConsult}
          className={`w-full py-3 rounded-md text-white font-medium ${
            loading || !selectedConsult ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Traitement...' : 'Enregistrer le paiement'}
        </button>
      </form>

      {/* ================= Paiements effectués ================= */}
      <h3 className="text-xl font-bold mb-2">Paiements effectués</h3>
      {paiements.length > 0 ? (
        <table className="w-full border border-gray-300 rounded-md text-sm mb-8">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">ID Consult</th>
              <th className="p-2 border">Nom Patient</th>
              <th className="p-2 border">Montant</th>
              <th className="p-2 border">Mode</th>
              <th className="p-2 border">Statut</th>
            </tr>
          </thead>
          <tbody>
            {paiements.map(p => (
              <tr key={p.idPaiement}>
                <td className="p-2 border">{p.idConsult}</td>
                <td className="p-2 border">{p.nom} {p.prenom}</td>
                <td className="p-2 border">{p.montant?.toLocaleString()} Ar</td>
                <td className="p-2 border">{p.modePaiement}</td>
                <td className="p-2 border">{p.statut}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500">Aucun paiement enregistré.</p>
      )}

      {/* ================= Consultations non payées ================= */}
      <h3 className="text-xl font-bold mb-2">Consultations non payées</h3>
      {consultations.length > 0 ? (
        <table className="w-full border border-gray-300 rounded-md text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">ID Consult</th>
              <th className="p-2 border">Nom Patient</th>
              <th className="p-2 border">Montant</th>
            </tr>
          </thead>
          <tbody>
            {consultations.map(c => (
              <tr key={c.idConsult}>
                <td className="p-2 border">{c.idConsult}</td>
                <td className="p-2 border">{c.nom} {c.prenom}</td>
                <td className="p-2 border">{c.prix?.toLocaleString()} Ar</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500">Toutes les consultations sont payées.</p>
      )}
    </div>
  );
};

export default PaiementForm;
