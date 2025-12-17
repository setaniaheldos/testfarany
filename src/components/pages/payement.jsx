import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PaiementForm = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // État du formulaire
  const [formData, setFormData] = useState({
    idConsult: '',
    modePaiement: 'MVola',
    numeroClient: '',
    montant: ''
  });

  // 1. Charger les consultations non payées au montage
  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      const res = await axios.get('https://heldosseva.duckdns.org/api/consultations/non-payees');
      setConsultations(res.data);
    } catch (err) {
      console.error("Erreur chargement consultations", err);
    }
  };

  // Mettre à jour le montant automatiquement quand on choisit une consultation
  const handleConsultChange = (id) => {
    const selected = consultations.find(c => c.idConsult === parseInt(id));
    setFormData({
      ...formData,
      idConsult: id,
      montant: selected ? selected.prix : ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.post('https://heldosseva.duckdns.org/api/paiements', formData);
      setMessage({ type: 'success', text: response.data.message });
      
      // Réinitialiser le formulaire et rafraîchir la liste
      setFormData({ idConsult: '', modePaiement: 'MVola', numeroClient: '', montant: '' });
      fetchConsultations();
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.error || "Une erreur est survenue" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Enregistrement de Paiement</h2>

      {message.text && (
        <div style={{ padding: '10px', marginBottom: '15px', borderRadius: '4px', 
          backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
          color: message.type === 'success' ? '#155724' : '#721c24' }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* COMBOBOX : CONSULTATIONS */}
        <div style={{ marginBottom: '15px' }}>
          <label>Sélectionner la Consultation :</label>
          <select 
            required
            value={formData.idConsult}
            onChange={(e) => handleConsultChange(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          >
            <option value="">-- Choisir une consultation --</option>
            {consultations.map(c => (
              <option key={c.idConsult} value={c.idConsult}>
                Réf #{c.idConsult} - {c.nomPatient} {c.prenom} ({c.prix} Ar)
              </option>
            ))}
          </select>
        </div>

        {/* AFFICHAGE DU MONTANT (Lecture seule) */}
        <div style={{ marginBottom: '15px' }}>
          <label>Montant à payer (Ar) :</label>
          <input 
            type="number" 
            value={formData.montant} 
            readOnly 
            style={{ width: '100%', padding: '8px', marginTop: '5px', backgroundColor: '#e9ecef' }}
          />
        </div>

        {/* MODE DE PAIEMENT */}
        <div style={{ marginBottom: '15px' }}>
          <label>Mode de Paiement :</label>
          <select 
            value={formData.modePaiement}
            onChange={(e) => setFormData({...formData, modePaiement: e.target.value})}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          >
            <option value="MVola">MVola</option>
            <option value="Espece">Espèces</option>
          </select>
        </div>

        {/* NUMÉRO MVOLA (Conditionnel) */}
        {formData.modePaiement === 'MVola' && (
          <div style={{ marginBottom: '15px' }}>
            <label>Numéro de téléphone MVola :</label>
            <input 
              type="text" 
              placeholder="034XXXXXXX"
              required
              value={formData.numeroClient}
              onChange={(e) => setFormData({...formData, numeroClient: e.target.value})}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading || !formData.idConsult}
          style={{ 
            width: '100%', padding: '10px', 
            backgroundColor: loading ? '#ccc' : '#007bff', 
            color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' 
          }}
        >
          {loading ? 'Traitement...' : 'Confirmer le Paiement'}
        </button>
      </form>
    </div>
  );
};

export default PaiementForm;