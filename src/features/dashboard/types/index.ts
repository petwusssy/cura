export type PatientCategory = 'Student' | 'Employee' | 'Outsider';

export type Page =
  | 'login'
  | 'dashboard'
  | 'patients'
  | 'patient-profile'
  | 'patient-form'
  | 'new-consultation'
  | 'consultations'
  | 'non-consultations'
  | 'inventory'
  | 'purchase-receipts'
  | 'medical-certificates'
  | 'beds'
  | 'reports'
  | 'notifications'
  | 'settings';

export type StudentCategory = 'Elementary' | 'Junior High School' | 'Senior High School' | 'College';

export interface Patient {
  id: string;
  name: string;
  category: PatientCategory;
  contact: string;
  birthday: string;
  age: number;
  sex?: string;
  email?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  course?: string;
  yearLevel?: string;
  position?: string;
  department?: string;
  address?: string;
  studentCategory?: StudentCategory;
  guardianName?: string;
  gradeLevel?: string;
}

export interface Treatment {
  id: string;
  medicineName: string;
  quantity: number;
  unit: string;
  timeGiven: string;
  nextDose?: string;
  remarks?: string;
}

export interface Consultation {
  id: string;
  patientId: string;
  date: string;
  timeIn: string;
  timeOut?: string;
  complaint: string;
  categories: string[];
  doctorConsulted: boolean;
  doctorName?: string;
  whoConsulted?: string;
  vitals: {
    height?: string;
    weight?: string;
    temp?: string;
    bp?: string;
    hr?: string;
    rr?: string;
    o2?: string;
    notes?: string;
  };
  treatments: Treatment[];
  earlyDismissal: boolean;
  earlyDismissalReason?: string;
  fetcherName?: string;
  nurseNotes?: string;
  recommendations?: string;
  followUp?: string;
  status: 'Consultation' | 'Non-Consultation';
  prescriptionImage?: string;
  transferred?: boolean;
  dismissalDestination?: string;
  fetcherIdImage?: string;
  purposeOfVisit?: string;
  operationalNotes?: string;
  assistingNurse?: string;
}

export interface HospitalTransfer {
  id: string;
  consultationId: string;
  patientId: string;
  date: string;
  time: string;
  receivingHospital: string;
  reason: string;
  transportMode: string;
  notes: string;
  transferredBy: string;
}

export interface StockHistory {
  date: string;
  qty: number;
  type: 'add' | 'dispense';
  note?: string;
}

export interface MedicineItem {
  id: string;
  name: string;
  stock: number;
  unit: string;
  dateAdded: string;
  status: 'Normal' | 'Low Stock' | 'Healthy' | 'Out of Stock';
  stockHistory: StockHistory[];
  batchNumber?: string;
  beginningQty?: number;
  dispensed?: number;
  threshold?: number;
}

export interface PurchaseHistory {
  date: string;
  qty: number;
  note: string;
}

export interface PurchaseRequest {
  id: string;
  medicine: string;
  requestedQty: number;
  receivedQty: number;
  date: string;
  status: 'Pending' | 'Partial' | 'Complete';
  history: PurchaseHistory[];
  description?: string;
  unit?: string;
  prfNo?: string;
  unitPrice?: number;
}

export interface MedicalCertificate {
  id: string;
  patientId: string;
  date: string;
  purpose: string;
  diagnosis?: string;
  recommendation?: string;
  doctor?: string;
  issuedBy?: string;
  notes?: string;
}

export interface BedHistory {
  patientName: string;
  patientId: string;
  date: string;
  timeIn: string;
  timeOut: string;
  duration: string;
}

export interface Bed {
  id: string;
  bedNumber: number;
  status: 'Available' | 'Occupied';
  patientName?: string | null;
  patientId?: string | null;
  timeOccupied?: string | null;
  history: BedHistory[];
}

export interface AppNotification {
  id: string;
  type: 'medication' | 'bed' | 'general';
  message: string;
  time: string;
  read: boolean;
  patientName?: string;
  nextDose?: string;
  minutesLeft?: number;
}
