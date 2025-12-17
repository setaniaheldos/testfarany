import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = "https://heldosseva.duckdns.org";

const GestionPaiements = () => {
    const [consultations, setConsultations] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [selectedConsult, setSelectedConsult] = useState(null);
    const [paymentMode, setPaymentMode] = useState('Espece');
    const [phone, setPhone] = useState('');

    const fetchData = async () => {
        try {
            const [resConsult, resStats] = await Promise.all([
                axios.get(`${API_URL}/consultations-paiements`),   // Nouvelle route avec jointure
                axios.get(`${API_URL}/paiements/stats`)
            ]);
            setConsultations(resConsult.data);
            setStats(resStats.data);
        } catch (err) {
            console.error("Erreur de chargement:", err);
            alert("Impossible de charger les données. Vérifiez que le serveur est en ligne.");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openPaymentForm = (consult) => {
        setSelectedConsult(consult);
        setShowModal(true);
        setPaymentMode('Espece');
        setPhone('');
    };

    const submitPayment = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                idConsult: selectedConsult.idConsult,
                montant: selectedConsult.prix || 0,
                modePaiement: paymentMode,
                numeroClient: paymentMode === 'MVola' ? phone : null
            };

            const response = await axios.post(`${API_URL}/api/paiements`, payload);
            alert(response.data.message || "Paiement enregistré !");

            setShowModal(false);
            fetchData(); // Rafraîchir
        } catch (err) {
            const errorMsg = err.response?.data?.error || "Erreur lors du paiement";
            alert("Erreur : " + errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#f9f9f9', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
            <h1 style={{ color: '#2c3e50', textAlign: 'center' }}>💰 Gestion des Paiements</h1>

            {/* --- STATS --- */}
            <h2 style={{ color: '#2c3e50' }}>📊 Statistiques Financières</h2>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '40px' }}>
                {stats.map(s => (
                    <div key={s.modePaiement} style={statCard(s.modePaiement)}>
                        <h4 style={{ margin: 0 }}>Total {s.modePaiement === 'Espece' ? 'Espèce' : 'MVola'}</h4>
                        <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '10px 0' }}>
                            {s.total.toLocaleString()} Ar
                        </p>
                        <small>{s.nombre} paiement{s.nombre > 1 ? 's' : ''}</small>
                    </div>
                ))}
            </div>

            {/* --- LISTE DES CONSULTATIONS --- */}
            <h2 style={{ color: '#2c3e50' }}>📋 Consultations & Paiements</h2>
            <div style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#34495e', color: 'white' }}>
                            <th style={thStyle}>ID</th>
                            <th style={thStyle}>Date Consultation</th>
                            <th style={thStyle}>Patient</th>
                            <th style={thStyle}>Praticien</th>
                            <th style={thStyle}>Prix</th>
                            <th style={thStyle}>Statut Paiement</th>
                            <th style={thStyle}>Mode</th>
                            <th style={thStyle}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {consultations.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#95a5a6' }}>
                                    Aucune consultation enregistrée
                                </td>
                            </tr>
                        ) : (
                            consultations.map(c => (
                                <tr key={c.idConsult} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={tdStyle}>{c.idConsult}</td>
                                    <td style={tdStyle}>{new Date(c.dateConsult).toLocaleDateString('fr-FR')}</td>
                                    <td style={tdStyle}>{c.prenomPatient} {c.nomPatient}</td>
                                    <td style={tdStyle}>Dr. {c.prenomPraticien} {c.nomPraticien}</td>
                                    <td style={tdStyle}><strong>{c.prix ? `${c.prix} Ar` : 'Non défini'}</strong></td>
                                    <td style={tdStyle}>
                                        <span style={statusBadge(c.statut)}>
                                            {c.statut || 'NON PAYÉ'}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>{c.modePaiement || '-'}</td>
                                    <td style={tdStyle}>
                                        {c.statut !== 'REUSSI' ? (
                                            <button onClick={() => openPaymentForm(c)} style={btnStyle('#3498db')}>
                                                💳 Régler maintenant
                                            </button>
                                        ) : (
                                            <span style={{ color: '#27ae60', fontWeight: 'bold' }}>✅ Payé</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL PAIEMENT --- */}
            {showModal && selectedConsult && (
                <div style={modalOverlay}>
                    <div style={modalContent}>
                        <h3>💳 Enregistrer un Paiement</h3>
                        <p><strong>Consultation :</strong> #{selectedConsult.idConsult}</p>
                        <p><strong>Patient :</strong> {selectedConsult.prenomPatient} {selectedConsult.nomPatient}</p>
                        <p><strong>Montant :</strong> <span style={{ color: '#27ae60', fontSize: '20px' }}>{selectedConsult.prix} Ar</span></p>

                        <form onSubmit={submitPayment} style={{ marginTop: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                Mode de paiement :
                            </label>
                            <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} style={inputStyle}>
                                <option value="Espece">💵 Espèce</option>
                                <option value="MVola">📱 MVola</option>
                            </select>

                            {paymentMode === 'MVola' && (
                                <div style={{ marginTop: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Numéro MVola :
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="Ex: 034 12 345 67"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                        style={inputStyle}
                                    />
                                </div>
                            )}

                            <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
                                <button type="submit" disabled={loading} style={btnStyle('#27ae60')}>
                                    {loading ? 'En cours...' : 'Confirmer le Paiement'}
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} style={btnStyle('#e74c3c')}>
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

// Styles (inchangés mais légèrement améliorés)
const thStyle = { padding: '15px', textAlign: 'left' };
const tdStyle = { padding: '15px', verticalAlign: 'middle' };

const statCard = (mode) => ({
    flex: '1 1 250px',
    padding: '25px',
    borderRadius: '12px',
    color: 'white',
    backgroundColor: mode === 'MVola' ? '#f39c12' : '#27ae60',
    textAlign: 'center',
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
});

const statusBadge = (statut) => ({
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    backgroundColor: 
        statut === 'REUSSI' ? '#d4edda' : 
        statut === 'EN_ATTENTE' ? '#fff3cd' : 
        statut === 'ECHOUE' ? '#f8d7da' : '#f8f9fa',
    color: 
        statut === 'REUSSI' ? '#155724' : 
        statut === 'EN_ATTENTE' ? '#856404' : 
        statut === 'ECHOUE' ? '#721c24' : '#495057'
});

const btnStyle = (bgColor) => ({
    backgroundColor: bgColor,
    color: 'white',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px'
});

const inputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '16px',
    boxSizing: 'border-box'
};

const modalOverlay = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
};

const modalContent = {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '500px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
};

export default GestionPaiements;