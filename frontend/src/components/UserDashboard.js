import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './UserDashboard.css';

function UserDashboard() {
  const { user, logout } = useAuth();
  const [circulars, setCirculars] = useState([]);
  const [filteredCirculars, setFilteredCirculars] = useState([]);
  const [selectedCircular, setSelectedCircular] = useState(null);
  const [filters, setFilters] = useState({
    category: 'all',
    priority: 'all',
    search: ''
  });

  useEffect(() => {
    fetchCirculars();
  }, []);

  // Fetch all circulars (including drafts, archived, published)
  const fetchCirculars = async () => {
    try {
      // Fetch all circulars, no status filter
      const response = await axios.get('/api/circulars?status=all');
      setCirculars(response.data);
    } catch (error) {
      console.error('Error fetching circulars:', error);
    }
  };

  useEffect(() => {
    let filtered = circulars;

    if (filters.category !== 'all') {
      filtered = filtered.filter(c => c.category === filters.category);
    }

    if (filters.priority !== 'all') {
      filtered = filtered.filter(c => c.priority === filters.priority);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(search) ||
        c.description.toLowerCase().includes(search)
      );
    }

    setFilteredCirculars(filtered);
  }, [filters, circulars]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const openCircular = (circular) => {
    setSelectedCircular(circular);
    axios.get(`/api/circulars/${circular._id}`); // Increment view count
  };

  return (
    <div className="user-dashboard">
      <header className="user-header">
        <div className="header-content">
          <h1>📢 Circular Distribution System</h1>
          <div className="user-info">
            <span>Welcome, {user.username}</span>
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      <div className="user-container">
        <aside className="filters-sidebar">
          <h3>🔍 Filters</h3>
          
          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              name="search"
              placeholder="Search circulars..."
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="all">All Categories</option>
              <option value="general">General</option>
              <option value="announcement">Announcement</option>
              <option value="notice">Notice</option>
              <option value="event">Event</option>
              <option value="policy">Policy</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Priority</label>
            <select name="priority" value={filters.priority} onChange={handleFilterChange}>
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="filter-info">
            <p>Showing {filteredCirculars.length} circulars</p>
          </div>
        </aside>

        <main className="circulars-content">
          {selectedCircular ? (
            <div className="circular-detail">
              <button onClick={() => setSelectedCircular(null)} className="back-btn">
                ← Back to List
              </button>
              
              <div className="detail-header">
                <h2>{selectedCircular.title}</h2>
                <div className="detail-badges">
                  <span className={`badge ${selectedCircular.category}`}>
                    {selectedCircular.category}
                  </span>
                  <span className={`badge priority-${selectedCircular.priority}`}>
                    {selectedCircular.priority}
                  </span>
                </div>
              </div>

              <div className="detail-meta">
                <span>📅 {new Date(selectedCircular.publishedDate).toLocaleDateString()}</span>
                <span>👁️ {selectedCircular.views} views</span>
                <span>✍️ By: {selectedCircular.publishedBy?.username || 'Admin'}</span>
              </div>

              <div className="detail-description">
                <h3>Description</h3>
                <p>{selectedCircular.description}</p>
              </div>

              <div className="detail-content">
                <h3>Full Content</h3>
                <div className="content-text">{selectedCircular.content}</div>
              </div>

              {selectedCircular.expiryDate && (
                <div className="expiry-notice">
                  <strong>⏰ Expires on:</strong> {new Date(selectedCircular.expiryDate).toLocaleDateString()}
                </div>
              )}
            </div>
          ) : (
            <div className="circulars-grid">
              {filteredCirculars.length === 0 ? (
                <div className="no-circulars">
                  <h3>No circulars found</h3>
                  <p>Try adjusting your filters</p>
                </div>
              ) : (
                filteredCirculars.map((circular) => (
                  <div key={circular._id} className="circular-card" onClick={() => openCircular(circular)}>
                    <div className="card-header">
                      <div className="card-badges">
                        <span className={`badge ${circular.category}`}>{circular.category}</span>
                        <span className={`badge priority-${circular.priority}`}>{circular.priority}</span>
                        {/* Show status badge */}
                        <span className={`badge status-${circular.status?.toLowerCase()}`}>{circular.status?.toUpperCase()}</span>
                      </div>
                    </div>
                    <h3>{circular.title}</h3>
                    <p className="card-description">{circular.description}</p>
                    <div className="card-footer">
                      <span className="card-date">
                        📅 {circular.publishedDate ? new Date(circular.publishedDate).toLocaleDateString() : 'N/A'}
                      </span>
                      <span className="card-views">👁️ {circular.views}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default UserDashboard;
