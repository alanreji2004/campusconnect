require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SERVICE_KEY || !SUPABASE_URL) {
    console.error('ERROR: Missing Supabase credentials in server/.env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const getPasswordFromDob = (dob) => {
    if (!dob) return 'Campus@123';
    const [y, m, d] = dob.split('-');
    return `${d}${m}${y}`;
};

const DEPARTMENTS = [
    { name: 'Computer Science', code: 'CS' },
    { name: 'Electronics', code: 'EC' },
    { name: 'Mechanical Engineering', code: 'ME' },
    { name: 'Civil Engineering', code: 'CE' },
    { name: 'Mathematics', code: 'MA' }
];


const USERS_TO_CREATE = [
    // 1 Admin
    {
        email: 'admin@campus.com',
        name: 'Root Admin',
        password: 'admin',
        roles: ['SUPER_ADMIN'],
        metadata: { departmentCode: 'IT' }

    },
    // 5 Students
    {
        email: 'student1@campus.com',
        name: 'Arjun Das',
        dob: '2004-05-10',
        roles: ['STUDENT'],
        metadata: { departmentCode: 'CS', semester: 'S4', dob: '2004-05-10' }

    },

    {
        email: 'student2@campus.com',
        name: 'Sneha Nair',
        dob: '2004-08-22',
        roles: ['STUDENT'],
        metadata: { departmentCode: 'ME', semester: 'S4', dob: '2004-08-22' }

    },
    {
        email: 'student3@campus.com',
        name: 'Rahul Varma',
        dob: '2005-01-15',
        roles: ['STUDENT'],
        metadata: { departmentCode: 'EC', semester: 'S2', dob: '2005-01-15' }

    },
    {
        email: 'student4@campus.com',
        name: 'Anjali Menon',
        dob: '2004-12-05',
        roles: ['STUDENT'],
        metadata: { departmentCode: 'CE', semester: 'S4', dob: '2004-12-05' }

    },
    {
        email: 'student5@campus.com',
        name: 'Kiran Joseph',
        dob: '2003-11-30',
        roles: ['STUDENT'],
        metadata: { departmentCode: 'CS', semester: 'S6', dob: '2003-11-30' }

    },
    // 5 Staff
    {
        email: 'staff1@campus.com',
        name: 'Dr. Ramesh Kumar',
        dob: '1975-04-12',
        roles: ['STAFF'],
        metadata: { departmentCode: 'CS', dob: '1975-04-12' }

    },
    {
        email: 'staff2@campus.com',
        name: 'Prof. Lakshmi Iyer',
        dob: '1982-09-25',
        roles: ['STAFF'],
        metadata: { departmentCode: 'MA', dob: '1982-09-25' }

    },
    {
        email: 'staff3@campus.com',
        name: 'Dr. Suresh Gopi',
        dob: '1978-01-10',
        roles: ['STAFF'],
        metadata: { departmentCode: 'ME', dob: '1978-01-10' }

    },
    {
        email: 'staff4@campus.com',
        name: 'Ms. Bindu Ravi',
        dob: '1985-06-18',
        roles: ['STAFF'],
        metadata: { departmentCode: 'EC', dob: '1985-06-18' }

    },
    {
        email: 'staff5@campus.com',
        name: 'Dr. Vinod Pillai',
        dob: '1972-12-01',
        roles: ['STAFF'],
        metadata: { departmentCode: 'CE', dob: '1972-12-01' }

    }
];

async function setupDatabase() {
    console.log('--- Cleaning up existing data ---');

    // Delete all users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (!listError) {
        for (const user of users) {
            await supabase.auth.admin.deleteUser(user.id);
            console.log(`Deleted user: ${user.email}`);
        }
    }

    // Delete all departments
    const { error: delError } = await supabase.from('departments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delError) {
        console.error('CRITICAL: Failed to clean departments. Does the table exist?');
        console.error(delError.message);
        return; // Stop if we can't even delete
    }
    console.log('Deleted departments.');


    console.log('\n--- Seeding Departments ---');
    for (const dept of DEPARTMENTS) {
        const { error } = await supabase.from('departments').insert([dept]);
        if (error) console.error(`Failed to add dept ${dept.name}:`, error.message);
        else console.log(`Added department: ${dept.name} (${dept.code})`);
    }


    console.log('\n--- Seeding Users ---');
    for (const user of USERS_TO_CREATE) {
        const password = user.password || getPasswordFromDob(user.dob);
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: user.email,
            password: password,
            email_confirm: true,
            user_metadata: { full_name: user.name, role: user.roles[0], ...user.metadata },
            app_metadata: { roles: user.roles }
        });

        if (authError) {
            console.error(`Failed to create ${user.email}: ${authError.message}`);
        } else {
            console.log(`Created: ${user.email} (Password: ${password})`);
            // Update public users table roles
            await supabase.from('users').update({ roles: user.roles }).eq('id', authData.user.id);
        }
    }

    console.log('\n--- Seeding Process Finished ---');
}

setupDatabase();