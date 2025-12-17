
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = "https://heldosseva.duckdns.org"; 

const GestionPaiements = () => {
    const [consultations, setConsultations] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // États pour le formulaire
    const [showModal, setShowModal] = useState(false);
    const [selectedConsultId, setSelectedConsultId] = useState('');
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

    // Soumettre le paiement
    const submitPayment = async (e) => {
        e.preventDefault();
        if(!selectedConsultId) return alert("Veuillez choisir une consultation");

        const consult = consultations.find(c => c.idConsult === parseInt(selectedConsultId));
        
        setLoading(true);
        try {
            const payload = {
                idConsult: consult.idConsult,
                montant: consult.prix,
                modePaiement: paymentMode,
                numeroClient: paymentMode === 'MVola' ? phone : null
            };

            const response = await axios.post(`${API_URL}/api/paiements`, payload);
            alert(response.data.message);
            
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (err) {
            alert("Erreur : " + (err.response?.data?.error || "Échec du paiement"));
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedConsultId('');
        setPhone('');
        setPaymentMode('Espece');
    };

    return (
        <div style={{ padding: '30px', backgroundColor: '#f4f7f6', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ color: '#2c3e50', margin: 0 }}>💰 Gestion Financière</h1>
                {/* --- LE BOUTON AJOUTER PAIEMENT --- */}
                <button 
                    onClick={() => setShowModal(true)} 
                    style={mainBtnStyle}>
                    + Nouveau Paiement
                </button>
            </div>

            {/* --- DASHBOARD --- */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                {stats.map(s => (
                    <div key={s.modePaiement} style={statCard(s.modePaiement)}>
                        <h4 style={{ margin: 0, opacity: 0.8 }}>Total {s.modePaiement}</h4>
                        <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '10px 0' }}>{s.total.toLocaleString()} Ar</p>
                        <small>{s.nombre} encaissements</small>
                    </div>
                ))}
            </div>

            {/* --- TABLEAU --- */}
            <div style={tableContainer}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#ecf0f1', textAlign: 'left' }}>
                            <th style={paddingStyle}>ID Consult</th>
                            <th style={paddingStyle}>Date</th>
                            <th style={paddingStyle}>Montant</th>
                            <th style={paddingStyle}>Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {consultations.map(c => (
                            <tr key={c.idConsult} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={paddingStyle}>#{c.idConsult}</td>
                                <td style={paddingStyle}>{new Date(c.dateConsult).toLocaleDateString()}</td>
                                <td style={paddingStyle}><strong>{c.prix} Ar</strong></td>
                                <td style={paddingStyle}>
                                    <span style={statusBadge(c.statutPaiement)}>
                                        {c.statutPaiement || "NON PAYÉ"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL FORMULAIRE --- */}
            {showModal && (
                <div style={modalOverlay}>
                    <div style={modalContent}>
                        <h2 style={{marginTop: 0}}>Effectuer un Paiement</h2>
                        <form onSubmit={submitPayment}>
                            
                            <label style={labelStyle}>Sélectionner la Consultation :</label>
                            <select 
                                value={selectedConsultId} 
                                onChange={(e) => setSelectedConsultId(e.target.value)}
                                style={inputStyle}
                                required
                            >
                                <option value="">-- Choisir une consultation --</option>
                                {consultations
                                    .filter(c => c.statutPaiement !== 'REUSSI')
                                    .map(c => (
                                        <option key={c.idConsult} value={c.idConsult}>
                                            Consultation #{c.idConsult} - {c.prix} Ar
                                        </option>
                                    ))
                                }
                            </select>

                            <label style={labelStyle}>Mode de Paiement :</label>
                            <select 
                                value={paymentMode} 
                                onChange={(e) => setPaymentMode(e.target.value)}
                                style={inputStyle}
                            >
                                <option value="Espece">💵 Espèce</option>
                                <option value="MVola">🇲📱 MVola (STK Push)</option>
                            </select>

                            {paymentMode === 'MVola' && (
                                <>
                                    <label style={labelStyle}>Numéro MVola :</label>
                                    <input 
                                        type="text" 
                                        placeholder="034XXXXXXXX" 
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        style={inputStyle}
                                        required 
                                    />
                                </>
                            )}

                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button type="submit" disabled={loading} style={confirmBtn}>
                                    {loading ? 'Connexion MVola...' : 'Valider le Paiement'}
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} style={cancelBtn}>
                                    Fermer
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
const mainBtnStyle = {
    backgroundColor: '#3498db',
    color: 'white',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px'
};

const tableContainer = {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    overflow: 'hidden'
};

const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: '600', color: '#34495e', marginTop: '15px' };

const inputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    boxSizing: 'border-box'
};

const modalOverlay = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
};

const modalContent = {
    backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '450px'
};

const confirmBtn = { backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', flex: 1, cursor: 'pointer', fontWeight: 'bold' };
const cancelBtn = { backgroundColor: '#95a5a6', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer' };

const paddingStyle = { padding: '15px' };

const statCard = (mode) => ({
    flex: 1, padding: '20px', borderRadius: '12px', color: 'white',
    backgroundColor: mode === 'MVola' ? '#f39c12' : '#27ae60',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
});

const statusBadge = (statut) => ({
    padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
    backgroundColor: statut === 'REUSSI' ? '#e8f5e9' : '#fff3e0',
    color: statut === 'REUSSI' ? '#2e7d32' : '#ef6c00'
});

export default GestionPaiements;