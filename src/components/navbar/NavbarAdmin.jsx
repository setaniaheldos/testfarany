import React, { useState } from 'react';
import { Menu, X, Users, UserPlus, LogOut, Shield } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
// 1. Importation du logo
import logo from '../../assets/pick2.jpg'; 

export default function NavbarAdmin() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const ADMIN_COLOR = 'purple'; 

  const navItems = [
    { to: '/admin-auth', label: 'Connexion Admin', icon: <Shield size={20} className="mr-2" /> },
    { to: '/utilisateur-login', label: 'Connexion Utilisateurs', icon: <Users size={20} className="mr-2" /> },
    { to: '/utilisateur', label: "Inscription d'utilisateurs", icon: <UserPlus size={20} className="mr-2" /> },
  ];

  const navLink = (to) =>
    `flex items-center px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
      location.pathname === to
        ? `bg-${ADMIN_COLOR}-600 text-white shadow-md shadow-${ADMIN_COLOR}-500/50`
        : `text-gray-700 dark:text-gray-300 hover:bg-${ADMIN_COLOR}-50 dark:hover:bg-gray-700 hover:text-${ADMIN_COLOR}-600`
    }`;

  const handleLogout = () => {
    navigate('/admin-auth');
  };

  return (
    <>
      <nav className="bg-white/80 dark:bg-gray-900/80 shadow-lg sticky top-0 z-50 backdrop-blur-lg">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className={`md:hidden p-2 rounded-full text-${ADMIN_COLOR}-600 dark:text-${ADMIN_COLOR}-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition`}
              aria-label="Ouvrir le menu"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            {/* 2. Logo et Titre */}
            <Link to="/utilisateur-login" className="flex items-center gap-3 group">
              <img 
                src={logo} 
                alt="Logo" 
                className="h-10 w-10 object-cover rounded-lg border border-purple-100 shadow-sm"
              />
              <span className={`text-2xl font-extralight text-${ADMIN_COLOR}-600 dark:text-${ADMIN_COLOR}-400 tracking-wider hidden sm:inline`}>
                Espace <span className="font-semibold text-purple-700">Admin</span>
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-3 text-sm">
            {navItems.map(item => (
              <Link key={item.to} to={item.to} className={navLink(item.to)}>
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
            
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-all shadow-md ml-4"
            >
              <LogOut size={18} className="mr-2" /> Déconnexion
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar responsive */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${sidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        <div
          className={`absolute inset-0 bg-black transition-opacity duration-300 ${sidebarOpen ? 'opacity-40' : 'opacity-0'}`}
          onClick={() => setSidebarOpen(false)}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-72 bg-white/95 dark:bg-gray-900/95 shadow-2xl transform transition-transform duration-300 backdrop-blur-sm
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              {/* Logo dans la Sidebar */}
              <img src={logo} alt="Logo" className="h-8 w-8 rounded-md" />
              <span className={`text-xl font-bold text-${ADMIN_COLOR}-700 dark:text-${ADMIN_COLOR}-300`}>
                Menu Admin
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              <X size={24} />
            </button>
          </div>
          <nav className="flex flex-col gap-1 mt-4 px-3 text-gray-800 dark:text-gray-200">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={navLink(item.to)}
                onClick={() => setSidebarOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
            <button
              onClick={() => { handleLogout(); setSidebarOpen(false); }}
              className="flex items-center px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-all shadow-md mt-4"
            >
              <LogOut size={18} className="mr-2" /> Déconnexion
            </button>
          </nav>
        </aside>
      </div>
    </>
  );
}