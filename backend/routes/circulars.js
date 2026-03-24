const express = require('express');
const router = express.Router();
const Circular = require('../models/Circular');
const memoryDB = require('../inMemoryDB');

// Get all published circulars (for users)
router.get('/', async (req, res) => {
  try {
    const { category, priority, status } = req.query;
    const useMemoryDB = req.app.get('USE_MEMORY_DB')();

    if (useMemoryDB) {
      // In-memory database
      let filtered = [...memoryDB.circulars];
      
      if (category) filtered = filtered.filter(c => c.category === category);
      if (priority) filtered = filtered.filter(c => c.priority === priority);
      if (status && status !== 'all') filtered = filtered.filter(c => c.status === status);
      else if (!status) filtered = filtered.filter(c => c.status === 'published');

      filtered.sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate));
      return res.json(filtered);
    }

    // MongoDB
    let query = {};
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (status) query.status = status;
    else query.status = 'published';

    const circulars = await Circular.find(query)
      .populate('publishedBy', 'username email')
      .sort({ publishedDate: -1 });
    
    res.json(circulars);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single circular
router.get('/:id', async (req, res) => {
  try {
    const useMemoryDB = req.app.get('USE_MEMORY_DB')();

    if (useMemoryDB) {
      const circular = memoryDB.circulars.find(c => c._id === req.params.id);
      if (!circular) {
        return res.status(404).json({ message: 'Circular not found' });
      }
      circular.views += 1;
      return res.json(circular);
    }

    const circular = await Circular.findById(req.params.id)
      .populate('publishedBy', 'username email');
    
    if (!circular) {
      return res.status(404).json({ message: 'Circular not found' });
    }

    circular.views += 1;
    await circular.save();

    res.json(circular);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new circular (admin only)
router.post('/', async (req, res) => {
  try {
    const useMemoryDB = req.app.get('USE_MEMORY_DB')();

    if (useMemoryDB) {
      const user = memoryDB.users.find(u => u._id === req.body.userId);
      const newCircular = {
        _id: String(memoryDB.getCircularIdCounter()),
        title: req.body.title,
        description: req.body.description,
        content: req.body.content,
        category: req.body.category,
        priority: req.body.priority,
        status: req.body.status || 'draft',
        publishedBy: user ? { _id: user._id, username: user.username, email: user.email } : null,
        publishedDate: new Date(),
        expiryDate: req.body.expiryDate,
        views: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memoryDB.circulars.push(newCircular);
      return res.status(201).json(newCircular);
    }

    const circular = new Circular({
      title: req.body.title,
      description: req.body.description,
      content: req.body.content,
      category: req.body.category,
      priority: req.body.priority,
      status: req.body.status || 'draft',
      publishedBy: req.body.userId,
      expiryDate: req.body.expiryDate
    });

    const newCircular = await circular.save();
    res.status(201).json(newCircular);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update circular (admin only)
router.put('/:id', async (req, res) => {
  try {
    const useMemoryDB = req.app.get('USE_MEMORY_DB')();

    if (useMemoryDB) {
      const circular = memoryDB.circulars.find(c => c._id === req.params.id);
      if (!circular) {
        return res.status(404).json({ message: 'Circular not found' });
      }
      Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined && key !== '_id' && key !== 'userId') {
          circular[key] = req.body[key];
        }
      });
      circular.updatedAt = new Date();
      return res.json(circular);
    }

    const circular = await Circular.findById(req.params.id);
    if (!circular) {
      return res.status(404).json({ message: 'Circular not found' });
    }

    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && key !== '_id') {
        circular[key] = req.body[key];
      }
    });

    circular.updatedAt = Date.now();
    const updatedCircular = await circular.save();
    res.json(updatedCircular);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete circular (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const useMemoryDB = req.app.get('USE_MEMORY_DB')();

    if (useMemoryDB) {
      const index = memoryDB.circulars.findIndex(c => c._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: 'Circular not found' });
      }
      memoryDB.circulars.splice(index, 1);
      return res.json({ message: 'Circular deleted successfully' });
    }

    const circular = await Circular.findById(req.params.id);
    if (!circular) {
      return res.status(404).json({ message: 'Circular not found' });
    }

    await circular.deleteOne();
    res.json({ message: 'Circular deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get statistics (admin only)
router.get('/stats/overview', async (req, res) => {
  try {
    const useMemoryDB = req.app.get('USE_MEMORY_DB')();

    if (useMemoryDB) {
      const totalCirculars = memoryDB.circulars.length;
      const publishedCirculars = memoryDB.circulars.filter(c => c.status === 'published').length;
      const draftCirculars = memoryDB.circulars.filter(c => c.status === 'draft').length;
      const archivedCirculars = memoryDB.circulars.filter(c => c.status === 'archived').length;
      const totalViews = memoryDB.circulars.reduce((sum, c) => sum + c.views, 0);

      return res.json({
        total: totalCirculars,
        published: publishedCirculars,
        draft: draftCirculars,
        archived: archivedCirculars,
        totalViews: totalViews
      });
    }

    const totalCirculars = await Circular.countDocuments();
    const publishedCirculars = await Circular.countDocuments({ status: 'published' });
    const draftCirculars = await Circular.countDocuments({ status: 'draft' });
    const archivedCirculars = await Circular.countDocuments({ status: 'archived' });
    
    const totalViews = await Circular.aggregate([
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]);

    res.json({
      total: totalCirculars,
      published: publishedCirculars,
      draft: draftCirculars,
      archived: archivedCirculars,
      totalViews: totalViews.length > 0 ? totalViews[0].total : 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
