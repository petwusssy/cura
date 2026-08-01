import { useState, useEffect } from 'react';
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

import { patientService } from '@/services/patientService';
import { consultationService } from '@/services/consultationService';
import { medicineService } from '@/services/medicineService';
import { bedService } from '@/services/bedService';
import { certificateService } from '@/services/certificateService';
import { notificationService } from '@/services/notificationService';

interface DashboardAppProps {
  onLogout: () => void;
}

export default function DashboardApp({ onLogout }: DashboardAppProps) {
  const [currentPage, setCurrentPage]       = useState<Page>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [editingPatientId, setEditingPatientId]   = useState<string | null>(null);
  const [searchQuery, setSearchQuery]       = useState('');

  const [patients, setPatients]                 = useState<Patient[]>([]);
  const [consultations, setConsultations]       = useState<Consultation[]>([]);
  const [transfers, setTransfers]               = useState<HospitalTransfer[]>([]);
  const [medicines, setMedicines]               = useState<MedicineItem[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [medicalCerts, setMedicalCerts]         = useState<MedicalCertificate[]>([]);
  const [beds, setBeds]                         = useState<Bed[]>([]);
  const [notifications, setNotifications]       = useState<AppNotification[]>([]);

  const navigate = (page: Page) => {
    setCurrentPage(page);
    if (page !== 'patients') setSearchQuery('');
  };

  useEffect(() => {
    patientService.getPatients().then(setPatients).catch(console.error);
    consultationService.getConsultations().then(setConsultations).catch(console.error);
    medicineService.getMedicines().then(setMedicines).catch(console.error);
    medicineService.getPurchaseRequests().then(setPurchaseRequests).catch(console.error);
    bedService.getBeds().then(setBeds).catch(console.error);
    certificateService.getCertificates().then(setMedicalCerts).catch(console.error);
    notificationService.getNotifications().then(setNotifications).catch(console.error);
  }, []);

  const handleSavePatient = async (patient: Patient) => {
    try {
      if (patients.find(p => p.id === patient.id)) {
        const updated = await patientService.updatePatient(patient.id, patient);
        setPatients(prev => prev.map(p => p.id === updated.id ? updated : p));
      } else {
        const created = await patientService.createPatient(patient);
        setPatients(prev => [...prev, created]);
      }
    } catch (error) {
      console.error('Failed to save patient', error);
      throw error;
    }
  };

  const handleSaveConsultation = async (consultation: Consultation) => {
    try {
      const { id, ...rest } = consultation;
      const created = await consultationService.createConsultation(rest);
      setConsultations(prev => [...prev, created]);
      
      // Keep medicine stock logic local for now (will be updated when Medicine API is integrated)
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
    } catch (e) {
      console.error('Failed to save consultation', e);
      throw e;
    }
  };

  const handleUpdateConsultation = async (updated: Consultation) => {
    try {
      const res = await consultationService.updateConsultation(updated.id, updated);
      setConsultations(prev => prev.map(c => c.id === res.id ? res : c));
    } catch (e) {
      console.error('Failed to update consultation', e);
    }
  };

  const handleConvertToConsultation = async (id: string) => {
    try {
      const res = await consultationService.updateConsultation(id, { status: 'Consultation' });
      setConsultations(prev => prev.map(c => c.id === id ? res : c));
    } catch (e) {
      console.error('Failed to convert consultation', e);
    }
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

  const handleAddMedicine = async (med: MedicineItem) => {
    try {
      const { id, ...rest } = med;
      const created = await medicineService.createMedicine(rest);
      setMedicines(prev => [...prev, created]);
    } catch (e) { console.error(e); }
  };

  const handleUpdateMedicine = async (med: MedicineItem) => {
    try {
      const updated = await medicineService.updateMedicine(med.id, med);
      setMedicines(prev => prev.map(m => m.id === updated.id ? updated : m));
    } catch (e) { console.error(e); }
  };

  const handleAddPurchaseRequest = async (req: PurchaseRequest) => {
    try {
      const { id, ...rest } = req;
      const created = await medicineService.createPurchaseRequest(rest);
      setPurchaseRequests(prev => [created, ...prev]);
    } catch (e) { console.error(e); }
  };

  const handleUpdatePurchaseRequest = async (req: PurchaseRequest) => {
    try {
      const updated = await medicineService.updatePurchaseRequest(req.id, req);
      setPurchaseRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
      
      const last = req.history[req.history.length - 1];
      if (last?.qty > 0) {
        setMedicines(prev => prev.map(m => {
          if (m.name === req.medicine) {
            const newStock = m.stock + last.qty;
            const updatedMed = {
              ...m, stock: newStock,
              status: newStock > 10 ? 'Normal' : 'Low Stock',
              stockHistory: [...m.stockHistory, { date: last.date, qty: last.qty, type: 'add' as const, note: `From PR ${req.id}` }],
            };
            // Note: The UI updates immediately, but we should also call the API for the medicine stock update.
            // For now, it updates locally.
            return updatedMed as MedicineItem;
          }
          return m;
        }));
      }
    } catch (e) { console.error(e); }
  };
  const handleAddMedCert = async (cert: MedicalCertificate) => {
    try {
      const { id, ...rest } = cert;
      const created = await certificateService.createCertificate(rest);
      setMedicalCerts(prev => [...prev, created]);
    } catch (e) { console.error(e); }
  };

  const handleUpdateMedCert = async (cert: MedicalCertificate) => {
    try {
      const updated = await certificateService.updateCertificate(cert.id, cert);
      setMedicalCerts(prev => prev.map(c => c.id === updated.id ? updated : c));
    } catch (e) { console.error(e); }
  };

  const handleUpdateBed = async (bed: Bed) => {
    try {
      const updated = await bedService.updateBed(bed.id, bed);
      setBeds(prev => prev.map(b => b.id === updated.id ? updated : b));
      if (updated.status === 'Occupied' && updated.patientName) {
        const notif: AppNotification = {
          id: `N${Date.now()}`, type: 'bed',
          message: `Bed ${updated.bedNumber} assigned to ${updated.patientName}`,
          time: new Date().toISOString(), read: false,
          patientName: updated.patientName,
        };
        setNotifications(prev => [notif, ...prev]);
      }
    } catch (e) { console.error(e); }
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
