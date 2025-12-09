import React, { useState } from 'react';
import axios from 'axios';

<<<<<<< HEAD
const ResisterUtil = () => {
=======
const RegisterUtil = () => {
>>>>>>> af5a4e5bafbd26c01f14bfaaa7adc6c3a19af5d9
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

<<<<<<< HEAD
=======
  // Tableau de phrases de succès aléatoires pour varier les messages
  const successMessages = [
    "🎉 Félicitations ! Votre compte a été créé avec succès. Bienvenue dans notre communauté !",
    "✅ Inscription réussie ! Vous pouvez maintenant vous connecter et explorer nos fonctionnalités.",
    "✨ Votre compte est prêt. Rejoignez-nous et commencez votre aventure dès aujourd'hui !",
    "🎊 Bravo pour votre inscription ! Un email de confirmation a été envoyé à votre adresse.",
    "🚀 Compte créé avec succès. Connectez-vous pour accéder à votre tableau de bord personnalisé."
  ];

>>>>>>> af5a4e5bafbd26c01f14bfaaa7adc6c3a19af5d9
  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

<<<<<<< HEAD
=======
  /**
   * Fonction pour envoyer uniquement l'email à Web3Forms après l'inscription réussie.
   */
  const sendToWeb3Forms = async (email) => {
    // La clé d'accès de votre formulaire Web3Forms
    const ACCESS_KEY = "aedd80be-dc02-4fba-8499-8a0ca2ab4d12"; 

    const formData = new FormData();
    formData.append("access_key", ACCESS_KEY);
    formData.append("subject", "Nouvelle inscription");
    formData.append("message", `Une nouvelle inscription a été effectuée avec l'email : ${email}`);
    formData.append("Email_Inscrit", email);

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!data.success) {
        console.error("Erreur Web3Forms:", data);
      } else {
        console.log("Notification de nouvelle inscription envoyée à Web3Forms avec succès:", email);
      }
    } catch (error) {
      console.error("Erreur réseau lors de l'envoi à Web3Forms:", error);
    }
  };

  /**
   * Gère la soumission principale du formulaire.
   */
>>>>>>> af5a4e5bafbd26c01f14bfaaa7adc6c3a19af5d9
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
<<<<<<< HEAD
=======

    // 1. Validation du formulaire
>>>>>>> af5a4e5bafbd26c01f14bfaaa7adc6c3a19af5d9
    if (!form.email || !form.password) {
      setError("Email et mot de passe requis");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
<<<<<<< HEAD
    setLoading(true);
    try {
=======

    setLoading(true);

    try {
      // 2. Envoi des données à votre propre backend
>>>>>>> af5a4e5bafbd26c01f14bfaaa7adc6c3a19af5d9
      const res = await axios.post('http://localhost:3001/register', {
        email: form.email,
        password: form.password,
      });
<<<<<<< HEAD
      setSuccess(res.data.message || "Inscription réussie !");
      setError('');
      setForm({ email: '', password: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 3000); // Masquer le message après 3s
    } catch (err) {
=======

      // 3. Tâche post-inscription : Envoi de l'email à Web3Forms (non-bloquant)
      sendToWeb3Forms(form.email); 

      // 4. Affichage d'une phrase de succès aléatoire (priorité au message backend, sinon aléatoire)
      const randomSuccessMessage = successMessages[Math.floor(Math.random() * successMessages.length)];
      setSuccess(res.data.message || randomSuccessMessage);
      setError('');
      setForm({ email: '', password: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 5000); // Augmenté à 5 secondes pour lire les phrases complètes

    } catch (err) {
      // 5. Gestion de l'erreur
>>>>>>> af5a4e5bafbd26c01f14bfaaa7adc6c3a19af5d9
      setSuccess('');
      setError(
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : "Erreur lors de l'inscription"
      );
    }
<<<<<<< HEAD
=======

>>>>>>> af5a4e5bafbd26c01f14bfaaa7adc6c3a19af5d9
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-300 to-blue-500 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 transition-all">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl border border-blue-200 max-w-sm w-full animate-fade-in-up transition-all duration-500"
      >
<<<<<<< HEAD
        <h2 className="text-2xl font-extrabold mb-6 text-blue-700 dark:text-blue-300 text-center animate-fade-in-down">
          Inscription Utilisateur
        </h2>
=======
        <h2 className="text-2xl font-extrabold mb-2 text-blue-700 dark:text-blue-300 text-center animate-fade-in-down">
          Inscription Utilisateur
        </h2>
        <p className="text-sm mb-6 text-gray-500 dark:text-gray-400 text-center animate-fade-in-down">
          Rejoignez notre communauté en quelques secondes !
        </p>

>>>>>>> af5a4e5bafbd26c01f14bfaaa7adc6c3a19af5d9
        {error && (
          <div className="mb-4 px-3 py-2 bg-red-100 text-red-700 rounded animate-bounce text-center">{error}</div>
        )}
        {success && (
<<<<<<< HEAD
          <div className="mb-4 px-3 py-2 bg-green-100 text-green-700 rounded animate-fade-in-up text-center">{success}</div>
        )}
=======
          <div className="mb-4 px-3 py-2 bg-green-100 text-green-700 rounded animate-fade-in-up text-center whitespace-pre-line">{success}</div>
        )}
        
>>>>>>> af5a4e5bafbd26c01f14bfaaa7adc6c3a19af5d9
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
        <div className="mb-4">
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
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Confirmer le mot de passe</label>
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
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
          {loading ? 'Inscription...' : "S'inscrire"}
        </button>
<<<<<<< HEAD
=======

        <p className="mt-4 text-sm text-center text-gray-700 dark:text-gray-300">
            Déjà un compte ? 
            <a href="/login" className="font-medium text-blue-600 hover:text-blue-500 ml-1">Connectez-vous.</a>
        </p>

>>>>>>> af5a4e5bafbd26c01f14bfaaa7adc6c3a19af5d9
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

<<<<<<< HEAD
export default ResisterUtil;
=======
export default RegisterUtil;
>>>>>>> af5a4e5bafbd26c01f14bfaaa7adc6c3a19af5d9
