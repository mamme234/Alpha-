const express = require('express');
const router = express.Router();

// Project management
router.get('/', (req, res) => {
    res.json([
        { id: 'p1', name: 'Just-ask', status: 'active', repo: 'https://github.com/user/just-ask' },
        { id: 'p2', name: 'Alpha-DB', status: 'active', repo: 'https://github.com/user/alpha-db' }
    ]);
});

router.post('/', (req, res) => {
    res.json({ message: 'Project created', project: req.body });
});

router.put('/:id', (req, res) => {
    res.json({ message: 'Project updated' });
});

router.delete('/:id', (req, res) => {
    res.json({ message: 'Project deleted' });
});

module.exports = router;
