import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from "xlsx";
import { 
  Plus, Search, Edit2, Trash2, ChevronUp, ChevronDown, RefreshCw, Check, X, 
  CalendarCheck, CalendarX, Clock4, Download, User, Stethoscope, Filter, 
  Eye, Calendar, Users, FileText, Phone, AlertCircle, CheckCircle, XCircle, Clock,
  Moon, Sun, Mail, MapPin
} from 'lucide-react';

export default function Rendezvous() {
  const [rdvs, setRdvs] = useState([]);
  const [patients, setPatients] = useState([]);
  const [praticiens, setPraticiens] = useState([]);
  const [selectedRdv, setSelectedRdv] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [form, setForm] = useState({
    idRdv: null,
    cinPatient: '',
    cinPraticien: '',
    dateHeure: '',
    statut: 'en_attente',
    idRdvParent: '',
    notes: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [search, setSearch] = useState({ patient: '', praticien: '', statut: '' });
  const [activeFilter, setActiveFilter] = useState('tous');
  const [sortField, setSortField] = useState('dateHeure');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Appliquer le mode sombre
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // === Notifications ===
  const notify = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), type === 'error' ? 4000 : 3000);
  };

  // === Chargement des données ===
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [rdvRes, patRes, pratRes] = await Promise.all([
        axios.get('https://heldosseva.duckdns.org/rendezvous'),
        axios.get('https://heldosseva.duckdns.org/patients'),
        axios.get('https://heldosseva.duckdns.org/praticiens')
      ]);
      setRdvs(rdvRes.data);
      setPatients(patRes.data);
      setPraticiens(pratRes.data);
    } catch (err) {
      notify("Erreur de connexion à l'API", 'error');
    } finally {
      setLoading(false);
    }
  };

  // === Gestion du formulaire ===
  const resetForm = () => {
    setForm({
      idRdv: null,
      cinPatient: '',
      cinPraticien: '',
      dateHeure: '',
      statut: 'en_attente',
      idRdvParent: '',
      notes: ''
    });
    setIsEditing(false);
  };

  const toggleForm = () => {
    if (showAddForm) {
      setShowAddForm(false);
      resetForm();
    } else {
      resetForm();
      setShowAddForm(true);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (new Date(form.dateHeure) < new Date()) {
      notify("La date du rendez-vous ne peut pas être dans le passé", 'error');
      return;
    }

    const url = isEditing
      ? `https://heldosseva.duckdns.org/rendezvous/${form.idRdv}`
      : 'https://heldosseva.duckdns.org/rendezvous';

    const method = isEditing ? 'put' : 'post';

    try {
      await axios[method](url, form);
      notify(isEditing ? "Rendez-vous modifié !" : "Rendez-vous créé !");
      fetchAllData();
      setShowAddForm(false);
      resetForm();
    } catch (err) {
      notify("Erreur lors de l'enregistrement", 'error');
    }
  };

  const handleEdit = (rdv) => {
    const formattedDate = rdv.dateHeure
      ? new Date(rdv.dateHeure).toISOString().slice(0, 16)
      : '';

    setForm({
      ...rdv,
      dateHeure: formattedDate
    });
    setIsEditing(true);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce rendez-vous ?")) return;

    try {
      await axios.delete(`https://heldosseva.duckdns.org/rendezvous/${id}`);
      notify("Rendez-vous supprimé");
      fetchAllData();
    } catch (err) {
      notify("Erreur suppression", 'error');
    }
  };

  const handleQuickStatusUpdate = async (id, newStatus) => {
    try {
      await axios.put(`https://heldosseva.duckdns.org/rendezvous/${id}`, { statut: newStatus });
      notify(`Rendez-vous ${newStatus === 'confirme' ? 'confirmé' : 'annulé'} !`);
      fetchAllData();
    } catch (err) {
      notify("Erreur lors de la mise à jour", 'error');
    }
  };

  const showDetails = (rdv) => {
    setSelectedRdv(rdv);
    setShowDetailModal(true);
  };

  // === Recherche & Tri ===
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // MODIFICATION: Fonctions améliorées pour gérer les cas sans CIN
  const getPatientInfo = (cin) => {
    if (!cin || cin.trim() === '') {
      return { 
        fullName: 'Patient non assigné', 
        tel: '', 
        email: '', 
        nom: 'Non', 
        prenom: 'assigné',
        adresse: ''
      };
    }
    
    const p = patients.find(p => p.cinPatient === cin);
    if (p) {
      return { 
        ...p, 
        fullName: `${p.nom || ''} ${p.prenom || ''}`.trim() || 'Nom inconnu'
      };
    }
    
    // Chercher par ID si CIN non trouvé
    const pById = patients.find(p => p.idPatient && p.idPatient.toString() === cin);
    if (pById) {
      return { 
        ...pById, 
        fullName: `${pById.nom || ''} ${pById.prenom || ''}`.trim() || 'Nom inconnu'
      };
    }
    
    return { 
      fullName: 'Patient inconnu', 
      tel: '', 
      email: '', 
      nom: 'Inconnu', 
      prenom: '',
      adresse: ''
    };
  };

  const getPraticienInfo = (cin) => {
    if (!cin || cin.trim() === '') {
      return { 
        fullName: 'Praticien non assigné', 
        specialite: '', 
        nom: 'Non', 
        prenom: 'assigné',
        tel: '',
        email: ''
      };
    }
    
    const pr = praticiens.find(pr => pr.cinPraticien === cin);
    if (pr) {
      return { 
        ...pr, 
        fullName: `Dr ${pr.nom || ''} ${pr.prenom || ''}`.trim() || 'Dr Nom inconnu'
      };
    }
    
    // Chercher par ID si CIN non trouvé
    const prById = praticiens.find(pr => pr.idPraticien && pr.idPraticien.toString() === cin);
    if (prById) {
      return { 
        ...prById, 
        fullName: `Dr ${prById.nom || ''} ${prById.prenom || ''}`.trim() || 'Dr Nom inconnu'
      };
    }
    
    return { 
      fullName: 'Praticien inconnu', 
      specialite: '', 
      nom: 'Inconnu', 
      prenom: '',
      tel: '',
      email: ''
    };
  };

  // Filtrage et tri
  const filteredRdvs = rdvs
    .filter(r => {
      const patientInfo = getPatientInfo(r.cinPatient);
      const praticienInfo = getPraticienInfo(r.cinPraticien);
      
      const patientMatch = patientInfo.fullName.toLowerCase().includes(search.patient.toLowerCase());
      const praticienMatch = praticienInfo.fullName.toLowerCase().includes(search.praticien.toLowerCase());
      const statutMatch = search.statut === '' || r.statut === search.statut;
      const filterMatch = activeFilter === 'tous' || r.statut === activeFilter;
      
      return patientMatch && praticienMatch && statutMatch && filterMatch;
    })
    .sort((a, b) => {
      let aVal = a[sortField] ?? '';
      let bVal = b[sortField] ?? '';

      if (sortField === 'dateHeure') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  const totalPages = Math.ceil(filteredRdvs.length / perPage);
  const paginatedRdvs = filteredRdvs.slice((page - 1) * perPage, page * perPage);

  // Statistiques
  const stats = {
    tous: rdvs.length,
    en_attente: rdvs.filter(r => r.statut === 'en_attente').length,
    confirme: rdvs.filter(r => r.statut === 'confirme').length,
    annule: rdvs.filter(r => r.statut === 'annule').length,
    aujourdhui: rdvs.filter(r => {
      const rdvDate = new Date(r.dateHeure).toDateString();
      const today = new Date().toDateString();
      return rdvDate === today;
    }).length
  };

  // === Export Excel ===
  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      const data = filteredRdvs.map(r => {
        const patientInfo = getPatientInfo(r.cinPatient);
        const praticienInfo = getPraticienInfo(r.cinPraticien);
        
        return {
          'ID': r.idRdv,
          'Patient': patientInfo.fullName,
          'Téléphone Patient': patientInfo.tel || '-',
          'Email Patient': patientInfo.email || '-',
          'Praticien': praticienInfo.fullName,
          'Spécialité': praticienInfo.specialite || '-',
          'Date': new Date(r.dateHeure).toLocaleDateString('fr-FR'),
          'Heure': new Date(r.dateHeure).toLocaleTimeString('fr-FR'),
          'Statut': r.statut === 'confirme' ? 'Confirmé' : r.statut === 'annule' ? 'Annulé' : 'En attente',
          'Notes': r.notes || '-',
          'Parent': r.idRdvParent || '-'
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Rendez-vous");
      XLSX.writeFile(wb, `rendezvous_${new Date().toISOString().split('T')[0]}.xlsx`);
      notify("Export Excel réussi !");
    } catch (err) {
      notify("Erreur lors de l'export", 'error');
    } finally {
      setExportLoading(false);
    }
  };

  // === Classes CSS conditionnelles pour le mode sombre ===
  const containerClasses = `min-h-screen transition-colors duration-300 ${
    darkMode 
      ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100' 
      : 'bg-gradient-to-br from-blue-50 to-cyan-50 text-gray-800'
  }`;

  const cardClasses = `rounded-xl shadow-sm border transition-all duration-300 backdrop-blur-sm ${
    darkMode 
      ? 'bg-gray-800/80 border-gray-700' 
      : 'bg-white/80 border-gray-200'
  }`;

  const inputClasses = `rounded-lg border focus:outline-none focus:ring-1 transition-all duration-300 text-sm ${
    darkMode
      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
  }`;

  const statutStyle = (s) => {
    const baseStyles = "px-2 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 transition-all duration-200";
    
    const styles = {
      confirme: `${baseStyles} ${
        darkMode 
          ? 'bg-emerald-900/20 text-emerald-300 border-emerald-800' 
          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      }`,
      annule: `${baseStyles} ${
        darkMode 
          ? 'bg-red-900/20 text-red-300 border-red-800' 
          : 'bg-red-50 text-red-700 border-red-200'
      }`,
      en_attente: `${baseStyles} ${
        darkMode 
          ? 'bg-amber-900/20 text-amber-300 border-amber-800' 
          : 'bg-amber-50 text-amber-700 border-amber-200'
      }`
    };
    
    return styles[s] || styles.en_attente;
  };

  const filterButtonStyle = (filter) => {
    const baseStyles = "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2";
    
    if (activeFilter === filter) {
      const activeStyles = {
        tous: `${baseStyles} ${
          darkMode 
            ? 'bg-blue-600 text-white shadow-lg' 
            : 'bg-blue-500 text-white shadow-sm'
        }`,
        en_attente: `${baseStyles} ${
          darkMode 
            ? 'bg-amber-600 text-white shadow-lg' 
            : 'bg-amber-500 text-white shadow-sm'
        }`,
        confirme: `${baseStyles} ${
          darkMode 
            ? 'bg-emerald-600 text-white shadow-lg' 
            : 'bg-emerald-500 text-white shadow-sm'
        }`,
        annule: `${baseStyles} ${
          darkMode 
            ? 'bg-red-600 text-white shadow-lg' 
            : 'bg-red-500 text-white shadow-sm'
        }`
      };
      return activeStyles[filter];
    }
    
    return `${baseStyles} ${
      darkMode 
        ? 'bg-gray-700/80 text-gray-300 border border-gray-600 hover:bg-gray-600' 
        : 'bg-white/80 text-gray-700 border border-gray-200 hover:bg-gray-50'
    }`;
  };

  const buttonStyle = (color = 'blue') => {
    const colors = {
      blue: `bg-blue-500 hover:bg-blue-600 ${darkMode ? 'text-white' : 'text-white'}`,
      green: `bg-emerald-500 hover:bg-emerald-600 ${darkMode ? 'text-white' : 'text-white'}`,
      purple: `bg-purple-500 hover:bg-purple-600 ${darkMode ? 'text-white' : 'text-white'}`,
      gray: `bg-gray-500 hover:bg-gray-600 ${darkMode ? 'text-white' : 'text-white'}`
    };
    return `${colors[color]} text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm shadow-sm transition-colors`;
  };

  const StatCard = ({ title, value, icon, color, onClick }) => (
    <div 
      onClick={onClick}
      className={`${cardClasses} p-4 transition-all duration-200 cursor-pointer ${onClick ? 'hover:scale-105' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs font-medium mb-1 ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {title}
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${
          darkMode 
            ? `bg-${color}-900/30 text-${color}-400` 
            : `bg-${color}-100 text-${color}-600`
        }`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const StatutIcon = ({ s, size = 12 }) => {
    const icons = {
      confirme: <CheckCircle className={`w-${size} h-${size}`} />,
      annule: <XCircle className={`w-${size} h-${size}`} />,
      en_attente: <Clock className={`w-${size} h-${size}`} />
    };
    return icons[s] || icons.en_attente;
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 inline opacity-30" />;
    return sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />;
  };

  return (
    <div className={containerClasses}>
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white font-medium flex items-center gap-2 transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-emerald-500' 
            : 'bg-red-500'
        }`}>
          {notification.type === 'success' ? 
            <CheckCircle className="w-4 h-4" /> : 
            <AlertCircle className="w-4 h-4" />
          }
          {notification.message}
        </div>
      )}

      {/* Header compact */}
      <div className={darkMode ? 'bg-gray-800/80 backdrop-blur-sm border-b border-gray-700/50' : 'bg-white/80 backdrop-blur-sm border-b border-white/20'}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
                📅 Rendez-vous
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredRdvs.length} rendez-vous trouvés
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Aujourd'hui</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.aujourdhui}</p>
              </div>
              <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  darkMode 
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-gray-900 hover:from-yellow-300 hover:to-amber-300' 
                    : 'bg-gradient-to-r from-gray-800 to-gray-900 text-white hover:from-gray-700 hover:to-gray-800'
                }`}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="w-full px-6 py-4">

        {/* Cartes de statistiques compactes */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <StatCard 
            title="Total" 
            value={stats.tous} 
            icon={<Users className="w-4 h-4" />} 
            color="blue"
            onClick={() => setActiveFilter('tous')}
          />
          <StatCard 
            title="En attente" 
            value={stats.en_attente} 
            icon={<Clock4 className="w-4 h-4" />} 
            color="amber"
            onClick={() => setActiveFilter('en_attente')}
          />
          <StatCard 
            title="Confirmés" 
            value={stats.confirme} 
            icon={<CalendarCheck className="w-4 h-4" />} 
            color="emerald"
            onClick={() => setActiveFilter('confirme')}
          />
          <StatCard 
            title="Annulés" 
            value={stats.annule} 
            icon={<CalendarX className="w-4 h-4" />} 
            color="red"
            onClick={() => setActiveFilter('annule')}
          />
        </div>

        {/* Barre d'actions compacte */}
        <div className={`${cardClasses} p-4 mb-4`}>
          <div className="flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setActiveFilter('tous')} className={filterButtonStyle('tous')}>
                Tous
              </button>
              <button onClick={() => setActiveFilter('en_attente')} className={filterButtonStyle('en_attente')}>
                <Clock4 className="w-3 h-3" /> En attente
              </button>
              <button onClick={() => setActiveFilter('confirme')} className={filterButtonStyle('confirme')}>
                <CalendarCheck className="w-3 h-3" /> Confirmés
              </button>
              <button onClick={() => setActiveFilter('annule')} className={filterButtonStyle('annule')}>
                <CalendarX className="w-3 h-3" /> Annulés
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <div className="relative flex-1 min-w-[200px]">
                <Search className={`absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 ${
                  darkMode ? 'text-gray-400' : 'text-gray-400'
                }`} />
                <input
                  type="text"
                  placeholder="Rechercher patient..."
                  className={`${inputClasses} w-full pl-7 pr-3 py-2`}
                  value={search.patient}
                  onChange={(e) => setSearch({ ...search, patient: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={toggleForm} 
                  className={buttonStyle('blue')}
                >
                  {showAddForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  {showAddForm ? 'Fermer' : 'Nouveau'}
                </button>
                <button 
                  onClick={handleExportExcel} 
                  disabled={exportLoading}
                  className={buttonStyle('green')}
                >
                  <Download className="w-3 h-3" /> 
                  {exportLoading ? '...' : 'Excel'}
                </button>
                <button 
                  onClick={fetchAllData} 
                  className={buttonStyle('purple')}
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Formulaire compact */}
        {showAddForm && (
          <div className={`${cardClasses} p-4 mb-4`}>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1 bg-blue-500 rounded">
                <CalendarCheck className="w-4 h-4 text-white" />
              </div>
              <h3 className={`text-lg font-semibold ${
                darkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                {isEditing ? 'Modifier RDV' : 'Nouveau RDV'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <select 
                  name="cinPatient" 
                  value={form.cinPatient} 
                  onChange={handleChange} 
                  required 
                  className={inputClasses}
                >
                  <option value="" disabled>Sélectionner un patient...</option>
                  {patients.map(p => (
                    <option key={p.cinPatient || p.idPatient} value={p.cinPatient || p.idPatient}>
                      {p.nom} {p.prenom} {p.cinPatient ? `(CIN: ${p.cinPatient})` : '(Sans CIN)'}
                    </option>
                  ))}
                </select>

                <select 
                  name="cinPraticien" 
                  value={form.cinPraticien} 
                  onChange={handleChange} 
                  required 
                  className={inputClasses}
                >
                  <option value="" disabled>Sélectionner un praticien...</option>
                  {praticiens.map(pr => (
                    <option key={pr.cinPraticien || pr.idPraticien} value={pr.cinPraticien || pr.idPraticien}>
                      Dr {pr.nom} {pr.prenom} {pr.cinPraticien ? `(CIN: ${pr.cinPraticien})` : '(Sans CIN)'}
                    </option>
                  ))}
                </select>

                <input
                  type="datetime-local"
                  name="dateHeure"
                  value={form.dateHeure}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                  className={inputClasses}
                />

                <select 
                  name="statut" 
                  value={form.statut} 
                  onChange={handleChange} 
                  className={inputClasses}
                >
                  <option value="en_attente">En attente</option>
                  <option value="confirme">Confirmé</option>
                  <option value="annule">Annulé</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  name="idRdvParent"
                  placeholder="ID RDV parent (optionnel)"
                  value={form.idRdvParent}
                  onChange={handleChange}
                  className={inputClasses}
                />
                <input
                  type="text"
                  name="notes"
                  placeholder="Notes (optionnel)"
                  value={form.notes}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button 
                  type="submit" 
                  className={buttonStyle('blue')}
                >
                  <Check className="w-3 h-3" />
                  {isEditing ? 'Modifier' : 'Créer'}
                </button>
                <button 
                  type="button" 
                  onClick={toggleForm} 
                  className={buttonStyle('gray')}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tableau compact */}
        <div className={`${cardClasses} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th 
                    className={`px-3 py-2 text-left font-semibold cursor-pointer transition-colors ${
                      darkMode 
                        ? 'text-gray-300 hover:bg-gray-600' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => handleSort('dateHeure')}
                  >
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Date
                      <SortIcon field="dateHeure" />
                    </div>
                  </th>
                  <th className={`px-3 py-2 text-left font-semibold ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Patient
                  </th>
                  <th className={`px-3 py-2 text-left font-semibold ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Praticien
                  </th>
                  <th 
                    className={`px-3 py-2 text-left font-semibold cursor-pointer transition-colors ${
                      darkMode 
                        ? 'text-gray-300 hover:bg-gray-600' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => handleSort('statut')}
                  >
                    Statut
                    <SortIcon field="statut" />
                  </th>
                  <th className={`px-3 py-2 text-center font-semibold ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                darkMode ? 'divide-gray-600' : 'divide-gray-100'
              }`}>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8">
                      <div className="flex justify-center items-center gap-2 text-gray-500 dark:text-gray-400">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Chargement...
                      </div>
                    </td>
                  </tr>
                ) : paginatedRdvs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={`text-center py-8 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <div className="flex flex-col items-center gap-2">
                        <CalendarCheck className="w-8 h-8 opacity-50" />
                        <p className="text-sm">Aucun rendez-vous</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRdvs.map(r => {
                    const patientInfo = getPatientInfo(r.cinPatient);
                    const praticienInfo = getPraticienInfo(r.cinPraticien);
                    const isPast = new Date(r.dateHeure) < new Date();
                    
                    return (
                      <tr key={r.idRdv} className={`transition-colors ${
                        darkMode 
                          ? 'hover:bg-gray-700' 
                          : 'hover:bg-gray-50'
                      } ${isPast ? 'opacity-60' : ''}`}>
                        <td className="px-3 py-2">
                          <div className="flex flex-col">
                            <span className={`font-medium ${
                              isPast 
                                ? 'text-gray-500' 
                                : darkMode 
                                  ? 'text-gray-100' 
                                  : 'text-gray-900'
                            }`}>
                              {new Date(r.dateHeure).toLocaleDateString('fr-FR')}
                            </span>
                            <span className={`text-xs ${
                              isPast 
                                ? 'text-gray-400' 
                                : darkMode 
                                  ? 'text-gray-400' 
                                  : 'text-gray-500'
                            }`}>
                              {new Date(r.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-start gap-2">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                              <User className="w-3 h-3 text-white" />
                            </div>
                            <div className="min-w-0">
                              <span className={`font-medium truncate block ${
                                darkMode ? 'text-gray-200' : 'text-gray-800'
                              }`}>
                                {patientInfo.fullName}
                              </span>
                              {patientInfo.tel && (
                                <span className={`text-xs truncate block ${
                                  darkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  📞 {patientInfo.tel}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-start gap-2">
                            <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                              <Stethoscope className="w-3 h-3 text-white" />
                            </div>
                            <div className="min-w-0">
                              <span className={`truncate block ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                {praticienInfo.fullName}
                              </span>
                              {praticienInfo.specialite && (
                                <span className={`text-xs truncate block ${
                                  darkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  🩺 {praticienInfo.specialite}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col gap-1">
                            <span className={statutStyle(r.statut)}>
                              <StatutIcon s={r.statut} size={12} />
                              {r.statut === 'confirme' ? 'Confirmé' : r.statut === 'annule' ? 'Annulé' : 'En attente'}
                            </span>
                            {r.statut === 'en_attente' && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleQuickStatusUpdate(r.idRdv, 'confirme')}
                                  className={`p-1 rounded transition-colors ${
                                    darkMode 
                                      ? 'text-emerald-400 hover:bg-emerald-900/30' 
                                      : 'text-emerald-600 hover:bg-emerald-100'
                                  }`}
                                  title="Confirmer"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleQuickStatusUpdate(r.idRdv, 'annule')}
                                  className={`p-1 rounded transition-colors ${
                                    darkMode 
                                      ? 'text-red-400 hover:bg-red-900/30' 
                                      : 'text-red-600 hover:bg-red-100'
                                  }`}
                                  title="Annuler"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-center gap-2">
                            <button 
                              onClick={() => showDetails(r)} 
                              className={`p-2 rounded-lg transition-colors ${
                                darkMode 
                                  ? 'bg-blue-900/40 hover:bg-blue-800/60' 
                                  : 'bg-blue-100 hover:bg-blue-200'
                              }`}
                              title="Voir les détails"
                            >
                              <Eye className={`w-4 h-4 ${
                                darkMode ? 'text-blue-400' : 'text-blue-600'
                              }`} />
                            </button>
                            <button 
                              onClick={() => handleEdit(r)} 
                              className={`p-2 rounded-lg transition-colors ${
                                darkMode 
                                  ? 'bg-amber-900/40 hover:bg-amber-800/60' 
                                  : 'bg-amber-100 hover:bg-amber-200'
                              }`}
                              title="Modifier"
                            >
                              <Edit2 className={`w-4 h-4 ${
                                darkMode ? 'text-amber-400' : 'text-amber-600'
                              }`} />
                            </button>
                            <button 
                              onClick={() => handleDelete(r.idRdv)} 
                              className={`p-2 rounded-lg transition-colors ${
                                darkMode 
                                  ? 'bg-red-900/40 hover:bg-red-800/60' 
                                  : 'bg-red-100 hover:bg-red-200'
                              }`}
                              title="Supprimer"
                            >
                              <Trash2 className={`w-4 h-4 ${
                                darkMode ? 'text-red-400' : 'text-red-600'
                              }`} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination compacte */}
          {paginatedRdvs.length > 0 && (
            <div className={`flex flex-wrap justify-between items-center px-3 py-2 gap-2 text-xs border-t ${
              darkMode 
                ? 'bg-gray-700/50 border-gray-600 text-gray-400' 
                : 'bg-gray-50/50 border-gray-100 text-gray-600'
            }`}>
              <div>
                {filteredRdvs.length} RDV
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`px-2 py-1 rounded border transition-colors disabled:opacity-50 ${
                    darkMode 
                      ? 'bg-gray-600 border-gray-500 text-gray-300 hover:bg-gray-500' 
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Préc
                </button>
                <span className={`px-2 py-1 rounded border font-medium ${
                  darkMode 
                    ? 'bg-gray-600 border-gray-500 text-gray-300' 
                    : 'bg-white border-gray-200 text-gray-700'
                }`}>
                  {page}/{totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={`px-2 py-1 rounded border transition-colors disabled:opacity-50 ${
                    darkMode 
                      ? 'bg-gray-600 border-gray-500 text-gray-300 hover:bg-gray-500' 
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Suiv
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de détails amélioré */}
      {showDetailModal && selectedRdv && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`p-4 border-b ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Détails RDV #{selectedRdv.idRdv}
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className={`p-1 rounded transition-colors ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Informations du patient */}
              <div>
                <h4 className={`text-sm font-medium mb-2 flex items-center gap-2 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <User className="w-4 h-4" />
                  Patient
                </h4>
                <div className={`p-3 rounded-lg ${
                  darkMode ? 'bg-gray-700/50' : 'bg-blue-50'
                }`}>
                  <p className={`font-semibold ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {getPatientInfo(selectedRdv.cinPatient).fullName}
                  </p>
                  {selectedRdv.cinPatient && (
                    <p className={`text-xs mt-1 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      CIN: {selectedRdv.cinPatient}
                    </p>
                  )}
                  {getPatientInfo(selectedRdv.cinPatient).tel && (
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-3 h-3" />
                      <span className={`text-xs ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {getPatientInfo(selectedRdv.cinPatient).tel}
                      </span>
                    </div>
                  )}
                  {getPatientInfo(selectedRdv.cinPatient).email && (
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="w-3 h-3" />
                      <span className={`text-xs ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {getPatientInfo(selectedRdv.cinPatient).email}
                      </span>
                    </div>
                  )}
                  {getPatientInfo(selectedRdv.cinPatient).adresse && (
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-3 h-3" />
                      <span className={`text-xs ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {getPatientInfo(selectedRdv.cinPatient).adresse}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Informations du praticien */}
              <div>
                <h4 className={`text-sm font-medium mb-2 flex items-center gap-2 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <Stethoscope className="w-4 h-4" />
                  Praticien
                </h4>
                <div className={`p-3 rounded-lg ${
                  darkMode ? 'bg-gray-700/50' : 'bg-cyan-50'
                }`}>
                  <p className={`font-semibold ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {getPraticienInfo(selectedRdv.cinPraticien).fullName}
                  </p>
                  {selectedRdv.cinPraticien && (
                    <p className={`text-xs mt-1 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      CIN: {selectedRdv.cinPraticien}
                    </p>
                  )}
                  {getPraticienInfo(selectedRdv.cinPraticien).specialite && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        darkMode 
                          ? 'bg-cyan-900/30 text-cyan-300' 
                          : 'bg-cyan-100 text-cyan-700'
                      }`}>
                        {getPraticienInfo(selectedRdv.cinPraticien).specialite}
                      </span>
                    </div>
                  )}
                  {getPraticienInfo(selectedRdv.cinPraticien).tel && (
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-3 h-3" />
                      <span className={`text-xs ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {getPraticienInfo(selectedRdv.cinPraticien).tel}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Date et heure */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className={`text-sm font-medium mb-1 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Date
                  </h4>
                  <p className={`text-sm ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {new Date(selectedRdv.dateHeure).toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <div>
                  <h4 className={`text-sm font-medium mb-1 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <Clock className="w-4 h-4 inline mr-2" />
                    Heure
                  </h4>
                  <p className={`text-sm ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {new Date(selectedRdv.dateHeure).toLocaleTimeString('fr-FR')}
                  </p>
                </div>
              </div>

              {/* Statut */}
              <div>
                <h4 className={`text-sm font-medium mb-1 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Statut
                </h4>
                <span className={statutStyle(selectedRdv.statut)}>
                  <StatutIcon s={selectedRdv.statut} size={16} />
                  {selectedRdv.statut === 'confirme' ? 'Confirmé' : selectedRdv.statut === 'annule' ? 'Annulé' : 'En attente'}
                </span>
              </div>

              {/* Notes */}
              {selectedRdv.notes && (
                <div>
                  <h4 className={`text-sm font-medium mb-1 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <FileText className="w-4 h-4 inline mr-2" />
                    Notes
                  </h4>
                  <p className={`text-sm p-3 rounded-lg ${
                    darkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-50 text-gray-700'
                  }`}>
                    {selectedRdv.notes}
                  </p>
                </div>
              )}

              {/* RDV Parent */}
              {selectedRdv.idRdvParent && (
                <div>
                  <h4 className={`text-sm font-medium mb-1 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    RDV Parent
                  </h4>
                  <p className={`text-sm ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    #{selectedRdv.idRdvParent}
                  </p>
                </div>
              )}
            </div>

            <div className={`p-4 border-t ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            } flex justify-end gap-2`}>
              <button
                onClick={() => setShowDetailModal(false)}
                className={buttonStyle('gray')}
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  handleEdit(selectedRdv);
                  setShowDetailModal(false);
                }}
                className={buttonStyle('blue')}
              >
                <Edit2 className="w-3 h-3" />
                Modifier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}