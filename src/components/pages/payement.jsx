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
  const [consultations, setConsultations] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [selectedConsult, setSelectedConsult] = useState('');
  const [modePaiement, setModePaiement] = useState('Espece');
  const [numeroClient, setNumeroClient] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [activeTab, setActiveTab] = useState('paiement');

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* En-tête avec statistiques */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Gestion des Paiements
          </h1>
          <p className="text-gray-600">
            Enregistrez et suivez les paiements des consultations
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Impayé</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {totalNonPaye.toLocaleString()} Ar
                  </p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <Clock className="h-6 w-6 text-red-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Collecté</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {totalPaye.toLocaleString()} Ar
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Consultations</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {consultations.length}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <User className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation par onglets */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-200 max-w-md">
            <button
              onClick={() => setActiveTab('paiement')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'paiement'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Nouveau Paiement
            </button>
            <button
              onClick={() => setActiveTab('historique')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'historique'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Historique
            </button>
            <button
              onClick={() => setActiveTab('impayes')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'impayes'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Impayés
            </button>
          </div>
        </div>

        {/* Message d'alerte */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-xl border ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center">
              <CheckCircle className={`h-5 w-5 mr-2 ${
                message.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`} />
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        )}

        {/* Onglet Nouveau Paiement */}
        {activeTab === 'paiement' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <CreditCard className="h-6 w-6 mr-2 text-blue-600" />
              Nouveau Paiement
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sélection consultation */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Consultation à payer
                </label>
                <select
                  value={selectedConsult}
                  onChange={(e) => setSelectedConsult(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white"
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

              {/* Prix sélectionné */}
              {consultSelectionnee && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-blue-700 font-medium">Patient sélectionné</p>
                      <p className="text-lg font-bold text-blue-900">
                        {consultSelectionnee.prenom} {consultSelectionnee.nom}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-700 font-medium">Montant à payer</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {consultSelectionnee.prix?.toLocaleString()} Ar
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mode de paiement */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Mode de paiement
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setModePaiement('Espece')}
                    className={`p-4 border rounded-xl flex items-center justify-center transition-all ${
                      modePaiement === 'Espece'
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg mr-3 ${
                        modePaiement === 'Espece' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <DollarSign className={`h-5 w-5 ${
                          modePaiement === 'Espece' ? 'text-blue-600' : 'text-gray-500'
                        }`} />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">Espèces</p>
                        <p className="text-xs text-gray-500">Paiement en cash</p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModePaiement('MVola')}
                    className={`p-4 border rounded-xl flex items-center justify-center transition-all ${
                      modePaiement === 'MVola'
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg mr-3 ${
                        modePaiement === 'MVola' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <Smartphone className={`h-5 w-5 ${
                          modePaiement === 'MVola' ? 'text-blue-600' : 'text-gray-500'
                        }`} />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">MVola</p>
                        <p className="text-xs text-gray-500">Paiement mobile</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Numéro MVola */}
              {modePaiement === 'MVola' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Numéro MVola du patient
                  </label>
                  <input
                    type="text"
                    value={numeroClient}
                    onChange={(e) => setNumeroClient(e.target.value)}
                    placeholder="034 12 345 67"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Format : 033xxxxxxx ou 034xxxxxxx (sans espace)
                  </p>
                </div>
              )}

              {/* Bouton de soumission */}
              <button
                type="submit"
                disabled={loading || !selectedConsult}
                className={`w-full py-4 rounded-xl text-white font-semibold transition-all flex items-center justify-center ${
                  loading || !selectedConsult
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Traitement en cours...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Enregistrer le paiement
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Onglet Historique des Paiements */}
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
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        ID Consult
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Mode
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paiements.map((p) => (
                      <tr key={p.idPaiement} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            #{p.idConsult}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 mr-3">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{p.prenom} {p.nom}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-green-700">
                            {p.montant?.toLocaleString()} Ar
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            p.modePaiement === 'MVola' 
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {p.modePaiement === 'MVola' ? (
                              <Smartphone className="h-3 w-3 mr-1" />
                            ) : (
                              <DollarSign className="h-3 w-3 mr-1" />
                            )}
                            {p.modePaiement}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            p.statut === 'validé' 
                              ? 'bg-green-100 text-green-800'
                              : p.statut === 'en attente'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {p.statut}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <CreditCard className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun paiement</h3>
                <p className="text-gray-500">Aucun paiement n'a été enregistré pour le moment.</p>
              </div>
            )}
          </div>
        )}

        {/* Onglet Consultations Impayées */}
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
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        ID Consult
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Montant dû
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {consultations.map((c) => (
                      <tr key={c.idConsult} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                            #{c.idConsult}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 mr-3">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{c.prenom} {c.nom}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-red-700">
                            {c.prix?.toLocaleString()} Ar
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              setSelectedConsult(c.idConsult.toString());
                              setActiveTab('paiement');
                            }}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Payer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tout est réglé !</h3>
                <p className="text-gray-500">Toutes les consultations sont payées.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaiementForm;