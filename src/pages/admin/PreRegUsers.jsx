import React, { useState, useEffect } from 'react';
import { getPreRegistrations, getPromoCodeUsageStats } from '../../appwrite/admin';

const PreRegUsers = () => {
  const [preRegs, setPreRegs] = useState([]);
  const [promoUsages, setPromoUsages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', type: '' });
  const [searchEmail, setSearchEmail] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [preRegData, promoData] = await Promise.all([
      getPreRegistrations(filter),
      getPromoCodeUsageStats(),
    ]);
    setPreRegs(preRegData);
    setPromoUsages(promoData.usages);
    setLoading(false);
  };

  const handleFilterChange = (key, value) => {
    setFilter({ ...filter, [key]: value });
  };

  const applyFilters = () => {
    loadData();
  };

  // Calculate owed benefits
  const calculateOwed = () => {
    let totalMonths = 0;
    preRegs.forEach(p => {
      totalMonths += p.bonusMonthsEarned || 0;
    });
    return {
      months: totalMonths,
      value: (totalMonths * 14.99).toFixed(2),
    };
  };

  const owed = calculateOwed();

  // Filter by email search
  const filteredPreRegs = preRegs.filter(p => 
    !searchEmail || p.email.toLowerCase().includes(searchEmail.toLowerCase())
  );

  // Export to CSV
  const exportCSV = () => {
    const headers = ['Email', 'Name', 'Type', 'Promo Code', 'Uses', 'Bonus Months', 'Status', 'Plus Until', 'Created'];
    const rows = filteredPreRegs.map(p => [
      p.email,
      p.name || '',
      p.type,
      p.promoCode,
      p.promoCodeUses,
      p.bonusMonthsEarned,
      p.status,
      new Date(p.plusUntil).toLocaleDateString(),
      new Date(p.createdAt).toLocaleDateString(),
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pre-registrations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Loading pre-registrations...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
          Pre-Registrations
        </h1>
        <p style={{ color: 'var(--color-text-muted)', margin: '0.5rem 0 0' }}>
          Manage pre-registered users and their promo codes
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <div style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '10px',
          border: '1px solid var(--color-border)',
          padding: '1rem',
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {preRegs.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Total Pre-Regs
          </div>
        </div>
        <div style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '10px',
          border: '1px solid var(--color-border)',
          padding: '1rem',
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {preRegs.filter(p => p.type === 'paid').length}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Paid ($5)
          </div>
        </div>
        <div style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '10px',
          border: '1px solid var(--color-border)',
          padding: '1rem',
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {preRegs.filter(p => p.type === 'reviewer').length}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            From Reviews
          </div>
        </div>
        <div style={{
          backgroundColor: 'rgba(var(--color-accent-rgb), 0.1)',
          borderRadius: '10px',
          border: '1px solid var(--color-accent)',
          padding: '1rem',
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-accent)' }}>
            ${owed.value}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Owed Value ({owed.months} months)
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        padding: '1rem',
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <input
          type="text"
          placeholder="Search by email..."
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
            flex: 1,
            minWidth: '200px',
          }}
        />
        <select
          value={filter.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
          }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="converted">Converted</option>
        </select>
        <select
          value={filter.type}
          onChange={(e) => handleFilterChange('type', e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
          }}
        >
          <option value="">All Types</option>
          <option value="paid">Paid ($5)</option>
          <option value="free_slot">Free Slot</option>
          <option value="reviewer">Reviewer</option>
        </select>
        <button
          onClick={applyFilters}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: 'var(--color-accent)',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Apply
        </button>
        <button
          onClick={exportCSV}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          📥 Export CSV
        </button>
      </div>

      {/* Table */}
      <div style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Promo Code</th>
                <th style={thStyle}>Uses</th>
                <th style={thStyle}>Bonus</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Plus Until</th>
                <th style={thStyle}>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredPreRegs.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No pre-registrations found
                  </td>
                </tr>
              ) : (
                filteredPreRegs.map((p, i) => (
                  <tr key={p.$id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-border)' }}>
                    <td style={tdStyle}>{p.email}</td>
                    <td style={tdStyle}>{p.name || '—'}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        backgroundColor: p.type === 'paid' ? '#10b981' : p.type === 'reviewer' ? '#3b82f6' : '#f59e0b',
                        color: 'white',
                      }}>
                        {p.type}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <code style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: 'var(--color-bg-tertiary)',
                        fontSize: '0.75rem',
                      }}>
                        {p.promoCode}
                      </code>
                    </td>
                    <td style={tdStyle}>{p.promoCodeUses}</td>
                    <td style={tdStyle}>{p.bonusMonthsEarned} mo</td>
                    <td style={tdStyle}>
                      <span style={{
                        color: p.status === 'active' ? '#10b981' : p.status === 'expired' ? '#ef4444' : '#6b7280',
                      }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {new Date(p.plusUntil).toLocaleDateString()}
                    </td>
                    <td style={tdStyle}>
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Promo Code Usage Section */}
      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '1rem' }}>
          Recent Promo Code Usage
        </h2>
        <div style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <th style={thStyle}>Promo Code</th>
                  <th style={thStyle}>Referrer</th>
                  <th style={thStyle}>New User Email</th>
                  <th style={thStyle}>Date</th>
                </tr>
              </thead>
              <tbody>
                {promoUsages.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                      No promo code usage recorded yet
                    </td>
                  </tr>
                ) : (
                  promoUsages.slice(0, 20).map((u, i) => (
                    <tr key={u.$id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-border)' }}>
                      <td style={tdStyle}>
                        <code style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor: 'var(--color-bg-tertiary)',
                          fontSize: '0.75rem',
                        }}>
                          {u.promoCode}
                        </code>
                      </td>
                      <td style={tdStyle}>{u.referrerId.slice(0, 8)}...</td>
                      <td style={tdStyle}>{u.newUserEmail}</td>
                      <td style={tdStyle}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const thStyle = {
  padding: '0.75rem 1rem',
  textAlign: 'left',
  color: 'var(--color-text-secondary)',
  fontWeight: 600,
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '0.75rem 1rem',
  color: 'var(--color-text-primary)',
  whiteSpace: 'nowrap',
};

export default PreRegUsers;
