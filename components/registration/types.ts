/**
 * Registration Form Types and Constants
 * Extracted from register.tsx for modularity
 */

export interface DegreeProgram {
  id: string;
  name: string;
  short_name: string;
  duration_years: number;
  program_type: 'ug' | 'pg';
  is_active: boolean;
}

export interface FormData {
  apaar_id: string;
  full_name: string;
  email: string;
  phone: string;
  dob: Date;
  gender: 'male' | 'female' | 'other';
  program_id: string;
  year: number;
  semester: number;
  roll_number: string;
  admission_no: string;
  password: string;
  confirm_password: string;
  // Consent fields
  acceptPrivacyPolicy: boolean;
  acceptTermsOfService: boolean;
}

export const initialFormData: FormData = {
  apaar_id: '',
  full_name: '',
  email: '',
  phone: '',
  dob: new Date(2000, 0, 1),
  gender: 'male',
  program_id: '',
  year: 1,
  semester: 1,
  roll_number: '',
  admission_no: '',
  password: '',
  confirm_password: '',
  acceptPrivacyPolicy: false,
  acceptTermsOfService: false,
};

export type ProgramType = 'ug' | 'pg';

export interface RegistrationFormState {
  formData: FormData;
  step: number;
  loading: boolean;
  verifying: boolean;
  error: string;
  apaarVerified: boolean;
  programs: DegreeProgram[];
  programType: ProgramType;
  selectedProgram: DegreeProgram | null;
  showDatePicker: boolean;
}

export interface RegistrationFormActions {
  updateFormData: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
  setStep: (step: number) => void;
  setLoading: (loading: boolean) => void;
  setVerifying: (verifying: boolean) => void;
  setError: (error: string) => void;
  setApaarVerified: (verified: boolean) => void;
  setPrograms: (programs: DegreeProgram[]) => void;
  setProgramType: (type: ProgramType) => void;
  setSelectedProgram: (program: DegreeProgram | null) => void;
  setShowDatePicker: (show: boolean) => void;
  nextStep: () => void;
  prevStep: () => void;
  verifyApaarId: () => Promise<void>;
  validateStep: () => boolean;
  handleSubmit: () => Promise<void>;
  fetchPrograms: () => Promise<void>;
}

export const TOTAL_STEPS = 4;

export const STEP_LABELS = ['APAAR ID', 'Personal', 'Academic', 'Password'];
