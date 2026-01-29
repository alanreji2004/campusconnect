import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import {
  LayoutDashboard,
  Users,
  Building2,
  GraduationCap,
  Upload,
  Plus,
  UserPlus,
  Briefcase,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Shield,
  Calendar,
  LogOut,
  ChevronRight
} from 'lucide-react';

// Mock chart data
const chartData = [
  { month: 'Jan', users: 120 },
  { month: 'Feb', users: 180 },
  { month: 'Mar', users: 260 },
  { month: 'Apr', users: 320 },
  { month: 'May', users: 410 }
];

export default function SuperAdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  const [stats, setStats] = useState({ totalUsers: 0, activeDevices: 14, attendance: '94.3%' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/stats');
      const data = await response.json();
      if (data.totalUsers) {
        setStats(prev => ({ ...prev, totalUsers: data.totalUsers }));
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'All Users', icon: Users },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'add-student', label: 'Add Student', icon: GraduationCap },
    { id: 'add-staff', label: 'Add Staff', icon: Briefcase },
  ];

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto w-full">
      {/* Header Info (Contextual based on tab) */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {tabs.find(t => t.id === activeTab)?.label || 'Dashboard'}
        </h1>
        <p className="text-slate-500 mt-1">
          {activeTab === 'overview' && 'Real-time overview of your campus operations.'}
          {activeTab === 'users' && 'Manage all students and staff members in one place.'}
          {activeTab === 'departments' && 'Organize and manage faculty departments.'}
          {activeTab === 'add-student' && 'Register new students to the platform.'}
          {activeTab === 'add-staff' && 'Onboard new faculty and administrative staff.'}
        </p>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-in-out">
        {activeTab === 'overview' && <OverviewTab stats={stats} />}
        {activeTab === 'users' && <UsersListTab />}
        {activeTab === 'departments' && <DepartmentsTab />}
        {activeTab === 'add-student' && <AddStudentTab />}
        {activeTab === 'add-staff' && <AddStaffTab />}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// SUB-COMPONENTS
// ----------------------------------------------------------------------

function OverviewTab({ stats }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard title="Total Users" value={stats.totalUsers} icon={Users} trend="+12% from last month" color="bg-blue-500" />
        <StatCard title="Active Devices" value={stats.activeDevices} icon={Shield} trend="+2 new this week" color="bg-emerald-500" />
        <StatCard title="Avg. Attendance" value={stats.attendance} icon={CheckCircle} trend="Consistent" color="bg-purple-500" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">User Growth</h3>
            <p className="text-sm text-slate-500">New joins over the last 5 months</p>
          </div>
          <button className="text-sm font-medium text-primary-600 hover:text-primary-700">View Report</button>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} dy={10} tick={{ fill: '#64748B', fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ stroke: '#cbd5e1' }}
              />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, color }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className={`rounded-xl p-3 ${color} bg-opacity-10`}>
          <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">30 Days</span>
      </div>
      <div>
        <div className="text-3xl font-bold text-slate-900">{value}</div>
        <div className="text-sm font-medium text-slate-500 mt-1">{title}</div>
      </div>
      <div className="mt-4 flex items-center text-xs text-emerald-600 font-medium">
        {trend}
      </div>
    </div>
  );
}

function UsersListTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/users');
      const data = await response.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.dept.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="text-center py-10 text-slate-500">Loading users...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium">
            <Filter size={18} /> Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium shadow-sm transition-all hover:shadow-md">
            <Upload size={18} /> Bulk Upload
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-4 font-semibold">Name</th>
              <th className="px-6 py-4 font-semibold">Role</th>
              <th className="px-6 py-4 font-semibold">Department</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-xs">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{user.name}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'STUDENT' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                    }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">{user.dept}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AddStudentTab() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '', name: '', department: 'Computer Science', semester: '1', tutor: '', dob: ''
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          role: 'STUDENT',
          metadata: {
            department: formData.department,
            semester: formData.semester,
            tutor: formData.tutor,
            dob: formData.dob
          }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to add student');

      alert('Student added successfully!');
      setFormData({ ...formData, email: '', name: '', dob: '' });
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target.result;
      // email,name,dept,semester,dob
      const lines = text.split('\n');
      const users = [];

      lines.forEach(line => {
        const [email, name, dept, semester, dob] = line.split(',').map(s => s?.trim());
        if (email && email.includes('@')) {
          users.push({
            email, name,
            role: 'STUDENT',
            metadata: {
              department: dept || 'General',
              semester: semester || '1',
              dob: dob || ''
            }
          });
        }
      });

      if (users.length > 0) {
        if (!window.confirm(`Found ${users.length} users. Upload now?`)) return;

        setLoading(true);
        try {
          const res = await fetch('http://localhost:5000/api/admin/users/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ users })
          });
          const data = await res.json();
          alert(`Bulk upload complete. Success: ${data.results.success}, Failed: ${data.results.failed}`);
        } catch (err) {
          alert("Upload failed: " + err.message);
        } finally {
          setLoading(false);
        }
      } else {
        alert("No valid users found in CSV. Format: email,name,dept,semester,dob");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-6 text-xl font-bold text-slate-900">Add New Student</h3>

        <form onSubmit={handleCreate} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all outline-none"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. John Doe"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Date of Birth</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="date"
                  required
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all outline-none"
                  value={formData.dob}
                  onChange={e => setFormData({ ...formData, dob: e.target.value })}
                />
              </div>
              <p className="mt-1.5 text-[10px] text-slate-400 italic">This will serve as the default password (format: DDMMYYYY)</p>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all outline-none"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="student@college.edu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
              <div className="relative">
                <select
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all outline-none"
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                >
                  <option>Computer Science</option>
                  <option>Electronics</option>
                  <option>Mechanical</option>
                  <option>Civil</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Semester</label>
              <div className="relative">
                <select
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all outline-none"
                  value={formData.semester}
                  onChange={e => setFormData({ ...formData, semester: e.target.value })}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Assigned Tutor</label>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all outline-none"
                value={formData.tutor}
                onChange={e => setFormData({ ...formData, tutor: e.target.value })}
                placeholder="e.g. Dr. Alan Reji"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary-600 py-3 text-sm font-bold text-white shadow-md hover:bg-primary-700 hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loading ? 'Processing...' : <><UserPlus size={18} /> Add Student</>}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        {/* Bulk Upload */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-2 text-lg font-bold text-slate-900">Bulk Import</h3>
          <p className="mb-4 text-sm text-slate-500">Upload a CSV file containing student details to add multiple students at once.</p>

          <div className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-10 transition-all hover:bg-slate-100 hover:border-primary-400">
            <div className="rounded-full bg-white p-3 shadow-sm ring-1 ring-slate-200 mb-3 group-hover:scale-110 transition-transform">
              <Upload className="h-6 w-6 text-primary-600" />
            </div>
            <p className="text-sm font-medium text-slate-900">Click to upload or drag and drop</p>
            <p className="mt-1 text-xs text-slate-500">CSV file (email, name, dept, semester, dob)</p>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 cursor-pointer opacity-0" />
          </div>
        </div>

        {/* Promotion Card */}
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-amber-100 opacity-50 blur-xl"></div>
          <h3 className="relative z-10 mb-2 text-lg font-bold text-amber-900">Semester Promotion</h3>
          <p className="relative z-10 mb-6 text-sm text-amber-800/80">
            Promote all eligible students to the next semester. Students in the final semester will be marked as graduated.
          </p>
          <button className="relative z-10 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-amber-700 transition-all">
            <GraduationCap size={18} /> Promote All Students
          </button>
        </div>
      </div>
    </div>
  );
}

function AddStaffTab() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '', name: '', department: 'Computer Science', role: 'LECTURER', dob: ''
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          role: formData.role, // PRINCIPAL, HOD, LECTURER, etc
          metadata: {
            department: formData.department,
            dob: formData.dob
          }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to add staff');

      alert('Staff added successfully!');
      setFormData({ ...formData, email: '', name: '', dob: '' });
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-6 text-xl font-bold text-slate-900">Add New Staff Member</h3>

        <form onSubmit={handleCreate} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all outline-none"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Dr. Sarah Connor"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Date of Birth</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="date"
                  required
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all outline-none"
                  value={formData.dob}
                  onChange={e => setFormData({ ...formData, dob: e.target.value })}
                />
              </div>
              <p className="mt-1.5 text-[10px] text-slate-400 italic">This will serve as the default password (format: DDMMYYYY)</p>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all outline-none"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="staff@college.edu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
              <div className="relative">
                <select
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all outline-none"
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                >
                  <option>Computer Science</option>
                  <option>Electronics</option>
                  <option>Mechanical</option>
                  <option>Civil</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Designation</label>
              <div className="relative">
                <select
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all outline-none"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="LECTURER">Lecturer</option>
                  <option value="ASST_PROF">Asst. Professor</option>
                  <option value="HOD">HOD</option>
                  <option value="PRINCIPAL">Principal</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow-md hover:bg-slate-800 hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loading ? 'Processing...' : <><Briefcase size={18} /> Add Staff Member</>}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-slate-900">Manage Roles</h3>
        <p className="text-sm text-slate-500 mb-6">Assign special administrative roles like HOD or Principal to existing staff members.</p>

        <div className="space-y-4">
          {/* Mock Staff Item */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">SM</div>
              <div>
                <div className="font-semibold text-slate-900">Prof. Smith</div>
                <div className="text-xs text-slate-500">Computer Science</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-primary-600 hover:border-primary-200 transition-colors">Assign HOD</button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">AR</div>
              <div>
                <div className="font-semibold text-slate-900">Dr. Alan Reji</div>
                <div className="text-xs text-slate-500">Electronics</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-primary-600 hover:border-primary-200 transition-colors">Assign Principal</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DepartmentsTab() {
  const [depts, setDepts] = useState(['Computer Science', 'Electronics', 'Mechanical', 'Civil']);
  const [newDept, setNewDept] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (newDept) {
      setDepts([...depts, newDept]);
      setNewDept('');
      setIsAdding(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Departments</h3>
          <p className="text-sm text-slate-500">Manage campus departments and faculties</p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-all shadow-sm"
        >
          <Plus size={18} /> Add Department
        </button>
      </div>

      {isAdding && (
        <div className="mb-8 flex gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <input
            autoFocus
            type="text"
            className="flex-1 max-w-sm rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
            placeholder="e.g. Biotechnology"
            value={newDept}
            onChange={e => setNewDept(e.target.value)}
          />
          <button onClick={handleAdd} className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 shadow-sm">
            Save
          </button>
          <button onClick={() => setIsAdding(false)} className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200">
            Cancel
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {depts.map(dept => (
          <div key={dept} className="group relative flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-5 hover:border-primary-200 hover:bg-slate-50 transition-all">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white shadow-sm text-primary-600 ring-1 ring-slate-100 group-hover:ring-primary-100 group-hover:text-primary-700 transition-colors">
                <Building2 size={24} />
              </div>
              <div>
                <div className="font-bold text-slate-900">{dept}</div>
                <div className="text-xs text-slate-500 font-medium">4 Year Program</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}