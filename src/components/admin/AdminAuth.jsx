import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminAuth = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // URL de base (gardée car elle est critique pour l'API)
  const API_BASE_URL = 'https://heldosseva.duckdns.org'; 
  
  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      // CORRECTION : S'assurer que l'URL est correcte pour le backend Admin
      const res = await axios.post(`${API_BASE_URL}/admins/login`, form); 
      
      setLoading(false);
      if (res.status === 200) {
        setSuccess('Connexion admin réussie ! Redirection...');
        // Stocker le statut ou le token admin ici
        setTimeout(() => {
          navigate('/action'); // Rediriger vers le tableau de bord admin
        }, 1200); 
      }
    } catch (err) {
      setLoading(false);
      console.error('Erreur API:', err);
      setError(
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : "Erreur d'authentification ou Serveur inaccessible"
      );
    }
  };

  return (
    // ✨ Fond : Le même fond gris/sombre, élégant et minimaliste
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <form
        onSubmit={handleSubmit}
        // ✨ Formulaire : Fond contrasté, coins très arrondis, ombre profonde et douce
        className="bg-white dark:bg-gray-800 p-8 sm:p-12 rounded-3xl shadow-2xl shadow-gray-400/30 dark:shadow-black/70 max-w-xs sm:max-w-sm w-full transition-all duration-500"
      >
        <div className="text-center mb-10">
          <h2 
            // ✨ Titre : Police très fine et épurée. Utilisation du texte Purple/Violet.
            className="text-4xl font-extralight mb-2 text-gray-800 dark:text-gray-100 tracking-wider"
          >
            Espace Admin
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Accès sécurisé
          </p>
        </div>
        
        {/* Messages de statut : Design discret */}
        {error && (
          <div className="mb-6 px-3 py-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700 rounded-lg text-sm text-center font-medium transition-opacity duration-500">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 px-3 py-2 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700 rounded-lg text-sm text-center font-medium transition-opacity duration-500">
            {success}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">
            Email Admin
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            // ✨ Input : Minimaliste (bordure basse, focus PURPLE subtil)
            className="w-full border-b border-gray-300 dark:border-gray-600 py-3 px-0 text-gray-900 dark:text-gray-100 bg-transparent placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-purple-500 transition-colors text-base"
            placeholder="admin@domaine.com"
            autoFocus
          />
        </div>

        <div className="mb-8">
          <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">
            Mot de passe
          </label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            // ✨ Input : Minimaliste (bordure basse, focus PURPLE subtil)
            className="w-full border-b border-gray-300 dark:border-gray-600 py-3 px-0 text-gray-900 dark:text-gray-100 bg-transparent placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-purple-500 transition-colors text-base"
            placeholder="Mot de passe secret"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          // ✨ Bouton : Couleur PURPLE riche, arrondi complet, ombre sophistiquée
          className={`w-full py-3.5 rounded-full font-semibold text-base uppercase tracking-widest transition-all duration-300 transform ${
            loading
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500 text-white shadow-lg shadow-purple-500/50 dark:shadow-purple-900/40 hover:shadow-xl hover:shadow-purple-500/60'
          }`}
        >
          {loading ? 'Connexion en cours...' : 'CONNEXION ADMIN'}
        </button>
      </form>
    </div>
  );
};

export default AdminAuth;