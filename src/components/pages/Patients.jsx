import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { 
  PlusCircle, Search, Edit2, Trash2, FileText, FileSpreadsheet, 
  ChevronUp, ChevronDown, RefreshCw, X, Check, Clock, 
  Filter, Users, User, UserCheck, Calendar, Sun, Moon
} from 'lucide-react';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({
    idPatient: null,
    // CIN retiré du formulaire
    prenom: '',
    nom: '',
    age: '',
    adresse: '',
    email: '',
    sexe: 'Homme',
    telephone: '',
    dateCreation: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState({ 
    nom: '', 
    prenom: '', 
    email: '', 
    telephone: '',
    sexe: '',
    dateDebut: '',
    dateFin: ''
  });
  const [sortField, setSortField] = useState('nom');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [perPage] = useState(6);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({ total: 0, hommes: 0, femmes: 0 });
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

  const handleNotification = (msg, type) => {
    setNotification({ show: true, message: msg, type: type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), type === 'error' ? 3000 : 2000);
  };
  
  const handleError = (msg) => handleNotification(msg, 'error');
  const handleSuccess = (msg) => handleNotification(msg, 'success');

  const fetchPatients = () => {
    setLoading(true);
    axios.get('https://heldosseva.duckdns.org/patients')
      .then(res => {
        setPatients(res.data);
        calculateStats(res.data);
      })
      .catch(() => handleError("Erreur lors du chargement des patients."))
      .finally(() => setLoading(false));
  };

  const calculateStats = (patientsData) => {
    const total = patientsData.length;
    const hommes = patientsData.filter(p => p.sexe === 'Homme').length;
    const femmes = patientsData.filter(p => p.sexe === 'Femme').length;
    setStats({ total, hommes, femmes });
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const url = `https://heldosseva.duckdns.org/patients${isEditing ? '/' + formData.idPatient : ''}`;
    const method = isEditing ? 'put' : 'post';
    
    if (formData.age && (isNaN(formData.age) || formData.age < 0 || formData.age > 120)) {
      handleError("L'âge doit être un nombre valide entre 0 et 120.");
      return;
    }
    
    const dataToSend = {
      // CIN retiré de l'envoi
      prenom: formData.prenom,
      nom: formData.nom,
      age: formData.age,
      adresse: formData.adresse,
      email: formData.email,
      sexe: formData.sexe,
      telephone: formData.telephone,
      dateCreation: isEditing ? formData.dateCreation : new Date().toISOString().split('T')[0]
    };

    axios[method](url, dataToSend)
      .then(() => {
        fetchPatients();
        setFormData({ 
          idPatient: null, 
          // CIN retiré du reset
          prenom: '', 
          nom: '', 
          age: '', 
          adresse: '', 
          email: '', 
          sexe: 'Homme', 
          telephone: '',
          dateCreation: '' 
        });
        setIsEditing(false);
        setShowForm(false);
        handleSuccess(isEditing ? "Dossier patient modifié avec succès." : "Nouveau patient ajouté avec succès.");
      })
      .catch((error) => {
        console.error(error);
        handleError(`Erreur lors de l'enregistrement du patient. Veuillez vérifier les données.`);
      });
  };

  const handleEdit = (patient) => {
    if (window.confirm("⚠️ Confirmer la modification du dossier patient ?")) {
      // Ne pas inclure le CIN lors de l'édition
      const { cinPatient, ...patientData } = patient;
      setFormData(patientData);
      setIsEditing(true);
      setShowForm(true);
    }
  };

  const handleAdd = () => {
    setFormData({ 
      idPatient: null, 
      // CIN retiré de l'ajout
      prenom: '', 
      nom: '', 
      age: '', 
      adresse: '', 
      email: '', 
      sexe: 'Homme', 
      telephone: '',
      dateCreation: '' 
    });
    setIsEditing(false);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setIsEditing(false);
    setFormData({ 
      idPatient: null, 
      // CIN retiré de l'annulation
      prenom: '', 
      nom: '', 
      age: '', 
      adresse: '', 
      email: '', 
      sexe: 'Homme', 
      telephone: '',
      dateCreation: '' 
    });
  };

  const handleDelete = (idPatient) => {
    if (window.confirm("⚠️ ATTENTION : La suppression est définitive. Voulez-vous vraiment continuer ?")) {
      axios.delete(`https://heldosseva.duckdns.org/patients/${idPatient}`)
        .then(() => {
          fetchPatients();
          handleSuccess("Patient supprimé avec succès.");
        })
        .catch(() => handleError("Erreur lors de la suppression du patient."));
    }
  };

  const handleSearchChange = (e) => {
    setSearch(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setPage(1);
  };

  const clearFilters = () => {
    setSearch({
      nom: '', 
      prenom: '', 
      email: '', 
      telephone: '',
      sexe: '',
      dateDebut: '',
      dateFin: ''
    });
    setPage(1);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredPatients = patients
    .filter(p => {
      const matchesSearch = 
        p.nom.toLowerCase().includes(search.nom.toLowerCase()) &&
        p.prenom.toLowerCase().includes(search.prenom.toLowerCase()) &&
        (p.email || '').toLowerCase().includes(search.email.toLowerCase()) &&
        (p.telephone || '').toLowerCase().includes(search.telephone.toLowerCase());
      
      const matchesSexe = !search.sexe || p.sexe === search.sexe;
      
      const matchesDate = !search.dateDebut || !search.dateFin || 
        (p.dateCreation && p.dateCreation >= search.dateDebut && p.dateCreation <= search.dateFin);
      
      return matchesSearch && matchesSexe && matchesDate;
    })
    .sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      
      if (sortField === 'age' || sortField === 'idPatient') {
        const aNum = Number(aVal) || 0;
        const bNum = Number(bVal) || 0;
        return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      if (sortField === 'dateCreation') {
        return sortOrder === 'asc' 
          ? new Date(aVal) - new Date(bVal)
          : new Date(bVal) - new Date(aVal);
      }
      
      return sortOrder === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });

  const totalPages = Math.ceil(filteredPatients.length / perPage);
  const paginatedPatients = filteredPatients.slice((page - 1) * perPage, page * perPage);

  const handlePrintPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(33, 150, 243);
    doc.text("Liste des Patients", 14, 15);
    doc.autoTable({
      head: [[
        "ID", "Nom", "Prénom", "Sexe", "Âge", "Adresse", "Email", "Téléphone" // CIN retiré
      ]],
      body: filteredPatients.map(p => [
        p.idPatient, p.nom, p.prenom, p.sexe, p.age, p.adresse, p.email, p.telephone // CIN retiré
      ]),
      startY: 25,
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [66, 165, 245], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    doc.save("liste_patients.pdf");
    handleSuccess("Fichier PDF généré avec succès.");
  };

  const handleExportExcel = () => {
    const dataToExport = filteredPatients.map(p => ({
      ID: p.idPatient,
      Nom: p.nom, // CIN retiré
      Prénom: p.prenom,
      Sexe: p.sexe,
      Âge: p.age,
      Adresse: p.adresse,
      Email: p.email,
      Téléphone: p.telephone
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Patients");
    XLSX.writeFile(wb, "liste_patients.xlsx");
    handleSuccess("Fichier Excel généré avec succès.");
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' 
      ? <ChevronUp className="w-4 h-4 inline-block ml-1" /> 
      : <ChevronDown className="w-4 h-4 inline-block ml-1" />;
  };

  // Classes CSS conditionnelles pour le mode sombre
  const containerClasses = `min-h-screen transition-colors duration-300 ${
    darkMode 
      ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100' 
      : 'bg-gradient-to-br from-blue-50 to-cyan-50 text-gray-800'
  }`;

  const cardClasses = `rounded-2xl shadow-xl border transition-all duration-300 ${
    darkMode 
      ? 'bg-gray-800 border-gray-700 text-gray-100' 
      : 'bg-white border-blue-100'
  }`;

  const inputClasses = `rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-sky-400 outline-none ${
    darkMode
      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-sky-500'
      : 'border-gray-300 text-gray-800 placeholder-gray-500 focus:border-sky-400 bg-white'
  }`;

  const statCardClasses = (color) => `rounded-2xl p-6 shadow-lg border transition-all duration-300 ${
    darkMode 
      ? `bg-gray-800/80 border-gray-700 text-gray-100` 
      : 'bg-white border-blue-100'
  }`;

  return (
    <div className={containerClasses}>
      {/* Notifications */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl font-semibold text-white flex items-center gap-2 transform transition-all duration-300 ease-in-out ${
          notification.type === 'success' 
            ? 'bg-gradient-to-r from-emerald-600 to-green-600' 
            : 'bg-gradient-to-r from-red-600 to-pink-600'
        }`}>
          {notification.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          {notification.message}
        </div>
      )}

      {/* En-tête avec statistiques */}
      <div className="mb-8 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className={`text-3xl sm:text-4xl font-bold mb-2 text-center sm:text-left ${
              darkMode ? 'text-sky-300' : 'text-sky-800'
            }`}>
              📋 Dossiers des Patients 
            </h2>
            <p className={`text-center sm:text-left ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Gestion complète des dossiers patients
            </p>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`self-center px-4 py-2 rounded-xl transition-all duration-300 ${
              darkMode 
                ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-gray-900 hover:from-yellow-300 hover:to-amber-300' 
                : 'bg-gradient-to-r from-gray-800 to-gray-900 text-white hover:from-gray-700 hover:to-gray-800'
            }`}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={statCardClasses('sky')}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Total Patients
                </p>
                <p className={`text-3xl font-bold ${darkMode ? 'text-sky-300' : 'text-sky-700'}`}>
                  {stats.total}
                </p>
              </div>
              <Users className={`w-12 h-12 p-2 rounded-xl ${
                darkMode 
                  ? 'text-sky-400 bg-sky-900/30' 
                  : 'text-sky-500 bg-sky-100'
              }`} />
            </div>
          </div>
          
          <div className={statCardClasses('blue')}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Patients Hommes
                </p>
                <p className={`text-3xl font-bold ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                  {stats.hommes}
                </p>
              </div>
              <User className={`w-12 h-12 p-2 rounded-xl ${
                darkMode 
                  ? 'text-blue-400 bg-blue-900/30' 
                  : 'text-blue-500 bg-blue-100'
              }`} />
            </div>
          </div>
          
          <div className={statCardClasses('pink')}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Patients Femmes
                </p>
                <p className={`text-3xl font-bold ${darkMode ? 'text-pink-300' : 'text-pink-700'}`}>
                  {stats.femmes}
                </p>
              </div>
              <UserCheck className={`w-12 h-12 p-2 rounded-xl ${
                darkMode 
                  ? 'text-pink-400 bg-pink-900/30' 
                  : 'text-pink-500 bg-pink-100'
              }`} />
            </div>
          </div>
        </div>
      </div>

      {/* Zone de Recherche et Actions */}
      <div className={`${cardClasses} p-6 mb-6 mx-4 sm:mx-6`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 gap-4">
          <div className="flex items-center gap-2">
            <Search className={`w-5 h-5 ${darkMode ? 'text-sky-400' : 'text-sky-500'}`} />
            <p className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Rechercher un patient:
            </p>
          </div>
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <input 
              type="text" 
              placeholder="Nom" 
              className={`${inputClasses} w-full sm:w-36 px-4 py-2`} 
              value={search.nom} 
              name="nom" 
              onChange={handleSearchChange} 
            />
            <input 
              type="text" 
              placeholder="Prénom" 
              className={`${inputClasses} w-full sm:w-36 px-4 py-2`} 
              value={search.prenom} 
              name="prenom" 
              onChange={handleSearchChange} 
            />
            <input 
              type="text" 
              placeholder="Email" 
              className={`${inputClasses} w-full sm:w-36 px-4 py-2`} 
              value={search.email} 
              name="email" 
              onChange={handleSearchChange} 
            />
            <input 
              type="text" 
              placeholder="Téléphone" 
              className={`${inputClasses} w-full sm:w-36 px-4 py-2`} 
              value={search.telephone} 
              name="telephone" 
              onChange={handleSearchChange} 
            />
          </div>
        </div>
        
        <div className={`border-t pt-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`flex items-center gap-2 font-medium mb-4 transition-colors ${
              darkMode ? 'text-sky-400 hover:text-sky-300' : 'text-sky-600 hover:text-sky-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtres avancés
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showFilters && (
            <div className={`p-4 rounded-xl mb-4 ${
              darkMode ? 'bg-gray-900/50 border border-gray-700' : 'bg-gray-50'
            }`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Sexe
                  </label>
                  <select 
                    className={`${inputClasses} w-full px-4 py-2`} 
                    value={search.sexe} 
                    name="sexe" 
                    onChange={handleSearchChange}
                  >
                    <option value="">Tous les sexes</option>
                    <option value="Homme">Homme</option>
                    <option value="Femme">Femme</option>
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Date de début
                  </label>
                  <input 
                    type="date" 
                    className={`${inputClasses} w-full px-4 py-2`} 
                    value={search.dateDebut} 
                    name="dateDebut" 
                    onChange={handleSearchChange} 
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Date de fin
                  </label>
                  <input 
                    type="date" 
                    className={`${inputClasses} w-full px-4 py-2`} 
                    value={search.dateFin} 
                    name="dateFin" 
                    onChange={handleSearchChange} 
                  />
                </div>
                
                <div className="md:col-span-3 flex justify-end">
                  <button 
                    onClick={clearFilters} 
                    className="px-4 py-2 rounded-xl transition-all flex items-center gap-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700"
                  >
                    <X className="w-4 h-4" />
                    Effacer les filtres
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-3 justify-between">
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={handleAdd} 
              className="flex items-center bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold px-6 py-2.5 rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all shadow-lg transform hover:scale-105"
            >
              <PlusCircle className="w-5 h-5 mr-2" /> Nouveau Patient
            </button>
            
            <button 
              onClick={fetchPatients} 
              className="flex items-center bg-gradient-to-r from-sky-500 to-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl hover:from-sky-600 hover:to-blue-600 transition-all shadow-lg transform hover:scale-105"
            >
              <RefreshCw className="w-5 h-5 mr-2" /> Actualiser
            </button>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={handlePrintPDF} 
              className="flex items-center bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold px-6 py-2.5 rounded-xl hover:from-red-600 hover:to-pink-600 transition-all shadow-lg transform hover:scale-105"
            >
              <FileText className="w-5 h-5 mr-2" /> Exporter PDF
            </button>
            
            <button 
              onClick={handleExportExcel} 
              className="flex items-center bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold px-6 py-2.5 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg transform hover:scale-105"
            >
              <FileSpreadsheet className="w-5 h-5 mr-2" /> Exporter Excel
            </button>
          </div>
        </div>
      </div>

      {/* Formulaire d'Ajout/Modification */}
      {showForm && (
        <form onSubmit={handleSubmit} className={`${cardClasses} p-6 sm:p-8 mb-8 mx-4 sm:mx-6`}>
          <h3 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-sky-300' : 'text-sky-700'}`}>
            {isEditing ? 'Modifier le Dossier Patient' : 'Ajouter un Nouveau Patient'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Champ CIN supprimé du formulaire */}
            
            <div className="flex flex-col">
              <label className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Prénom <span className="text-red-500 font-bold">*</span>
              </label>
              <input 
                className={`${inputClasses} px-4 py-2.5`} 
                name="prenom" 
                placeholder="Prénom" 
                value={formData.prenom} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div className="flex flex-col">
              <label className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Nom <span className="text-red-500 font-bold">*</span>
              </label>
              <input 
                className={`${inputClasses} px-4 py-2.5`} 
                name="nom" 
                placeholder="Nom" 
                value={formData.nom} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div className="flex flex-col">
              <label className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Âge <span className="text-red-500 font-bold">*</span>
              </label>
              <input 
                className={`${inputClasses} px-4 py-2.5`} 
                name="age" 
                type="number" 
                placeholder="Âge" 
                value={formData.age} 
                onChange={handleChange} 
                required 
                min="0" 
                max="120" 
              />
            </div>

            <div className="flex flex-col">
              <label className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Adresse
              </label>
              <input 
                className={`${inputClasses} px-4 py-2.5`} 
                name="adresse" 
                placeholder="Adresse complète" 
                value={formData.adresse} 
                onChange={handleChange} 
              />
            </div>
            
            <div className="flex flex-col">
              <label className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Email
              </label>
              <input 
                className={`${inputClasses} px-4 py-2.5`} 
                name="email" 
                type="email" 
                placeholder="Email" 
                value={formData.email} 
                onChange={handleChange} 
              />
            </div>
            
            <div className="flex flex-col">
              <label className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Sexe <span className="text-red-500 font-bold">*</span>
              </label>
              <select 
                className={`${inputClasses} px-4 py-2.5`} 
                name="sexe" 
                value={formData.sexe} 
                onChange={handleChange} 
                required
              >
                <option value="Homme">Homme</option>
                <option value="Femme">Femme</option>
              </select>
            </div>
            
            <div className="flex flex-col">
              <label className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Téléphone
              </label>
              <input 
                className={`${inputClasses} px-4 py-2.5`} 
                name="telephone" 
                placeholder="Téléphone" 
                value={formData.telephone} 
                onChange={handleChange} 
              />
            </div>

            {isEditing && (
              <div className="flex flex-col">
                <label className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Date de création
                </label>
                <input 
                  className={`${inputClasses} px-4 py-2.5 bg-opacity-50 ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`} 
                  name="dateCreation" 
                  value={formData.dateCreation} 
                  readOnly 
                />
              </div>
            )}
          </div>
          <div className="flex gap-3 justify-end pt-6">
            <button 
              type="submit" 
              className="flex items-center bg-gradient-to-r from-sky-500 to-blue-500 text-white font-semibold px-6 py-2 rounded-xl hover:from-sky-600 hover:to-blue-600 transition-all shadow-md transform hover:scale-105"
            >
              {isEditing ? <Edit2 className="w-5 h-5 mr-2" /> : <PlusCircle className="w-5 h-5 mr-2" />}
              {isEditing ? 'Mettre à jour' : 'Enregistrer'}
            </button>
            <button 
              type="button" 
              onClick={handleCancel} 
              className="flex items-center bg-gradient-to-r from-gray-400 to-gray-500 text-white font-semibold px-6 py-2 rounded-xl hover:from-gray-500 hover:to-gray-600 transition-all shadow-md"
            >
              <X className="w-5 h-5 mr-2" /> Annuler
            </button>
          </div>
        </form>
      )}

      {/* Tableau des Patients (Desktop) */}
      <div className="mt-8 hidden md:block mx-4 sm:mx-6">
        <div className={`overflow-x-auto rounded-2xl shadow-xl border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-sky-100'
        }`}>
          <table className="min-w-[1400px] w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-sky-500 to-blue-500 text-white uppercase text-left font-semibold">
                {/* Colonne CIN retirée du tableau */}
                {['idPatient', 'nom', 'prenom', 'sexe', 'age'].map(field => (
                  <th 
                    key={field} 
                    className="px-4 py-3 cursor-pointer hover:bg-sky-600 transition-all"
                    onClick={() => handleSort(field)}
                  >
                    <div className="flex items-center">
                      {field === 'idPatient' ? 'ID' : 
                       field.charAt(0).toUpperCase() + field.slice(1)}
                      <SortIcon field={field} />
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3">Adresse</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Téléphone</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className={darkMode ? 'text-gray-200' : 'text-gray-700'}>
              {loading ? (
                <tr>
                  <td colSpan={9} className={`text-center py-8 font-semibold flex items-center justify-center gap-2 ${
                    darkMode ? 'text-sky-400' : 'text-sky-500'
                  }`}>
                    <Clock className="w-5 h-5 animate-spin" /> Chargement des données...
                  </td>
                </tr>
              ) : paginatedPatients.length > 0 ? (
                paginatedPatients.map((p, index) => (
                  <tr 
                    key={p.idPatient} 
                    className={`border-t transition-all duration-200 hover:bg-opacity-50 ${
                      darkMode 
                        ? `border-gray-700 hover:bg-sky-900/30 ${
                            index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/70'
                          }`
                        : `border-gray-100 hover:bg-sky-50/50 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`
                    }`}
                  >
                    <td className={`px-4 py-3 font-bold ${darkMode ? 'text-sky-300' : 'text-sky-600'}`}>
                      {p.idPatient}
                    </td>
                    {/* Cellule CIN retirée du tableau */}
                    <td className={`px-4 py-3 font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                      {p.nom}
                    </td>
                    <td className="px-4 py-3">{p.prenom}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        p.sexe === 'Homme' 
                          ? darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'
                          : darkMode ? 'bg-pink-900/50 text-pink-300' : 'bg-pink-100 text-pink-800'
                      }`}>
                        {p.sexe}
                      </span>
                    </td>
                    <td className="px-4 py-3">{p.age} ans</td>
                    <td className="px-4 py-3 max-w-[200px] truncate" title={p.adresse}>
                      {p.adresse}
                    </td>
                    <td className="px-4 py-3 max-w-[150px] truncate" title={p.email}>
                      {p.email}
                    </td>
                    <td className="px-4 py-3">{p.telephone}</td>
                    <td className="px-4 py-3 space-x-2 flex justify-center">
                      <button 
                        onClick={() => handleEdit(p)} 
                        className="flex items-center bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-3 py-2 rounded-lg hover:from-yellow-600 hover:to-amber-600 transition-all shadow-md transform hover:scale-105"
                      >
                        <Edit2 className="w-4 h-4 mr-1" /> Modifier
                      </button>
                      <button 
                        onClick={() => handleDelete(p.idPatient)} 
                        className="flex items-center bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-2 rounded-lg hover:from-red-600 hover:to-pink-600 transition-all shadow-md transform hover:scale-105"
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Supprimer
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className={`text-center py-8 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <X className="w-5 h-5 inline-block mr-2 text-red-400" /> 
                    Aucun patient ne correspond aux critères de recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4 mx-4 sm:mx-6">
        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Affichage de {paginatedPatients.length} patient(s) sur {filteredPatients.length}
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))} 
            disabled={page === 1} 
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-white hover:from-sky-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg transform hover:scale-105"
          >
            Précédent
          </button>
          <span className={`font-bold px-4 py-2 rounded-xl shadow-lg border ${
            darkMode 
              ? 'bg-gray-800 text-sky-300 border-gray-700' 
              : 'bg-white text-sky-800 border-sky-200'
          }`}>
            Page {page} sur {totalPages || 1}
          </span>
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
            disabled={page === totalPages || totalPages === 0} 
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-white hover:from-sky-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg transform hover:scale-105"
          >
            Suivant
          </button>
        </div>
      </div>

      {/* Cartes Patients (Mobile) */}
      <div className="md:hidden grid grid-cols-1 gap-4 mt-6 mx-4 sm:mx-6">
        {loading ? (
          <div className={`text-center py-8 font-semibold flex items-center justify-center gap-2 ${
            darkMode ? 'text-sky-400' : 'text-sky-500'
          }`}>
            <Clock className="w-5 h-5 animate-spin" /> Chargement des dossiers...
          </div>
        ) : paginatedPatients.length > 0 ? (
          paginatedPatients.map((p) => (
            <div 
              key={p.idPatient} 
              className={`p-5 rounded-2xl shadow-lg border hover:shadow-xl transition-all duration-200 ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
                  : 'bg-white border-sky-200 hover:bg-gray-50'
              }`}
            >
              <div className={`flex items-center justify-between mb-3 pb-3 ${
                darkMode ? 'border-gray-700' : 'border-sky-100'
              }`}>
                <div>
                  <span className={`font-extrabold text-lg block ${
                    darkMode ? 'text-sky-300' : 'text-sky-700'
                  }`}>
                    {p.nom} {p.prenom}
                  </span>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    ID: {p.idPatient} {/* CIN retiré de l'affichage mobile */}
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  p.sexe === 'Homme' 
                    ? darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'
                    : darkMode ? 'bg-pink-900/50 text-pink-300' : 'bg-pink-100 text-pink-800'
                }`}>
                  {p.sexe}, {p.age} ans
                </span>
              </div>
              <div className={`space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <div className="flex justify-between">
                  <span className="font-medium">Email:</span>
                  <span>{p.email || 'Non renseigné'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Téléphone:</span>
                  <span>{p.telephone || 'Non renseigné'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Date création:</span>
                  <span>{p.dateCreation}</span>
                </div>
                <div>
                  <span className="font-medium block mb-1">Adresse:</span>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {p.adresse || 'Non renseignée'}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 mt-4 justify-end">
                <button 
                  onClick={() => handleEdit(p)} 
                  className="flex items-center bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-4 py-2 rounded-lg hover:from-yellow-600 hover:to-amber-600 transition-all shadow-md transform hover:scale-105"
                >
                  <Edit2 className="w-4 h-4 mr-1" /> Modifier
                </button>
                <button 
                  onClick={() => handleDelete(p.idPatient)} 
                  className="flex items-center bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-pink-600 transition-all shadow-md transform hover:scale-105"
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Supprimer
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className={`text-center py-8 rounded-2xl shadow-lg border ${
            darkMode 
              ? 'bg-gray-800 border-gray-700 text-gray-400' 
              : 'bg-white border-sky-200 text-gray-500'
          }`}>
            <X className="w-6 h-6 inline-block mr-2 text-red-400" /> 
            Aucun patient trouvé.
          </div>
        )}
      </div>
    </div>
  );
}