import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Shield, Users, Trash2, Loader, CheckCircle, Clock, PlusCircle, ChevronDown, ChevronUp } from 'lucide-react';

const AdminDashboard = () => {
  // Données
  const [admins, setAdmins] = useState([]);
  const [users, setUsers] = useState([]);
  
  // États de chargement et message
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [message, setMessage] = useState('');

  // États pour la fonctionnalité "Voir Plus"
  const [showAllAdmins, setShowAllAdmins] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);
  
  // Détermination du mode sombre pour un style adaptatif
  const [darkMode] = useState(
    // Pour la démonstration, on suppose que l'état darkMode est géré ailleurs, 
    // mais la logique suivante est la plus sûre si vous n'avez pas de gestion centralisée.
    typeof window !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );
  
  const API_BASE_URL = 'https://heldosseva.duckdns.org';
  const displayMessage = (msg, duration = 3000) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), duration);
  };

  // --- Chargement des données ---
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/admins`);
        setAdmins(res.data);
      } catch (e) {
        // En cas d'erreur de l'API réelle, utilisez un jeu de données minimal
        setAdmins(Array.from({ length: 3 }, (_, i) => ({ 
          id: i + 1, 
          email: i === 0 ? 'super.admin@api-fail.com' : `admin${i + 1}@api-fail.com`
        })));
        displayMessage("Avertissement: Impossible de charger les admins depuis l'API. Affichage des données de secours.", 5000);
      } finally {
        setLoadingAdmins(false);
      }
    };

    const fetchUserData = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/users`);
        setUsers(res.data);
      } catch (e) {
        setUsers(Array.from({ length: 4 }, (_, i) => ({ 
          id: i + 101, 
          email: `user${i + 1}@api-fail.com`, 
          isApproved: i % 2 === 0 
        })));
        displayMessage("Avertissement: Impossible de charger les utilisateurs depuis l'API. Affichage des données de secours.", 5000);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchAdminData();
    fetchUserData();
  }, []);

  // --- Logique de suppression d'Admin (CORRIGÉE) ---
  const handleDeleteAdmin = async (id, idx) => {
    if (idx === 0) {
      displayMessage("Action refusée : Le premier administrateur est non supprimable.", 3000);
      return;
    }
    if (!window.confirm("CONFIRMATION : Voulez-vous vraiment supprimer cet administrateur ?")) return;

    try {
      // 1. DÉCOMMENTER L'APPEL À L'API
      await axios.delete(`${API_BASE_URL}/admins/${id}`); 
      
      // 2. MISE À JOUR DE L'ÉTAT LOCAL (UNIQUEMENT APRÈS SUCCÈS API)
      setAdmins(admins.filter(a => a.id !== id));
      displayMessage("Admin supprimé avec succès.", 3000);
    } catch (error) {
      // 3. GESTION DES ERREURS API PLUS PRÉCISE
      const errorMsg = error.response?.data?.message || "Erreur inconnue lors de la suppression de l'admin.";
      displayMessage(`Erreur API: ${errorMsg}`, 5000);
    }
  };

  // --- Logique de suppression d'Utilisateur (CORRIGÉE) ---
  const handleDeleteUser = async (id) => {
    if (!window.confirm("CONFIRMATION : Voulez-vous vraiment supprimer cet utilisateur ?")) return;

    try {
      // 1. DÉCOMMENTER L'APPEL À L'API
      await axios.delete(`${API_BASE_URL}/users/${id}`); 
      
      // 2. MISE À JOUR DE L'ÉTAT LOCAL (UNIQUEMENT APRÈS SUCCÈS API)
      setUsers(users.filter(u => u.id !== id));
      displayMessage("Utilisateur supprimé avec succès.", 3000);
    } catch (error) {
      // 3. GESTION DES ERREURS API PLUS PRÉCISE
      const errorMsg = error.response?.data?.message || "Erreur inconnue lors de la suppression de l'utilisateur.";
      displayMessage(`Erreur API: ${errorMsg}`, 5000);
    }
  };

  // --- Variables et Fonctions de Rendu (inchangées) ---
  
  const MAX_ITEMS = 5;
  const displayAdmins = showAllAdmins ? admins : admins.slice(0, MAX_ITEMS);
  const displayUsers = showAllUsers ? users : users.slice(0, MAX_ITEMS);

  const cardClasses = `bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl transition-all duration-300 ${
    darkMode ? 'border border-gray-700' : 'border border-gray-100 hover:shadow-2xl'
  }`;
  
  const rowClasses = (idx) => 
    `transition-colors duration-200 ${
      idx % 2 === 0 
      ? 'bg-gray-50 dark:bg-gray-700/50' 
      : 'bg-white dark:bg-gray-800/50' 
    } hover:bg-indigo-50 dark:hover:bg-gray-700`;

  const LoadingIndicator = ({ label }) => (
    <div className={`text-center py-4 flex items-center justify-center ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
      <Loader className="w-5 h-5 animate-spin mr-2" />
      {label}
    </div>
  );
  
  const ToggleButton = ({ isShowingAll, totalItems, toggleFunction }) => {
    if (totalItems <= MAX_ITEMS) return null;
    
    return (
      <button
        onClick={toggleFunction}
        className="w-full mt-4 py-2 flex items-center justify-center text-sm font-semibold rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors duration-300"
      >
        {isShowingAll ? (
          <>
            <ChevronUp className="w-4 h-4 mr-2" />
            Voir moins
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4 mr-2" />
            Voir les {totalItems - MAX_ITEMS} autres entrées
          </>
        )}
      </button>
    );
  };

  // --- Rendu final (inchangé) ---
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} py-10`}>
      <div className="max-w-6xl mx-auto">
        <div className={cardClasses}>
          <h2 className={`text-4xl font-extrabold mb-10 text-center ${darkMode ? 'text-indigo-400' : 'text-indigo-700'} flex items-center justify-center gap-3`}>
            <Shield className="w-8 h-8" />
            Portail de Gestion Administrateur
          </h2>
          
          {/* Message de notification */}
          {message && (
            <div className={`mb-6 px-4 py-3 ${message.includes('Erreur') || message.includes('Action refusée') ? 'bg-red-100 dark:bg-red-800/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700' : 'bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700'} rounded-lg text-center font-semibold shadow-md transition-opacity duration-500 animate-fadeIn`}>
              {message}
            </div>
          )}
          
          <div className="mb-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
            
            {/* Tableau des administrateurs */}
            <div className="lg:col-span-1">
              <h3 className={`text-2xl font-bold mb-5 ${darkMode ? 'text-gray-200' : 'text-gray-700'} border-b pb-2 border-indigo-200 dark:border-gray-700`}>
                <Shield className="w-5 h-5 inline mr-2 text-indigo-500" />
                Liste des Administrateurs ({admins.length})
              </h3>
              
              {loadingAdmins ? (
                <LoadingIndicator label="Chargement des administrateurs..." />
              ) : admins.length === 0 ? (
                <div className="text-gray-500 text-center py-4 italic">Aucun administrateur trouvé.</div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-lg shadow-lg border dark:border-gray-700/50">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-indigo-500 dark:bg-indigo-700 text-white uppercase text-xs tracking-wider">
                          <th className="p-3 text-left">Email</th>
                          <th className="p-3 text-center">Rôle</th>
                          <th className="p-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayAdmins.map((admin, idx) => (
                          <tr key={admin.id} className={rowClasses(idx)}>
                            <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{admin.email}</td>
                            <td className="p-3 text-center">
                              {idx === 0 ? (
                                <span className="text-indigo-500 font-bold">Principal</span>
                              ) : (
                                <span className="text-gray-500 dark:text-gray-400">Secondaire</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {idx === 0 ? (
                                <span className="text-gray-400 italic text-xs">Non modifiable</span>
                              ) : (
                                <button
                                  onClick={() => handleDeleteAdmin(admin.id, idx)}
                                  className="inline-flex items-center px-3 py-1.5 rounded-full bg-red-500 text-white font-medium text-xs hover:bg-red-600 transition-all shadow-md shadow-red-500/30"
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Supprimer
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <ToggleButton 
                    isShowingAll={showAllAdmins} 
                    totalItems={admins.length} 
                    toggleFunction={() => setShowAllAdmins(prev => !prev)} 
                  />
                </>
              )}
            </div>

            {/* Tableau des utilisateurs */}
            <div className="lg:col-span-1">
              <h3 className={`text-2xl font-bold mb-5 ${darkMode ? 'text-gray-200' : 'text-gray-700'} border-b pb-2 border-indigo-200 dark:border-gray-700`}>
                <Users className="w-5 h-5 inline mr-2 text-indigo-500" />
                Comptes Utilisateurs ({users.length})
              </h3>
              
              {loadingUsers ? (
                <LoadingIndicator label="Chargement des utilisateurs..." />
              ) : users.length === 0 ? (
                <div className="text-gray-500 text-center py-4 italic">Aucun utilisateur trouvé.</div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-lg shadow-lg border dark:border-gray-700/50">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-indigo-500 dark:bg-indigo-700 text-white uppercase text-xs tracking-wider">
                          <th className="p-3 text-left">Email</th>
                          <th className="p-3 text-center">Statut</th>
                          <th className="p-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayUsers.map((user, idx) => (
                          <tr key={user.id} className={rowClasses(idx)}>
                            <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{user.email}</td>
                            <td className="p-3 text-center">
                              {user.isApproved ? (
                                <span className="inline-flex items-center text-green-600 dark:text-green-400 font-semibold text-xs bg-green-100 dark:bg-green-900/50 px-2 py-0.5 rounded-full">
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Validé
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-yellow-600 dark:text-yellow-400 font-semibold text-xs bg-yellow-100 dark:bg-yellow-900/50 px-2 py-0.5 rounded-full">
                                  <Clock className="w-3.5 h-3.5 mr-1" /> En attente
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="inline-flex items-center px-3 py-1.5 rounded-full bg-red-500 text-white font-medium text-xs hover:bg-red-600 transition-all shadow-md shadow-red-500/30"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1" /> Supprimer
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <ToggleButton 
                    isShowingAll={showAllUsers} 
                    totalItems={users.length} 
                    toggleFunction={() => setShowAllUsers(prev => !prev)} 
                  />
                </>
              )}
            </div>
          </div>
          
          {/* Section des actions rapides */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700/50 mt-4">
            <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Actions Rapides</h3>
            <div className="flex flex-wrap justify-center gap-4">
              
              {/* Aller à l'accueil */}
              <Link
                to="/accueil"
                className="inline-flex items-center px-6 py-2 rounded-full bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-all duration-300 shadow-lg shadow-indigo-500/40"
              >
                <Users className="w-5 h-5 mr-2" />
                Espace Patient (Accueil)
              </Link>
              
              {/* Ajouter un admin */}
              <Link
                to="/authen"
                className="inline-flex items-center px-6 py-2 rounded-full bg-green-500 text-white font-semibold hover:bg-green-600 transition-all duration-300 shadow-lg shadow-green-500/40"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Créer un Nouvel Admin
              </Link>
              
              {/* Approuver un utilisateur */}
              <Link
                to="/action"
                className="inline-flex items-center px-6 py-2 rounded-full bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-all duration-300 shadow-lg shadow-amber-500/40"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Gérer les Approbations
              </Link>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
            animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;