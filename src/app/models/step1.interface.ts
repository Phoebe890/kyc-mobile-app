export interface Step1FormData {
  fullName: string;
  phoneNumber: string;
  employmentStatus: string;
  dateOfBirth: Date;
  county: string;
}

export type EmploymentStatus = 'employed' | 'self-employed' | 'unemployed' | 'student' | 'retired'; 