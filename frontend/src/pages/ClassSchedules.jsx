import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CalendarDays, Clock, MapPin, User } from 'lucide-react';

export default function ClassSchedules() {
    const { user } = useAuth();
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) fetchTimetable();
    }, [user]);

    const fetchTimetable = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/student/timetable?studentId=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setTimetable(data.timetable || []);
            }
        } catch (error) {
            console.error("Failed to load timetable", error);
        } finally {
            setLoading(false);
        }
    };

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    // Assuming periods 1-6 for now, or determining max period from data
    const periods = [1, 2, 3, 4, 5, 6];

    const getSlot = (day, period) => {
        return timetable.find(t => t.day_of_week === day && t.period === period);
    };

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-primary-600" />
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 font-sans">
            <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-600">
                    <CalendarDays size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Weekly Timetable</h1>
                    <p className="text-slate-500 font-medium">Your class schedule for the semester</p>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-black tracking-widest text-primary-900/50 w-24">Period</th>
                                {days.map(day => (
                                    <th key={day} className="px-6 py-4 font-bold tracking-wider min-w-[160px]">{day}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {periods.map(period => (
                                <tr key={period} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-black text-slate-300 group-hover:text-primary-300 text-lg">
                                        P{period}
                                    </td>
                                    {days.map(day => {
                                        const slot = getSlot(day, period);
                                        return (
                                            <td key={`${day}-${period}`} className="px-6 py-4 align-top">
                                                {slot ? (
                                                    <div className="rounded-lg bg-primary-50/50 border border-primary-100 p-3 hover:bg-primary-50 hover:border-primary-200 transition-all cursor-default">
                                                        <div className="font-bold text-slate-800 text-sm mb-1">{slot.subject?.name || 'Subject'}</div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 uppercase tracking-wider">
                                                                {slot.subject?.code}
                                                            </div>
                                                            {slot.staff?.full_name && (
                                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                                                    <User size={10} />
                                                                    <span className="truncate max-w-[120px]">{slot.staff.full_name}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="h-full min-h-[80px] rounded-lg border-2 border-dashed border-slate-100 flex items-center justify-center">
                                                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Free</span>
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}