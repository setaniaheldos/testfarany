import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'https://heldosseva.duckdns.org'; 
// ⚠️ Ajoute :3000 si ton backend écoute sur un port

const PaiementForm = () => {
  const [consultations, setConsultations] = useState([]);
  const [selectedConsult, setSelectedConsult] = useState('');
  const [modePaiement, setModePaiement] = useState('Espece');
  const [numeroClient, setNumeroClient] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  /* =============================
     Charger consultations non payées
  ============================== */
  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/consultations/non-payees`);
      setConsultations(res.data || []);
    } catch (err) {
      setMessage({
        text: "Erreur lors du chargement des consultations",
        type: "error"
      });
    }
  };

  const consultSelectionnee = consultations.find(
    c => c.idConsult === Number(selectedConsult)
  );

  /* =============================
     Soumission paiement
  ============================== */
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
        setMessage({
          text: "Numéro MVola invalide (033xxxxxxx ou 034xxxxxxx)",
          type: "error"
        });
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

      /* ===== Gestion statut MVola ===== */
      if (res.data?.status === 'EN_ATTENTE' || res.data?.statut === 'EN_ATTENTE') {
        setMessage({
          text: "Demande MVola envoyée. Veuillez confirmer sur le téléphone du patient.",
          type: "success"
        });
      } else {
        setMessage({
          text: res.data?.message || "Paiement enregistré avec succès",
          type: "success"
        });
      }

      await fetchConsultations();
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

  /* =============================
     RENDER
  ============================== */
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg mt-10">
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

      <form onSubmit={handleSubmit} className="space-y-6">

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
            {consultations.map((c) => (
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

        {/* Bouton */}
        <button
          type="submit"
          disabled={loading || !selectedConsult}
          className={`w-full py-3 rounded-md text-white font-medium ${
            loading || !selectedConsult
              ? 'bg-gray-400'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Traitement...' : 'Enregistrer le paiement'}
        </button>
      </form>

      {consultations.length === 0 && (
        <p className="text-center text-gray-500 mt-8">
          Aucune consultation non payée.
        </p>
      )}
    </div>
  );
};

export default PaiementForm;
