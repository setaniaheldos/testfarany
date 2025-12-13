import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminAuth = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 🚨 CORRECTION CRITIQUE ICI : Utilisation de l'URL de base Nginx (Port 80/443 implicite)
  // Si vous utilisez un nom de domaine, remplacez l'IP.
  // Si votre application React est sur le même domaine/IP, vous pouvez utiliser une URL relative '/admins/login'
  const API_BASE_URL = 'http://82.165.15.45'; 
  
  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      // CORRECTION : Supprimer le port :3000 pour que Nginx (port 80) gère la requête
      const res = await axios.post(`${API_BASE_URL}/admins/login`, form); 
      
      setLoading(false);
      if (res.status === 200) {
        // Optionnel : stocker le token/statut admin ici (localStorage/Context)
        setSuccess('Connexion admin réussie !');
        setTimeout(() => {
          navigate('/action');
        }, 1200); 
      }
    } catch (err) {
      setLoading(false);
      console.error('Erreur API:', err);
      setError(
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : "Erreur d'authentification ou Serveur inaccessible (Vérifier Nginx)"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-300 to-blue-500 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 transition-all">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl border border-blue-200 max-w-sm w-full animate-fade-in-up transition-all duration-500"
      >
        <h2 className="text-2xl font-extrabold mb-6 text-blue-700 dark:text-blue-300 text-center animate-fade-in-down">
          Authentification Admin
        </h2>
        {error && (
          <div className="mb-4 px-3 py-2 bg-red-100 text-red-700 rounded animate-bounce text-center">{error}</div>
        )}
        {success && (
          <div className="mb-4 px-3 py-2 bg-green-100 text-green-700 rounded animate-fade-in-up text-center">{success}</div>
        )}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-blue-300 rounded-xl p-2 bg-gray-100 dark:bg-gray-800 focus:ring-2 focus:ring-blue-400 transition-all"
            autoFocus
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Mot de passe</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-blue-300 rounded-xl p-2 bg-gray-100 dark:bg-gray-800 focus:ring-2 focus:ring-blue-400 transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded-xl font-bold transition-all duration-300 ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow'
          } animate-fade-in-up`}
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
        <style>{`
          .animate-fade-in-up {
            animation: fadeInUp 0.7s;
          }
          .animate-fade-in-down {
            animation: fadeInDown 0.7s;
          }
          .animate-bounce {
            animation: bounce 1s;
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px);}
            to { opacity: 1; transform: translateY(0);}
          }
          @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-30px);}
            to { opacity: 1; transform: translateY(0);}
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0);}
            50% { transform: translateY(-8px);}
          }
        `}</style>
      </form>
    </div>
  );
};

export default AdminAuth;