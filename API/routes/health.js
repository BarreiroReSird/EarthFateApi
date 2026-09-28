const express = require('express');

const router = express.Router();

// Deliberately minimal: no version, no uptime, no database check. Anything
// added here is information handed to whoever finds the endpoint.
router.get('/', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

module.exports = router;
