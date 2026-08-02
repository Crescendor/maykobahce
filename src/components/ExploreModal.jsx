import React, { useState } from 'react';
import { X, Sparkles, MapPin, Calendar, Lock, MessageSquare } from 'lucide-react';
import InstagramIcon from './InstagramIcon';

export default function ExploreModal({ isOpen, onClose, flowers, onSelectFlower }) {
  const [filter, setFilter] = useState('all'); // 'all', 'recent', 'with_notes', 'private'

  if (!isOpen) return null;

  const filteredFlowers = flowers.filter((f) => {
    if (filter === 'with_notes') return Boolean(f.note);
    if (filter === 'private') return f.isPrivate;
    return true;
  });

  // Sort by date (latest first if 'recent' or default)
  const sortedFlowers = [...filteredFlowers].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <div style={styles.overlay} className="animate-fade-in">
      <div style={styles.card} className="glass-card-light animate-slide-up">
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>🌸 Çiçek Bahçesini Keşfet</h2>
            <p style={styles.subtitle}>Herkesin diktiği çiçekleri inceleyin ve ziyarete gidin</p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Filter Pills */}
        <div style={styles.filterBar}>
          <button
            style={{ ...styles.filterPill, ...(filter === 'all' ? styles.activePill : {}) }}
            onClick={() => setFilter('all')}
          >
            Tüm Çiçekler ({flowers.length})
          </button>
          <button
            style={{ ...styles.filterPill, ...(filter === 'with_notes' ? styles.activePill : {}) }}
            onClick={() => setFilter('with_notes')}
          >
            💬 Notlu Çiçekler
          </button>
          <button
            style={{ ...styles.filterPill, ...(filter === 'private' ? styles.activePill : {}) }}
            onClick={() => setFilter('private')}
          >
            🔒 Gizli Notlar
          </button>
        </div>

        {/* Flowers Grid Feed */}
        <div style={styles.gridContainer}>
          {sortedFlowers.length > 0 ? (
            sortedFlowers.map((flower) => {
              const formattedDate = new Date(flower.createdAt).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'short'
              });

              return (
                <div
                  key={flower.id}
                  style={styles.flowerCard}
                  onClick={() => {
                    onSelectFlower(flower);
                    onClose();
                  }}
                >
                  <div style={styles.cardHeader}>
                    <div style={styles.avatarBadge}>🌸</div>
                    <div>
                      <h4 style={styles.creatorName}>{flower.name || 'Anonim'}</h4>
                      {flower.instagram && (
                        <p style={styles.igText}>
                          <InstagramIcon size={12} /> {flower.instagram}
                        </p>
                      )}
                    </div>
                  </div>

                  <p style={styles.noteSnippet}>
                    {flower.isPrivate ? (
                      <span style={{ color: '#b45309', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Lock size={12} /> Şifreli Gizli Not
                      </span>
                    ) : flower.note ? (
                      `"${flower.note}"`
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Henüz yazılı not eklenmemiş</span>
                    )}
                  </p>

                  <div style={styles.cardFooter}>
                    <span style={styles.dateText}>
                      <Calendar size={12} /> {formattedDate}
                    </span>
                    <button type="button" className="btn-secondary" style={styles.visitBtn}>
                      <MapPin size={12} /> Ziyaret Et
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={styles.emptyState}>
              <p>Bu filtrede henüz çiçek bulunmuyor 🌿</p>
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
    background: 'rgba(10, 25, 15, 0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1250,
    padding: 16
  },
  card: {
    width: '100%',
    maxWidth: 780,
    maxHeight: '85vh',
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
    fontSize: '1.4rem',
    fontWeight: 700,
    color: '#0f172a'
  },
  subtitle: {
    fontSize: '0.84rem',
    color: '#64748b'
  },
  closeBtn: {
    background: 'rgba(0,0,0,0.06)',
    border: 'none',
    width: 36,
    height: 36,
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  filterBar: {
    display: 'flex',
    gap: 8,
    overflowX: 'auto',
    marginBottom: 16,
    paddingBottom: 4
  },
  filterPill: {
    padding: '7px 14px',
    borderRadius: 99,
    border: '1px solid #cbd5e1',
    background: '#f8fafc',
    color: '#475569',
    fontSize: '0.84rem',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease'
  },
  activePill: {
    background: '#10b981',
    color: '#ffffff',
    borderColor: '#059669',
    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 14,
    overflowY: 'auto',
    flex: 1,
    paddingRight: 4
  },
  flowerCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 18,
    padding: 14,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'all 0.2s ease',
    boxShadow: 'var(--shadow-sm)'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8
  },
  avatarBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: '#d8f3dc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.1rem'
  },
  creatorName: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: '#0f172a'
  },
  igText: {
    fontSize: '0.75rem',
    color: '#e1306c',
    display: 'flex',
    alignItems: 'center',
    gap: 3
  },
  noteSnippet: {
    fontSize: '0.84rem',
    color: '#334155',
    fontStyle: 'italic',
    lineHeight: 1.4,
    marginBottom: 10,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTop: '1px solid #f1f5f9',
    paddingTop: 8
  },
  dateText: {
    fontSize: '0.74rem',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  visitBtn: {
    padding: '4px 10px',
    fontSize: '0.76rem',
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  emptyState: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: 40,
    color: '#64748b'
  }
};
