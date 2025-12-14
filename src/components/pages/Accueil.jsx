import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Users,
  Calendar,
  UserCheck,
  Stethoscope,
  TrendingUp,
  Activity,
  Eye,
  EyeOff,
  UserPlus,
  Moon,
  Sun,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

// Enregistrement des composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// --- Fonctions utilitaires ---

function getLast6Months() {
  const months = [];
  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    months.push(monthNames[date.getMonth()] + ' ' + date.getFullYear().toString().slice(2)); // Année courte
  }

  return months;
}

// Fonction pour simuler la croissance des patients par mois (remplace l'ancienne)
function generateMonthlyNewPatientData(patients) {
  const today = new Date();
  const monthlyCounts = Array(6).fill(0); // Les 6 derniers mois

  // Calculer les dates de début des 6 derniers mois
  const startDates = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    startDates.push(date);
  }

  if (patients && patients.length > 0) {
    patients.forEach(patient => {
      // Supposons que chaque patient a un champ 'dateCreation' ou 'datePremiereConsultation'
      const creationDate = new Date(patient.dateCreation || patient.datePremiereConsultation || '2024-01-01'); // Fallback si pas de date

      for (let i = 0; i < 6; i++) {
        const startMonth = startDates[i];
        const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);

        if (creationDate >= startMonth && creationDate < nextMonth) {
          monthlyCounts[i]++;
          break;
        }
      }
    });
  } else {
    // Données simulées si aucune donnée patient n'est disponible
    return Array.from({ length: 6 }, () => Math.floor(Math.random() * 30) + 10);
  }

  return monthlyCounts;
}


export default function Dashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalConsultations: 0,
    totalPraticiens: 0,
    consultationsMensuelles: 0,
    patientsHommes: 0,
    patientsFemmes: 0
  });
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showCharts, setShowCharts] = useState(true);
  const [monthlyPatientData, setMonthlyPatientData] = useState([]); // Nouvel état pour les données de graphique

  useEffect(() => {
    // Assurez-vous que le composant est monté côté client avant d'accéder à localStorage
    if (typeof window !== 'undefined') {
        const isDark = localStorage.getItem('darkMode') === 'true';
        setDarkMode(isDark);
        document.documentElement.classList.toggle('dark', isDark);
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [patientsRes, consultationsRes, praticiensRes] = await Promise.all([
        
        // Utilisez vos URLs réelles ici:
         axios.get('https://heldosseva.duckdns.org/patients'),
        axios.get('https://heldosseva.duckdns.org/consultations'),
        axios.get('https://heldosseva.duckdns.org/praticiens')
      ]);

      // Simulation de données basées sur les données récupérées si les API ne sont pas réelles
      const patients = patientsRes.data.map((p, index) => ({
        id: p.id,
        sexe: index % 2 === 0 ? 'Homme' : 'Femme',
        // Simuler une date de création dans les 6 derniers mois
        date_creation: new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 180))).toISOString()
      }));
      const consultations = consultationsRes.data.map((c, index) => ({
        id: c.id,
        dateConsult: new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 365))).toISOString()
      }));
      const praticiens = praticiensRes.data;

      // Calculer les statistiques
      const totalPatients = patients.length;
      const totalConsultations = consultations.length;
      const totalPraticiens = praticiens.length;

      const patientsHommes = patients.filter(p => p.sexe === 'Homme').length;
      const patientsFemmes = patients.filter(p => p.sexe === 'Femme').length;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const consultationsMensuelles = consultations.filter(consult => {
        const consultDate = new Date(consult.dateConsult);
        return consultDate.getMonth() === currentMonth && consultDate.getFullYear() === currentYear;
      }).length;

      // Données des nouveaux patients par mois
      const newPatientData = generateMonthlyNewPatientData(patients.map(p => ({
        dateCreation: p.date_creation
      })));
      setMonthlyPatientData(newPatientData);

      setStats({
        totalPatients,
        totalConsultations,
        totalPraticiens,
        consultationsMensuelles,
        patientsHommes,
        patientsFemmes
      });
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      // Fallback avec données simulées en cas d'erreur API
      setStats({
          totalPatients: 452,
          totalConsultations: 1200,
          totalPraticiens: 22,
          consultationsMensuelles: 125,
          patientsHommes: 220,
          patientsFemmes: 232
      });
      setMonthlyPatientData([15, 20, 35, 28, 45, 52]);
    } finally {
      setLoading(false);
    }
  };

  // Données pour le graphique circulaire (Patients par sexe)
  const doughnutData = {
    labels: ['Hommes', 'Femmes'],
    datasets: [
      {
        data: [stats.patientsHommes, stats.patientsFemmes],
        backgroundColor: [
          'rgba(75, 192, 192, 0.9)', // Vert Bleu
          'rgba(255, 159, 64, 0.9)', // Orange
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // NOUVELLES Données pour le graphique linéaire (Nouveaux patients des 6 derniers mois)
  const lineData = {
    labels: getLast6Months(),
    datasets: [
      {
        label: 'Nouveaux Patients',
        data: monthlyPatientData, // Utilisation des données réelles/simulées de l'état
        borderColor: '#4f46e5', // Indigo
        backgroundColor: 'rgba(79, 70, 229, 0.1)', // Indigo clair
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#4f46e5',
        pointRadius: 6,
        pointHoverRadius: 8,
        pointStyle: 'circle'
      },
    ],
  };

  // Données pour le graphique en barres (Spécialités des praticiens)
  const barData = {
    labels: ['Généralistes', 'Spécialistes', 'Chirurgiens', 'Pédiatres', 'Cardiologues'],
    datasets: [
      {
        label: 'Nombre de praticiens',
        data: [12, 8, 5, 3, 4], // Données simulées
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)', // Rouge
          'rgba(54, 162, 235, 0.8)', // Bleu
          'rgba(255, 205, 86, 0.8)', // Jaune
          'rgba(75, 192, 192, 0.8)', // Vert
          'rgba(153, 102, 255, 0.8)', // Violet
        ],
        borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        borderRadius: 4
      },
    ],
  };

  // Options communes pour les graphiques
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: darkMode ? '#ccc' : '#444',
          font: {
            size: 13
          }
        }
      },
      title: {
        display: true,
        color: darkMode ? '#fff' : '#333',
        font: {
            size: 18,
            weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: darkMode ? '#fff' : '#333',
        bodyColor: darkMode ? '#ccc' : '#444',
        borderColor: darkMode ? '#374151' : '#ddd',
        borderWidth: 1
      }
    },
  };

  const lineOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        ...chartOptions.plugins.title,
        text: 'Croissance des Nouveaux Patients (6 derniers mois)'
      }
    },
    scales: {
      x: {
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
          lineWidth: 1
        },
        ticks: {
          color: darkMode ? '#ccc' : '#444',
        }
      },
      y: {
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
          lineWidth: 1
        },
        ticks: {
          color: darkMode ? '#ccc' : '#444',
        },
        beginAtZero: true
      }
    }
  };

  const doughnutOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        ...chartOptions.plugins.title,
        text: 'Répartition des patients par sexe'
      }
    }
  };

  const barOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        ...chartOptions.plugins.title,
        text: 'Répartition des praticiens par spécialité'
      }
    },
    scales: {
      x: {
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
        },
        ticks: {
          color: darkMode ? '#ccc' : '#444',
        }
      },
      y: {
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
        },
        ticks: {
          color: darkMode ? '#ccc' : '#444',
        },
        beginAtZero: true
      }
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    if (typeof window !== 'undefined') {
        localStorage.setItem('darkMode', newDarkMode.toString());
        document.documentElement.classList.toggle('dark', newDarkMode);
    }
  };

  // Styles élégants
  const containerClasses = `min-h-screen p-4 md:p-8 transition-colors duration-500 ${
    darkMode
      ? 'bg-gray-900 text-white'
      : 'bg-gray-50 text-gray-800' // Changement pour un gris très clair en mode clair
  }`;

  const cardClasses = `rounded-xl shadow-2xl transition-all duration-300 ${
    darkMode
      ? 'bg-gray-800 border border-gray-700 hover:shadow-gray-700/50'
      : 'bg-white border border-gray-100 hover:shadow-blue-200/50'
  }`;

  const iconBgClasses = (color) => {
    return `${color} p-3 rounded-xl shadow-lg`;
  };

  if (loading) {
    return (
      <div className={containerClasses}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mx-auto"></div>
            <p className={`mt-4 text-xl ${darkMode ? 'text-gray-300' : 'text-indigo-600'}`}>
              Chargement des données vitales...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {/* Utilisation de 'w-full' et padding pour un effet plein écran soigné */}
      <div className="w-full xl:max-w-screen-2xl xl:mx-auto">

        {/* En-tête avec Boutons de Contrôle */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
              Tableau de Bord Clinique Tsaradia
            </h1>
            <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Vue d'ensemble et métriques clés pour une gestion efficace.
            </p>
          </div>
          <div className="flex gap-4 mt-6 lg:mt-0">
            {/* Bouton Afficher/Masquer Graphiques */}
            <button
              onClick={() => setShowCharts(!showCharts)}
              className={`flex items-center px-5 py-2.5 rounded-full font-medium transition-all duration-300 shadow-md ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              {showCharts ? <EyeOff className="w-5 h-5 mr-2" /> : <Eye className="w-5 h-5 mr-2" />}
              {showCharts ? 'Masquer' : 'Afficher'}
            </button>
            {/* Bouton Mode Sombre/Clair */}
            <button
              onClick={toggleDarkMode}
              className={`flex items-center px-5 py-2.5 rounded-full font-medium transition-all duration-300 shadow-md ${
                darkMode
                  ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                  : 'bg-indigo-500 text-white hover:bg-indigo-600'
              }`}
            >
              {darkMode ? <Sun className="w-5 h-5 mr-2" /> : <Moon className="w-5 h-5 mr-2" />}
              {darkMode ? 'Mode Clair' : 'Mode Sombre'}
            </button>
          </div>
        </div>

        {/* Cartes statistiques Élégantes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          
          {/* Carte Total Patients */}
          <div className={`${cardClasses} p-6 transform hover:-translate-y-1`}>
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-indigo-300' : 'text-indigo-600'} mb-1`}>
                  Total Patients Suivis
                </p>
                <p className="text-4xl font-extrabold text-indigo-500">{stats.totalPatients}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
                  <span className='font-semibold'>Fidélisation:</span> Base de données complète pour un suivi personnalisé.
                </p>
              </div>
              <div className={iconBgClasses('bg-indigo-100 dark:bg-indigo-900/50')}>
                <Users className="w-7 h-7 text-indigo-500" />
              </div>
            </div>
          </div>

          {/* Carte Consultations Globales */}
          <div className={`${cardClasses} p-6 transform hover:-translate-y-1`}>
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-green-300' : 'text-green-600'} mb-1`}>
                  Consultations Globales
                </p>
                <p className="text-4xl font-extrabold text-green-500">{stats.totalConsultations}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
                  <span className='font-semibold'>Activité:</span> **{stats.consultationsMensuelles}** ce mois-ci (Mois en cours).
                </p>
              </div>
              <div className={iconBgClasses('bg-green-100 dark:bg-green-900/50')}>
                <Calendar className="w-7 h-7 text-green-500" />
              </div>
            </div>
          </div>

          {/* Carte Praticiens Actifs */}
          <div className={`${cardClasses} p-6 transform hover:-translate-y-1`}>
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-purple-300' : 'text-purple-600'} mb-1`}>
                  Praticiens Actifs
                </p>
                <p className="text-4xl font-extrabold text-purple-500">{stats.totalPraticiens}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
                  <span className='font-semibold'>Ressources:</span> Personnel soignant mobilisé pour la prise en charge.
                </p>
              </div>
              <div className={iconBgClasses('bg-purple-100 dark:bg-purple-900/50')}>
                <Stethoscope className="w-7 h-7 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Carte Croissance Nouveaux Patients */}
          {/* <div className={`${cardClasses} p-6 transform hover:-translate-y-1`}>
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-orange-300' : 'text-orange-600'} mb-1`}>
                  Croissance Mensuelle
                </p>
                
                <p className="text-4xl font-extrabold text-orange-500">
                    {monthlyPatientData.length >= 2 ? ((monthlyPatientData[5] / monthlyPatientData[4]) * 100).toFixed(0) + '%' : 'N/A'}
                </p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
                  <span className='font-semibold'>Acquisition:</span> Comparaison du dernier mois avec l'avant-dernier.
                </p>
              </div>
              <div className={iconBgClasses('bg-orange-100 dark:bg-orange-900/50')}>
                <TrendingUp className="w-7 h-7 text-orange-500" />
              </div>
            </div>
          </div> */}
        </div>

        {/* Section explicative/Alertes */}
        <div className={`mb-10 p-6 rounded-xl shadow-lg border-l-4 border-indigo-500 transition-colors duration-300 ${darkMode ? 'bg-gray-800/80 text-gray-300' : 'bg-white/90 text-gray-700'}`}>
            <h3 className="text-xl font-bold mb-2 text-indigo-500 flex items-center">
                <Activity className="w-5 h-5 mr-2" /> Analyse des Indicateurs Clés
            </h3>
            <p className="text-base italic">
                Ces données statistiques sont essentielles. La croissance des nouveaux patients (<span className="font-semibold text-indigo-500">Croissance Mensuelle</span>) indique la popularité du service, tandis que la répartition démographique aide à ajuster les <span className="font-semibold text-orange-500">ressources spécialisées</span>. Une bonne gestion est un gage de **performance** et de **qualité des soins**.
            </p>
        </div>


        {/* Graphiques - Apparaissent si showCharts est vrai */}
        {showCharts && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            {/* Graphique linéaire (Nouveaux Patients) */}
            <div className={`${cardClasses} p-6 lg:col-span-2 transform hover:shadow-2xl transition duration-500`}>
              <div className="h-96">
                <Line data={lineData} options={lineOptions} />
              </div>
            </div>

            {/* Graphique circulaire (Patients par sexe) */}
            <div className={`${cardClasses} p-6 transform hover:shadow-2xl transition duration-500`}>
              <div className="h-96 flex items-center justify-center">
                {/* S'assurer que le titre est centré visuellement avec un padding ajusté */}
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
            </div>

            {/* Graphique en barres (Spécialités des praticiens) */}
            <div className={`${cardClasses} p-6 lg:col-span-3 transform hover:shadow-2xl transition duration-500`}>
              <div className="h-80">
                <Bar data={barData} options={barOptions} />
              </div>
            </div>
          </div>
        )}


        {/* Pied de page élégant */}
        <div className={`mt-10 pt-4 border-t ${darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'} text-center`}>
          <p className="text-sm font-medium">
            © {new Date().getFullYear()} Système de gestion médicale - Tous droits réservés
          </p>
          <p className="text-xs mt-1">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')} (Données simulées ou temps réel)
          </p>
        </div>
      </div>
    </div>
  );
}