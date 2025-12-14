import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from "xlsx";
import { 
  Plus, Search, Edit2, Trash2, ChevronUp, ChevronDown, RefreshCw, Check, X, 
  CalendarCheck, CalendarX, Clock4, Download, User, Stethoscope, Filter, 
  Eye, Calendar, Users, FileText, Phone, AlertCircle, CheckCircle, XCircle, Clock
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

  const getPatientInfo = (cin) => {
    const p = patients.find(p => p.cinPatient === cin);
    return p ? { ...p, fullName: `${p.nom} ${p.prenom}` } : { fullName: 'Inconnu', tel: '', email: '' };
  };

  const getPraticienInfo = (cin) => {
    const pr = praticiens.find(pr => pr.cinPraticien === cin);
    return pr ? { ...pr, fullName: `Dr ${pr.nom} ${pr.prenom}` } : { fullName: 'Inconnu', specialite: '' };
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

  // === Styles utilitaires ===
  const statutStyle = (s) => {
    const baseStyles = "px-2 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 transition-all duration-200";
    
    const styles = {
      confirme: `${baseStyles} bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800`,
      annule: `${baseStyles} bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800`,
      en_attente: `${baseStyles} bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800`
    };
    
    return styles[s] || styles.en_attente;
  };

  const filterButtonStyle = (filter) => {
    const baseStyles = "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2";
    
    if (activeFilter === filter) {
      const activeStyles = {
        tous: `${baseStyles} bg-blue-500 text-white shadow-sm`,
        en_attente: `${baseStyles} bg-amber-500 text-white shadow-sm`,
        confirme: `${baseStyles} bg-emerald-500 text-white shadow-sm`,
        annule: `${baseStyles} bg-red-500 text-white shadow-sm`
      };
      return activeStyles[filter];
    }
    
    return `${baseStyles} bg-white/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600`;
  };

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

  const StatCard = ({ title, value, icon, color, onClick }) => (
    <div 
      onClick={onClick}
      className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md ${onClick ? 'hover:scale-105' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`p-2 rounded-lg bg-${color}-100 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-blue-900 transition-colors w-full">

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
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-white/20 dark:border-gray-700/50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
                Rendez-vous
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredRdvs.length} rendez-vous trouvés
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Aujourd'hui</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.aujourdhui}</p>
              </div>
              <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
                <Calendar className="w-4 h-4 text-white" />
              </div>
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
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm p-4 mb-4 border border-gray-200 dark:border-gray-700">
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
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <input
                  type="text"
                  placeholder="Patient..."
                  className="w-full pl-7 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  value={search.patient}
                  onChange={(e) => setSearch({ ...search, patient: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={toggleForm} 
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm shadow-sm transition-colors"
                >
                  {showAddForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  {showAddForm ? 'Fermer' : 'Nouveau'}
                </button>
                <button 
                  onClick={handleExportExcel} 
                  disabled={exportLoading}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm shadow-sm transition-colors disabled:opacity-50"
                >
                  <Download className="w-3 h-3" /> 
                  {exportLoading ? '...' : 'Excel'}
                </button>
                <button 
                  onClick={fetchAllData} 
                  className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-lg shadow-sm transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Formulaire compact */}
        {showAddForm && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm p-4 mb-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1 bg-blue-500 rounded">
                <CalendarCheck className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
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
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                >
                  <option value="" disabled>Patient...</option>
                  {patients.map(p => (
                    <option key={p.cinPatient} value={p.cinPatient}>
                      {p.nom} {p.prenom}
                    </option>
                  ))}
                </select>

                <select 
                  name="cinPraticien" 
                  value={form.cinPraticien} 
                  onChange={handleChange} 
                  required 
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                >
                  <option value="" disabled>Praticien...</option>
                  {praticiens.map(pr => (
                    <option key={pr.cinPraticien} value={pr.cinPraticien}>
                      Dr {pr.nom} {pr.prenom}
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
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                />

                <select 
                  name="statut" 
                  value={form.statut} 
                  onChange={handleChange} 
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                >
                  <option value="en_attente">En attente</option>
                  <option value="confirme">Confirmé</option>
                  <option value="annule">Annulé</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end">
                <button 
                  type="submit" 
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-1 text-sm transition-colors"
                >
                  <Check className="w-3 h-3" />
                  {isEditing ? 'Modifier' : 'Créer'}
                </button>
                <button 
                  type="button" 
                  onClick={toggleForm} 
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tableau compact */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th 
                    className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('dateHeure')}
                  >
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Date
                      <SortIcon field="dateHeure" />
                    </div>
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">
                    Patient
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">
                    Praticien
                  </th>
                  <th 
                    className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('statut')}
                  >
                    Statut
                    <SortIcon field="statut" />
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-600">
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
                    <td colSpan={5} className="text-center py-8 text-gray-400 dark:text-gray-500">
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
                      <tr key={r.idRdv} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        isPast ? 'opacity-60' : ''
                      }`}>
                        <td className="px-3 py-2">
                          <div className="flex flex-col">
                            <span className={`font-medium ${isPast ? 'text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                              {new Date(r.dateHeure).toLocaleDateString('fr-FR')}
                            </span>
                            <span className={`text-xs ${isPast ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                              {new Date(r.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <User className="w-3 h-3 text-white" />
                            </div>
                            <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[120px]">
                              {patientInfo.fullName}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                              <Stethoscope className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
                              {praticienInfo.fullName}
                            </span>
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
                                  className="p-1 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded transition-colors"
                                  title="Confirmer"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleQuickStatusUpdate(r.idRdv, 'annule')}
                                  className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
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
                              className="p-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-800/60 rounded-lg transition-colors"
                              title="Voir les détails"
                            >
                              <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </button>
                            <button 
                              onClick={() => handleEdit(r)} 
                              className="p-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-800/60 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            </button>
                            <button 
                              onClick={() => handleDelete(r.idRdv)} 
                              className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-800/60 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
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
            <div className="flex flex-wrap justify-between items-center px-3 py-2 bg-gray-50/50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-600 gap-2 text-xs">
              <div className="text-gray-600 dark:text-gray-400">
                {filteredRdvs.length} RDV
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2 py-1 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                >
                  Préc
                </button>
                <span className="px-2 py-1 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded text-gray-700 dark:text-gray-300 font-medium">
                  {page}/{totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-2 py-1 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                >
                  Suiv
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de détails */}
      {showDetailModal && selectedRdv && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Détails RDV</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Patient</h4>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {getPatientInfo(selectedRdv.cinPatient).fullName}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Praticien</h4>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {getPraticienInfo(selectedRdv.cinPraticien).fullName}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Date</h4>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {new Date(selectedRdv.dateHeure).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Heure</h4>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {new Date(selectedRdv.dateHeure).toLocaleTimeString('fr-FR')}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Statut</h4>
                <span className={statutStyle(selectedRdv.statut)}>
                  <StatutIcon s={selectedRdv.statut} size={12} />
                  {selectedRdv.statut === 'confirme' ? 'Confirmé' : selectedRdv.statut === 'annule' ? 'Annulé' : 'En attente'}
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  handleEdit(selectedRdv);
                  setShowDetailModal(false);
                }}
                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
              >
                Modifier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}