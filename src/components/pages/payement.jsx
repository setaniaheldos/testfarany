import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'https://heldosseva.duckdns.org'; // Remplace par ton URL backend (ex: http://82.165.15.45:3000)

const PaiementForm = () => {
  const [consultations, setConsultations] = useState([]);
  const [selectedConsult, setSelectedConsult] = useState('');
  const [modePaiement, setModePaiement] = useState('Espece');
  const [numeroClient, setNumeroClient] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' }); // success ou error

  // Charger les consultations non payées au montage
  useEffect(() => {
    const fetchConsultationsNonPayees = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/consultations/non-payees`);
        setConsultations(res.data);
      } catch (err) {
        setMessage({ text: 'Erreur lors du chargement des consultations', type: 'error' });
      }
    };
    fetchConsultationsNonPayees();
  }, []);

  // Trouver la consultation sélectionnée pour afficher son prix
  const consultSelectionnee = consultations.find(c => c.idConsult === parseInt(selectedConsult));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (!selectedConsult) {
      setMessage({ text: 'Veuillez sélectionner une consultation', type: 'error' });
      return;
    }

    const montant = consultSelectionnee?.prix;
    if (!montant || montant <= 0) {
      setMessage({ text: 'Le prix de cette consultation n\'est pas défini', type: 'error' });
      return;
    }

    if (modePaiement === 'MVola') {
      const cleanedNum = numeroClient.replace(/\s/g, '');
      if (!/^033\d{7}$|^034\d{7}$/.test(cleanedNum)) {
        setMessage({ text: 'Numéro MVola invalide (doit être 033xxxxxxx ou 034xxxxxxx)', type: 'error' });
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        idConsult: parseInt(selectedConsult),
        montant: montant,
        modePaiement: modePaiement,
        numeroClient: modePaiement === 'MVola' ? numeroClient.replace(/\s/g, '') : null
      };

      const res = await axios.post(`${API_BASE}/api/paiements`, payload);

      setMessage({
        text: res.data.message || 'Paiement enregistré avec succès !',
        type: 'success'
      });

      // Recharger la liste après paiement réussi
      const updated = await axios.get(`${API_BASE}/api/consultations/non-payees`);
      setConsultations(updated.data);
      setSelectedConsult('');
      setNumeroClient('');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erreur lors du paiement';
      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg mt-10">
      <h2 className="text-2xl font-bold mb-6 text-center">Enregistrer un Paiement</h2>

      {message.text && (
        <div className={`p-4 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sélecteur de consultation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Consultation à payer
          </label>
          <select
            value={selectedConsult}
            onChange={(e) => setSelectedConsult(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">-- Choisir une consultation --</option>
            {consultations.map((c) => (
              <option key={c.idConsult} value={c.idConsult}>
                #{c.idConsult} - {c.prenom} {c.nom} - Prix: {c.prix?.toLocaleString()} Ar
              </option>
            ))}
          </select>
        </div>

        {/* Affichage du prix */}
        {consultSelectionnee && (
          <div className="bg-blue-50 p-4 rounded">
            <strong>Prix à payer :</strong> {consultSelectionnee.prix?.toLocaleString()} Ar
          </div>
        )}

        {/* Mode de paiement */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mode de paiement
          </label>
          <div className="flex gap-6">
            <label className="flex items-center">
              <input
                type="radio"
                name="mode"
                value="Espece"
                checked={modePaiement === 'Espece'}
                onChange={(e) => setModePaiement(e.target.value)}
                className="mr-2"
              />
              Espèces
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="mode"
                value="MVola"
                checked={modePaiement === 'MVola'}
                onChange={(e) => setModePaiement(e.target.value)}
                className="mr-2"
              />
              MVola
            </label>
          </div>
        </div>

        {/* Numéro MVola (conditionnel) */}
        {modePaiement === 'MVola' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro MVola du patient (033 ou 034)
            </label>
            <input
              type="text"
              value={numeroClient}
              onChange={(e) => setNumeroClient(e.target.value)}
              placeholder="034 12 345 67"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required={modePaiement === 'MVola'}
            />
            <p className="text-xs text-gray-500 mt-1">Format: 033xxxxxxx ou 034xxxxxxx</p>
          </div>
        )}

        {/* Bouton */}
        <button
          type="submit"
          disabled={loading || !selectedConsult}
          className={`w-full py-3 px-4 rounded-md text-white font-medium ${
            loading || !selectedConsult
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Traitement en cours...' : 'Enregistrer le paiement'}
        </button>
      </form>

      {consultations.length === 0 && (
        <p className="text-center text-gray-500 mt-8">
          Aucune consultation non payée pour le moment.
        </p>
      )}
    </div>
  );
};

export default PaiementForm;