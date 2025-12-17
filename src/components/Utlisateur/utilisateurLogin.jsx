import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const UtilisateurLogin = ({ onLogin }) => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('https://heldosseva.duckdns.org/login', form);
      setLoading(false);
      // Connexion réussie, masquer NavbarAdmin et afficher Navbar
      if (onLogin) onLogin();
      navigate('/accueil');
    } catch (err) {
      setLoading(false);
      setError(
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : "Erreur de connexion"
      );
    }
  };

  return (
    // ✨ Fond : Passage à un fond gris très subtil ou sombre, centré
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <form
        onSubmit={handleSubmit}
        // ✨ Formulaire : Fond très contrasté, coins très arrondis, ombre profonde et douce, taille plus compacte
        className="bg-white dark:bg-gray-800 p-8 sm:p-12 rounded-3xl shadow-2xl shadow-gray-400/30 dark:shadow-black/70 max-w-xs sm:max-w-sm w-full transition-all duration-500"
      >
        <div className="text-center mb-10">
          <h2 
            // ✨ Titre : Police très fine et épurée
            className="text-4xl font-extralight mb-2 text-gray-800 dark:text-gray-100 tracking-wider"
          >
            Se connecter
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Accédez à votre compte
          </p>
        </div>
        
        {error && (
          // ✨ Erreur : Plus de padding, couleur rouge bordeaux discrète
          <div className="mb-6 px-3 py-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700 rounded-lg text-sm text-center font-medium transition-opacity duration-500">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">
            Adresse Email
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            // ✨ Input : Minimaliste, bordure très fine, focus avec un anneau indigo subtil
            className="w-full border-b border-gray-300 dark:border-gray-600 py-3 px-0 text-gray-900 dark:text-gray-100 bg-transparent placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-indigo-500 transition-colors text-base"
            placeholder="votre.email@exemple.com"
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
            // ✨ Input : Minimaliste, bordure très fine, focus avec un anneau indigo subtil
            className="w-full border-b border-gray-300 dark:border-gray-600 py-3 px-0 text-gray-900 dark:text-gray-100 bg-transparent placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-indigo-500 transition-colors text-base"
            placeholder="Mot de passe"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          // ✨ Bouton : Couleur indigo riche, effet de survol et désactivation doux, texte en majuscules pour le style
          className={`w-full py-3.5 rounded-full font-semibold text-base uppercase tracking-widest transition-all duration-300 transform ${
            loading
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/50 dark:shadow-indigo-900/40 hover:shadow-xl hover:shadow-indigo-500/60'
          }`}
        >
          {loading ? 'Connexion en cours...' : 'CONNEXION'}
        </button>

        <div className="text-center mt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Si vous n'avez pas de compte ? 
                <a 
                    href="/utilisateur" // Modifiez ceci avec votre route de connexion
                    className="ml-1 font-medium text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                >
                    Inscrivez-vous ici
                </a>
            </p>
        </div>
      </form>
    </div>
  );
};

export default UtilisateurLogin;