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
  { id: 'med-1', name: 'Allerta 10mg tab', batchNumber: 'B-ALT902', beginningQty: 90, dispensed: 28, stock: 62, unit: 'Tablets', dateAdded: '2026-05-12', status: 'Healthy', stockHistory: [{ date: '2026-05-12', qty: 90, type: 'add', note: 'Beginning Inventory' }, { date: '2026-05-30', qty: 28, type: 'dispense', note: 'Monthly clinic consumption' }] },
  { id: 'med-2', name: 'Allerkid 60mL bottle', batchNumber: 'B-AKD611', beginningQty: 1, dispensed: 0, stock: 1, unit: 'Bottles', dateAdded: '2026-05-12', status: 'Low Stock', stockHistory: [{ date: '2026-05-12', qty: 1, type: 'add', note: 'Beginning Inventory' }] },
  { id: 'med-3', name: 'Alnix 10mg tab', batchNumber: 'B-ALX231', beginningQty: 103, dispensed: 11, stock: 92, unit: 'Tablets', dateAdded: '2026-05-12', status: 'Healthy', stockHistory: [{ date: '2026-05-12', qty: 103, type: 'add', note: 'Beginning Inventory' }, { date: '2026-05-30', qty: 11, type: 'dispense', note: 'Monthly clinic consumption' }] },
  { id: 'med-4', name: 'Aspilets-EC 80mg tab', batchNumber: 'B-ASP894', beginningQty: 4, dispensed: 0, stock: 4, unit: 'Tablets', dateAdded: '2026-05-12', status: 'Low Stock', stockHistory: [{ date: '2026-05-12', qty: 4, type: 'add', note: 'Beginning Inventory' }] },
  { id: 'med-5', name: 'Benadryl 25mg', batchNumber: 'B-BEN025', beginningQty: 10, dispensed: 0, stock: 10, unit: 'Tablets', dateAdded: '2026-05-12', status: 'Healthy', stockHistory: [{ date: '2026-05-12', qty: 10, type: 'add', note: 'Beginning Inventory' }] },
  { id: 'med-6', name: 'Benadryl 50mg', batchNumber: 'B-BEN050', beginningQty: 9, dispensed: 0, stock: 9, unit: 'Tablets', dateAdded: '2026-05-12', status: 'Healthy', stockHistory: [{ date: '2026-05-12', qty: 9, type: 'add', note: 'Beginning Inventory' }] },
  { id: 'med-7', name: 'Benadryl 60mL bottle', batchNumber: 'B-BEN60M', beginningQty: 1, dispensed: 0, stock: 1, unit: 'Bottles', dateAdded: '2026-05-12', status: 'Low Stock', stockHistory: [{ date: '2026-05-12', qty: 1, type: 'add', note: 'Beginning Inventory' }] },
  { id: 'med-8', name: 'Bioflu tab', batchNumber: 'B-BIO085', beginningQty: 85, dispensed: 7, stock: 78, unit: 'Tablets', dateAdded: '2026-05-12', status: 'Healthy', stockHistory: [{ date: '2026-05-12', qty: 85, type: 'add', note: 'Beginning Inventory' }, { date: '2026-05-30', qty: 7, type: 'dispense', note: 'Monthly clinic consumption' }] },
  { id: 'med-9', name: 'Biogesic 500mg tab', batchNumber: 'B-BIO500', beginningQty: 254, dispensed: 106, stock: 148, unit: 'Tablets', dateAdded: '2026-05-12', status: 'Healthy', stockHistory: [{ date: '2026-05-12', qty: 254, type: 'add', note: 'Beginning Inventory' }, { date: '2026-05-30', qty: 106, type: 'dispense', note: 'Monthly clinic consumption' }] },
  { id: 'med-10', name: 'Budecort respules 250mcg/mL', batchNumber: 'B-BUD250', beginningQty: 15, dispensed: 1, stock: 14, unit: 'Respules', dateAdded: '2026-05-12', status: 'Healthy', stockHistory: [{ date: '2026-05-12', qty: 15, type: 'add', note: 'Beginning Inventory' }, { date: '2026-05-30', qty: 1, type: 'dispense', note: 'Monthly clinic consumption' }] },
  { id: 'med-11', name: 'Buscopan 10mg tab', batchNumber: 'B-BUS010', beginningQty: 20, dispensed: 5, stock: 15, unit: 'Tablets', dateAdded: '2026-05-12', status: 'Healthy', stockHistory: [{ date: '2026-05-12', qty: 20, type: 'add', note: 'Beginning Inventory' }, { date: '2026-05-30', qty: 5, type: 'dispense', note: 'Monthly clinic consumption' }] },
  { id: 'med-12', name: 'Buscopan Plus', batchNumber: 'B-BUSPLS', beginningQty: 59, dispensed: 29, stock: 30, unit: 'Tablets', dateAdded: '2026-05-12', status: 'Healthy', stockHistory: [{ date: '2026-05-12', qty: 59, type: 'add', note: 'Beginning Inventory' }, { date: '2026-05-30', qty: 29, type: 'dispense', note: 'Monthly clinic consumption' }] },
  { id: 'med-13', name: 'Calmoseptine ointment', batchNumber: 'B-CAL012', beginningQty: 12, dispensed: 9, stock: 3, unit: 'Ointment', dateAdded: '2026-05-12', status: 'Low Stock', stockHistory: [{ date: '2026-05-12', qty: 12, type: 'add', note: 'Beginning Inventory' }, { date: '2026-05-30', qty: 9, type: 'dispense', note: 'Monthly clinic consumption' }] },
  { id: 'med-14', name: 'Catapres 75mcg', batchNumber: 'B-CAT075', beginningQty: 21, dispensed: 0, stock: 21, unit: 'Tablets', dateAdded: '2026-05-12', status: 'Healthy', stockHistory: [{ date: '2026-05-12', qty: 21, type: 'add', note: 'Beginning Inventory' }] },
  { id: 'med-15', name: 'Celecoxib 200mg capsule', batchNumber: 'B-CEL200', beginningQty: 25, dispensed: 25, stock: 0, unit: 'Capsules', dateAdded: '2026-05-12', status: 'Out of Stock', stockHistory: [{ date: '2026-05-12', qty: 25, type: 'add', note: 'Beginning Inventory' }, { date: '2026-05-30', qty: 25, type: 'dispense', note: 'Monthly clinic consumption' }] },
  { id: 'med-16', name: 'Dolcet 37.5mg/325mg tab', batchNumber: 'B-DOL375', beginningQty: 17, dispensed: 0, stock: 17, unit: 'Tablets', dateAdded: '2026-05-12', status: 'Healthy', stockHistory: [{ date: '2026-05-12', qty: 17, type: 'add', note: 'Beginning Inventory' }] },
  { id: 'med-17', name: 'Dolfenal 500mg tab', batchNumber: 'B-DOL500', beginningQty: 291, dispensed: 31, stock: 260, unit: 'Tablets', dateAdded: '2026-05-12', status: 'Healthy', stockHistory: [{ date: '2026-05-12', qty: 291, type: 'add', note: 'Beginning Inventory' }, { date: '2026-05-30', qty: 31, type: 'dispense', note: 'Monthly clinic consumption' }] },
  { id: 'med-18', name: 'Duavent nebules', batchNumber: 'B-DUA013', beginningQty: 13, dispensed: 4, stock: 9, unit: 'Nebules', dateAdded: '2026-05-12', status: 'Healthy', stockHistory: [{ date: '2026-05-12', qty: 13, type: 'add', note: 'Beginning Inventory' }, { date: '2026-05-30', qty: 4, type: 'dispense', note: 'Monthly clinic consumption' }] },
  { id: 'med-19', name: 'Erceflora Niblet', batchNumber: 'B-ERC015', beginningQty: 15, dispensed: 5, stock: 10, unit: 'Vials', dateAdded: '2026-05-12', status: 'Healthy', stockHistory: [{ date: '2026-05-12', qty: 15, type: 'add', note: 'Beginning Inventory' }, { date: '2026-05-30', qty: 5, type: 'dispense', note: 'Monthly clinic consumption' }] },
  { id: 'med-20', name: 'Erythromycin ointment tubes', batchNumber: 'B-ERY001', beginningQty: 1, dispensed: 0, stock: 1, unit: 'Tubes', dateAdded: '2026-05-12', status: 'Low Stock', stockHistory: [{ date: '2026-05-12', qty: 1, type: 'add', note: 'Beginning Inventory' }] },
  { id: 'med-21', name: 'Flotera chewable', batchNumber: 'B-FLO003', beginningQty: 3, dispensed: 3, stock: 0, unit: 'Tablets', dateAdded: '2026-05-12', status: 'Out of Stock', stockHistory: [{ date: '2026-05-12', qty: 3, type: 'add', note: 'Beginning Inventory' }, { date: '2026-05-30', qty: 3, type: 'dispense', note: 'Monthly clinic consumption' }] },
  { id: 'med-22', name: 'Gaviscon sachet', batchNumber: 'B-GAV088', beginningQty: 88, dispensed: 26, stock: 62, unit: 'Sachets', dateAdded: '2026-05-12', status: 'Healthy', stockHistory: [{ date: '2026-05-12', qty: 88, type: 'add', note: 'Beginning Inventory' }, { date: '2026-05-30', qty: 26, type: 'dispense', note: 'Monthly clinic consumption' }] },
  { id: 'med-23', name: 'Gaviscon tablet', batchNumber: 'B-GAVTAB', beginningQty: 0, dispensed: 0, stock: 0, unit: 'Tablets', dateAdded: '2026-05-12', status: 'Out of Stock', stockHistory: [{ date: '2026-05-12', qty: 0, type: 'add', note: 'No Stock' }] },
  { id: 'med-24', name: 'Hidrasec 30mg granules', batchNumber: 'B-HID030', beginningQty: 195, dispensed: 39, stock: 156, unit: 'Sachets', dateAdded: '2026-05-12', status: 'Healthy', stockHistory: [{ date: '2026-05-12', qty: 195, type: 'add', note: 'Beginning Inventory' }, { date: '2026-05-30', qty: 39, type: 'dispense', note: 'Monthly clinic consumption' }] },
  { id: 'med-25', name: 'Hydrite sachet', batchNumber: 'B-HYD310', beginningQty: 310, dispensed: 60, stock: 250, unit: 'Sachets', dateAdded: '2026-05-12', status: 'Healthy', stockHistory: [{ date: '2026-05-12', qty: 310, type: 'add', note: 'Beginning Inventory' }, { date: '2026-05-30', qty: 60, type: 'dispense', note: 'Monthly clinic consumption' }] },
  { id: 'med-26', name: 'Hypromellose 3mg/mL drops', batchNumber: 'B-HYP003', beginningQty: 1, dispensed: 0, stock: 1, unit: 'Bottles', dateAdded: '2026-05-12', status: 'Low Stock', stockHistory: [{ date: '2026-05-12', qty: 1, type: 'add', note: 'Beginning Inventory' }] },
  { id: 'med-27', name: 'Imodium 2mg cap', batchNumber: 'B-IMO002', beginningQty: 213, dispensed: 31, stock: 182, unit: 'Capsules', dateAdded: '2026-05-12', status: 'Healthy', stockHistory: [{ date: '2026-05-12', qty: 213, type: 'add', note: 'Beginning Inventory' }, { date: '2026-05-30', qty: 31, type: 'dispense', note: 'Monthly clinic consumption' }] },
  { id: 'med-28', name: 'Isordil SL 5mg tab', batchNumber: 'B-ISO005', beginningQty: 0, dispensed: 0, stock: 0, unit: 'Tablets', dateAdded: '2026-05-12', status: 'Out of Stock', stockHistory: [{ date: '2026-05-12', qty: 0, type: 'add', note: 'No Stock' }] },
  { id: 'med-29', name: 'Kremil-S chewable pink', batchNumber: 'B-KRE077', beginningQty: 77, dispensed: 11, stock: 66, unit: 'Tablets', dateAdded: '2026-05-12', status: 'Healthy', stockHistory: [{ date: '2026-05-12', qty: 77, type: 'add', note: 'Beginning Inventory' }, { date: '2026-05-30', qty: 11, type: 'dispense', note: 'Monthly clinic consumption' }] },
  { id: 'med-30', name: 'Kremil-S ADVANCE', batchNumber: 'B-KREADV', beginningQty: 32, dispensed: 0, stock: 32, unit: 'Tablets', dateAdded: '2026-05-12', status: 'Healthy', stockHistory: [{ date: '2026-05-12', qty: 32, type: 'add', note: 'Beginning Inventory' }] },
  { id: 'med-31', name: 'Motillium 10mg', batchNumber: 'B-MOT010', beginningQty: 40, dispensed: 3, stock: 37, unit: 'Tablets', dateAdded: '2026-05-12', status: 'Healthy', stockHistory: [{ date: '2026-05-12', qty: 40, type: 'add', note: 'Beginning Inventory' }, { date: '2026-05-30', qty: 3, type: 'dispense', note: 'Monthly clinic consumption' }] },
  { id: 'med-32', name: 'Nafarin A', batchNumber: 'B-NAF227', beginningQty: 227, dispensed: 14, stock: 213, unit: 'Tablets', dateAdded: '2026-05-12', status: 'Healthy', stockHistory: [{ date: '2026-05-12', qty: 227, type: 'add', note: 'Beginning Inventory' }, { date: '2026-05-30', qty: 14, type: 'dispense', note: 'Monthly clinic consumption' }] },
  { id: 'med-33', name: 'Norvasc 10mg tab', batchNumber: 'B-NOR010', beginningQty: 7, dispensed: 1, stock: 6, unit: 'Tablets', dateAdded: '2026-05-12', status: 'Healthy', stockHistory: [{ date: '2026-05-12', qty: 7, type: 'add', note: 'Beginning Inventory' }, { date: '2026-05-30', qty: 1, type: 'dispense', note: 'Monthly clinic consumption' }] },
  { id: 'med-34', name: 'Omeprazole 20mg cap', batchNumber: 'B-OME020', beginningQty: 2, dispensed: 0, stock: 2, unit: 'Capsules', dateAdded: '2026-05-12', status: 'Low Stock', stockHistory: [{ date: '2026-05-12', qty: 2, type: 'add', note: 'Beginning Inventory' }] },
  { id: 'med-35', name: 'Omeprazole 40mg cap', batchNumber: 'B-OME040', beginningQty: 51, dispensed: 17, stock: 34, unit: 'Capsules', dateAdded: '2026-05-12', status: 'Healthy', stockHistory: [{ date: '2026-05-12', qty: 51, type: 'add', note: 'Beginning Inventory' }, { date: '2026-05-30', qty: 17, type: 'dispense', note: 'Monthly clinic consumption' }] },
  { id: 'med-36', name: 'Panto Plus cap', batchNumber: 'B-PAN028', beginningQty: 28, dispensed: 15, stock: 13, unit: 'Capsules', dateAdded: '2026-05-12', status: 'Healthy', stockHistory: [{ date: '2026-05-12', qty: 28, type: 'add', note: 'Beginning Inventory' }, { date: '2026-05-30', qty: 15, type: 'dispense', note: 'Monthly clinic consumption' }] },
  { id: 'med-37', name: 'Paracetamol syrup', batchNumber: 'B-PAR001', beginningQty: 1, dispensed: 0, stock: 1, unit: 'Bottles', dateAdded: '2026-05-12', status: 'Low Stock', stockHistory: [{ date: '2026-05-12', qty: 1, type: 'add', note: 'Beginning Inventory' }] },
  { id: 'med-38', name: 'Plavix 75mg tab', batchNumber: 'B-PLA075', beginningQty: 4, dispensed: 0, stock: 4, unit: 'Tablets', dateAdded: '2026-05-12', status: 'Low Stock', stockHistory: [{ date: '2026-05-12', qty: 4, type: 'add', note: 'Beginning Inventory' }] },
  { id: 'med-39', name: 'Ranitidine 150mg tab', batchNumber: 'B-RAN150', beginningQty: 53, dispensed: 17, stock: 36, unit: 'Tablets', dateAdded: '2026-05-12', status: 'Healthy', stockHistory: [{ date: '2026-05-12', qty: 53, type: 'add', note: 'Beginning Inventory' }, { date: '2026-05-30', qty: 17, type: 'dispense', note: 'Monthly clinic consumption' }] },
  { id: 'med-40', name: 'Serc 16mg cap', batchNumber: 'B-SER016', beginningQty: 54, dispensed: 14, stock: 40, unit: 'Capsules', dateAdded: '2026-05-12', status: 'Healthy', stockHistory: [{ date: '2026-05-12', qty: 54, type: 'add', note: 'Beginning Inventory' }, { date: '2026-05-30', qty: 14, type: 'dispense', note: 'Monthly clinic consumption' }] },
  { id: 'med-41', name: 'Sinupret tab', batchNumber: 'B-SIN125', beginningQty: 125, dispensed: 18, stock: 107, unit: 'Tablets', dateAdded: '2026-05-12', status: 'Healthy', stockHistory: [{ date: '2026-05-12', qty: 125, type: 'add', note: 'Beginning Inventory' }, { date: '2026-05-30', qty: 18, type: 'dispense', note: 'Monthly clinic consumption' }] },
  { id: 'med-42', name: 'Strepsils lozenges (8xpack)', batchNumber: 'B-STR093', beginningQty: 93, dispensed: 61, stock: 32, unit: 'Packs', dateAdded: '2026-05-12', status: 'Healthy', stockHistory: [{ date: '2026-05-12', qty: 93, type: 'add', note: 'Beginning Inventory' }, { date: '2026-05-30', qty: 61, type: 'dispense', note: 'Monthly clinic consumption' }] },
  { id: 'med-43', name: 'Ventolin nebules', batchNumber: 'B-VEN028', beginningQty: 28, dispensed: 9, stock: 19, unit: 'Nebules', dateAdded: '2026-05-12', status: 'Healthy', stockHistory: [{ date: '2026-05-12', qty: 28, type: 'add', note: 'Beginning Inventory' }, { date: '2026-05-30', qty: 9, type: 'dispense', note: 'Monthly clinic consumption' }] },
];

export const mockPurchaseRequests: PurchaseRequest[] = [];


export const mockMedicalCerts: MedicalCertificate[] = [
  {
    id: 'MC-001',
    patientId: 'STU-2024-001',
    patientName: 'Aaliyah Ysabella G. Cosino',
    age: 23,
    sex: 'FEMALE',
    statusDesignation: '4th year level of BS Arc student of University of the Assumption',
    examinedDueTo: 'skin allergies and difficulty on breathing.',
    date: 'June 17, 2026',
    purpose: 'Medical excuse and clinic clearance for school activities.',
    diagnosis: 'Allergic reaction secondary to food intake with allergens.',
    treatment: 'Loratadine 10 mg tablet, 1 tablet once a day for 7 days.\nPrednisone 5 mg tablet, 1 tablet once a day for 7 days.',
    recommendation: 'Have a rest for 1-2 days. May go back to school after 1-2 days once there is no presence of itchiness/allergies. Advice proper hand washing at all times and avoid allergenic foods.',
    doctor: 'JOHNNY MICHAEL P. MANGULABNAN, MD',
    doctorTitle: 'UNIVERSITY PHYSICIAN/PHILHEALTH YAKAP',
    licenseNo: '0095055',
    ptrNo: '22483890',
    issuedBy: 'Grace Aquino, RN',
  },
  {
    id: 'MC-002',
    patientId: 'EMP-2024-002',
    patientName: 'Roberto Gomez',
    age: 42,
    sex: 'MALE',
    statusDesignation: 'Faculty & Staff Member of University of the Assumption',
    examinedDueTo: 'high fever and acute severe cough.',
    date: 'June 27, 2026',
    purpose: 'Medical certificate for employee sick leave.',
    diagnosis: 'Upper respiratory tract infection with fever',
    treatment: 'Paracetamol 500mg every 6 hours for fever.\nAmoxicillin 500mg capsules three times daily for 7 days.',
    recommendation: 'Rest for 2-3 days. Complete prescribed oral antibiotics and increase fluid intake.',
    doctor: 'JOHNNY MICHAEL P. MANGULABNAN, MD',
    doctorTitle: 'UNIVERSITY PHYSICIAN/PHILHEALTH YAKAP',
    licenseNo: '0095055',
    ptrNo: '22483890',
    issuedBy: 'Grace Aquino, RN',
  },
  {
    id: 'MC-003',
    patientId: 'STU-2024-005',
    patientName: 'Sofia Reyes',
    age: 19,
    sex: 'FEMALE',
    statusDesignation: '1st year student of BS Nursing of University of the Assumption',
    examinedDueTo: 'acute lower abdominal pain and cramping.',
    date: 'June 25, 2026',
    purpose: 'Medical certificate for excuse from PE class.',
    diagnosis: 'Dysmenorrhea',
    treatment: 'Mefenamic Acid 500mg capsule twice daily as needed for pain.\nWarm compress applied to lower abdominal area.',
    recommendation: 'Excuse from strenuous physical education activities for 1-2 days.',
    doctor: 'JOHNNY MICHAEL P. MANGULABNAN, MD',
    doctorTitle: 'UNIVERSITY PHYSICIAN/PHILHEALTH YAKAP',
    licenseNo: '0095055',
    ptrNo: '22483890',
    issuedBy: 'Grace Aquino, RN',
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
