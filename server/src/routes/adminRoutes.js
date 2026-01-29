const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Stats
router.get('/stats', adminController.getStats);

// Users
router.post('/users', adminController.createUser);
router.post('/users/bulk', adminController.bulkCreateUsers);
router.get('/users', adminController.listUsers);
router.delete('/users/:id', adminController.deleteUser);
router.post('/promote', adminController.promoteStudents);


// Departments
router.get('/departments', adminController.listDepartments);
router.post('/departments', adminController.createDepartment);
router.put('/departments/:id', adminController.updateDepartment);
router.delete('/departments/:id', adminController.deleteDepartment);

// Roles
router.post('/assign-role', adminController.assignRole);

module.exports = router;