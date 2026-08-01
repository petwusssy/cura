import { Patient, Consultation, MedicineItem, PurchaseRequest, MedicalCertificate, Bed, AppNotification, HospitalTransfer } from '@/types';

export const mockPatients: Patient[] = [
  {
    id: 'STU-2024-001', name: 'Maria Santos', category: 'Student', contact: '09171234567',
    birthday: '2003-05-15', age: 22, sex: 'Female', email: 'maria.santos@ua.edu.ph',
    emergencyContact: 'Jose Santos', emergencyPhone: '09181234567',
    course: 'BS Nursing', yearLevel: '3rd Year',
  },
  {
    id: 'STU-2024-002', name: 'Juan dela Cruz', category: 'Student', contact: '09281234567',
    birthday: '2002-11-20', age: 23, sex: 'Male', email: 'juan.delacruz@ua.edu.ph',
    emergencyContact: 'Ana dela Cruz', emergencyPhone: '09191234567',
    course: 'BSBA Marketing', yearLevel: '4th Year',
  },
  {
    id: 'STU-2024-003', name: 'Angelica Reyes', category: 'Student', contact: '09351234567',
    birthday: '2004-03-08', age: 21, sex: 'Female', email: 'angelica.reyes@ua.edu.ph',
    emergencyContact: 'Pedro Reyes', emergencyPhone: '09201234567',
    course: 'BS Education', yearLevel: '2nd Year',
  },
  {
    id: 'EMP-2024-001', name: 'Dr. Rosario Mendez', category: 'Employee', contact: '09451234567',
    birthday: '1978-07-22', age: 46, sex: 'Female', email: 'r.mendez@ua.edu.ph',
    emergencyContact: 'Carlos Mendez', emergencyPhone: '09211234567',
    position: 'Physician', department: 'Medical Clinic',
  },
  {
    id: 'EMP-2024-002', name: 'Mark Villanueva', category: 'Employee', contact: '09561234567',
    birthday: '1985-01-15', age: 40, sex: 'Male', email: 'm.villanueva@ua.edu.ph',
    emergencyContact: 'Liza Villanueva', emergencyPhone: '09221234567',
    position: 'Professor', department: 'College of Engineering',
  },
  {
    id: 'OUT-2024-001', name: 'Lorna Castillo', category: 'Outsider', contact: '09781234567',
    birthday: '1975-12-05', age: 49, sex: 'Female', email: 'lorna.castillo@email.com',
    emergencyContact: 'Ramon Castillo', emergencyPhone: '09241234567',
    address: 'Blk 5 Lot 12, Del Pilar St., San Fernando, Pampanga',
  },
  {
    id: 'OUT-2024-002', name: 'Roberto Garcia', category: 'Outsider', contact: '09671234567',
    birthday: '1990-09-30', age: 34, sex: 'Male', email: 'roberto.garcia@email.com',
    emergencyContact: 'Maria Garcia', emergencyPhone: '09231234567',
    address: 'Sto. Rosario, San Fernando, Pampanga',
  },
  {
    id: 'STU-2024-004', name: 'Christian Bautista', category: 'Student', contact: '09891234567',
    birthday: '2003-08-14', age: 22, sex: 'Male', email: 'christian.bautista@ua.edu.ph',
    emergencyContact: 'Gloria Bautista', emergencyPhone: '09251234567',
    course: 'BS Computer Science', yearLevel: '3rd Year',
  },
  {
    id: 'STU-2024-005', name: 'Patricia Ocampo', category: 'Student', contact: '09111234567',
    birthday: '2005-02-28', age: 20, sex: 'Female', email: 'patricia.ocampo@ua.edu.ph',
    emergencyContact: 'Manuel Ocampo', emergencyPhone: '09261234567',
    course: 'BS Accountancy', yearLevel: '1st Year',
  },
  {
    id: 'EMP-2024-003', name: 'Grace Aquino', category: 'Employee', contact: '09121234567',
    birthday: '1992-06-11', age: 32, sex: 'Female', email: 'g.aquino@ua.edu.ph',
    emergencyContact: 'Ben Aquino', emergencyPhone: '09271234567',
    position: 'Nurse', department: 'Medical Clinic',
  },
];

export const mockConsultations: Consultation[] = [
  {
    id: 'CON-001', patientId: 'STU-2024-001', date: '2026-06-27', timeIn: '08:30', timeOut: '09:15',
    complaint: 'Headache and dizziness', categories: ['Headache'],
    doctorConsulted: true, doctorName: 'Dr. Rosario Mendez', whoConsulted: 'Patient',
    vitals: { height: '160', weight: '52', temp: '36.8', bp: '110/70', hr: '78', rr: '18', o2: '98' },
    treatments: [
      { id: 't1', medicineName: 'Biogesic 500mg', quantity: 2, unit: 'tablet', timeGiven: '08:45', nextDose: '12:45', remarks: 'Take after meals' },
    ],
    earlyDismissal: false, status: 'Consultation',
    nurseNotes: 'Patient advised to rest and hydrate.', recommendations: 'Rest and increase fluid intake.',
  },
  {
    id: 'CON-002', patientId: 'STU-2024-002', date: '2026-06-27', timeIn: '09:00', timeOut: '09:30',
    complaint: 'Stomach pain and nausea', categories: ['Abdominal Pain/Stomachache', 'Dyspepsia'],
    doctorConsulted: false,
    vitals: { height: '172', weight: '68', temp: '37.1', bp: '120/80', hr: '82', rr: '16', o2: '99' },
    treatments: [
      { id: 't2', medicineName: 'Buscopan', quantity: 1, unit: 'tablet', timeGiven: '09:10', nextDose: '13:10', remarks: '' },
    ],
    earlyDismissal: true, earlyDismissalReason: 'Persistent stomach pain', fetcherName: 'Ana dela Cruz',
    status: 'Consultation', nurseNotes: 'Patient sent home due to persistent pain.',
  },
  {
    id: 'CON-003', patientId: 'EMP-2024-002', date: '2026-06-27', timeIn: '10:15',
    complaint: 'Fever and cough', categories: ['Fever', 'Cough'],
    doctorConsulted: true, doctorName: 'Dr. Rosario Mendez',
    vitals: { height: '175', weight: '75', temp: '38.2', bp: '130/85', hr: '90', rr: '20', o2: '97' },
    treatments: [
      { id: 't3', medicineName: 'Paracetamol 500mg', quantity: 2, unit: 'tablet', timeGiven: '10:30', nextDose: '14:30', remarks: 'Every 4 hours if with fever' },
      { id: 't4', medicineName: 'Dimetapp', quantity: 1, unit: 'tablet', timeGiven: '10:30', nextDose: '22:30', remarks: '' },
    ],
    earlyDismissal: false, status: 'Consultation',
    nurseNotes: 'BP elevated. Advised to rest and monitor.', recommendations: 'Rest for 2 days.',
  },
  {
    id: 'CON-004', patientId: 'STU-2024-003', date: '2026-06-27', timeIn: '11:00',
    complaint: 'Wound on left knee', categories: ['Accidents'],
    doctorConsulted: false,
    vitals: { height: '158', weight: '48', temp: '36.5', bp: '100/65', hr: '75', rr: '16', o2: '99' },
    treatments: [
      { id: 't5', medicineName: 'Betadine solution', quantity: 1, unit: 'application', timeGiven: '11:15', remarks: 'Cleaned and dressed wound' },
    ],
    earlyDismissal: false, status: 'Non-Consultation',
    nurseNotes: 'Minor abrasion on left knee. Cleaned and dressed.',
  },
  {
    id: 'CON-005', patientId: 'OUT-2024-002', date: '2026-06-26', timeIn: '14:00', timeOut: '14:45',
    complaint: 'Back pain', categories: ['Body pain'],
    doctorConsulted: false,
    vitals: { height: '168', weight: '72', temp: '36.7', bp: '125/80', hr: '80', rr: '18', o2: '98' },
    treatments: [
      { id: 't6', medicineName: 'Ibuprofen 400mg', quantity: 1, unit: 'tablet', timeGiven: '14:15', nextDose: '20:15', remarks: 'With food' },
    ],
    earlyDismissal: false, status: 'Non-Consultation',
    nurseNotes: 'Patient advised warm compress and rest.',
  },
  {
    id: 'CON-006', patientId: 'STU-2024-004', date: '2026-06-26', timeIn: '08:00', timeOut: '08:30',
    complaint: 'Sore throat', categories: ['Acute Resp. Tract Infection'],
    doctorConsulted: true, doctorName: 'Dr. Rosario Mendez',
    vitals: { height: '170', weight: '65', temp: '37.3', bp: '115/75', hr: '76', rr: '17', o2: '98' },
    treatments: [
      { id: 't7', medicineName: 'Strepsils', quantity: 2, unit: 'lozenge', timeGiven: '08:15', remarks: 'Dissolve slowly' },
    ],
    earlyDismissal: false, status: 'Consultation',
    nurseNotes: 'Mild pharyngeal erythema noted.',
  },
  {
    id: 'CON-007', patientId: 'STU-2024-005', date: '2026-06-25', timeIn: '13:00', timeOut: '13:40',
    complaint: 'Dysmenorrhea, severe cramps', categories: ['Dysmenorrhea'],
    doctorConsulted: true, doctorName: 'Dr. Rosario Mendez',
    vitals: { height: '157', weight: '50', temp: '36.6', bp: '105/65', hr: '85', rr: '18', o2: '98' },
    treatments: [
      { id: 't8', medicineName: 'Mefenamic 500mg', quantity: 1, unit: 'capsule', timeGiven: '13:15', nextDose: '19:15', remarks: 'After meals' },
    ],
    earlyDismissal: false, status: 'Consultation',
    nurseNotes: 'Patient rested at clinic for 30 minutes before discharge.',
  },
  {
    id: 'CON-008', patientId: 'OUT-2024-001', date: '2026-06-25', timeIn: '10:00', timeOut: '10:30',
    complaint: 'Hypertension, headache', categories: ['Hypertension', 'Headache'],
    doctorConsulted: true, doctorName: 'Dr. Rosario Mendez',
    vitals: { height: '163', weight: '70', temp: '36.8', bp: '160/95', hr: '88', rr: '19', o2: '97' },
    treatments: [
      { id: 't9', medicineName: 'Amlodipine 5mg', quantity: 1, unit: 'tablet', timeGiven: '10:15', remarks: 'Once daily' },
    ],
    earlyDismissal: false, status: 'Consultation',
    nurseNotes: 'High BP recorded. Referred to physician.',
    transferred: false,
  },
];

export const mockTransfers: HospitalTransfer[] = [
  {
    id: 'TRF-001',
    consultationId: 'CON-003',
    patientId: 'EMP-2024-002',
    date: '2026-06-27',
    time: '11:30',
    receivingHospital: 'Jose B. Lingad Memorial Regional Hospital',
    reason: 'High fever requiring further evaluation and IV medication',
    transportMode: 'Ambulance',
    notes: 'Patient stable during transfer. BP: 130/85',
    transferredBy: 'Grace Aquino, RN',
  },
];

export const mockMedicines: MedicineItem[] = [
  { id: 'm1', name: 'Biogesic 500mg tab', stock: 148, unit: 'tablet', dateAdded: '2026-06-01', status: 'Normal',
    stockHistory: [{ date: '2026-06-01', qty: 200, type: 'add', note: 'Initial stock' }, { date: '2026-06-27', qty: 52, type: 'dispense', note: 'Dispensed to patients' }] },
  { id: 'm2', name: 'Paracetamol 500mg tab', stock: 280, unit: 'tablet', dateAdded: '2026-06-01', status: 'Normal',
    stockHistory: [{ date: '2026-06-01', qty: 300, type: 'add', note: 'Initial stock' }] },
  { id: 'm3', name: 'Ibuprofen 400mg tab', stock: 95, unit: 'tablet', dateAdded: '2026-06-01', status: 'Normal',
    stockHistory: [{ date: '2026-06-01', qty: 100, type: 'add', note: 'Initial stock' }] },
  { id: 'm4', name: 'Buscopan tab', stock: 8, unit: 'tablet', dateAdded: '2026-05-15', status: 'Low Stock',
    stockHistory: [{ date: '2026-05-15', qty: 50, type: 'add', note: 'Initial stock' }] },
  { id: 'm5', name: 'Dimetapp tab', stock: 42, unit: 'tablet', dateAdded: '2026-06-01', status: 'Normal',
    stockHistory: [{ date: '2026-06-01', qty: 50, type: 'add', note: 'Initial stock' }] },
  { id: 'm6', name: 'Strepsils lozenge', stock: 60, unit: 'piece', dateAdded: '2026-06-10', status: 'Normal',
    stockHistory: [{ date: '2026-06-10', qty: 72, type: 'add', note: 'Replenishment' }] },
  { id: 'm7', name: 'Benadryl 25mg cap', stock: 5, unit: 'capsule', dateAdded: '2026-05-01', status: 'Low Stock',
    stockHistory: [{ date: '2026-05-01', qty: 30, type: 'add', note: 'Initial stock' }] },
  { id: 'm8', name: 'Cetirizine 10mg tab', stock: 110, unit: 'tablet', dateAdded: '2026-06-01', status: 'Normal',
    stockHistory: [{ date: '2026-06-01', qty: 120, type: 'add', note: 'Initial stock' }] },
  { id: 'm9', name: 'Omeprazole 20mg cap', stock: 75, unit: 'capsule', dateAdded: '2026-06-01', status: 'Normal',
    stockHistory: [{ date: '2026-06-01', qty: 80, type: 'add', note: 'Initial stock' }] },
  { id: 'm10', name: 'Metronidazole 500mg tab', stock: 3, unit: 'tablet', dateAdded: '2026-04-15', status: 'Low Stock',
    stockHistory: [{ date: '2026-04-15', qty: 30, type: 'add', note: 'Initial stock' }] },
  { id: 'm11', name: 'Betadine solution 60mL', stock: 12, unit: 'bottle', dateAdded: '2026-06-01', status: 'Normal',
    stockHistory: [{ date: '2026-06-01', qty: 15, type: 'add', note: 'Initial stock' }] },
  { id: 'm12', name: 'Gaviscon sachet', stock: 25, unit: 'sachet', dateAdded: '2026-06-01', status: 'Normal',
    stockHistory: [{ date: '2026-06-01', qty: 30, type: 'add', note: 'Initial stock' }] },
  { id: 'm13', name: 'Hydrite sachet', stock: 40, unit: 'sachet', dateAdded: '2026-06-01', status: 'Normal',
    stockHistory: [{ date: '2026-06-01', qty: 50, type: 'add', note: 'Initial stock' }] },
  { id: 'm14', name: 'Kremil-S chewable tab', stock: 6, unit: 'tablet', dateAdded: '2026-05-20', status: 'Low Stock',
    stockHistory: [{ date: '2026-05-20', qty: 40, type: 'add', note: 'Initial stock' }] },
  { id: 'm15', name: 'Mefenamic 500mg cap', stock: 88, unit: 'capsule', dateAdded: '2026-06-01', status: 'Normal',
    stockHistory: [{ date: '2026-06-01', qty: 100, type: 'add', note: 'Initial stock' }] },
];

export const mockPurchaseRequests: PurchaseRequest[] = [
  {
    id: 'PR-001', medicine: 'Buscopan tab', requestedQty: 100, receivedQty: 50, date: '2026-06-15',
    status: 'Partial',
    history: [
      { date: '2026-06-15', qty: 0, note: 'Purchase request created' },
      { date: '2026-06-20', qty: 50, note: 'Partial delivery received' },
    ],
  },
  {
    id: 'PR-002', medicine: 'Benadryl 25mg cap', requestedQty: 60, receivedQty: 0, date: '2026-06-20',
    status: 'Pending',
    history: [{ date: '2026-06-20', qty: 0, note: 'Purchase request created' }],
  },
  {
    id: 'PR-003', medicine: 'Paracetamol 500mg tab', requestedQty: 200, receivedQty: 200, date: '2026-06-01',
    status: 'Complete',
    history: [
      { date: '2026-06-01', qty: 0, note: 'Purchase request created' },
      { date: '2026-06-05', qty: 200, note: 'Full delivery received' },
    ],
  },
  {
    id: 'PR-004', medicine: 'Metronidazole 500mg tab', requestedQty: 50, receivedQty: 0, date: '2026-06-25',
    status: 'Pending',
    history: [{ date: '2026-06-25', qty: 0, note: 'Purchase request created' }],
  },
];

export const mockMedicalCerts: MedicalCertificate[] = [
  {
    id: 'MC-001', patientId: 'STU-2024-001', date: '2026-06-27',
    purpose: 'Medical clearance for school requirements',
    diagnosis: 'Tension-type headache',
    recommendation: 'Rest for 1 day. May resume activities afterwards.',
    doctor: 'Dr. Rosario Mendez', issuedBy: 'Grace Aquino, RN',
    notes: 'Patient presented with headache and dizziness. BP normal. Advised rest.',
  },
  {
    id: 'MC-002', patientId: 'EMP-2024-002', date: '2026-06-27',
    purpose: 'Medical certificate for sick leave',
    diagnosis: 'Upper respiratory tract infection with fever',
    recommendation: 'Rest for 2-3 days. Complete prescribed medications.',
    doctor: 'Dr. Rosario Mendez', issuedBy: 'Grace Aquino, RN',
  },
  {
    id: 'MC-003', patientId: 'STU-2024-005', date: '2026-06-25',
    purpose: 'Medical certificate for excuse from PE',
    diagnosis: 'Dysmenorrhea',
    recommendation: 'Excuse from strenuous physical activity for 1 day.',
    doctor: 'Dr. Rosario Mendez', issuedBy: 'Grace Aquino, RN',
  },
];

export const mockBeds: Bed[] = [
  {
    id: 'BED-001', bedNumber: 1, status: 'Occupied',
    patientName: 'Maria Santos', patientId: 'STU-2024-001',
    timeOccupied: '2026-06-27T09:15:00',
    history: [
      { patientName: 'Juan dela Cruz', patientId: 'STU-2024-002', date: '2026-06-27', timeIn: '09:00', timeOut: '09:30', duration: '0h 30m' },
      { patientName: 'Lorna Castillo', patientId: 'OUT-2024-001', date: '2026-06-26', timeIn: '10:00', timeOut: '11:30', duration: '1h 30m' },
    ],
  },
  {
    id: 'BED-002', bedNumber: 2, status: 'Occupied',
    patientName: 'Mark Villanueva', patientId: 'EMP-2024-002',
    timeOccupied: '2026-06-27T10:30:00',
    history: [
      { patientName: 'Patricia Ocampo', patientId: 'STU-2024-005', date: '2026-06-25', timeIn: '13:00', timeOut: '13:45', duration: '0h 45m' },
    ],
  },
  {
    id: 'BED-003', bedNumber: 3, status: 'Available', history: [
      { patientName: 'Roberto Garcia', patientId: 'OUT-2024-002', date: '2026-06-26', timeIn: '14:00', timeOut: '15:30', duration: '1h 30m' },
      { patientName: 'Christian Bautista', patientId: 'STU-2024-004', date: '2026-06-26', timeIn: '08:00', timeOut: '08:30', duration: '0h 30m' },
    ],
  },
  { id: 'BED-004', bedNumber: 4, status: 'Available', history: [
    { patientName: 'Angelica Reyes', patientId: 'STU-2024-003', date: '2026-06-25', timeIn: '08:00', timeOut: '09:00', duration: '1h 0m' },
  ] },
  { id: 'BED-005', bedNumber: 5, status: 'Available', history: [] },
  { id: 'BED-006', bedNumber: 6, status: 'Available', history: [
    { patientName: 'Lorna Castillo', patientId: 'OUT-2024-001', date: '2026-06-25', timeIn: '10:00', timeOut: '10:45', duration: '0h 45m' },
  ] },
  { id: 'BED-007', bedNumber: 7, status: 'Available', history: [] },
  { id: 'BED-008', bedNumber: 8, status: 'Available', history: [] },
];

export const mockNotifications: AppNotification[] = [
  {
    id: 'N001', type: 'medication', message: 'Medication due for Maria Santos',
    time: '2026-06-27T12:35:00', read: false,
    patientName: 'Maria Santos', nextDose: '12:45', minutesLeft: 8,
  },
  {
    id: 'N002', type: 'medication', message: 'Medication due for Juan dela Cruz',
    time: '2026-06-27T13:00:00', read: false,
    patientName: 'Juan dela Cruz', nextDose: '13:10', minutesLeft: 4,
  },
  {
    id: 'N003', type: 'bed', message: 'Bed 1 has been occupied for 3+ hours',
    time: '2026-06-27T12:15:00', read: false,
    patientName: 'Maria Santos',
  },
  {
    id: 'N004', type: 'general', message: 'Low stock alert: Buscopan tab (8 units remaining)',
    time: '2026-06-27T08:00:00', read: true,
  },
  {
    id: 'N005', type: 'general', message: 'Low stock alert: Benadryl 25mg cap (5 units remaining)',
    time: '2026-06-27T08:00:00', read: true,
  },
];
