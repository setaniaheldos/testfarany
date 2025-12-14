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
    // ✨ Changement : Fond plus subtil et monochrome (gris clair)
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-all">
      <form
        onSubmit={handleSubmit}
        // ✨ Changement : Utilisation d'un fond blanc pur ou d'un gris foncé pour l'élégance, bordures plus douces, ombre subtile
        className="bg-white dark:bg-gray-800 p-10 rounded-xl shadow-2xl shadow-gray-300/50 dark:shadow-black/50 max-w-sm w-full transition-all duration-500 transform hover:shadow-xl"
      >
        <h2 
          // ✨ Changement : Police plus simple, couleur noire/gris foncé ou blanc cassé, moins d'emphase sur l'animation du titre
          className="text-3xl font-light mb-8 text-gray-800 dark:text-gray-100 text-center tracking-wide"
        >
          Bienvenue
        </h2>
        {error && (
          // ✨ Changement : Message d'erreur plus discret, couleur bordeaux élégante
          <div className="mb-6 px-4 py-3 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700 rounded-lg text-sm text-center transition-opacity duration-500">
            {error}
          </div>
        )}
        <div className="mb-5">
          <label className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            // ✨ Changement : Design d'input minimaliste (bordure fine, pas de fond gris distinctif), focus élégant
            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-gray-100 bg-transparent focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:focus:ring-indigo-600 transition-colors"
            autoFocus
          />
        </div>
        <div className="mb-8">
          <label className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">Mot de passe</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            // ✨ Changement : Design d'input minimaliste (bordure fine, pas de fond gris distinctif), focus élégant
            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-gray-100 bg-transparent focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:focus:ring-indigo-600 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          // ✨ Changement : Bouton avec une couleur primaire sophistiquée (Indigo ou Bleu nuit), ombre plus douce, police plus légère
          className={`w-full py-3 rounded-lg font-medium text-lg transition-all duration-300 tracking-wider transform hover:scale-[1.01] ${
            loading
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white shadow-md shadow-indigo-300/50 dark:shadow-indigo-900/50'
          }`}
        >
          {loading ? 'Vérification...' : 'Se connecter'}
        </button>
        {/* Suppression du bloc <style> et intégration des animations par défaut de Tailwind ou suppression pour un look plus statique et élégant. */}
      </form>
    </div>
  );
};

export default UtilisateurLogin;