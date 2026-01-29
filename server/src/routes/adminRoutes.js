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
router.get('/staff', adminController.listStaff);


router.get('/departments', adminController.listDepartments);
router.post('/departments', adminController.createDepartment);
router.put('/departments/:id', adminController.updateDepartment);
router.delete('/departments/:id', adminController.deleteDepartment);

router.get('/classes', adminController.listClasses);
router.post('/classes', adminController.createClass);
router.get('/classes/:id/students', adminController.getClassStudents);
router.put('/classes/:id', adminController.updateClass);
router.delete('/classes/:id', adminController.deleteClass);
router.delete('/classes/students/:studentId', adminController.removeStudentFromClass);

router.post('/assign-role', adminController.assignRole);

module.exports = router;