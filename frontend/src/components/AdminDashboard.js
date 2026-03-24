import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './AdminDashboard.css';

function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [circulars, setCirculars] = useState([]);
  const [stats, setStats] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: 'general',
    priority: 'medium',
    status: 'draft',
    expiryDate: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCirculars();
    fetchStats();
  }, []);

  const fetchCirculars = async () => {
    try {
      const response = await axios.get('/api/circulars?status=all');
      setCirculars(response.data);
    } catch (error) {
      console.error('Error fetching circulars:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/circulars/stats/overview');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, userId: user.id };
      
      if (editingId) {
        await axios.put(`/api/circulars/${editingId}`, data);
        setMessage('Circular updated successfully!');
      } else {
        await axios.post('/api/circulars', data);
        setMessage('Circular created successfully!');
      }
      
      resetForm();
      fetchCirculars();
      fetchStats();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error: ' + (error.response?.data?.message || 'Operation failed'));
    }
  };

  const handleEdit = (circular) => {
    setFormData({
      title: circular.title,
      description: circular.description,
      content: circular.content,
      category: circular.category,
      priority: circular.priority,
      status: circular.status,
      expiryDate: circular.expiryDate ? circular.expiryDate.split('T')[0] : ''
    });
    setEditingId(circular._id);
    setActiveTab('create');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this circular?')) {
      try {
        await axios.delete(`/api/circulars/${id}`);
        fetchCirculars();
        fetchStats();
        setMessage('Circular deleted successfully!');
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        setMessage('Error deleting circular');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content: '',
      category: 'general',
      priority: 'medium',
      status: 'draft',
      expiryDate: ''
    });
    setEditingId(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="header-content">
          <h1>📢 Admin Dashboard</h1>
          <div className="user-info">
            <span>Welcome, {user.username}</span>
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      <div className="admin-container">
        <nav className="admin-nav">
          <button
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button
            className={activeTab === 'create' ? 'active' : ''}
            onClick={() => { setActiveTab('create'); resetForm(); }}
          >
            ➕ Create Circular
          </button>
          <button
            className={activeTab === 'manage' ? 'active' : ''}
            onClick={() => setActiveTab('manage')}
          >
            📝 Manage Circulars
          </button>
        </nav>

        <main className="admin-content">
          {message && <div className="alert">{message}</div>}

          {activeTab === 'overview' && (
            <div className="overview-tab">
              <h2>Statistics</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>{stats.total || 0}</h3>
                  <p>Total Circulars</p>
                </div>
                <div className="stat-card published">
                  <h3>{stats.published || 0}</h3>
                  <p>Published</p>
                </div>
                <div className="stat-card draft">
                  <h3>{stats.draft || 0}</h3>
                  <p>Drafts</p>
                </div>
                <div className="stat-card views">
                  <h3>{stats.totalViews || 0}</h3>
                  <p>Total Views</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'create' && (
            <div className="create-tab">
              <h2>{editingId ? 'Edit Circular' : 'Create New Circular'}</h2>
              <form onSubmit={handleSubmit} className="circular-form">
                <input
                  type="text"
                  name="title"
                  placeholder="Circular Title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
                
                <textarea
                  name="description"
                  placeholder="Short Description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="2"
                  required
                />
                
                <textarea
                  name="content"
                  placeholder="Full Content"
                  value={formData.content}
                  onChange={handleChange}
                  rows="6"
                  required
                />

                <div className="form-row">
                  <select name="category" value={formData.category} onChange={handleChange}>
                    <option value="general">General</option>
                    <option value="announcement">Announcement</option>
                    <option value="notice">Notice</option>
                    <option value="event">Event</option>
                    <option value="policy">Policy</option>
                  </select>

                  <select name="priority" value={formData.priority} onChange={handleChange}>
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="form-row">
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>

                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    {editingId ? 'Update Circular' : 'Create Circular'}
                  </button>
                  {editingId && (
                    <button type="button" onClick={resetForm} className="btn-secondary">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="manage-tab">
              <h2>All Circulars</h2>
              <div className="circulars-list">
                {circulars.map((circular) => (
                  <div key={circular._id} className="circular-item">
                    <div className="circular-header">
                      <h3>{circular.title}</h3>
                      <div className="badges">
                        <span className={`badge ${circular.status}`}>{circular.status}</span>
                        <span className={`badge priority-${circular.priority}`}>{circular.priority}</span>
                      </div>
                    </div>
                    <p className="circular-desc">{circular.description}</p>
                    <div className="circular-meta">
                      <span>Category: {circular.category}</span>
                      <span>Views: {circular.views}</span>
                      <span>Date: {new Date(circular.publishedDate).toLocaleDateString()}</span>
                    </div>
                    <div className="circular-actions">
                      <button onClick={() => handleEdit(circular)} className="btn-edit">
                        ✏️ Edit
                      </button>
                      <button onClick={() => handleDelete(circular._id)} className="btn-delete">
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
