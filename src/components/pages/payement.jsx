import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = "https://heldosseva.duckdns.org";

const GestionPaiements = () => {
    const [consultations, setConsultations] = useState([]);
    const [stats, setStats] = useState([
        { modePaiement: 'Espece', nombre: 0, total: 0 },
        { modePaiement: 'MVola', nombre: 0, total: 0 }
    ]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingPriceId, setEditingPriceId] = useState(null);
    const [tempPrice, setTempPrice] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [selectedConsult, setSelectedConsult] = useState(null);
    const [paymentMode, setPaymentMode] = useState('Espece');
    const [phone, setPhone] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // --- Récupération des données du backend ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const consultResponse = await axios.get(`${API_URL}/consultations-paiements`);
            const data = consultResponse.data.map(c => ({
                ...c,
                prix: c.prix || 0,
                statut: c.statut || 'EN_ATTENTE'
            }));
            setConsultations(data);

            const statsResponse = await axios.get(`${API_URL}/paiements/stats`);
            setStats([
                { modePaiement: 'Espece', nombre: 0, total: 0 },
                { modePaiement: 'MVola', nombre: 0, total: 0 },
                ...statsResponse.data
            ].reduce((acc, cur) => {
                const index = acc.findIndex(s => s.modePaiement === cur.modePaiement);
                if (index !== -1) acc[index] = cur;
                else acc.push(cur);
                return acc;
            }, []));
        } catch (err) {
            console.error("Erreur API :", err);
            setError(`Erreur de connexion au serveur (${err.response?.status || 'Connexion refusée'})`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Enregistrer le prix édité ---
    const savePrice = async (idConsult) => {
        const newPrice = parseFloat(tempPrice);
        if (isNaN(newPrice) || newPrice < 0) return alert("Prix invalide");
        try {
            await axios.put(`${API_URL}/consultations/${idConsult}`, { prix: newPrice });
            setConsultations(prev => prev.map(c => c.idConsult === idConsult ? { ...c, prix: newPrice } : c));
            setEditingPriceId(null);
        } catch (err) {
            alert("Erreur mise à jour prix");
        }
    };

    // --- Paiement ---
    const submitPayment = async (e) => {
        e.preventDefault();
        if (!selectedConsult) return;
        setSubmitting(true);
        try {
            const payload = {
                idConsult: selectedConsult.idConsult,
                montant: selectedConsult.prix,
                modePaiement: paymentMode,
                numeroClient: paymentMode === 'MVola' ? phone.trim() : null
            };
            await axios.post(`${API_URL}/api/paiements`, payload);
            alert("Paiement validé !");
            setShowModal(false);
            setPhone('');
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Erreur lors du paiement");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div style={loaderStyle}>Chargement des données...</div>;

    return (
        <div style={containerStyle}>
            <h1 style={{ textAlign: 'center' }}>💰 Gestion des Paiements</h1>
            
            {error && <div style={errorStyle}>{error} <button onClick={fetchData}>Réessayer</button></div>}

            {/* Statistiques */}
            <div style={statsContainer}>
                {stats.map(s => (
                    <div key={s.modePaiement} style={statCard(s.modePaiement)}>
                        <h3>{s.modePaiement}</h3>
                        <p style={{ fontSize: '24px' }}>{s.total?.toLocaleString()} Ar</p>
                        <small>{s.nombre} transactions</small>
                    </div>
                ))}
            </div>

            {/* Tableau */}
            <div style={tableWrapper}>
                <table style={tableStyle}>
                    <thead>
                        <tr style={headerRowStyle}>
                            <th>ID</th><th>Patient</th><th>Prix</th><th>Statut</th><th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {consultations.map(c => (
                            <tr key={c.idConsult} style={rowStyle}>
                                <td>#{c.idConsult}</td>
                                <td>{c.prenomPatient} {c.nomPatient}</td>
                                <td>
                                    {editingPriceId === c.idConsult ? (
                                        <input 
                                            type="number" 
                                            value={tempPrice} 
                                            onChange={e => setTempPrice(e.target.value)}
                                            onBlur={() => savePrice(c.idConsult)}
                                            autoFocus
                                        />
                                    ) : (
                                        <span 
                                            onClick={() => {setEditingPriceId(c.idConsult); setTempPrice(c.prix)}} 
                                            style={{cursor:'pointer', color:'#3498db'}}
                                        >
                                            {c.prix ? `${c.prix} Ar` : 'Définir prix'}
                                        </span>
                                    )}
                                </td>
                                <td>{c.statut === 'REUSSI' ? '✅ Payé' : '❌ Non payé'}</td>
                                <td>
                                    {c.statut !== 'REUSSI' && c.prix > 0 && (
                                        <button onClick={() => {setSelectedConsult(c); setShowModal(true)}} style={payBtn}>Régler</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal de Paiement */}
            {showModal && selectedConsult && (
                <div style={overlay}>
                    <div style={modal}>
                        <h2>Paiement pour #{selectedConsult.idConsult}</h2>
                        <form onSubmit={submitPayment}>
                            <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} style={inputFull}>
                                <option value="Espece">Espèce</option>
                                <option value="MVola">MVola</option>
                            </select>
                            {paymentMode === 'MVola' && (
                                <input type="text" placeholder="Numéro téléphone" value={phone} onChange={e => setPhone(e.target.value)} style={inputFull} required />
                            )}
                            <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
                                <button type="submit" disabled={submitting} style={confirmBtn}>
                                    Confirmer {selectedConsult.prix} Ar
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} style={cancelBtn}>Annuler</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Styles ---
const containerStyle = { padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' };
const statsContainer = { display: 'flex', gap: '20px', marginBottom: '30px' };
const statCard = (mode) => ({ flex: 1, padding: '20px', borderRadius: '10px', color: 'white', backgroundColor: mode === 'MVola' ? '#f39c12' : '#27ae60' });
const tableWrapper = { background: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', overflow: 'hidden' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const headerRowStyle = { background: '#34495e', color: 'white' };
const rowStyle = { borderBottom: '1px solid #eee' };
const payBtn = { background: '#3498db', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' };
const overlay = { position: 'fixed', top:0, left:0, right:0, bottom:0, background: 'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center' };
const modal = { background: 'white', padding: '30px', borderRadius: '10px', width: '400px' };
const inputFull = { width: '100%', padding: '10px', margin: '10px 0', boxSizing: 'border-box' };
const confirmBtn = { background: '#27ae60', color: 'white', border:'none', padding:'10px', flex:1, borderRadius:'5px' };
const cancelBtn = { background: '#e74c3c', color: 'white', border:'none', padding:'10px', flex:1, borderRadius:'5px' };
const errorStyle = { padding: '15px', background: '#f8d7da', color: '#721c24', borderRadius: '5px', marginBottom: '20px' };
const loaderStyle = { textAlign: 'center', padding: '100px', fontSize: '20px' };

export default GestionPaiements;
