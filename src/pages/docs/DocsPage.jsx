import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import BrandLogo from '../../components/shared/BrandLogo';
import { PixelIcon } from '../../components/shared/pixel-art/PixelIcons';
import { documentationIndex, sidebarNavigation, searchableContent } from '../../data/docs';
import './docs.css';

/**
 * Documentation Page Component
 * Displays comprehensive product documentation with sidebar navigation
 */
const DocsPage = () => {
  const { slug = 'introduction', sectionId } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Set body background to black for docs page
  React.useEffect(() => {
    const originalBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#000000';
    return () => {
      document.body.style.backgroundColor = originalBg;
    };
  }, []);

  // Get current documentation
  const currentDoc = documentationIndex[slug] || documentationIndex['introduction'];

  // Get specific section if sectionId is provided
  const currentSection = sectionId 
    ? currentDoc.sections.find(s => s.id === sectionId)
    : null;

  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return searchableContent.filter(item =>
      item.searchText.includes(query)
    ).slice(0, 10);
  }, [searchQuery]);

  // Get navigation items
  const getNavItems = () => {
    if (searchQuery.trim()) {
      return searchResults.map(result => ({
        title: result.title,
        slug: result.docSlug,
        category: result.docTitle,
      }));
    }
    return sidebarNavigation;
  };

  return (
    <div className="docs-page">
      {/* Header */}
      <div style={{
        background: 'rgba(18, 18, 18, 0.95)',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
        padding: '1rem 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: '#FFFFFF' }}>
            <BrandLogo variant="icon" width={32} height={32} />
            <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>LastWeek Docs</span>
          </Link>
        </div>
      </div>

      {/* Main Container */}
      <div className="docs-container">
        {/* Sidebar */}
        <aside className="docs-sidebar">
          <div className="docs-sidebar-header">
            <PixelIcon type="book" size={20} />
            <span className="docs-sidebar-title">Documentation</span>
          </div>

          <input
            type="text"
            className="docs-search"
            placeholder="Search docs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {searchQuery.trim() ? (
            <div className="docs-nav-section">
              <div className="docs-nav-category">Search Results</div>
              {searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <Link
                    key={result.id}
                    to={`/docs/${result.docSlug}`}
                    className={`docs-nav-item ${slug === result.docSlug ? 'active' : ''}`}
                    onClick={() => setSearchQuery('')}
                  >
                    <PixelIcon type="search" size={16} />
                    <span>{result.title}</span>
                  </Link>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '0.75rem' }}>
                  No results found
                </div>
              )}
            </div>
          ) : (
            sidebarNavigation.map((section, idx) => (
              <div key={idx} className="docs-nav-section">
                <div className="docs-nav-category">{section.category}</div>
                {section.items.map((item) => (
                  <Link
                    key={item.slug}
                    to={`/docs/${item.slug}`}
                    className={`docs-nav-item ${slug === item.slug ? 'active' : ''}`}
                  >
                    <PixelIcon type={item.icon} size={16} />
                    <span>{item.title}</span>
                  </Link>
                ))}
              </div>
            ))
          )}
        </aside>

        {/* Content */}
        <main className="docs-content">
          {/* Breadcrumb */}
          <div className="docs-breadcrumb">
            <Link to="/" style={{ color: 'var(--purple-bright)', textDecoration: 'none' }}>
              Home
            </Link>
            <span className="docs-breadcrumb-separator">/</span>
            <Link to="/docs" style={{ color: 'var(--purple-bright)', textDecoration: 'none' }}>
              Docs
            </Link>
            <span className="docs-breadcrumb-separator">/</span>
            <Link to={`/docs/${slug}`} style={{ color: 'var(--purple-bright)', textDecoration: 'none' }}>
              {currentDoc.title}
            </Link>
            {currentSection && (
              <>
                <span className="docs-breadcrumb-separator">/</span>
                <span>{currentSection.title}</span>
              </>
            )}
          </div>

          {/* Header */}
          <div className="docs-header">
            <h1 className="docs-title">{currentSection ? currentSection.title : currentDoc.title}</h1>
            <p className="docs-description">{currentSection ? '' : currentDoc.description}</p>
            <div className="docs-meta">
              <div className="docs-meta-item">
                <PixelIcon type="clock" size={16} />
                <span>{currentDoc.estimatedReadingTime} min read</span>
              </div>
              <div className="docs-meta-item">
                <PixelIcon type="target" size={16} />
                <span>Last updated: {new Date(currentDoc.lastUpdated).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Table of Contents */}
          {!currentSection && currentDoc.sections.length > 3 && (
            <div className="docs-toc">
              <div className="docs-toc-title">Table of Contents</div>
              <ul className="docs-toc-list">
                {currentDoc.sections.map((section) => (
                  <li key={section.id} className="docs-toc-item">
                    <Link to={`/docs/${slug}/${section.id}`} className="docs-toc-link">
                      {section.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sections */}
          {currentSection ? (
            <section className="docs-section">
              <div className="docs-section-content">
                {currentSection.content.split('\n\n').map((paragraph, idx) => (
                  <div key={idx}>
                    {paragraph.includes('•') || paragraph.includes('1.') ? (
                      <div>
                        {paragraph.split('\n').map((line, lineIdx) => (
                          <div key={lineIdx}>
                            {line.startsWith('•') ? (
                              <ul style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }}>
                                <li>{line.substring(1).trim()}</li>
                              </ul>
                            ) : line.match(/^\d+\./) ? (
                              <ol style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }}>
                                <li>{line.replace(/^\d+\.\s*/, '')}</li>
                              </ol>
                            ) : (
                              <p>{line}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>{paragraph}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ) : (
            currentDoc.sections.map((section) => (
              <section key={section.id} id={section.id} className="docs-section">
                <h2 className="docs-section-title">{section.title}</h2>
                <div className="docs-section-content">
                  {section.content.split('\n\n').map((paragraph, idx) => (
                    <div key={idx}>
                      {paragraph.includes('•') || paragraph.includes('1.') ? (
                        <div>
                          {paragraph.split('\n').map((line, lineIdx) => (
                            <div key={lineIdx}>
                              {line.startsWith('•') ? (
                                <ul style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }}>
                                  <li>{line.substring(1).trim()}</li>
                                </ul>
                              ) : line.match(/^\d+\./) ? (
                                <ol style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }}>
                                  <li>{line.replace(/^\d+\.\s*/, '')}</li>
                                </ol>
                              ) : (
                                <p>{line}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>{paragraph}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}

          {/* Navigation */}
          <div className="docs-navigation">
            <Link
              to={`/docs/${Object.keys(documentationIndex)[Math.max(0, Object.keys(documentationIndex).indexOf(slug) - 1)]}`}
              className={`docs-nav-button ${slug === Object.keys(documentationIndex)[0] ? 'disabled' : ''}`}
            >
              <PixelIcon type="arrow" size={16} style={{ transform: 'rotate(180deg)' }} />
              Previous
            </Link>
            <Link
              to={`/docs/${Object.keys(documentationIndex)[Math.min(Object.keys(documentationIndex).length - 1, Object.keys(documentationIndex).indexOf(slug) + 1)]}`}
              className={`docs-nav-button ${slug === Object.keys(documentationIndex)[Object.keys(documentationIndex).length - 1] ? 'disabled' : ''}`}
            >
              Next
              <PixelIcon type="arrow" size={16} />
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DocsPage;
