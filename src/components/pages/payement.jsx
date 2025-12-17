import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

// 🔗 URL du serveur en dur – Modifiable facilement ici
const API_URL = "https://heldosseva.duckdns.org";

const GestionPaiements = () => {
  const [consultations, setConsultations] = useState([]);
  const [stats, setStats] = useState({
    Espece: { nombre: 0, total: 0 },
    MVola: { nombre: 0, total: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [tempPrice, setTempPrice] = useState('');
  const priceInputRef = useRef(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedConsult, setSelectedConsult] = useState(null);
  const [paymentMode, setPaymentMode] = useState('Espece');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // --- Récupération des données ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [consultResponse, statsResponse] = await Promise.all([
        axios.get(`${API_URL}/consultations-paiements`),
        axios.get(`${API_URL}/paiements/stats`)
      ]);

      const data = consultResponse.data.map(c => ({
        ...c,
        prix: Number(c.prix) || 0,
        statut: c.statut || null,
        modePaiement: c.modePaiement || null
      }));
      setConsultations(data);

      const newStats = {
        Espece: { nombre: 0, total: 0 },
        MVola: { nombre: 0, total: 0 }
      };
      statsResponse.data.forEach(s => {
        if (s.modePaiement in newStats && s.statut === 'REUSSI') {
          newStats[s.modePaiement] = { nombre: s.nombre, total: Number(s.total) };
        }
      });
      setStats(newStats);

    } catch (err) {
      console.error("Erreur API :", err);
      if (err.code === 'ERR_NETWORK') {
        setError("Impossible de contacter le serveur. Vérifiez votre connexion ou le certificat HTTPS.");
      } else if (err.response?.status === 404) {
        setError("Route non trouvée. Vérifiez l'URL du serveur.");
      } else {
        setError(`Erreur : ${err.response?.data?.error || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Focus sur input prix
  useEffect(() => {
    if (editingPriceId && priceInputRef.current) {
      priceInputRef.current.focus();
      priceInputRef.current.select();
    }
  }, [editingPriceId]);

  // --- Édition du prix ---
  const startEditPrice = (consult) => {
    if (consult.statut === 'REUSSI') return;
    setEditingPriceId(consult.idConsult);
    setTempPrice(consult.prix || '');
  };

  const cancelEditPrice = () => {
    setEditingPriceId(null);
    setTempPrice('');
  };

  const savePrice = async (idConsult) => {
    const newPrice = parseFloat(tempPrice);
    if (isNaN(newPrice) || newPrice < 0) {
      alert("Prix invalide");
      return;
    }

    try {
      await axios.put(`${API_URL}/consultations/${idConsult}`, { prix: newPrice });
      setConsultations(prev =>
        prev.map(c => c.idConsult === idConsult ? { ...c, prix: newPrice } : c)
      );
      cancelEditPrice();
    } catch (err) {
      alert("Erreur lors de la sauvegarde du prix");
      console.error(err);
    }
  };

  // --- Validation numéro MVola ---
  const isValidPhone = (num) => {
    const cleaned = num.replace(/\s/g, '');
    return /^034\d{7}$/.test(cleaned) || /^033\d{7}$/.test(cleaned);
  };

  // --- Soumission paiement ---
  const submitPayment = async (e) => {
    e.preventDefault();

    if (selectedConsult.prix <= 0) {
      alert("Veuillez d'abord définir un prix supérieur à 0");
      return;
    }

    if (paymentMode === 'MVola' && !isValidPhone(phone)) {
      alert("Numéro MVola invalide ! Doit commencer par 033 ou 034 suivi de 7 chiffres.\nEx: 034 12 345 67");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        idConsult: selectedConsult.idConsult,
        montant: selectedConsult.prix,
        modePaiement: paymentMode,
        numeroClient: paymentMode === 'MVola' ? phone.replace(/\s/g, '') : undefined
      };

      const res = await axios.post(`${API_URL}/api/paiements`, payload);

      if (paymentMode === 'Espece') {
        alert("Paiement en espèces enregistré avec succès !");
      } else {
        alert(
          "Demande MVola envoyée avec succès !\n" +
          "Le patient doit confirmer le paiement sur son téléphone.\n\n" +
          (res.data.correlationId ? `Référence : ${res.data.correlationId}` : "")
        );
      }

      setShowModal(false);
      setPhone('');
      setPaymentMode('Espece');
      fetchData();

    } catch (err) {
      console.error("Erreur paiement :", err);
      const msg = err.response?.data?.error || "Erreur inconnue lors du paiement";
      alert("Erreur : " + msg);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Statut visuel ---
  const getPaymentStatus = (c) => {
    if (!c.statut) return { text: "Non payé", color: "#e74c3c" };
    if (c.statut === 'REUSSI') return { text: "Payé", color: "#27ae60" };
    if (c.statut === 'EN_ATTENTE') return { text: "En attente (MVola)", color: "#f39c12" };
    if (c.statut === 'ECHOUE') return { text: "Échoué", color: "#c0392b" };
    return { text: c.statut, color: "#7f8c8d" };
  };

  if (loading) return <div style={loaderStyle}>Chargement...</div>;
  if (error) return (
    <div style={errorStyle}>
      <strong>Erreur :</strong> {error}
      <button onClick={fetchData} style={{ marginLeft: '10px', padding: '8px 16px' }}>
        Réessayer
      </button>
    </div>
  );

  return (
    <div style={containerStyle}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#2c3e50' }}>
        Gestion des Paiements
      </h1>

      {/* Statistiques */}
      <div style={statsContainer}>
        <div style={statCard('Espece')}>
          <h3>Espèces</h3>
          <p style={{ fontSize: '32px', margin: '15px 0', fontWeight: 'bold' }}>
            {stats.Espece.total.toLocaleString()} Ar
          </p>
          <small>{stats.Espece.nombre} paiement{stats.Espece.nombre > 1 ? 's' : ''}</small>
        </div>
        <div style={statCard('MVola')}>
          <h3>MVola</h3>
          <p style={{ fontSize: '32px', margin: '15px 0', fontWeight: 'bold' }}>
            {stats.MVola.total.toLocaleString()} Ar
          </p>
          <small>{stats.MVola.nombre} paiement{stats.MVola.nombre > 1 ? 's' : ''}</small>
        </div>
      </div>

      {/* Tableau */}
      <div style={tableWrapper}>
        <table style={tableStyle}>
          <thead>
            <tr style={headerRowStyle}>
              <th style={{ width: '80px' }}>#ID</th>
              <th>Patient</th>
              <th style={{ width: '140px' }}>Date</th>
              <th style={{ width: '140px' }}>Prix</th>
              <th style={{ width: '180px' }}>Statut Paiement</th>
              <th style={{ width: '120px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {consultations.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '50px', color: '#95a5a6' }}>
                  Aucune consultation enregistrée
                </td>
              </tr>
            ) : (
              consultations.map(c => {
                const status = getPaymentStatus(c);
                const canEditPrice = c.statut !== 'REUSSI';
                const canPay = !c.statut && c.prix > 0;

                return (
                  <tr key={c.idConsult} style={rowStyle}>
                    <td><strong>#{c.idConsult}</strong></td>
                    <td><strong>{c.prenomPatient} {c.nomPatient}</strong></td>
                    <td>{new Date(c.dateConsult).toLocaleDateString('fr-MG')}</td>
                    <td>
                      {editingPriceId === c.idConsult ? (
                        <input
                          ref={priceInputRef}
                          type="number"
                          value={tempPrice}
                          onChange={(e) => setTempPrice(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') savePrice(c.idConsult);
                            if (e.key === 'Escape') cancelEditPrice();
                          }}
                          onBlur={() => savePrice(c.idConsult)}
                          style={priceInputStyle}
                          min="0"
                        />
                      ) : (
                        <span
                          onClick={() => canEditPrice && startEditPrice(c)}
                          style={{
                            cursor: canEditPrice ? 'pointer' : 'default',
                            color: canEditPrice ? '#3498db' : '#95a5a6',
                            fontWeight: 'bold'
                          }}
                        >
                          {c.prix > 0 ? `${c.prix.toLocaleString()} Ar` : 'Définir prix'}
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ color: status.color, fontWeight: 'bold' }}>
                        {status.text}
                      </span>
                      {c.modePaiement && <small> ({c.modePaiement})</small>}
                    </td>
                    <td>
                      {canPay ? (
                        <button
                          onClick={() => {
                            setSelectedConsult(c);
                            setShowModal(true);
                          }}
                          style={payBtn}
                        >
                          Régler
                        </button>
                      ) : (
                        <span style={{ color: '#27ae60', fontWeight: 'bold' }}>✓</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Paiement */}
      {showModal && selectedConsult && (
        <div style={overlay} onClick={() => setShowModal(false)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Régler la consultation #{selectedConsult.idConsult}</h2>
            <p><strong>Patient :</strong> {selectedConsult.prenomPatient} {selectedConsult.nomPatient}</p>
            <p><strong>Montant dû :</strong> <span style={{ fontSize: '20px', color: '#27ae60' }}>
              {selectedConsult.prix.toLocaleString()} Ar
            </span></p>

            <form onSubmit={submitPayment}>
              <label style={{ display: 'block', margin: '15px 0 8px', fontWeight: 'bold' }}>
                Mode de paiement
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                style={inputFull}
              >
                <option value="Espece">Espèces (immédiat)</option>
                <option value="MVola">MVola (demande au patient)</option>
              </select>

              {paymentMode === 'MVola' && (
                <div>
                  <label style={{ display: 'block', margin: '20px 0 8px', fontWeight: 'bold' }}>
                    Numéro MVola du patient
                  </label>
                  <input
                    type="text"
                    placeholder="034 12 345 67"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={inputFull}
                    required
                  />
                  <small style={{ color: '#e67e22' }}>
                    Doit commencer par <strong>033</strong> ou <strong>034</strong>
                  </small>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
                <button type="submit" disabled={submitting} style={confirmBtn}>
                  {submitting ? 'Envoi...' : `Confirmer le paiement`}
                </button>
                <button type="button" onClick={() => setShowModal(false)} style={cancelBtn}>
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

// --- Styles ---
const containerStyle = { padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Segoe UI, Arial, sans-serif' };
const statsContainer = { display: 'flex', gap: '30px', marginBottom: '50px', justifyContent: 'center', flexWrap: 'wrap' };
const statCard = (mode) => ({
  flex: '1 1 280px',
  padding: '30px',
  borderRadius: '16px',
  textAlign: 'center',
  color: 'white',
  backgroundColor: mode === 'MVola' ? '#e67e22' : '#27ae60',
  boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
});
const tableWrapper = { background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 6px 25px rgba(0,0,0,0.1)' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const headerRowStyle = { background: '#2c3e50', color: 'white' };
const rowStyle = { borderBottom: '1px solid #ecf0f1', height: '70px' };
const priceInputStyle = { width: '110px', padding: '8px', borderRadius: '6px', border: '2px solid #3498db', fontSize: '16px' };
const payBtn = { background: '#3498db', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modal = { background: 'white', padding: '35px', borderRadius: '16px', width: '90%', maxWidth: '500px', boxShadow: '0 15px 40px rgba(0,0,0,0.3)' };
const inputFull = { width: '100%', padding: '14px', margin: '8px 0', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #bdc3c7', fontSize: '16px' };
const confirmBtn = { background: '#27ae60', color: 'white', border: 'none', padding: '14px', flex: 1, borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' };
const cancelBtn = { background: '#e74c3c', color: 'white', border: 'none', padding: '14px', flex: 1, borderRadius: '8px', fontSize: '16px', cursor: 'pointer' };
const errorStyle = { padding: '25px', background: '#f8d7da', color: '#721c24', borderRadius: '10px', margin: '20px', textAlign: 'center', fontSize: '18px' };
const loaderStyle = { textAlign: 'center', padding: '100px', fontSize: '24px', color: '#3498db' };

export default GestionPaiements;