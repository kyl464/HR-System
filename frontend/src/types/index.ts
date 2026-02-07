export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface Employee {
  id: number;
  user_id: number;
  name: string;
  center: string;
  roles: string;
  photo_url: string;
  sex: string;
  pob: string;
  dob: string;
  age: number;
  religion: string;
  phone: string;
  address1: string;
  address2: string;
  nik: string;
  npwp: string;
  education_level: string;
  institution: string;
  major: string;
  graduation_year: number;
  bank_account: string;
  status_ptkp: string;
}

export interface Attendance {
  id: number;
  user_id: number;
  date: string;
  session: string;
  status: string;
  clock_in: string;
  clock_out: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
}

export interface Award {
  id: number;
  quarter: string;
  year: number;
  employee_name: string;
  award_name: string;
}

export interface WorkPermit {
  id: number;
  user_id: number;
  date: string;
  session: string;
  leave_type: string;
  reason: string;
  supporting_file: string;
  status: string;
}

export interface Objective {
  id: number;
  title: string;
  description: string;
  is_active: boolean;
}

export interface Assignment {
  id: number;
  user_id: number;
  objective_id: number;
  objective: Objective;
  submission: string;
  submitted_at: string;
}
