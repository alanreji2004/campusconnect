const { createClient } = require('@supabase/supabase-js');
const config = require('../config');

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
} else {
    console.warn('WARNING: SUPABASE_SERVICE_KEY is not set. Admin features will be disabled.');
}

const ensureAdmin = (res) => {
    if (!supabaseAdmin) {
        res.status(503).json({ error: 'Admin configuration missing (Service Key)' });
        return false;
    }
    return true;
};

// User Management
exports.createUser = async (req, res, next) => {
    if (!ensureAdmin(res)) return;
    try {
        const { email, name, role, metadata } = req.body;
        let { password } = req.body;

        if (!email || !role) {
            return res.status(400).json({ error: 'Email and role are required' });
        }

        if (!password && metadata?.dob) {
            const [y, m, d] = metadata.dob.split('-');
            password = `${d}${m}${y}`;
        }

        if (!password) {
            password = 'Campus@123';
        }

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: name, role, ...metadata },
            app_metadata: { roles: [role] }
        });

        if (authError) throw authError;

        // Ensure we don't store "department" (name) in Auth metadata if departmentCode exists
        if (authData.user.user_metadata.department && authData.user.user_metadata.departmentCode) {
            delete authData.user.user_metadata.department;
            await supabaseAdmin.auth.admin.updateUserById(authData.user.id, {
                user_metadata: authData.user.user_metadata
            });
        }

        const userId = authData.user.id;
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .update({ roles: [role] })
            .eq('id', userId);


        if (dbError) console.error('DB Update Error:', dbError);

        res.status(201).json({ message: 'User created successfully', user: authData.user });
    } catch (error) {
        next(error);
    }
};

exports.bulkCreateUsers = async (req, res, next) => {
    if (!ensureAdmin(res)) return;
    try {
        const { users } = req.body;
        if (!Array.isArray(users)) {
            return res.status(400).json({ error: 'Users must be an array' });
        }

        const results = { success: 0, failed: 0, errors: [] };

        for (const user of users) {
            try {
                let password = user.password;
                if (!password && user.metadata?.dob) {
                    const [y, m, d] = user.metadata.dob.split('-');
                    password = `${d}${m}${y}`;
                }

                const { error } = await supabaseAdmin.auth.admin.createUser({
                    email: user.email,
                    password: password || 'Campus@123',
                    email_confirm: true,
                    user_metadata: { full_name: user.name, role: user.role, ...user.metadata },
                    app_metadata: { roles: [user.role] }
                });

                if (error) throw error;
                results.success++;
            } catch (err) {
                results.failed++;
                results.errors.push({ email: user.email, error: err.message });
            }
        }
        res.json({ message: 'Bulk processing complete', results });
    } catch (error) {
        next(error);
    }
};

exports.promoteStudents = async (req, res, next) => {
    if (!ensureAdmin(res)) return;
    try {
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error) throw error;

        let promoted = 0;
        let graduated = 0;

        for (const user of users) {
            const roles = user.app_metadata?.roles || [];
            if (roles.includes('STUDENT')) {
                const currentSem = user.user_metadata?.semester;
                let semNum = parseInt(currentSem);
                if (isNaN(semNum)) continue;

                if (semNum >= 8) {
                    await supabaseAdmin.auth.admin.deleteUser(user.id);
                    graduated++;
                } else {
                    const newSem = semNum + 1;
                    await supabaseAdmin.auth.admin.updateUserById(user.id, {
                        user_metadata: {
                            ...user.user_metadata,
                            semester: `${newSem}${getOrdinal(newSem)} Semester`
                        }
                    });
                    promoted++;
                }
            }
        }
        res.json({ message: 'Promotion complete', promoted, graduated });
    } catch (error) {
        next(error);
    }
};

exports.getStats = async (req, res, next) => {
    if (!ensureAdmin(res)) return;
    try {
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error) throw error;
        res.json({ totalUsers: users.length });
    } catch (error) {
        next(error);
    }
};

exports.listUsers = async (req, res, next) => {
    if (!ensureAdmin(res)) return;
    try {
        // Fetch users from Auth
        const [{ data: { users }, error: authError }, { data: depts, error: deptError }] = await Promise.all([
            supabaseAdmin.auth.admin.listUsers(),
            supabaseAdmin.from('departments').select('name, code')
        ]);

        if (authError) throw authError;
        if (deptError) throw deptError;

        // Create a lookup map for department names
        const deptMap = (depts || []).reduce((acc, d) => {
            acc[d.code] = d.name;
            return acc;
        }, {});

        const formattedUsers = users.map(u => {
            const deptCode = u.user_metadata?.departmentCode;
            return {
                id: u.id,
                email: u.email,
                name: u.user_metadata?.full_name || 'N/A',
                role: u.user_metadata?.role || u.app_metadata?.roles?.[0] || 'USER',
                dept: deptMap[deptCode] || deptCode || u.user_metadata?.department || 'N/A',
                status: u.last_sign_in_at ? 'Active' : 'Inactive',
                dob: u.user_metadata?.dob || 'N/A'
            };
        });
        res.json({ users: formattedUsers });
    } catch (error) {
        next(error);
    }
};


exports.deleteUser = async (req, res, next) => {
    if (!ensureAdmin(res)) return;
    try {
        const { id } = req.params;

        // Delete from Supabase Auth (this should trigger cascade in public.users if setup correctly)
        const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

        if (error) throw error;

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        next(error);
    }
};


// Department Management
exports.listDepartments = async (req, res, next) => {
    if (!ensureAdmin(res)) return;
    try {
        const { data, error } = await supabaseAdmin
            .from('departments')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        res.json({ departments: data });
    } catch (error) {
        next(error);
    }
};

exports.createDepartment = async (req, res, next) => {
    if (!ensureAdmin(res)) return;
    try {
        const { name, code } = req.body;
        if (!name || !code) return res.status(400).json({ error: 'Name and Code are required' });

        const { data, error } = await supabaseAdmin
            .from('departments')
            .insert([{ name, code }])
            .select();

        if (error) throw error;
        res.status(201).json({ message: 'Department created', department: data[0] });
    } catch (error) {
        next(error);
    }
};


exports.updateDepartment = async (req, res, next) => {
    if (!ensureAdmin(res)) return;
    try {
        const { id } = req.params;
        const { name, code } = req.body;
        if (!name || !code) return res.status(400).json({ error: 'Name and Code are required' });

        const { data, error } = await supabaseAdmin
            .from('departments')
            .update({ name, code })
            .eq('id', id)
            .select();

        if (error) throw error;
        res.json({ message: 'Department updated', department: data[0] });
    } catch (error) {
        next(error);
    }
};


exports.deleteDepartment = async (req, res, next) => {
    if (!ensureAdmin(res)) return;
    try {
        const { id } = req.params;
        const { error } = await supabaseAdmin
            .from('departments')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ message: 'Department deleted' });
    } catch (error) {
        next(error);
    }
};

// Role Assignment (HOD/Principal)
exports.assignRole = async (req, res, next) => {
    if (!ensureAdmin(res)) return;
    try {
        const { userId, role, departmentCode } = req.body;

        if (!userId || !role) {
            return res.status(400).json({ error: 'User ID and role are required' });
        }

        // If promoting to HOD, demote the current HOD of that department
        if (role === 'HOD' && departmentCode) {
            const { data: { users: allUsers }, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
            if (!listErr) {
                const currentHOD = allUsers.find(u =>
                    (u.user_metadata?.role === 'HOD' || u.app_metadata?.roles?.includes('HOD')) &&
                    u.user_metadata?.departmentCode === departmentCode &&
                    u.id !== userId
                );

                if (currentHOD) {
                    console.log(`Demoting old HOD: ${currentHOD.email}`);
                    await supabaseAdmin.auth.admin.updateUserById(currentHOD.id, {
                        user_metadata: { ...currentHOD.user_metadata, role: 'STAFF' },
                        app_metadata: { roles: ['STAFF'] }
                    });
                    await supabaseAdmin.from('users').update({ roles: ['STAFF'] }).eq('id', currentHOD.id);
                }
            }
        }

        // Get current user to preserve existing metadata
        const { data: { user }, error: getError } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (getError) throw getError;

        const updatedMetadata = { ...user.user_metadata, role };
        // Remove old 'department' name and only keep 'departmentCode'
        if (departmentCode) {
            updatedMetadata.departmentCode = departmentCode;
            delete updatedMetadata.department;
        }

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: updatedMetadata,
            app_metadata: { roles: [role, 'STAFF'] } // Keep STAFF as base role
        });

        if (updateError) throw updateError;

        // Also update the public users table roles
        await supabaseAdmin.from('users').update({ roles: [role, 'STAFF'] }).eq('id', userId);

        res.json({ message: `Role ${role} assigned successfully` });
    } catch (error) {
        next(error);
    }
};



function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}