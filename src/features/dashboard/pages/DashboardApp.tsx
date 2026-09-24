import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Layout } from '../layouts/DashboardLayout';
import {
  Dashboard, PatientManagement, PatientForm, PatientProfile, NewConsultation,
  ConsultationTab, NonConsultationTab, Inventory, PurchaseReceipts,
  MedicalCertificates, BedsManagement, Reports, Notifications, Settings,
  GlobalSearch, Appointments, Telemedicine
} from '../components';
import {
  Patient, Consultation, MedicineItem, PurchaseRequest, MedicalCertificate,
  Bed, AppNotification, HospitalTransfer, Page, PatientQueue
} from '@/types';

import { patientService } from '@/services/patientService';
import { consultationService } from '@/services/consultationService';
import { medicineService } from '@/services/medicineService';
import { bedService } from '@/services/bedService';
import { certificateService } from '@/services/certificateService';
import { notificationService } from '@/services/notificationService';
import { queueService } from '@/services/queueService';
import { getManilaDate, getManilaTime } from '@/utils/philippineTime';


interface DashboardAppProps {
  onLogout: () => void;
}

export default function DashboardApp({ onLogout }: DashboardAppProps) {
  const location = useLocation();
  const routerNavigate = useNavigate();
  
  const pathParts = location.pathname.split('/');
  const routePage = pathParts[2] || 'dashboard';
  const currentPage = routePage as Page;

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [editingPatientId, setEditingPatientId]   = useState<string | null>(null);
  const [convertingId, setConvertingId]           = useState<string | null>(null);
  const [searchQuery, setSearchQuery]       = useState('');

  // Initialize with empty arrays to prevent mock data from showing before real data is fetched
  const [patients, setPatients]                 = useState<Patient[]>([]);
  const [consultations, setConsultations]       = useState<Consultation[]>([]);
  const [transfers, setTransfers]               = useState<HospitalTransfer[]>([]);
  const [medicines, setMedicines]               = useState<MedicineItem[]>(() => {
    try {
      const cached = localStorage.getItem('cura_medicines_cache');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [medicalCerts, setMedicalCerts]         = useState<MedicalCertificate[]>(() => {
    try {
      const cached = localStorage.getItem('cura_medical_certs');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [beds, setBeds]                         = useState<Bed[]>([]);
  const [notifications, setNotifications]       = useState<AppNotification[]>([]);
  const [queues, setQueues]                     = useState<PatientQueue[]>([]);
  const readNotifIdsRef = useRef<Set<string>>(new Set());
  const dismissedNotifIdsRef = useRef<Set<string>>(new Set());
  const completedQueueIdsRef = useRef<Set<string>>(new Set());
  const notifiedQueueIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    try {
      const readStored = JSON.parse(localStorage.getItem('cura_read_notifs') || '[]');
      readNotifIdsRef.current = new Set(readStored);
      const dismissedStored = JSON.parse(localStorage.getItem('cura_dismissed_notifs') || '[]');
      dismissedNotifIdsRef.current = new Set(dismissedStored);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const navigate = (page: Page) => {
    routerNavigate(`/dashboard/${page === 'dashboard' ? '' : page}`);
    setSearchQuery(''); // clear search when changing pages
  };

  useEffect(() => {
    patientService.getPatients().then(d => {
      if (d !== undefined) {
        setPatients(d.map(p => ({ ...p, name: p.name ? p.name.toUpperCase() : p.name })));
      }
    }).catch(console.error);
    consultationService.getConsultations().then(d => d !== undefined && setConsultations(d)).catch(console.error);
    medicineService.getMedicines().then(d => {
      if (d !== undefined) {
        setMedicines(d);
        localStorage.setItem('cura_medicines_cache', JSON.stringify(d));
      }
    }).catch(console.error);
    medicineService.getPurchaseRequests().then(d => d !== undefined && setPurchaseRequests(d)).catch(console.error);
    bedService.getBeds().then(d => d !== undefined && setBeds(d)).catch(console.error);
    certificateService.getCertificates().then(d => {
      if (d !== undefined && d.length > 0) {
        setMedicalCerts(prev => {
          const map = new Map<string, MedicalCertificate>();
          prev.forEach(c => map.set(c.id, c));
          d.forEach(c => map.set(c.id, c));
          const merged = Array.from(map.values());
          try { localStorage.setItem('cura_medical_certs', JSON.stringify(merged)); } catch {}
          return merged;
        });
      }
    }).catch(console.error);
    queueService.getQueues().then(d => d !== undefined && setQueues(d)).catch(console.error);

    const fetchAndMergeNotifications = () => {
      notificationService.getNotifications().then(d => {
        if (d !== undefined) {
          setNotifications(prev => {
            const localMeds = prev.filter(p => p.id.startsWith('med-') && !dismissedNotifIdsRef.current.has(p.id));
            const backendNotifs = d
              .filter(n => !dismissedNotifIdsRef.current.has(n.id))
              .map(n => readNotifIdsRef.current.has(n.id) ? { ...n, read: true } : n);
            return [...localMeds, ...backendNotifs];
          });
        }
      }).catch(console.error);
    };

    const fetchQueues = () => {
      queueService.getQueues().then(d => {
        if (d !== undefined) {
          setQueues(() => {
            return d
              .filter(q => !completedQueueIdsRef.current.has(q.id))
              .map(q => notifiedQueueIdsRef.current.has(q.id) ? { ...q, status: 'called' } : q);
          });
        }
      }).catch(console.error);
    };

    fetchAndMergeNotifications();
    fetchQueues();

    // Polling for new notifications and queues (1.5s for near-instant sync)
    const interval = setInterval(() => {
      fetchAndMergeNotifications();
      fetchQueues();
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Check for upcoming medication doses
  useEffect(() => {
    const checkUpcomingDoses = () => {
      const [currHStr, currMStr] = getManilaTime().split(':');
      const currentHours = parseInt(currHStr, 10);
      const currentMinutes = parseInt(currMStr, 10);
      const today = getManilaDate();

      setNotifications(prev => {
        const newNotifs: AppNotification[] = [];
        
        consultations.forEach(c => {
          if (c.date !== today || !c.treatments) return;
          
          c.treatments.forEach(t => {
            if (t.nextDose) {
              const [doseHourStr, doseMinuteStr] = t.nextDose.split(':');
              const doseHour = parseInt(doseHourStr, 10);
              const doseMinute = parseInt(doseMinuteStr, 10);
              
              if (isNaN(doseHour) || isNaN(doseMinute)) return;
              
              const doseTimeInMins = doseHour * 60 + doseMinute;
              const currentTimeInMins = currentHours * 60 + currentMinutes;
              const diff = doseTimeInMins - currentTimeInMins;
              
              // If dose is within 30 minutes (0 to 30 mins)
              if (diff >= 0 && diff <= 30) {
                const notifId = `med-${c.id}-${t.medicineName}-${t.nextDose}`;
                if (dismissedNotifIdsRef.current.has(notifId)) return;
                // Check if we already have this notification
                if (!prev.find(n => n.id === notifId) && !newNotifs.find(n => n.id === notifId)) {
                  const patientName = patients.find(p => p.id === c.patientId)?.name || 'Unknown Patient';
                  const isRead = readNotifIdsRef.current.has(notifId);
                  newNotifs.push({
                    id: notifId,
                    type: 'medication',
                    message: `Medication (${t.medicineName}) due for ${patientName} in ${diff === 0 ? 'less than a minute' : `${diff} mins`}`,
                    time: now.toISOString(),
                    read: isRead,
                    patientName,
                    nextDose: t.nextDose,
                    minutesLeft: diff,
                  });
                }
              }
            }
          });
        });

        if (newNotifs.length > 0) {
          return [...newNotifs, ...prev];
        }
        return prev;
      });
    };

    // Run immediately, then every minute
    checkUpcomingDoses();
    const interval = setInterval(checkUpcomingDoses, 60000);
    return () => clearInterval(interval);
  }, [consultations, patients]);

  const handleSavePatient = async (patient: Patient) => {
    const formattedPatient = {
      ...patient,
      name: patient.name ? patient.name.trim().toUpperCase() : patient.name,
    };
    if (editingPatientId) {
      setPatients(prev => prev.map(p => p.id === editingPatientId ? formattedPatient : p));
      try { await patientService.updatePatient(editingPatientId, formattedPatient); } 
      catch (error) { console.error('API failed, but state updated locally:', error); }
    } else {
      setPatients(prev => [formattedPatient, ...prev]);
      try { await patientService.createPatient(formattedPatient); } 
      catch (error) { console.error('API failed, but state updated locally:', error); }
    }
  };

  const processMedicineDeductions = async (consultationDate: string, patientId: string, treatments: Treatment[]) => {
    if (!treatments || treatments.length === 0) return;
    const patientName = patients.find(p => p.id === patientId)?.name || 'patient';
    
    const updates = treatments.map(async (t) => {
      const med = medicines.find(m => m.name === t.medicineName);
      if (med) {
        const newStock = Math.max(0, med.stock - t.quantity);
        const updatedMed = {
          ...med,
          stock: newStock,
          status: newStock <= 10 ? 'Low Stock' : 'Normal' as any,
          stockHistory: [...(med.stockHistory || []), {
            date: consultationDate,
            qty: t.quantity,
            type: 'dispense' as const,
            note: `Dispensed to ${patientName}`,
          }],
        };
        try {
          await medicineService.updateMedicine(updatedMed.id, updatedMed);
          return updatedMed;
        } catch (e) {
          console.error(`Failed to update stock for ${med.name}`, e);
        }
      }
      return null;
    });

    const results = await Promise.all(updates);
    const successfulUpdates = results.filter(Boolean) as MedicineItem[];

    if (successfulUpdates.length > 0) {
      setMedicines(prev => prev.map(m => {
        const updated = successfulUpdates.find(u => u.id === m.id);
        return updated ? updated : m;
      }));
    }
  };

  const handleSaveConsultation = async (consultation: Consultation) => {
    try {
      const { id, ...rest } = consultation;
      const created = await consultationService.createConsultation(rest);
      setConsultations(prev => [...prev, created]);
      
      await processMedicineDeductions(consultation.date, consultation.patientId, consultation.treatments);
      // Removed instant hardcoded notification; now handled by interval inside useEffect
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
    setConvertingId(id);
    navigate('convert-consultation-tab');
  };

  const handleSaveConversion = async (newConsultation: Consultation) => {
    if (!convertingId) return;
    try {
      const existing = consultations.find(c => c.id === convertingId);
      if (!existing) return;
      
      const created = await consultationService.createConsultation(newConsultation);
      const updatedOld = await consultationService.updateConsultation(convertingId, { 
        complaint: `${existing.complaint} [CONVERTED]` 
      });

      await processMedicineDeductions(newConsultation.date, newConsultation.patientId, newConsultation.treatments);

      setConsultations(prev => {
        const mapped = prev.map(c => c.id === convertingId ? updatedOld : c);
        return [...mapped, created];
      });
      setConvertingId(null);
    } catch (e) {
      console.error('Failed to save conversion', e);
      throw e;
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
    // Optimistically add to state immediately
    setMedicines(prev => [...prev, med]);
    try {
      const { id, ...rest } = med;
      const created = await medicineService.createMedicine(rest);
      // Replace temp local item with the server-assigned item (real UUID)
      setMedicines(prev => prev.map(m => m.id === med.id ? created : m));
    } catch (e) { 
      console.error('API failed, but state updated locally:', e); 
    }
  };

  const handleUpdateMedicine = async (med: MedicineItem) => {
    setMedicines(prev => prev.map(m => m.id === med.id ? med : m));
    try {
      await medicineService.updateMedicine(med.id, med);
    } catch (e) { 
      console.error('API failed, but state updated locally:', e); 
    }
  };

  const handleAddPurchaseRequest = async (req: PurchaseRequest) => {
    // Optimistic update: immediately add to state so PRF template reflects it instantly
    setPurchaseRequests(prev => [req, ...prev]);
    try {
      const { id, ...rest } = req;
      const created = await medicineService.createPurchaseRequest(rest);
      // Replace temp item with server-assigned item (real UUID)
      setPurchaseRequests(prev => prev.map(r => r.id === req.id ? created : r));
    } catch (e) {
      console.error('API failed, but state updated locally:', e);
    }
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

  const handleDeletePurchaseRequest = async (id: string) => {
    // Optimistic update: remove from state immediately so tracker and PRF template sync instantly
    setPurchaseRequests(prev => prev.filter(r => r.id !== id));
    try {
      await medicineService.deletePurchaseRequest(id);
    } catch (e) {
      console.error('API delete failed, but state updated locally:', e);
    }
  };
  const handleAddMedCert = async (cert: MedicalCertificate) => {
    try {
      const { id, ...rest } = cert;
      const created = await certificateService.createCertificate(rest);
      const fullCreated = {
        ...cert,
        ...created,
        patientId: created.patientId || cert.patientId,
        patientName: cert.patientName || created.patientName,
        date: cert.date || created.date,
      };
      setMedicalCerts(prev => {
        const next = [...prev.filter(c => c.id !== cert.id && c.id !== fullCreated.id), fullCreated];
        try { localStorage.setItem('cura_medical_certs', JSON.stringify(next)); } catch {}
        return next;
      });
      return fullCreated;
    } catch (e) {
      console.error('Error creating certificate:', e);
      setMedicalCerts(prev => {
        const next = [...prev.filter(c => c.id !== cert.id), cert];
        try { localStorage.setItem('cura_medical_certs', JSON.stringify(next)); } catch {}
        return next;
      });
      return cert;
    }
  };

  const handleDeleteMedCert = async (id: string) => {
    setMedicalCerts(prev => {
      const next = prev.filter(c => c.id !== id);
      try { localStorage.setItem('cura_medical_certs', JSON.stringify(next)); } catch {}
      return next;
    });
    try {
      await certificateService.deleteCertificate(id);
    } catch (e) {
      console.warn('Backend delete certificate note:', e);
    }
  };

  const handleUpdateMedCert = async (cert: MedicalCertificate) => {
    try {
      const updated = await certificateService.updateCertificate(cert.id, cert);
      const fullUpdated = { ...cert, ...updated, patientId: updated.patientId || cert.patientId };
      setMedicalCerts(prev => {
        const next = prev.map(c => c.id === fullUpdated.id ? fullUpdated : c);
        try { localStorage.setItem('cura_medical_certs', JSON.stringify(next)); } catch {}
        return next;
      });
      return fullUpdated;
    } catch (e) {
      console.error('Error updating certificate:', e);
      setMedicalCerts(prev => {
        const next = prev.map(c => c.id === cert.id ? cert : c);
        try { localStorage.setItem('cura_medical_certs', JSON.stringify(next)); } catch {}
        return next;
      });
      return cert;
    }
  };

  const handleUpdateBed = async (bed: Bed) => {
    // 1. Optimistic UI update for immediate 0ms responsiveness!
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

    // 2. Sync with remote server asynchronously in background without freezing UI
    try {
      await bedService.updateBed(bed.id, bed);
    } catch (e: any) { 
      console.error('Background updateBed server note:', e);
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    readNotifIdsRef.current.add(id);
    try {
      const stored = JSON.parse(localStorage.getItem('cura_read_notifs') || '[]');
      if (!stored.includes(id)) {
        localStorage.setItem('cura_read_notifs', JSON.stringify([...stored, id]));
      }
    } catch (e) {
      console.error(e);
    }
    if (!id.startsWith('med-')) {
      try {
        await notificationService.updateNotification(id, { read: true });
      } catch (error) {
        console.error('Failed to update notification read status on server:', error);
      }
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    setNotifications(prev => {
      const allIds = prev.map(n => n.id);
      allIds.forEach(id => readNotifIdsRef.current.add(id));
      try {
        localStorage.setItem('cura_read_notifs', JSON.stringify(Array.from(readNotifIdsRef.current)));
      } catch (e) {
        console.error(e);
      }
      return prev.map(n => ({ ...n, read: true }));
    });

    try {
      await notificationService.markAllRead();
      const backendUnread = notifications.filter(n => !n.read && !n.id.startsWith('med-'));
      await Promise.allSettled(backendUnread.map(n => notificationService.updateNotification(n.id, { read: true })));
    } catch (error) {
      console.error('Failed to mark all notifications read on server:', error);
    }
  };

  const handleDismissNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    dismissedNotifIdsRef.current.add(id);
    try {
      const stored = JSON.parse(localStorage.getItem('cura_dismissed_notifs') || '[]');
      if (!stored.includes(id)) {
        localStorage.setItem('cura_dismissed_notifs', JSON.stringify([...stored, id]));
      }
    } catch (e) {
      console.error(e);
    }
    if (!id.startsWith('med-')) {
      try {
        await notificationService.deleteNotification(id);
      } catch (error) {
        console.error('Failed to delete notification on server:', error);
      }
    }
  };

  const handleClearAllNotifications = async () => {
    setNotifications([]);
    notifications.forEach(n => dismissedNotifIdsRef.current.add(n.id));
    try {
      localStorage.setItem('cura_dismissed_notifs', JSON.stringify(Array.from(dismissedNotifIdsRef.current)));
      await notificationService.clearAll();
    } catch (error) {
      console.error('Failed to clear notifications on server:', error);
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
            queues={queues}
            onNotifyQueue={async (id) => {
              notifiedQueueIdsRef.current.add(id);
              setQueues(prev => prev.map(q => q.id === id ? { ...q, status: 'called' } : q));
              try {
                await queueService.notifyQueue(id);
              } catch (err) {
                console.error(err);
                notifiedQueueIdsRef.current.delete(id);
                fetchQueues();
              }
            }}
            onCompleteQueue={async (id) => {
              completedQueueIdsRef.current.add(id);
              setQueues(prev => prev.filter(q => q.id !== id));
              try {
                await queueService.completeQueue(id);
              } catch (err) {
                console.error(err);
                completedQueueIdsRef.current.delete(id);
                fetchQueues();
              }
            }}
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
      case 'appointments':
        return (
          <Appointments patients={patients} onNavigate={navigate} />
        );
      case 'telemedicine':
        return (
          <Telemedicine patients={patients} onNavigate={navigate} />
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
        return (
          <NewConsultation
            patient={selectedPatient}
            patients={patients}
            medicines={medicines}
            onSave={handleSaveConsultation} onNavigate={navigate}
          />
        );
      case 'new-consultation-tab':
        return (
          <NewConsultation
            patient={selectedPatient}
            patients={patients}
            medicines={medicines}
            forcedStatus="Consultation"
            onSave={handleSaveConsultation} onNavigate={navigate}
          />
        );
      case 'new-non-consultation-tab':
        return (
          <NewConsultation
            patient={selectedPatient}
            patients={patients}
            medicines={medicines}
            forcedStatus="Non-Consultation"
            onSave={handleSaveConsultation} onNavigate={navigate}
          />
        );
      case 'convert-consultation-tab': {
        const initialData = consultations.find(c => c.id === convertingId);
        const p = patients.find(p => p.id === initialData?.patientId);
        return (
          <NewConsultation
            patient={p}
            patients={patients}
            medicines={medicines}
            forcedStatus="Consultation"
            initialData={initialData}
            onSave={async (c) => {
              await handleSaveConversion(c);
              navigate('consultations');
            }}
            onNavigate={navigate}
          />
        );
      }
      case 'consultations':
        return (
          <ConsultationTab
            patients={patients} consultations={consultations}
            transfers={transfers} searchQuery={searchQuery}
            onUpdateConsultation={handleUpdateConsultation}
            onAddTransfer={handleAddTransfer}
            onNavigate={navigate} onSelectPatient={setSelectedPatientId}
          />
        );
      case 'non-consultations':
        return (
          <NonConsultationTab
            patients={patients} consultations={consultations}
            searchQuery={searchQuery}
            onConvertToConsultation={handleConvertToConsultation}
            onNavigate={navigate} onSelectPatient={setSelectedPatientId}
          />
        );
      case 'inventory':
        return (
          <Inventory
            medicines={medicines} searchQuery={searchQuery}
            onUpdateMedicine={handleUpdateMedicine}
            onAddMedicine={handleAddMedicine}
          />
        );
      case 'purchase-receipts':
        return (
          <PurchaseReceipts
            purchaseRequests={purchaseRequests} medicines={medicines}
            searchQuery={searchQuery}
            onUpdateRequest={handleUpdatePurchaseRequest}
            onAddRequest={handleAddPurchaseRequest}
            onDeleteRequest={handleDeletePurchaseRequest}
          />
        );
      case 'medical-certificates':
        return (
          <MedicalCertificates
            medicalCerts={medicalCerts} patients={patients}
            selectedPatientId={selectedPatientId} searchQuery={searchQuery}
            onAddCert={handleAddMedCert} onUpdateCert={handleUpdateMedCert}
            onDeleteCert={handleDeleteMedCert}
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
            onMarkRead={handleMarkNotificationRead}
            onMarkAllRead={handleMarkAllNotificationsRead}
            onDismiss={handleDismissNotification}
            onClearAll={handleClearAllNotifications}
            onNavigate={navigate}
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
        headerSearchComponent={
          currentPage === 'dashboard' ? (
            <GlobalSearch
              patients={patients}
              consultations={consultations}
              medicines={medicines}
              onNavigate={navigate}
              onSelectPatient={setSelectedPatientId}
            />
          ) : (
            <div className="flex-1 max-w-md relative">
              <input
                type="text"
                placeholder={`Search in ${currentPage.replace('-', ' ')}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#1E5AA8]/5 border border-[#1E5AA8]/20 rounded-xl text-sm text-[#1B3A6B] placeholder-[#1B3A6B]/60 focus:outline-none focus:border-[#1B3A6B] focus:bg-[#1E5AA8]/10 transition-all"
              />
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1B3A6B]/70">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          )
        }
      >
        {renderPage()}
      </Layout>
    </div>
  );
}
