import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = "https://heldosseva.duckdns.org"; 

const GestionPaiements = () => {
    const [consultations, setConsultations] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // États pour le formulaire de paiement
    const [showModal, setShowModal] = useState(false);
    const [selectedConsult, setSelectedConsult] = useState(null);
    const [paymentMode, setPaymentMode] = useState('Espece');
    const [phone, setPhone] = useState('');

    const fetchData = async () => {
        try {
            const [resConsult, resStats] = await Promise.all([
                axios.get(`${API_URL}/consultations`),
                axios.get(`${API_URL}/paiements/stats`)
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

    // Ouvrir le formulaire pour une consultation spécifique
    const openPaymentForm = (consult) => {
        setSelectedConsult(consult);
        setShowModal(true);
    };

    // Soumettre le paiement au backend
    const submitPayment = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                idConsult: selectedConsult.idConsult,
                montant: selectedConsult.prix,
                modePaiement: paymentMode,
                numeroClient: paymentMode === 'MVola' ? phone : null
            };

            const response = await axios.post(`${API_URL}/api/paiements`, payload);
            alert(response.data.message);
            
            setShowModal(false); // Fermer le formulaire
            setPhone('');        // Réinitialiser le téléphone
            fetchData();         // Rafraîchir les données
        } catch (err) {
            alert("Erreur : " + (err.response?.data?.error || "Transaction échouée"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#f9f9f9', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            
            {/* --- DASHBOARD STATS --- */}
            <h2 style={{ color: '#2c3e50' }}>📊 Tableau de Bord Financier</h2>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                {stats.map(s => (
                    <div key={s.modePaiement} style={statCard(s.modePaiement)}>
                        <h4 style={{ margin: 0 }}>Total {s.modePaiement}</h4>
                        <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>{s.total.toLocaleString()} Ar</p>
                        <small>{s.nombre} transactions</small>
                    </div>
                ))}
            </div>

            {/* --- LISTE DES CONSULTATIONS --- */}
            <h2 style={{ color: '#2c3e50' }}>💰 Liste des Consultations</h2>
            <div style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#34495e', color: 'white', textAlign: 'left' }}>
                            <th style={paddingStyle}>ID</th>
                            <th style={paddingStyle}>Date</th>
                            <th style={paddingStyle}>Prix</th>
                            <th style={paddingStyle}>Statut</th>
                            <th style={paddingStyle}>Action</th>
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
                                        <button 
                                            onClick={() => openPaymentForm(c)}
                                            style={btnStyle('#3498db')}>
                                            💳 Régler
                                        </button>
                                    ) : (
                                        <span style={{ color: '#27ae60', fontWeight: 'bold' }}>✅ Payé</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL : FORMULAIRE DE PAIEMENT --- */}
            {showModal && (
                <div style={modalOverlay}>
                    <div style={modalContent}>
                        <h3>Nouveau Paiement</h3>
                        <p>Consultation n°<strong>{selectedConsult?.idConsult}</strong></p>
                        <p>Montant à payer : <strong style={{color: '#27ae60'}}>{selectedConsult?.prix} Ar</strong></p>
                        <hr />
                        
                        <form onSubmit={submitPayment}>
                            <label style={{display: 'block', marginBottom: '10px'}}>Mode de paiement :</label>
                            <select 
                                value={paymentMode} 
                                onChange={(e) => setPaymentMode(e.target.value)}
                                style={inputStyle}
                            >
                                <option value="Espece">💵 Espèce</option>
                                <option value="MVola">🇲📱 MVola (API)</option>
                            </select>

                            {paymentMode === 'MVola' && (
                                <div style={{marginTop: '15px'}}>
                                    <label style={{display: 'block', marginBottom: '5px'}}>Numéro de téléphone :</label>
                                    <input 
                                        type="text" 
                                        placeholder="034XXXXXXXX" 
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required 
                                        style={inputStyle}
                                    />
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                                <button type="submit" disabled={loading} style={btnStyle('#27ae60', '#fff', '100%')}>
                                    {loading ? 'Traitement...' : 'Confirmer le Paiement'}
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} style={btnStyle('#e74c3c', '#fff', '100%')}>
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
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
    backgroundColor: mode === 'MVola' ? '#f39c12' : mode === 'Espece' ? '#27ae60' : '#95a5a6',
    minWidth: '200px'
});

const statusBadge = (statut) => ({
    padding: '5px 12px',
    borderRadius: '15px',
    fontSize: '11px',
    fontWeight: 'bold',
    backgroundColor: statut === 'REUSSI' ? '#d4edda' : '#fff3cd',
    color: statut === 'REUSSI' ? '#155724' : '#856404'
});

const btnStyle = (color, textColor = 'white', width = 'auto') => ({
    backgroundColor: color,
    color: textColor,
    border: 'none',
    padding: '10px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    width: width
});

const inputStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '16px',
    boxSizing: 'border-box'
};

const modalOverlay = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
};

const modalContent = {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    width: '400px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
};

export default GestionPaiements;