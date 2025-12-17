import React, { useState, useEffect } from 'react';

const GestionPaiements = () => {
  const [paiements, setPaiements] = useState([]);
  const [consultationsDisponibles, setConsultationsDisponibles] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    idConsult: '',
    montant: '',
    modePaiement: 'MVola',
    numeroClient: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  // 1. Charger les données (Paiements, Stats et Consultations non payées)
  const fetchData = async () => {
    try {
      const [resPaiements, resStats, resConsults] = await Promise.all([
        fetch('http://localhost:5000/api/paiements'),
        fetch('http://localhost:5000/api/paiements/stats'),
        fetch('http://localhost:5000/api/consultations/non-payees')
      ]);
      
      setPaiements(await resPaiements.json());
      setStats(await resStats.json());
      setConsultationsDisponibles(await resConsults.json());
    } catch (err) {
      console.error("Erreur de chargement:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Gérer le changement de consultation dans la Combobox
  const handleConsultChange = (id) => {
    const selected = consultationsDisponibles.find(c => c.idConsult === parseInt(id));
    setFormData({
      ...formData,
      idConsult: id,
      montant: selected ? selected.prix : '' // Remplit le prix auto
    });
  };

  // 3. Soumission du paiement
  const handlePaiement = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('http://localhost:5000/api/paiements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: formData.modePaiement === 'MVola' 
            ? "Demande MVola envoyée ! En attente de validation client." 
            : "Paiement en espèces enregistré avec succès." 
        });
        setFormData({ idConsult: '', montant: '', modePaiement: 'MVola', numeroClient: '' });
        fetchData(); // Rafraîchir tout
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
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Gestion de la Caisse</h1>

        {/* --- STATISTIQUES --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-600 text-white p-4 rounded-xl shadow-md">
            <p className="text-sm opacity-80">Total Recettes (Réussis)</p>
            <p className="text-2xl font-bold">
                {stats.filter(s => s.statut === 'REUSSI')
                      .reduce((acc, curr) => acc + curr.total, 0)
                      .toLocaleString()} Ar
            </p>
          </div>
          {stats.map((s, i) => (
            <div key={i} className="bg-white p-4 rounded-xl shadow-sm border-b-4 border-yellow-500">
              <p className="text-xs text-gray-500 uppercase font-semibold">{s.modePaiement} - {s.statut}</p>
              <p className="text-xl font-bold text-gray-800">{s.total.toLocaleString()} Ar</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- FORMULAIRE --- */}
          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Encaisser</h2>
            
            <form onSubmit={handlePaiement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Consultation en attente</label>
                <select 
                  required
                  className="w-full p-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.idConsult}
                  onChange={(e) => handleConsultChange(e.target.value)}
                >
                  <option value="">-- Sélectionner --</option>
                  {consultationsDisponibles.map(c => (
                    <option key={c.idConsult} value={c.idConsult}>
                      N°{c.idConsult} - {c.nomPatient} {c.prenom} ({c.prix} Ar)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Montant à payer (Ar)</label>
                <input 
                  type="number" readOnly
                  className="w-full p-2 border rounded-lg bg-gray-50 font-bold text-gray-700"
                  value={formData.montant}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Mode de règlement</label>
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
                  <label className="block text-sm font-medium text-gray-600 mb-1">Numéro MVola</label>
                  <input 
                    type="text" required
                    className="w-full p-2 border rounded-lg border-yellow-400 focus:ring-yellow-400"
                    placeholder="0340000000"
                    value={formData.numeroClient}
                    onChange={(e) => setFormData({...formData, numeroClient: e.target.value})}
                  />
                </div>
              )}

              <button 
                disabled={loading || !formData.idConsult}
                className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
                  loading || !formData.idConsult ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-lg'
                }`}
              >
                {loading ? 'Traitement...' : 'Confirmer le règlement'}
              </button>
            </form>

            {message.text && (
              <div className={`mt-4 p-3 rounded-lg text-sm border ${
                message.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'
              }`}>
                {message.text}
              </div>
            )}
          </div>

          {/* --- TABLEAU HISTORIQUE --- */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-700">Derniers Paiements</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="p-4">Patient</th>
                    <th className="p-4">Montant</th>
                    <th className="p-4">Mode / Statut</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paiements.length === 0 && (
                    <tr><td colSpan="4" className="p-4 text-center text-gray-400">Aucun paiement enregistré</td></tr>
                  )}
                  {paiements.map((p) => (
                    <tr key={p.idPaiement} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-gray-800">{p.nom} {p.prenom}</div>
                        <div className="text-xs text-gray-400 italic">Consultation #{p.idConsult}</div>
                      </td>
                      <td className="p-4 font-semibold text-gray-700">{p.montant.toLocaleString()} Ar</td>
                      <td className="p-4">
                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold mr-2 ${
                          p.modePaiement === 'MVola' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {p.modePaiement}
                        </span>
                        <span className={`text-[10px] font-bold ${
                          p.statut === 'REUSSI' ? 'text-green-500' : p.statut === 'EN_ATTENTE' ? 'text-orange-400' : 'text-red-500'
                        }`}>
                          ● {p.statut}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-500">
                        {new Date(p.datePaiement).toLocaleDateString()}<br/>
                        {new Date(p.datePaiement).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GestionPaiements;