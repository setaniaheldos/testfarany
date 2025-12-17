import React, { useState, useEffect } from 'react';
import {
  Menu, X, Home, Users, UserPlus, Calendar, FileText, ClipboardList, Stethoscope,
  LogOut, Sun, Moon, ChevronLeft, ChevronRight, Activity
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function MedicalSidebar({ onLogout }) {
  // Changement de l'état initial : mettons la sidebar dépliée par défaut (false) pour un premier affichage clair.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

 

 

  const handleLogout = () => {
    onLogout?.();
    navigate('/admin-auth');
  };

  const menuItems = [
    { to: '/accueil', label: 'Tableau de Bord', icon: <Home size={20} /> },
    { to: '/patients', label: 'Gestion Patients', icon: <Users size={20} /> },
    { to: '/praticiens', label: 'Équipe Médicale', icon: <UserPlus size={20} /> },
    { to: '/rendezvous', label: 'Rendez-vous', icon: <Calendar size={20} /> },
    { to: '/consultation', label: 'Consultation', icon: <FileText size={20} /> },
    { to: '/prescription', label: 'Traitements/Prescription', icon: <ClipboardList size={20} /> },
    { to: '/examen', label: 'Facturations', icon: <Stethoscope size={20} /> },
    { to: '/payement', label: 'Paiements', icon: <Activity size={20} /> },
  ];

  const isActive = (path) => location.pathname === path;

  // Définition des largeurs (CLÉS DU CHANGEMENT)
  const SIDEBAR_WIDTH = 'w-64'; // 16rem
  const COLLAPSED_WIDTH = 'w-0'; // MASQUÉ COMPLÈTEMENT
  
  // PADDING DU CONTENU PRINCIPAL
  const CONTENT_PADDING = 'lg:ml-64'; // Marge si déplié
  const COLLAPSED_PADDING = 'lg:ml-0'; // Marge si masqué

  const ACCENT_COLOR = 'indigo'; 

  return (
    <>
      {/* Bouton de bascule mobile (Hamburger) */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-3 rounded-xl bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-all duration-300"
      >
        <Menu size={20} />
      </button>

      {/* Bouton de Bascule (Collapse) pour le mode Bureau */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        title={sidebarCollapsed ? 'Déplier le menu' : 'Replier le menu'}
        className={`fixed top-4 z-50 p-3 rounded-full text-white shadow-xl transition-all duration-300 lg:block hidden 
          ${
            sidebarCollapsed
              // Quand masqué (w-0), le bouton reste visible à left-4 (pour le rouvrir)
              ? 'left-4 bg-indigo-600 hover:bg-indigo-700' 
              // Quand déplié (w-64), le bouton se déplace à left-64
              : `left-64 bg-gray-700 dark:bg-gray-200 dark:text-gray-800 hover:bg-gray-600 dark:hover:bg-gray-300 transform -translate-x-1/2`
          } 
        `}
      >
        {/* Afficher Menu quand masqué, ChevronLeft quand déplié */}
        {sidebarCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
      </button>

      {/* Sidebar Desktop + Mobile */}
<aside
  className={`fixed inset-y-0 left-0 z-40 flex flex-col 
    bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg
    text-gray-100 dark:text-white 
    shadow-2xl shadow-gray-400/30 dark:shadow-black/70
    transition-all duration-300 overflow-hidden
    ${sidebarCollapsed ? COLLAPSED_WIDTH : SIDEBAR_WIDTH} 
    ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
    lg:translate-x-0`}
>


        
        {/* Conteneur interne : toujours de la largeur complète, masqué/déplié via 'sidebarCollapsed' sur l'ASIDE */}
        {/* Nous utilisons 'opacity' et 'pointer-events' pour garantir que le contenu est bien invisible et inactif lorsque la barre est masquée (w-0) */}
        <div className={`flex flex-col w-64 h-full transition-opacity duration-200 ${sidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          
          {/* En-tête de la Sidebar */}
          <div className={`flex items-center p-4 border-b border-gray-100 dark:border-gray-700 justify-between`}>
            
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-${ACCENT_COLOR}-100 dark:bg-${ACCENT_COLOR}-900`}>
                <Activity size={24} className={`text-${ACCENT_COLOR}-500`} />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-wide text-gray-900 dark:text-white">Clinique Tsaradia</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">G.Patient</p>
              </div>
            </div>

            {/* Bouton de fermeture mobile (X) */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all lg:hidden`}
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3 py-3 rounded-lg transition-all duration-200 group gap-4
                  ${
                    isActive(item.to)
                      ? `bg-${ACCENT_COLOR}-50 dark:bg-gray-700 text-${ACCENT_COLOR}-600 dark:text-${ACCENT_COLOR}-400 font-semibold border-l-4 border-${ACCENT_COLOR}-500`
                      : `text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-l-4 border-transparent`
                  }
                `}
                title={item.label}
              >
                <span className="flex-shrink-0">
                  {item.icon}
                </span>
                <span className="text-sm">
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>

          {/* Footer Sidebar (Déconnexion & Mode Sombre) */}
          <div className={`p-4 border-t border-gray-100 dark:border-gray-700 space-y-2`}>
            
       

            {/* Déconnexion */}
            <button
              onClick={handleLogout}
              className={`w-full flex items-center px-3 py-3 rounded-lg transition-all 
                bg-red-50 dark:bg-red-900/40 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 gap-3`}
              title="Déconnexion"
            >
              <span className="flex-shrink-0">
                <LogOut size={20} />
              </span>
              <span className="font-medium text-sm">
                Déconnexion
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content padding */}
      <div 
        className={`transition-all duration-300 pt-16 lg:pt-0 
        ${sidebarCollapsed ? COLLAPSED_PADDING : CONTENT_PADDING}`}
      >
        {/* Ton contenu principal ici */}
      </div>
    </>
  );
}