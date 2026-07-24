const express = require('express');
const router = express.Router();

// Workspace management
router.get('/', (req, res) => {
    res.json({ workspace: { name: 'Muhammad\'s workspace', id: 'ws_123' } });
});

router.post('/', (req, res) => {
    res.json({ message: 'Workspace created' });
});

router.put('/:id', (req, res) => {
    res.json({ message: 'Workspace updated' });
});

router.delete('/:id', (req, res) => {
    res.json({ message: 'Workspace deleted' });
});

module.exports = router;
