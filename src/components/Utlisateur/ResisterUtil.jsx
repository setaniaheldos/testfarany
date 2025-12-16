import React, { useState } from 'react';
import axios from 'axios';
// Importez useNavigate si vous souhaitez rediriger après l'inscription
// import { useNavigate } from 'react-router-dom'; 

const ResisterUtil = () => {
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  // const navigate = useNavigate(); // Décommentez si vous utilisez la navigation

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.email || !form.password || !form.confirmPassword) {
      setError("Tous les champs sont requis.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('https://heldosseva.duckdns.org/register', {
        email: form.email,
        password: form.password,
      });
      setSuccess(res.data.message || "Inscription réussie ! Vous pouvez maintenant vous connecter.");
      setError('');
      setForm({ email: '', password: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 5000); // Masquer le message après 5s
      // navigate('/login'); // Rediriger l'utilisateur vers la page de connexion
    } catch (err) {
      setSuccess('');
      setError(
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : "Erreur lors de l'inscription. Veuillez réessayer."
      );
    }
    setLoading(false);
  };

  return (
    // ✨ Fond : Passage à un fond monochrome simple et élégant, inspiré du login
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <form
        onSubmit={handleSubmit}
        // ✨ Formulaire : Fond contrasté, coins très arrondis, ombre profonde et douce (comme le login)
        className="bg-white dark:bg-gray-800 p-8 sm:p-12 rounded-3xl shadow-2xl shadow-gray-400/30 dark:shadow-black/70 max-w-xs sm:max-w-sm w-full transition-all duration-500"
      >
        <div className="text-center mb-10">
          <h2 
            // ✨ Titre : Police très fine et épurée (comme le login)
            className="text-4xl font-extralight mb-2 text-gray-800 dark:text-gray-100 tracking-wider"
          >
            Créer un compte
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Rejoignez-nous en quelques étapes
          </p>
        </div>
        
        {/* ✨ Messages de statut : Design discret et élégant */}
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
            Adresse Email
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            // ✨ Input : Minimaliste (bordure basse, focus indigo subtil)
            className="w-full border-b border-gray-300 dark:border-gray-600 py-3 px-0 text-gray-900 dark:text-gray-100 bg-transparent placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-indigo-500 transition-colors text-base"
            placeholder="votre.email@exemple.com"
            autoFocus
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">
            Mot de passe
          </label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            // ✨ Input : Minimaliste (bordure basse, focus indigo subtil)
            className="w-full border-b border-gray-300 dark:border-gray-600 py-3 px-0 text-gray-900 dark:text-gray-100 bg-transparent placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-indigo-500 transition-colors text-base"
            placeholder="Nouveau mot de passe"
          />
        </div>

        <div className="mb-8">
          <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">
            Confirmer le mot de passe
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            // ✨ Input : Minimaliste (bordure basse, focus indigo subtil)
            className="w-full border-b border-gray-300 dark:border-gray-600 py-3 px-0 text-gray-900 dark:text-gray-100 bg-transparent placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-indigo-500 transition-colors text-base"
            placeholder="Confirmer votre mot de passe"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          // ✨ Bouton : Couleur indigo riche, arrondi complet, ombre sophistiquée (comme le login)
          className={`w-full py-3.5 rounded-full font-semibold text-base uppercase tracking-widest transition-all duration-300 transform ${
            loading
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/50 dark:shadow-indigo-900/40 hover:shadow-xl hover:shadow-indigo-500/60'
          }`}
        >
          {loading ? 'Inscription en cours...' : "S'INSCRIRE"}
        </button>
        
        <div className="text-center mt-6">
            {/* Ajout d'un lien pour revenir au Login */}
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Déjà un compte ? 
                <a 
                    href="/utilisateur-login" // Modifiez ceci avec votre route de connexion
                    className="ml-1 font-medium text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                >
                    Connectez-vous ici
                </a>
            </p>
        </div>
      </form>
    </div>
  );
};

export default ResisterUtil;