import React, { useState, useEffect } from 'react';

const GestionPaiements = () => {
  const [paiements, setPaiements] = useState([]);
  const [consultationsDisponibles, setConsultationsDisponibles] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // L'URL doit correspondre à votre backend (Port 3000 d'après votre code)
  const API_BASE_URL = 'https://heldosseva.duckdns.org/api'; 

  const [formData, setFormData] = useState({
    idConsult: '',
    montant: '',
    modePaiement: 'MVola',
    numeroClient: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchData = async () => {
    try {
      // On utilise les routes exactes de votre backend
      const [resPaiements, resStats, resConsults] = await Promise.all([
        fetch(`${API_BASE_URL}/paiements`),
        fetch(`${API_BASE_URL}/paiements/stats`),
        fetch(`${API_BASE_URL}/consultations/non-payees`)
      ]);
      
      const dataP = await resPaiements.json();
      const dataS = await resStats.json();
      const dataC = await resConsults.json();

      setPaiements(Array.isArray(dataP) ? dataP : []);
      setStats(Array.isArray(dataS) ? dataS : []);
      setConsultationsDisponibles(Array.isArray(dataC) ? dataC : []);

      console.log("Consultations non payées chargées:", dataC);
    } catch (err) {
      console.error("Erreur de chargement:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConsultChange = (id) => {
    // On cherche la consultation sélectionnée pour auto-remplir le prix
    const selected = consultationsDisponibles.find(c => c.idConsult === parseInt(id));
    setFormData({
      ...formData,
      idConsult: id,
      montant: selected ? selected.prix : '' 
    });
  };

  const handlePaiement = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${API_BASE_URL}/paiements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: data.message || "Opération réussie" 
        });
        // Reset du formulaire
        setFormData({ idConsult: '', montant: '', modePaiement: 'MVola', numeroClient: '' });
        fetchData(); // Rafraîchir la liste et la combobox
      } else {
        setMessage({ type: 'error', text: data.error || "Erreur lors du paiement" });
      }
    } catch (err) {
      setMessage({ type: 'error', text: "Erreur de connexion au serveur" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Gestion de la Caisse</h1>

        {/* --- STATS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {stats.map((s, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow-sm border-t-4 border-blue-500">
              <p className="text-xs text-gray-500 uppercase">{s.modePaiement} - {s.statut}</p>
              <p className="text-xl font-bold">{s.total.toLocaleString()} Ar</p>
              <p className="text-xs text-gray-400">{s.nombre} transaction(s)</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- FORMULAIRE --- */}
          <div className="bg-white p-6 rounded-xl shadow-sm border h-fit">
            <h2 className="text-lg font-semibold mb-4">Encaisser une consultation</h2>
            <form onSubmit={handlePaiement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Patient en attente</label>
                <select 
                  required
                  className="w-full p-2 border rounded-lg bg-white"
                  value={formData.idConsult}
                  onChange={(e) => handleConsultChange(e.target.value)}
                >
                  <option value="">-- Sélectionner --</option>
                  {consultationsDisponibles.map(c => (
                    <option key={c.idConsult} value={c.idConsult}>
                      {c.nomPatient} {c.prenom} (Prix: {c.prix} Ar)
                    </option>
                  ))}
                </select>
                {consultationsDisponibles.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1 italic">Aucune consultation à régler.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Montant à payer</label>
                <input 
                  type="number" readOnly
                  className="w-full p-2 border rounded-lg bg-gray-50 font-bold"
                  value={formData.montant}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Mode de règlement</label>
                <select 
                  className="w-full p-2 border rounded-lg bg-white"
                  value={formData.modePaiement}
                  onChange={(e) => setFormData({...formData, modePaiement: e.target.value})}
                >
                  <option value="MVola">MVola</option>
                  <option value="Espece">Espèces</option>
                </select>
              </div>

              {formData.modePaiement === 'MVola' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Numéro MVola</label>
                  <input 
                    type="text" required
                    className="w-full p-2 border rounded-lg border-yellow-500"
                    placeholder="034XXXXXXX"
                    value={formData.numeroClient}
                    onChange={(e) => setFormData({...formData, numeroClient: e.target.value})}
                  />
                </div>
              )}

              <button 
                disabled={loading || !formData.idConsult}
                className="w-full bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-300"
              >
                {loading ? 'Traitement...' : 'Confirmer le règlement'}
              </button>
            </form>

            {message.text && (
              <div className={`mt-4 p-3 rounded text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {message.text}
              </div>
            )}
          </div>

          {/* --- TABLEAU --- */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="p-4">Patient</th>
                  <th className="p-4">Montant</th>
                  <th className="p-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paiements.map((p) => (
                  <tr key={p.idPaiement} className="text-sm">
                    <td className="p-4">
                      <div className="font-bold">{p.nom} {p.prenom}</div>
                      <div className="text-xs text-gray-400">#C{p.idConsult} - {new Date(p.datePaiement).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4 font-semibold">{p.montant} Ar</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${p.statut === 'REUSSI' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {p.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionPaiements;