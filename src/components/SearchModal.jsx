import React, { useState } from 'react';
import { X, Search, MapPin, User } from 'lucide-react';
import InstagramIcon from './InstagramIcon';

export default function SearchModal({ isOpen, onClose, flowers, onSelectFlower }) {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filteredFlowers = flowers.filter((f) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = (f.name || '').toLowerCase().includes(q);
    const igMatch = (f.instagram || '').toLowerCase().includes(q);
    const noteMatch = (f.note || '').toLowerCase().includes(q);
    return nameMatch || igMatch || noteMatch;
  });

  return (
    <div style={styles.overlay} className="animate-fade-in">
      <div style={styles.card} className="glass-card-light animate-slide-up">
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h3 style={styles.title}>🔍 Bahçede Çiçek Ara</h3>
            <p style={styles.subtitle}>{flowers.length} çiçek arasında arama yapın</p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div className="form-group" style={{ marginBottom: 16 }}>
          <div style={styles.inputWrapper}>
            <Search size={18} style={styles.searchIcon} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 40 }}
              placeholder="İsim veya @instagram yazın..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Results List */}
        <div style={styles.listContainer}>
          {filteredFlowers.length > 0 ? (
            filteredFlowers.slice(0, 50).map((flower) => (
              <div
                key={flower.id}
                style={styles.flowerRow}
                onClick={() => {
                  onSelectFlower(flower);
                  onClose();
                }}
              >
                <div style={styles.rowLeft}>
                  <div style={styles.flowerIconBadge}>🌸</div>
                  <div>
                    <h4 style={styles.flowerName}>
                      {flower.name || 'Anonim'}
                    </h4>
                    {flower.instagram && (
                      <p style={styles.flowerIg}>
                        <InstagramIcon size={12} /> {flower.instagram}
                      </p>
                    )}
                  </div>
                </div>

                <button type="button" className="btn-secondary" style={styles.goBtn}>
                  <MapPin size={14} /> Çiçeğe Git
                </button>
              </div>
            ))
          ) : (
            <div style={styles.emptyState}>
              <p>Aramanızla eşleşen çiçek bulunamadı 🌿</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(10, 25, 15, 0.65)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1200,
    padding: 16
  },
  card: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '80vh',
    borderRadius: 24,
    padding: 24,
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#0f172a'
  },
  subtitle: {
    fontSize: '0.82rem',
    color: '#64748b'
  },
  closeBtn: {
    background: 'rgba(0,0,0,0.06)',
    border: 'none',
    width: 34,
    height: 34,
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    color: '#94a3b8'
  },
  listContainer: {
    overflowY: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    paddingRight: 4
  },
  flowerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    borderRadius: 14,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  rowLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12
  },
  flowerIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    background: '#d8f3dc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem'
  },
  flowerName: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#0f172a'
  },
  flowerIg: {
    fontSize: '0.78rem',
    color: '#e1306c',
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  goBtn: {
    padding: '6px 12px',
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  emptyState: {
    textAlign: 'center',
    padding: 32,
    color: '#64748b',
    fontSize: '0.9rem'
  }
};
