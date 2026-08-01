import { useState } from 'react';
import { Layout } from '../layouts/DashboardLayout';
import {
  Dashboard, PatientManagement, PatientForm, PatientProfile, NewConsultation,
  ConsultationTab, NonConsultationTab, Inventory, PurchaseReceipts,
  MedicalCertificates, BedsManagement, Reports, Notifications, Settings,
} from '../components';
import {
  Patient, Consultation, MedicineItem, PurchaseRequest, MedicalCertificate,
  Bed, AppNotification, HospitalTransfer, Page,
} from '@/types';
import {
  mockPatients, mockConsultations, mockMedicines, mockPurchaseRequests,
  mockMedicalCerts, mockBeds, mockNotifications, mockTransfers,
} from '@/services';

interface DashboardAppProps {
  onLogout: () => void;
}

export default function DashboardApp({ onLogout }: DashboardAppProps) {
  const [currentPage, setCurrentPage]       = useState<Page>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [editingPatientId, setEditingPatientId]   = useState<string | null>(null);
  const [searchQuery, setSearchQuery]       = useState('');

  const [patients, setPatients]                 = useState<Patient[]>(mockPatients);
  const [consultations, setConsultations]       = useState<Consultation[]>(mockConsultations);
  const [transfers, setTransfers]               = useState<HospitalTransfer[]>(mockTransfers);
  const [medicines, setMedicines]               = useState<MedicineItem[]>(mockMedicines);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>(mockPurchaseRequests);
  const [medicalCerts, setMedicalCerts]         = useState<MedicalCertificate[]>(mockMedicalCerts);
  const [beds, setBeds]                         = useState<Bed[]>(mockBeds);
  const [notifications, setNotifications]       = useState<AppNotification[]>(mockNotifications);

  const navigate = (page: Page) => {
    setCurrentPage(page);
    if (page !== 'patients') setSearchQuery('');
  };

  const handleSavePatient = (patient: Patient) => {
    setPatients(prev => {
      const exists = prev.find(p => p.id === patient.id);
      return exists ? prev.map(p => p.id === patient.id ? patient : p) : [...prev, patient];
    });
  };

  const handleSaveConsultation = (consultation: Consultation) => {
    setConsultations(prev => [...prev, consultation]);
    consultation.treatments.forEach(t => {
      setMedicines(prev => prev.map(m => {
        if (m.name.toLowerCase().startsWith(t.medicineName.toLowerCase().split(' ')[0].toLowerCase())) {
          const newStock = Math.max(0, m.stock - t.quantity);
          return {
            ...m, stock: newStock,
            status: newStock <= 10 ? 'Low Stock' : 'Normal',
            stockHistory: [...m.stockHistory, {
              date: consultation.date, qty: t.quantity, type: 'dispense' as const,
              note: `Dispensed to ${patients.find(p => p.id === consultation.patientId)?.name || 'patient'}`,
            }],
          };
        }
        return m;
      }));
    });
    consultation.treatments.forEach(t => {
      if (t.nextDose) {
        const notif: AppNotification = {
          id: `N${Date.now()}${Math.random()}`, type: 'medication',
          message: `Medication due for ${patients.find(p => p.id === consultation.patientId)?.name}`,
          time: new Date().toISOString(), read: false,
          patientName: patients.find(p => p.id === consultation.patientId)?.name,
          nextDose: t.nextDose, minutesLeft: 30,
        };
        setNotifications(prev => [notif, ...prev]);
      }
    });
  };

  const handleUpdateConsultation = (updated: Consultation) => {
    setConsultations(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleConvertToConsultation = (id: string) => {
    setConsultations(prev => prev.map(c => c.id === id ? { ...c, status: 'Consultation' } : c));
  };

  const handleAddTransfer = (transfer: HospitalTransfer) => {
    setTransfers(prev => [...prev, transfer]);
    const notif: AppNotification = {
      id: `N${Date.now()}`, type: 'general',
      message: `Patient ${patients.find(p => p.id === transfer.patientId)?.name} transferred to ${transfer.receivingHospital}`,
      time: new Date().toISOString(), read: false,
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const handleUpdateMedicine = (med: MedicineItem) => {
    setMedicines(prev => prev.map(m => m.id === med.id ? med : m));
  };

  const handleAddMedicine = (med: MedicineItem) => {
    setMedicines(prev => [...prev, med]);
  };

  const handleUpdatePurchaseRequest = (req: PurchaseRequest) => {
    setPurchaseRequests(prev => prev.map(r => r.id === req.id ? req : r));
    const last = req.history[req.history.length - 1];
    if (last?.qty > 0) {
      setMedicines(prev => prev.map(m => {
        if (m.name === req.medicine) {
          const newStock = m.stock + last.qty;
          return {
            ...m, stock: newStock,
            status: newStock > 10 ? 'Normal' : 'Low Stock',
            stockHistory: [...m.stockHistory, { date: last.date, qty: last.qty, type: 'add' as const, note: `From PR ${req.id}` }],
          };
        }
        return m;
      }));
    }
  };

  const handleAddPurchaseRequest = (req: PurchaseRequest) => {
    setPurchaseRequests(prev => [...prev, req]);
  };

  const handleAddMedCert = (cert: MedicalCertificate) => {
    setMedicalCerts(prev => [...prev, cert]);
  };

  const handleUpdateMedCert = (cert: MedicalCertificate) => {
    setMedicalCerts(prev => prev.map(c => c.id === cert.id ? cert : c));
  };

  const handleUpdateBed = (bed: Bed) => {
    setBeds(prev => prev.map(b => b.id === bed.id ? bed : b));
    if (bed.status === 'Occupied' && bed.patientName) {
      const notif: AppNotification = {
        id: `N${Date.now()}`, type: 'bed',
        message: `Bed ${bed.bedNumber} assigned to ${bed.patientName}`,
        time: new Date().toISOString(), read: false,
        patientName: bed.patientName,
      };
      setNotifications(prev => [notif, ...prev]);
    }
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            patients={patients} consultations={consultations}
            medicines={medicines} notifications={notifications}
            onNavigate={navigate} onSelectPatient={setSelectedPatientId}
          />
        );
      case 'patients':
        return (
          <PatientManagement
            patients={patients} searchQuery={searchQuery}
            onNavigate={navigate} onSelectPatient={setSelectedPatientId}
            onEditPatient={setEditingPatientId}
          />
        );
      case 'patient-form':
        return (
          <PatientForm
            patients={patients} editingPatientId={editingPatientId}
            onSave={handleSavePatient} onNavigate={navigate}
          />
        );
      case 'patient-profile':
        if (!selectedPatient) { navigate('patients'); return null; }
        return (
          <PatientProfile
            patient={selectedPatient} consultations={consultations}
            medicalCerts={medicalCerts} onNavigate={navigate}
            onSelectPatient={setSelectedPatientId}
          />
        );
      case 'new-consultation':
        if (!selectedPatient) { navigate('patients'); return null; }
        return (
          <NewConsultation
            patient={selectedPatient}
            onSave={handleSaveConsultation} onNavigate={navigate}
          />
        );
      case 'consultations':
        return (
          <ConsultationTab
            patients={patients} consultations={consultations}
            transfers={transfers}
            onUpdateConsultation={handleUpdateConsultation}
            onAddTransfer={handleAddTransfer}
            onNavigate={navigate} onSelectPatient={setSelectedPatientId}
          />
        );
      case 'non-consultations':
        return (
          <NonConsultationTab
            patients={patients} consultations={consultations}
            onConvertToConsultation={handleConvertToConsultation}
            onNavigate={navigate} onSelectPatient={setSelectedPatientId}
          />
        );
      case 'inventory':
        return (
          <Inventory
            medicines={medicines}
            onUpdateMedicine={handleUpdateMedicine}
            onAddMedicine={handleAddMedicine}
          />
        );
      case 'purchase-receipts':
        return (
          <PurchaseReceipts
            purchaseRequests={purchaseRequests} medicines={medicines}
            onUpdateRequest={handleUpdatePurchaseRequest}
            onAddRequest={handleAddPurchaseRequest}
          />
        );
      case 'medical-certificates':
        return (
          <MedicalCertificates
            medicalCerts={medicalCerts} patients={patients}
            selectedPatientId={selectedPatientId}
            onAddCert={handleAddMedCert} onUpdateCert={handleUpdateMedCert}
          />
        );
      case 'beds':
        return (
          <BedsManagement
            beds={beds} patients={patients} onUpdateBed={handleUpdateBed}
          />
        );
      case 'reports':
        return (
          <Reports
            patients={patients} consultations={consultations}
            medicines={medicines} beds={beds}
            medicalCerts={medicalCerts} purchaseRequests={purchaseRequests}
          />
        );
      case 'notifications':
        return (
          <Notifications
            notifications={notifications}
            onMarkRead={id => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
            onMarkAllRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
            onDismiss={id => setNotifications(prev => prev.filter(n => n.id !== id))}
          />
        );
      case 'settings':
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-scope h-full">
      <Layout
        currentPage={currentPage} onNavigate={navigate}
        onLogout={onLogout}
        notifications={notifications}
        searchQuery={searchQuery}
        onSearchChange={q => { setSearchQuery(q); if (q) navigate('patients'); }}
      >
        {renderPage()}
      </Layout>
    </div>
  );
}
