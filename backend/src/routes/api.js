const express = require('express');
const multer = require('multer');
const { 
    handleIncomingReport, 
    getReports, 
    updateReportStatus, 
    upvoteReport,
    registerUser,
    loginUser,
    getSettings,
    updateSettings
} = require('../controllers/reportController');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/reports/intake', upload.single('evidence'), handleIncomingReport);
router.get('/reports', getReports);
router.patch('/reports/:refId/status', updateReportStatus);
router.post('/reports/:refId/upvote', upvoteReport);

router.post('/auth/signup', registerUser);
router.post('/auth/login', loginUser);

router.get('/admin/settings', getSettings);
router.post('/admin/settings', updateSettings);

module.exports = router;