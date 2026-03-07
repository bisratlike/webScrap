'use strict';

const { Router } = require('express');
const { register, ping } = require('../controllers/installsController');

const router = Router();

// POST /api/installs/register
router.post('/register', register);

// POST /api/installs/ping
router.post('/ping', ping);

module.exports = router;
