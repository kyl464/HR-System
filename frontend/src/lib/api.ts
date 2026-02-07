export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
}

// Auth
export const login = (email: string, password: string) =>
    fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });

export const logout = () =>
    fetchAPI('/auth/logout', { method: 'POST' });

export const getCurrentUser = () =>
    fetchAPI('/auth/me');

// Attendance
export const getAttendance = (month?: string, year?: string) =>
    fetchAPI(`/attendance?month=${month || ''}&year=${year || ''}`);

export const getAttendanceCalendar = (month?: string, year?: string) =>
    fetchAPI(`/attendance/calendar?month=${month || ''}&year=${year || ''}`);

export const addAttendance = (data: {
    date: string;
    session: string;
    status?: string;
    clock_in?: string;
    clock_out?: string;
}) =>
    fetchAPI('/attendance', {
        method: 'POST',
        body: JSON.stringify(data),
    });

// Employees
export const getEmployees = (search?: string, center?: string) =>
    fetchAPI(`/employees?search=${search || ''}&center=${center || ''}`);

export const getEmployee = (id: number) =>
    fetchAPI(`/employees/${id}`);

// Announcements
export const getAnnouncements = () =>
    fetchAPI('/announcements');

// Awards
export const getAwards = (quarter?: string, year?: string) =>
    fetchAPI(`/awards?quarter=${quarter || ''}&year=${year || ''}`);

// Work Permits
export const getWorkPermits = (status?: string, leaveType?: string) =>
    fetchAPI(`/work-permits?status=${status || ''}&leave_type=${leaveType || ''}`);

export const addWorkPermit = (data: {
    date: string;
    session: string;
    leave_type: string;
    reason: string;
    supporting_file?: string;
}) =>
    fetchAPI('/work-permits', {
        method: 'POST',
        body: JSON.stringify(data),
    });

// Assignments
export const getObjectives = () =>
    fetchAPI('/assignments/objectives');

export const getAssignments = () =>
    fetchAPI('/assignments');

export const submitAssignment = (data: {
    objective_id: number;
    submission: string;
}) =>
    fetchAPI('/assignments', {
        method: 'POST',
        body: JSON.stringify(data),
    });
