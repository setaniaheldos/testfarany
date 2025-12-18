import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CreditCard, 
  DollarSign, 
  Smartphone, 
  CheckCircle, 
  Clock,
  TrendingUp,
  User,
  Loader2
} from 'lucide-react';

const API_BASE = 'https://heldosseva.duckdns.org';

const PaiementForm = () => {
  const [consultations, setConsultations] = useState([]); // impayées
  const [paiements, setPaiements] = useState([]);        // historique
  const [selectedConsult, setSelectedConsult] = useState('');
  const [modePaiement, setModePaiement] = useState('Espece');
  const [numeroClient, setNumeroClient] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [activeTab, setActiveTab] = useState('paiement');

  // Chargement initial des données
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
      console.error("Erreur chargement données:", err);
      setMessage({ text: "Erreur lors du chargement des données. Vérifiez que le serveur est en marche.", type: "error" });
    }
  };

  const consultSelectionnee = consultations.find(c => c.idConsult === Number(selectedConsult));

  const totalNonPaye = consultations.reduce((sum, c) => sum + (c.prix || 0), 0);
  const totalPaye = paiements.reduce((sum, p) => sum + (p.montant || 0), 0);

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
      if (!/^03[2348]\d{7}$/.test(cleanedNum)) {
        setMessage({ text: "Numéro MVola invalide (doit commencer par 032, 033, 034 ou 038)", type: "error" });
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

      const successMsg = modePaiement === 'MVola'
        ? "Demande de paiement MVola envoyée ! Le client doit confirmer sur son téléphone."
        : res.data?.message || "Paiement en espèces enregistré avec succès";

      setMessage({ text: successMsg, type: "success" });

      // Rafraîchir les listes
      await fetchData();

      // Reset formulaire
      setSelectedConsult('');
      setNumeroClient('');
      setModePaiement('Espece');

    } catch (err) {
      const errorMsg = err.response?.data?.error || "Erreur lors du paiement. Réessayez.";
      setMessage({ text: errorMsg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Affichage lisible du statut
  const getStatutDisplay = (statut) => {
    switch (statut) {
      case 'REUSSI': return { text: 'Réussi', color: 'bg-green-100 text-green-800' };
      case 'EN_ATTENTE': return { text: 'En attente', color: 'bg-yellow-100 text-yellow-800' };
      default: return { text: statut || 'Inconnu', color: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">

        {/* En-tête avec stats */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestion des Paiements</h1>
          <p className="text-gray-600">Enregistrez et suivez les paiements des consultations</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Impayé</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{totalNonPaye.toLocaleString()} Ar</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg"><Clock className="h-6 w-6 text-red-500" /></div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Collecté</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{totalPaye.toLocaleString()} Ar</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg"><TrendingUp className="h-6 w-6 text-green-500" /></div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Consultations Impayées</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{consultations.length}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg"><User className="h-6 w-6 text-blue-500" /></div>
              </div>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-200 max-w-md">
            <button onClick={() => setActiveTab('paiement')} className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'paiement' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}>
              Nouveau Paiement
            </button>
            <button onClick={() => setActiveTab('historique')} className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'historique' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}>
              Historique
            </button>
            <button onClick={() => setActiveTab('impayes')} className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'impayes' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}>
              Impayés
            </button>
          </div>
        </div>

        {/* Message d'alerte */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            <div className="flex items-center">
              <CheckCircle className={`h-5 w-5 mr-2 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        )}

        {/* === ONGLET NOUVEAU PAIEMENT === */}
        {activeTab === 'paiement' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <CreditCard className="h-6 w-6 mr-2 text-blue-600" />
              Nouveau Paiement
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sélection consultation */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Consultation à payer</label>
                <select
                  value={selectedConsult}
                  onChange={(e) => setSelectedConsult(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                  required
                >
                  <option value="">-- Sélectionner une consultation --</option>
                  {consultations.map(c => (
                    <option key={c.idConsult} value={c.idConsult}>
                      #{c.idConsult} - {c.prenom} {c.nom} - {c.prix?.toLocaleString()} Ar
                    </option>
                  ))}
                </select>
              </div>

              {/* Infos consultation sélectionnée */}
              {consultSelectionnee && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-blue-700 font-medium">Patient</p>
                      <p className="text-lg font-bold text-blue-900">{consultSelectionnee.prenom} {consultSelectionnee.nom}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-700 font-medium">Montant à payer</p>
                      <p className="text-2xl font-bold text-blue-900">{consultSelectionnee.prix?.toLocaleString()} Ar</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mode de paiement */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Mode de paiement</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button type="button" onClick={() => setModePaiement('Espece')}
                    className={`p-5 border-2 rounded-xl flex items-center justify-center transition-all ${modePaiement === 'Espece' ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-100' : 'border-gray-300 hover:border-gray-400'}`}>
                    <div className="flex items-center">
                      <div className={`p-3 rounded-lg mr-4 ${modePaiement === 'Espece' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <DollarSign className={`h-6 w-6 ${modePaiement === 'Espece' ? 'text-blue-600' : 'text-gray-500'}`} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Espèces</p>
                        <p className="text-sm text-gray-500">Paiement en cash</p>
                      </div>
                    </div>
                  </button>

                  <button type="button" onClick={() => setModePaiement('MVola')}
                    className={`p-5 border-2 rounded-xl flex items-center justify-center transition-all ${modePaiement === 'MVola' ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-100' : 'border-gray-300 hover:border-gray-400'}`}>
                    <div className="flex items-center">
                      <div className={`p-3 rounded-lg mr-4 ${modePaiement === 'MVola' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <Smartphone className={`h-6 w-6 ${modePaiement === 'MVola' ? 'text-blue-600' : 'text-gray-500'}`} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">MVola</p>
                        <p className="text-sm text-gray-500">Paiement mobile</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Numéro MVola */}
              {modePaiement === 'MVola' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Numéro MVola du patient</label>
                  <input
                    type="text"
                    value={numeroClient}
                    onChange={(e) => setNumeroClient(e.target.value)}
                    placeholder="034 12 345 67"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required={modePaiement === 'MVola'}
                  />
                  <p className="text-xs text-gray-500 mt-2">Ex: 032, 033, 034 ou 038 suivi de 7 chiffres</p>
                </div>
              )}

              {/* Bouton submit */}
              <button
                type="submit"
                disabled={loading || !selectedConsult}
                className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center ${
                  loading || !selectedConsult
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg'
                }`}
              >
                {loading ? (
                  <> <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Traitement en cours... </>
                ) : (
                  <> <CreditCard className="h-5 w-5 mr-2" /> Enregistrer le paiement </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* === ONGLET HISTORIQUE === */}
        {activeTab === 'historique' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <CheckCircle className="h-6 w-6 mr-2 text-green-600" />
              Historique des Paiements
            </h2>

            {paiements.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ID Consult</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Patient</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Montant</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Mode</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paiements.map((p) => {
                      const statutInfo = getStatutDisplay(p.statut);
                      return (
                        <tr key={p.idPay || p.idPaiement} className="hover:bg-gray-50">
                          <td className="px-6 py-4"><span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">#{p.idConsult}</span></td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3"><User className="h-5 w-5 text-gray-600" /></div>
                              <p className="font-medium">{p.prenom} {p.nom}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-green-700">{p.montant?.toLocaleString()} Ar</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center ${p.modePaiement === 'MVola' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                              {p.modePaiement === 'MVola' ? <Smartphone className="h-4 w-4 mr-1" /> : <DollarSign className="h-4 w-4 mr-1" />}
                              {p.modePaiement}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statutInfo.color}`}>
                              {statutInfo.text}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <CreditCard className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <p>Aucun paiement enregistré pour le moment.</p>
              </div>
            )}
          </div>
        )}

        {/* === ONGLET IMPAYÉS === */}
        {activeTab === 'impayes' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <Clock className="h-6 w-6 mr-2 text-red-600" />
              Consultations Impayées
            </h2>

            {consultations.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ID Consult</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Patient</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Montant dû</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {consultations.map((c) => (
                      <tr key={c.idConsult} className="hover:bg-gray-50">
                        <td className="px-6 py-4"><span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">#{c.idConsult}</span></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3"><User className="h-5 w-5 text-gray-600" /></div>
                            <p className="font-medium">{c.prenom} {c.nom}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-red-700">{c.prix?.toLocaleString()} Ar</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              setSelectedConsult(c.idConsult.toString());
                              setActiveTab('paiement');
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center text-sm font-medium"
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Payer maintenant
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Tout est réglé !</h3>
                <p>Toutes les consultations sont payées.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaiementForm;