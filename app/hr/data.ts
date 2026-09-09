
export const EMPLOYEES = [
  { id: 'EMP-001', name: 'Ahmed Khan', designation: 'CTO', department: 'IT', status: 'Active', office: 'Head Office' },
  { id: 'EMP-002', name: 'Sara Ali', designation: 'Software Engineer', department: 'IT', status: 'Active', office: 'Head Office' },
  { id: 'EMP-003', name: 'Ali Raza', designation: 'VP Sales', department: 'Sales', status: 'Active', office: 'North Branch' },
  { id: 'EMP-004', name: 'Fatima Noor', designation: 'HR Manager', department: 'HR', status: 'Active', office: 'Head Office' },
  { id: 'EMP-005', name: 'Usman Sheikh', designation: 'Sales Manager', department: 'Sales', status: 'On Leave', office: 'South Branch' },
  { id: 'EMP-006', name: 'Nadia Khan', designation: 'Senior Software Engineer', department: 'IT', status: 'Inactive', office: 'Head Office' },
];

export const ATTENDANCE = [
  { id: 'EMP-001', name: 'Ahmed Khan', checkIn: '09:03 AM', checkOut: '06:02 PM', worked: '8h 59m', status: 'Present' },
  { id: 'EMP-002', name: 'Sara Ali', checkIn: '09:25 AM', checkOut: '06:10 PM', worked: '8h 45m', status: 'Late' },
  { id: 'EMP-003', name: 'Ali Raza', checkIn: '—', checkOut: '—', worked: '—', status: 'Absent' },
  { id: 'EMP-004', name: 'Fatima Noor', checkIn: '08:55 AM', checkOut: '06:05 PM', worked: '9h 10m', status: 'Present' },
  { id: 'EMP-005', name: 'Usman Sheikh', checkIn: '—', checkOut: '—', worked: '—', status: 'On Leave' },
  { id: 'EMP-006', name: 'Nadia Khan', checkIn: '08:50 AM', checkOut: '05:58 PM', worked: '9h 08m', status: 'Present' },
];

export const OFFICES = [
  { name: 'Head Office', code: 'HO-01', address: 'Gulberg III, Lahore', employees: 28, geofence: '150m radius' },
  { name: 'North Branch', code: 'NB-02', address: 'Blue Area, Islamabad', employees: 12, geofence: '200m radius' },
  { name: 'South Branch', code: 'SB-03', address: 'Clifton, Karachi', employees: 9, geofence: '150m radius' },
];

export const SHIFTS = [
  { name: 'Morning Shift', time: '09:00 AM – 06:00 PM', grace: '15 min', employees: 32, status: 'Active' },
  { name: 'Evening Shift', time: '02:00 PM – 11:00 PM', grace: '10 min', employees: 8, status: 'Active' },
  { name: 'Night Shift', time: '10:00 PM – 07:00 AM', grace: '10 min', employees: 4, status: 'Scheduled' },
  { name: 'Half Day Shift', time: '09:00 AM – 01:00 PM', grace: '5 min', employees: 2, status: 'Draft' },
];

export const LEAVES = [
  { employee: 'Usman Sheikh', type: 'Annual Leave', from: '2026-09-05', to: '2026-09-12', days: 7, status: 'Approved' },
  { employee: 'Nadia Khan', type: 'Sick Leave', from: '2026-09-10', to: '2026-09-11', days: 2, status: 'Pending' },
  { employee: 'Ali Raza', type: 'Casual Leave', from: '2026-09-15', to: '2026-09-15', days: 1, status: 'Pending' },
  { employee: 'Sara Ali', type: 'Maternity Leave', from: '2026-08-01', to: '2026-11-01', days: 90, status: 'Approved' },
  { employee: 'Ahmed Khan', type: 'Unpaid Leave', from: '2026-07-20', to: '2026-07-22', days: 3, status: 'Rejected' },
];

export const HOLIDAYS = [
  { name: 'Independence Day', date: '2026-08-14', type: 'National', day: 'Friday' },
  { name: 'Eid ul Fitr', date: '2026-03-20', type: 'Religious', day: 'Friday' },
  { name: 'Eid ul Adha', date: '2026-05-27', type: 'Religious', day: 'Wednesday' },
  { name: 'Quaid-e-Azam Day', date: '2026-12-25', type: 'National', day: 'Friday' },
  { name: 'Company Foundation Day', date: '2026-10-10', type: 'Company', day: 'Saturday' },
];

export const OVERTIME = [
  { employee: 'Sara Ali', date: '2026-09-05', hours: 3.5, rate: '$18/hr', amount: '$63.00', status: 'Approved' },
  { employee: 'Ahmed Khan', date: '2026-09-04', hours: 2.0, rate: '$25/hr', amount: '$50.00', status: 'Approved' },
  { employee: 'Nadia Khan', date: '2026-09-06', hours: 4.0, rate: '$16/hr', amount: '$64.00', status: 'Pending' },
  { employee: 'Ali Raza', date: '2026-09-03', hours: 1.5, rate: '$20/hr', amount: '$30.00', status: 'Rejected' },
];

export const PAYROLL = [
  { id: 'PR-2026-09', employee: 'Ahmed Khan', base: '$8,000.00', overtime: '$50.00', deductions: '$800.00', net: '$7,250.00', status: 'Paid' },
  { id: 'PR-2026-10', employee: 'Sara Ali', base: '$4,500.00', overtime: '$63.00', deductions: '$450.00', net: '$4,113.00', status: 'Paid' },
  { id: 'PR-2026-11', employee: 'Ali Raza', base: '$6,000.00', overtime: '$30.00', deductions: '$600.00', net: '$5,430.00', status: 'Pending' },
  { id: 'PR-2026-12', employee: 'Fatima Noor', base: '$5,000.00', overtime: '$0.00', deductions: '$500.00', net: '$4,500.00', status: 'Draft' },
];

export const TASKS = [
  { title: 'Q3 sales report preparation', assignedTo: 'Ali Raza', due: '2026-09-12', priority: 'High', status: 'Pending' },
  { title: 'Migrate payroll module to v2', assignedTo: 'Sara Ali', due: '2026-09-20', priority: 'High', status: 'Pending' },
  { title: 'Onboard 2 new hires', assignedTo: 'Fatima Noor', due: '2026-09-08', priority: 'Medium', status: 'Approved' },
  { title: 'Office geofence audit', assignedTo: 'Ahmed Khan', due: '2026-09-15', priority: 'Low', status: 'Approved' },
  { title: 'Update employee handbook', assignedTo: 'Fatima Noor', due: '2026-09-30', priority: 'Low', status: 'Draft' },
];

export const PERFORMANCE = [
  { employee: 'Ahmed Khan', period: 'H1 2026', rating: 4.8, goals: '8/9', reviewer: 'Fatima Noor', status: 'Approved' },
  { employee: 'Sara Ali', period: 'H1 2026', rating: 4.5, goals: '7/9', reviewer: 'Ahmed Khan', status: 'Approved' },
  { employee: 'Ali Raza', period: 'H1 2026', rating: 4.1, goals: '7/8', reviewer: 'Fatima Noor', status: 'Pending' },
  { employee: 'Usman Sheikh', period: 'H1 2026', rating: 3.6, goals: '5/8', reviewer: 'Ali Raza', status: 'Pending' },
];

export const TRACKING = [
  { employee: 'Ahmed Khan', office: 'Head Office', location: 'Head Office — Gulberg III', since: '09:03 AM', status: 'Present', lat: 31.5204, lng: 74.3587, moving: false, speed: 0, battery: 82 },
  { employee: 'Ali Raza', office: 'North Branch', location: 'En route — Blue Area → F-7', since: '09:12 AM', status: 'CheckedIn', lat: 33.6844, lng: 73.0479, moving: true, speed: 24, battery: 64 },
  { employee: 'Usman Sheikh', office: 'South Branch', location: 'Client visit — Clifton Block 5', since: '09:40 AM', status: 'CheckedIn', lat: 24.8607, lng: 67.0011, moving: true, speed: 12, battery: 47 },
  { employee: 'Sara Ali', office: 'Head Office', location: 'Client visit — Mall Road', since: '10:05 AM', status: 'CheckedIn', lat: 31.5497, lng: 74.3436, moving: true, speed: 31, battery: 71 },
];

export const OFFICE_COORDS: Record<string, { lat: number; lng: number }> = {
  'Head Office': { lat: 31.5204, lng: 74.3587 },
  'North Branch': { lat: 33.6844, lng: 73.0479 },
  'South Branch': { lat: 24.8607, lng: 67.0011 },
};


export const NOTIFICATIONS = [
  { title: 'Leave Request', body: 'Nadia Khan requested 2 days sick leave', time: '10 min ago', type: 'Leave' },
  { title: 'Late Check-in', body: 'Sara Ali checked in 25 minutes late', time: '1 hr ago', type: 'Attendance' },
  { title: 'Payroll Approved', body: 'September payroll batch was approved', time: '3 hrs ago', type: 'Payroll' },
  { title: 'New Employee', body: 'HR created a new employee profile: EMP-007', time: 'Yesterday', type: 'Employee' },
  { title: 'Overtime Request', body: 'Nadia Khan requested 4h overtime approval', time: 'Yesterday', type: 'Overtime' },
];

export const ORG_CHART = {
  name: 'Ahmed Khan',
  role: 'CTO',
  children: [
    { name: 'Sara Ali', role: 'Software Engineer', children: [] as never[] },
    { name: 'Nadia Khan', role: 'Senior Software Engineer', children: [] as never[] },
    {
      name: 'Fatima Noor',
      role: 'HR Manager',
      children: [{ name: 'Ali Raza', role: 'VP Sales', children: [] as never[] }] as never[],
    },
  ],
};
