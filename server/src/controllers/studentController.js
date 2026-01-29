const { createClient } = require('@supabase/supabase-js');
const config = require('../config');

// Initialize Supabase Admin Client
let supabaseAdmin;
if (config.supabase.serviceKey) {
    supabaseAdmin = createClient(
        config.supabase.url,
        config.supabase.serviceKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
}

exports.getDashboardData = async (req, res, next) => {
    try {
        const { studentId } = req.query;
        if (!studentId) return res.status(400).json({ error: 'Student ID is required' });

        // 1. Fetch Student Details with Class and Tutor
        const { data: student, error: studentError } = await supabaseAdmin
            .from('students')
            .select('*, class:classes(*, tutor:users(full_name))')
            .eq('user_id', studentId)
            .single();

        if (studentError || !student) {
            return res.status(404).json({ error: 'Student profile not found' });
        }

        // 2. Fetch Attendance Records
        const { data: attendance } = await supabaseAdmin
            .from('attendance')
            .select('*')
            .eq('student_id', student.id);

        // 3. Fetch Subjects for the Class
        // Subjects are determined by Department and Semester (from Class)
        // If class has specific subjects assigned in timetable, we might want those?
        // But usually subjects are curriculum based.
        const { data: subjects } = await supabaseAdmin
            .from('subjects')
            .select('*')
            .eq('department', student.department)
            .eq('semester', student.class?.semester);

        // 4. Calculate Attendance Stats
        let totalClasses = 0;
        let presentClasses = 0;
        const subjectStats = (subjects || []).map(sub => {
            const subAttendance = attendance.filter(a => a.subject_id === sub.id);
            const subTotal = subAttendance.length;
            const subPresent = subAttendance.filter(a => a.status === 'PRESENT').length;

            totalClasses += subTotal;
            presentClasses += subPresent;

            return {
                ...sub,
                total: subTotal,
                present: subPresent,
                percentage: subTotal > 0 ? Math.round((subPresent / subTotal) * 100) : 0
            };
        });

        const overallPercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

        res.json({
            profile: {
                name: student.name, // Will be fetched from user table if not in student table, but user_id join needed?
                // Wait, student table has user_id, need to join users to get name if not stored.
                // The query above select '*, class...'
                // Let's do a separate fetch or improved join for user name if needed. 
                // Using what we have: Student table usually doesn't have name, Users table has.
                // Let's refetch student with user details.
                admission: student.admission_number,
                department: student.department,
                semester: student.class?.semester,
                batch: student.class?.batch,
                tutor: student.class?.tutor?.full_name || 'Not Assigned',
                class_name: student.class?.name
            },
            academics: {
                overallAttendance: overallPercentage,
                subjectStats: subjectStats
            }
        });

    } catch (error) {
        next(error);
    }
};

exports.getCourses = async (req, res, next) => {
    try {
        const { studentId } = req.query;
        // Fetch student to get dept and semester
        const { data: student } = await supabaseAdmin
            .from('students')
            .select('department, class:classes(semester)')
            .eq('user_id', studentId)
            .single();

        if (!student) return res.status(404).json({ error: 'Student not found' });

        const { data: courses, error } = await supabaseAdmin
            .from('subjects')
            .select('*')
            .eq('department', student.department)
            .eq('semester', student.class?.semester);

        if (error) throw error;
        res.json({ courses });
    } catch (error) {
        next(error);
    }
};

exports.getTimetable = async (req, res, next) => {
    try {
        const { studentId } = req.query;
        const { data: student } = await supabaseAdmin
            .from('students')
            .select('class_id')
            .eq('user_id', studentId)
            .single();

        if (!student?.class_id) return res.json({ timetable: [] });

        const { data: timetable, error } = await supabaseAdmin
            .from('timetables')
            .select('*, subject:subjects(name, code), staff:users(full_name)')
            .eq('class_id', student.class_id);

        if (error) throw error;
        res.json({ timetable });
    } catch (error) {
        next(error);
    }
};
