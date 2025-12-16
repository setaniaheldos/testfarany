import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const AdminAction = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Couleur principale Admin: Purple (Violet)
  const ADMIN_COLOR = 'purple';
  const API_BASE_URL = 'https://heldosseva.duckdns.org';

  // Charger les utilisateurs en attente
  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/users/pending`);
      setPendingUsers(res.data);
    } catch (err) {
      setMessage("Erreur lors du chargement des utilisateurs.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  // Valider un utilisateur
  const approveUser = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/users/${id}/approve`);
      setMessage("Utilisateur validé avec succès !");
      setPendingUsers(pendingUsers.filter(u => u.id !== id));
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage("Erreur lors de la validation.");
    }
  };

  // Refuser/supprimer un utilisateur
  const deleteUser = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/users/${id}`);
      setMessage("Utilisateur supprimé.");
      setPendingUsers(pendingUsers.filter(u => u.id !== id));
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage("Erreur lors de la suppression.");
    }
  };

  return (
    // ✨ Conteneur : Fond global clair/sombre, conteneur central avec ombre élégante
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center py-12 px-4">
      <div className="max-w-4xl w-full bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl shadow-gray-400/30 dark:shadow-black/70 transition-all">
        
        <h2 
          // ✨ Titre : Police fine et couleur Admin (Purple)
          className={`text-3xl font-light mb-8 text-${ADMIN_COLOR}-600 dark:text-${ADMIN_COLOR}-400 text-center tracking-wider`}
        >
          Panneau de Validation des Utilisateurs
        </h2>
        
        <div className="mb-8 flex justify-between items-center">
          <button
            onClick={fetchPendingUsers}
            // ✨ Bouton de rafraîchissement
            className={`px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors`}
          >
            Rafraîchir
          </button>
          <Link
            to="/admindas"
            // ✨ Bouton de lien : Couleur Admin (Purple), arrondi complet, ombre douce
            className={`px-4 py-2 rounded-full bg-${ADMIN_COLOR}-600 text-white font-semibold hover:bg-${ADMIN_COLOR}-700 shadow-lg shadow-${ADMIN_COLOR}-500/50 transition-all transform hover:scale-[1.01]`}
          >
            Aller au Dashboard
          </Link>
        </div>

        {/* ✨ Messages de statut : Design discret et élégant */}
        {message && (
          <div className={`mb-6 px-4 py-3 bg-${ADMIN_COLOR}-100 dark:bg-${ADMIN_COLOR}-900/40 text-${ADMIN_COLOR}-700 dark:text-${ADMIN_COLOR}-300 border border-${ADMIN_COLOR}-300 dark:border-${ADMIN_COLOR}-700 rounded-lg text-sm text-center font-medium transition-opacity duration-500`}>
            {message}
          </div>
        )}
        
        {loading ? (
          <div className={`text-center py-10 text-${ADMIN_COLOR}-500 dark:text-${ADMIN_COLOR}-400 font-medium`}>
            Chargement des utilisateurs en attente...
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400 font-medium border-t border-gray-200 dark:border-gray-700 pt-8">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p>Aucun utilisateur n'est en attente de validation.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr className={`bg-${ADMIN_COLOR}-50 dark:bg-${ADMIN_COLOR}-900/40`}>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider rounded-tl-lg">
                    ID Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider rounded-tr-lg">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {pendingUsers.map(user => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {user.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-center space-x-3">
                        {/* Bouton Valider (Vert) */}
                        <button
                          onClick={() => approveUser(user.id)}
                          className="px-4 py-2 rounded-full bg-green-600 text-white font-semibold text-xs hover:bg-green-700 transition-all shadow-md hover:shadow-lg"
                        >
                          Valider
                        </button>
                        {/* Bouton Refuser (Rouge) */}
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="px-4 py-2 rounded-full bg-red-600 text-white font-semibold text-xs hover:bg-red-700 transition-all shadow-md hover:shadow-lg"
                        >
                          Refuser
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAction;