import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Remplacez par l'URL de votre serveur Node.js sur Railway/VPS
const API_URL = "http://82.165.15.45:3000"; 

const GestionPaiements = () => {
    const [consultations, setConsultations] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(false);

    // 1. Charger les données (Consultations + Stats Financières)
    const fetchData = async () => {
        try {
            const [resConsult, resStats] = await Promise.all([
                axios.get(`${API_URL}/consultations`),
                axios.get(`${API_URL}/paiements/stats`) // Route de statistiques que nous avons créée
            ]);
            setConsultations(resConsult.data);
            setStats(resStats.data);
        } catch (err) {
            console.error("Erreur de chargement:", err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // 2. Fonction de paiement unifiée (Espèce & MVola)
    const encaisserPaiement = async (consult, mode) => {
        let numeroClient = null;

        // Si c'est MVola, on demande le numéro de téléphone
        if (mode === 'MVola') {
            numeroClient = prompt("Entrez le numéro MVola du client (ex: 0340012345) :");
            if (!numeroClient) return; // Annulation si vide
        }

        setLoading(true);
        try {
            const payload = {
                idConsult: consult.idConsult,
                montant: consult.prix, // Le montant est tiré du prix de la consultation
                modePaiement: mode,
                numeroClient: numeroClient
            };

            // Appel de la route unifiée /api/paiements
            const response = await axios.post(`${API_URL}/api/paiements`, payload);
            
            alert(response.data.message);
            fetchData(); // Rafraîchir les données et le tableau de bord
        } catch (err) {
            const msg = err.response?.data?.error || "Erreur lors de la transaction";
            alert("Erreur : " + msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
            
            {/* --- TABLEAU DE BORD FINANCIER --- */}
            <h2 style={{ color: '#2c3e50' }}>📊 Tableau de Bord Financier</h2>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                {stats.length > 0 ? stats.map(s => (
                    <div key={s.modePaiement} style={statCard(s.modePaiement)}>
                        <h4 style={{ margin: 0 }}>Total {s.modePaiement}</h4>
                        <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>
                            {s.total.toLocaleString()} Ar
                        </p>
                        <small>{s.nombre} paiements réussis</small>
                    </div>
                )) : (
                    <div style={statCard('default')}>Aucune donnée de paiement disponible</div>
                )}
            </div>

            {/* --- LISTE DES CONSULTATIONS --- */}
            <h2 style={{ color: '#2c3e50' }}>💰 Gestion des Encaissements</h2>
            <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#34495e', color: 'white', textAlign: 'left' }}>
                            <th style={paddingStyle}>ID</th>
                            <th style={paddingStyle}>Date</th>
                            <th style={paddingStyle}>Prix</th>
                            <th style={paddingStyle}>Statut</th>
                            <th style={paddingStyle}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {consultations.map(c => (
                            <tr key={c.idConsult} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={paddingStyle}>{c.idConsult}</td>
                                <td style={paddingStyle}>{new Date(c.dateConsult).toLocaleDateString()}</td>
                                <td style={paddingStyle}><strong>{c.prix} Ar</strong></td>
                                <td style={paddingStyle}>
                                    <span style={statusBadge(c.statutPaiement)}>
                                        {c.statutPaiement || "EN ATTENTE"}
                                    </span>
                                </td>
                                <td style={paddingStyle}>
                                    {c.statutPaiement !== 'REUSSI' ? (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button 
                                                onClick={() => encaisserPaiement(c, 'Espece')}
                                                disabled={loading}
                                                style={btnStyle('#27ae60')}>💵 Espèce</button>
                                            <button 
                                                onClick={() => encaisserPaiement(c, 'MVola')}
                                                disabled={loading}
                                                style={btnStyle('#f1c40f', '#000')}>🇲📱 MVola</button>
                                        </div>
                                    ) : (
                                        <span style={{ color: '#27ae60', fontWeight: 'bold' }}>✅ Payé</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- STYLES ---

const paddingStyle = { padding: '15px' };

const statCard = (mode) => ({
    flex: 1,
    padding: '20px',
    borderRadius: '10px',
    color: 'white',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    backgroundColor: mode === 'MVola' ? '#f39c12' : mode === 'Espece' ? '#27ae60' : '#95a5a6',
    minWidth: '200px'
});

const statusBadge = (statut) => ({
    padding: '5px 12px',
    borderRadius: '15px',
    fontSize: '12px',
    fontWeight: 'bold',
    backgroundColor: statut === 'REUSSI' ? '#d4edda' : '#fff3cd',
    color: statut === 'REUSSI' ? '#155724' : '#856404'
});

const btnStyle = (color, textColor = 'white') => ({
    backgroundColor: color,
    color: textColor,
    border: 'none',
    padding: '8px 12px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: '0.3s opacity',
    opacity: '0.9'
});

export default GestionPaiements;