import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Layout } from '../layouts/DashboardLayout';
import {
  Dashboard, DashboardSkeleton, PageSkeleton,
  PatientManagement, PatientForm, PatientProfile, NewConsultation,
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
import { getManilaDate, getManilaTime, normalizeDate, formatTime12 } from '@/utils/philippineTime';
import { toast } from 'sonner';


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

  // Initialize with cached data when available to eliminate skeleton on repeat views
  const [patients, setPatients]                 = useState<Patient[]>(() => {
    try {
      const cached = localStorage.getItem('cura_patients_cache');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [consultations, setConsultations]       = useState<Consultation[]>(() => {
    try {
      const cached = localStorage.getItem('cura_consultations_cache');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [transfers, setTransfers]               = useState<HospitalTransfer[]>([]);
  const [medicines, setMedicines]               = useState<MedicineItem[]>(() => {
    try {
      const cached = localStorage.getItem('cura_medicines_cache');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>(() => {
    try {
      const cached = localStorage.getItem('cura_purchase_requests_cache');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [medicalCerts, setMedicalCerts]         = useState<MedicalCertificate[]>(() => {
    try {
      const cached = localStorage.getItem('cura_medical_certs');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [beds, setBeds]                         = useState<Bed[]>(() => {
    try {
      const cached = localStorage.getItem('cura_beds_cache');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [notifications, setNotifications]       = useState<AppNotification[]>([]);
  const [queues, setQueues]                     = useState<PatientQueue[]>(() => {
    try {
      const cached = localStorage.getItem('cura_queues_cache');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  // true while the first batch of API calls is in-flight
  const [isLoading, setIsLoading]               = useState(true);

  // If we already have loaded data, never show a blocking skeleton
  const hasExistingData = patients.length > 0 || consultations.length > 0 || medicines.length > 0 || purchaseRequests.length > 0;

  // Threshold delay: only reveal skeleton if network is actually slow (> 150ms) and we have no data
  const [skeletonVisible, setSkeletonVisible]   = useState(false);

  useEffect(() => {
    if (!isLoading || hasExistingData) {
      setSkeletonVisible(false);
      return;
    }
    const timer = setTimeout(() => {
      setSkeletonVisible(true);
    }, 150);
    return () => clearTimeout(timer);
  }, [isLoading, hasExistingData]);
  const readNotifIdsRef = useRef<Set<string>>(new Set());
  const dismissedNotifIdsRef = useRef<Set<string>>(new Set());
  const alertedDosesRef = useRef<Set<string>>(new Set());
  const alertedUpcomingDosesRef = useRef<Set<string>>(new Set());
  const alertedBedsRef = useRef<Set<string>>(new Set());
  const alertedUpcomingBedsRef = useRef<Set<string>>(new Set());
  const completedQueueIdsRef = useRef<Set<string>>(new Set());
  const notifiedQueueIdsRef = useRef<Set<string>>(new Set());
  const savingConsultationRef = useRef<boolean>(false);
  const savingConversionRef = useRef<boolean>(false);
  const knownServerNotifIdsRef = useRef<Set<string>>(new Set());
  const isInitialServerNotifFetchRef = useRef<boolean>(true);

  useEffect(() => {
    try {
      const readStored = JSON.parse(localStorage.getItem('cura_read_notifs') || '[]');
      readNotifIdsRef.current = new Set(readStored);
      const dismissedStored = JSON.parse(localStorage.getItem('cura_dismissed_notifs') || '[]');
      dismissedNotifIdsRef.current = new Set(dismissedStored);
      const intakedStored = JSON.parse(localStorage.getItem('cura_intaked_med_doses') || '[]');
      if (Array.isArray(intakedStored)) {
        intakedStored.forEach((id: string) => dismissedNotifIdsRef.current.add(id));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleMarkDoseIntaked = (keys: string[], consultationId?: string, treatmentId?: string, updatedRemarks?: string) => {
    keys.forEach(k => {
      dismissedNotifIdsRef.current.add(k);
    });
    setNotifications(prev => prev.filter(n => !keys.includes(n.id)));

    if (consultationId && updatedRemarks) {
      setConsultations(prev => prev.map(c => {
        if (c.id !== consultationId) return c;
        return {
          ...c,
          treatments: (c.treatments || []).map(t => {
            if ((treatmentId && String(t.id) === String(treatmentId)) ||
                keys.some(k => k.includes(t.medicineName) && (k.includes(String(t.nextDose)) || k.includes(String(t.timeGiven))))) {
              return { ...t, remarks: updatedRemarks };
            }
            return t;
          })
        };
      }));
    }
  };

  const navigate = (page: Page) => {
    routerNavigate(`/dashboard/${page === 'dashboard' ? '' : page}`);
    setSearchQuery(''); // clear search when changing pages
  };

  const fetchQueues = useCallback(() => {
    queueService.getQueues().then(d => {
      if (d !== undefined && Array.isArray(d)) {
        setQueues(() => {
          return d
            .filter(q => !completedQueueIdsRef.current.has(q.id))
            .map(q => notifiedQueueIdsRef.current.has(q.id) ? { ...q, status: 'called' } : q);
        });
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    // ─── Parallel initial fetch ────────────────────────────────────────────
    // allSettled so a single failing endpoint doesn't block the rest.
    Promise.allSettled([
      patientService.getPatients(),
      consultationService.getConsultations(),
      medicineService.getMedicines(),
      medicineService.getPurchaseRequests(),
      bedService.getBeds(),
      certificateService.getCertificates(),
      queueService.getQueues(),
    ]).then(([pRes, cRes, mRes, prRes, bRes, certRes, qRes]) => {
      if (pRes.status === 'fulfilled' && pRes.value !== undefined) {
        const pMap = new Map<string, Patient>();
        pRes.value.forEach(p => {
          if (p.id) pMap.set(String(p.id), { ...p, name: p.name ? p.name.toUpperCase() : p.name });
        });
        const formatted = Array.from(pMap.values());
        setPatients(formatted);
        try { localStorage.setItem('cura_patients_cache', JSON.stringify(formatted)); } catch {}
      }
      if (cRes.status === 'fulfilled' && cRes.value !== undefined) {
        const seenIds = new Set<string>();
        const seenKeys = new Set<string>();
        const unique = cRes.value.filter(c => {
          if (c.id && seenIds.has(String(c.id))) return false;
          const key = `${c.patientId}|${c.date}|${c.timeIn}|${(c.complaint || '').trim()}|${c.status}`;
          if (seenKeys.has(key)) return false;
          if (c.id) seenIds.add(String(c.id));
          seenKeys.add(key);
          return true;
        });
        setConsultations(unique);
        try { localStorage.setItem('cura_consultations_cache', JSON.stringify(unique)); } catch {}
      }
      if (mRes.status === 'fulfilled' && mRes.value !== undefined) {
        const mMap = new Map<string, MedicineItem>();
        mRes.value.forEach(m => {
          if (m.id) mMap.set(String(m.id), m);
        });
        const uniqueMeds = Array.from(mMap.values());
        setMedicines(uniqueMeds);
        try { localStorage.setItem('cura_medicines_cache', JSON.stringify(uniqueMeds)); } catch {}
      }
      if (prRes.status === 'fulfilled' && prRes.value !== undefined) {
        const prMap = new Map<string, PurchaseRequest>();
        prRes.value.forEach(pr => {
          if (pr.id) prMap.set(String(pr.id), pr);
        });
        const uniquePR = Array.from(prMap.values());
        setPurchaseRequests(uniquePR);
        try { localStorage.setItem('cura_purchase_requests_cache', JSON.stringify(uniquePR)); } catch {}
      }
      if (bRes.status === 'fulfilled' && bRes.value !== undefined) {
        const bMap = new Map<string, Bed>();
        bRes.value.forEach(b => {
          if (b.id) bMap.set(String(b.id), b);
        });
        const uniqueBeds = Array.from(bMap.values());
        setBeds(uniqueBeds);
        try { localStorage.setItem('cura_beds_cache', JSON.stringify(uniqueBeds)); } catch {}
      }
      if (certRes.status === 'fulfilled' && certRes.value !== undefined && certRes.value.length > 0) {
        setMedicalCerts(prev => {
          const map = new Map<string, MedicalCertificate>();
          prev.forEach(c => { if (c.id) map.set(String(c.id), c); });
          certRes.value!.forEach(c => { if (c.id) map.set(String(c.id), c); });
          const merged = Array.from(map.values());
          try { localStorage.setItem('cura_medical_certs', JSON.stringify(merged)); } catch {}
          return merged;
        });
      }
      if (qRes.status === 'fulfilled' && qRes.value !== undefined) {
        const qMap = new Map<string, PatientQueue>();
        qRes.value.forEach(q => {
          if (q.id) qMap.set(String(q.id), q);
        });
        const uniqueQueues = Array.from(qMap.values());
        setQueues(uniqueQueues);
        try { localStorage.setItem('cura_queues_cache', JSON.stringify(uniqueQueues)); } catch {}
      }
    }).finally(() => {
      // Immediate transition when network requests settle
      setIsLoading(false);
    });

    const isLocalNotif = (id: string, type?: string) =>
      id.startsWith('med-') || id.startsWith('stock-') || type === 'stock' || id.startsWith('N');

    const fetchAndMergeNotifications = () => {
      notificationService.getNotifications().then(d => {
        if (d !== undefined && Array.isArray(d)) {
          d.forEach(n => {
            if (n.id) knownServerNotifIdsRef.current.add(String(n.id));
          });
          isInitialServerNotifFetchRef.current = false;
          setNotifications(prev => {
            const localNotifs = prev.filter(p => isLocalNotif(p.id, p.type) && !dismissedNotifIdsRef.current.has(p.id));
            const backendNotifs = d
              .filter(n => !dismissedNotifIdsRef.current.has(n.id))
              .map(n => readNotifIdsRef.current.has(n.id) ? { ...n, read: true } : n);
            return [...localNotifs, ...backendNotifs];
          });
        }
      }).catch(() => {});
    };

    fetchAndMergeNotifications();
    fetchQueues();

    // Polling for multi-device auto-synchronization (no manual refresh needed)
    let isPolling = false;
    let pollCount = 0;
    const pollData = (forceFullSync = false) => {
      if (isPolling) return;
      if (!forceFullSync && typeof document !== 'undefined' && document.hidden) return;
      isPolling = true;
      pollCount++;

      // Stagger queries across cycles to balance server load:
      // Cycle 1: Notifications + Queues + Beds (Every 5s)
      // Cycle 2: Consultations + Patients (Every ~10s or on tab focus)
      // Cycle 3: Medicines + Medical Certificates (Every ~15s or on tab focus)
      const shouldSyncRecords = forceFullSync || pollCount % 2 === 0;
      const shouldSyncInventory = forceFullSync || pollCount % 3 === 0;

      Promise.allSettled([
        notificationService.getNotifications(),
        queueService.getQueues(),
        bedService.getBeds(),
        ...(shouldSyncRecords ? [consultationService.getConsultations(), patientService.getPatients()] : []),
        ...(shouldSyncInventory ? [medicineService.getMedicines(), certificateService.getCertificates()] : []),
      ]).then((results) => {
        const [nRes, qRes, bRes] = results.slice(0, 3);
        let extraIdx = 3;
        const cRes = shouldSyncRecords ? results[extraIdx++] : null;
        const pRes = shouldSyncRecords ? results[extraIdx++] : null;
        const mRes = shouldSyncInventory ? results[extraIdx++] : null;
        const certRes = shouldSyncInventory ? results[extraIdx++] : null;

        // 1. Notifications with deduplication
        if (nRes && nRes.status === 'fulfilled' && nRes.value && Array.isArray(nRes.value)) {
          const incoming = nRes.value;

          if (isInitialServerNotifFetchRef.current) {
            incoming.forEach(n => {
              if (n.id) knownServerNotifIdsRef.current.add(String(n.id));
            });
            isInitialServerNotifFetchRef.current = false;
          } else {
            const brandNew = incoming.filter(n => !n.read && n.id && !knownServerNotifIdsRef.current.has(String(n.id)));
            brandNew.forEach(n => {
              knownServerNotifIdsRef.current.add(String(n.id));
              const title = n.type === 'appointment_request' ? '📅 New Appointment Request'
                : n.type === 'telemedicine_request' ? '📹 New Telemedicine Request'
                : n.type === 'medcert_request' ? '📋 New MedCert Request'
                : '🔔 New Notification';
              toast.info(`${title}: ${n.message || 'New request received'}`, {
                duration: 8000,
              });
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                try {
                  new Notification(title, {
                    body: n.message || 'New request received',
                    icon: '/favicon.ico',
                  });
                } catch {}
              }
            });
          }

          setNotifications(prev => {
            const localNotifs = prev.filter(p => isLocalNotif(p.id, p.type) && !dismissedNotifIdsRef.current.has(p.id));
            const backendNotifs = incoming
              .filter(n => !dismissedNotifIdsRef.current.has(n.id))
              .map(n => readNotifIdsRef.current.has(n.id) ? { ...n, read: true } : n);
            return [...localNotifs, ...backendNotifs];
          });
        }

        // 2. Queues with Map deduplication
        if (qRes && qRes.status === 'fulfilled' && qRes.value && Array.isArray(qRes.value)) {
          const qMap = new Map<string, PatientQueue>();
          qRes.value.forEach(q => {
            if (q.id && !completedQueueIdsRef.current.has(q.id)) {
              qMap.set(String(q.id), notifiedQueueIdsRef.current.has(q.id) ? { ...q, status: 'called' } : q);
            }
          });
          const uniqueQueues = Array.from(qMap.values());
          setQueues(uniqueQueues);
          try { localStorage.setItem('cura_queues_cache', JSON.stringify(uniqueQueues)); } catch {}
        }

        // 3. Beds with Map deduplication
        if (bRes && bRes.status === 'fulfilled' && bRes.value && Array.isArray(bRes.value)) {
          const bMap = new Map<string, Bed>();
          bRes.value.forEach(b => {
            if (b.id) bMap.set(String(b.id), b);
          });
          const uniqueBeds = Array.from(bMap.values());
          setBeds(uniqueBeds);
          try { localStorage.setItem('cura_beds_cache', JSON.stringify(uniqueBeds)); } catch {}
        }

        // 4. Consultations with strict ID and composite-key deduplication
        if (cRes && cRes.status === 'fulfilled' && cRes.value && Array.isArray(cRes.value)) {
          const seenIds = new Set<string>();
          const seenKeys = new Set<string>();
          const uniqueConsults = cRes.value.filter(c => {
            if (c.id && seenIds.has(String(c.id))) return false;
            const key = `${c.patientId}|${c.date}|${c.timeIn}|${(c.complaint || '').trim()}|${c.status}`;
            if (seenKeys.has(key)) return false;
            if (c.id) seenIds.add(String(c.id));
            seenKeys.add(key);
            return true;
          });
          setConsultations(uniqueConsults);
          try { localStorage.setItem('cura_consultations_cache', JSON.stringify(uniqueConsults)); } catch {}
        }

        // 5. Patients with Map deduplication by ID (seamlessly syncs newly added patients across devices)
        if (pRes && pRes.status === 'fulfilled' && pRes.value && Array.isArray(pRes.value)) {
          const pMap = new Map<string, Patient>();
          pRes.value.forEach(p => {
            if (p.id) {
              pMap.set(String(p.id), { ...p, name: p.name ? p.name.toUpperCase() : p.name });
            }
          });
          const uniquePatients = Array.from(pMap.values());
          setPatients(uniquePatients);
          try { localStorage.setItem('cura_patients_cache', JSON.stringify(uniquePatients)); } catch {}
        }

        // 6. Medicines with Map deduplication
        if (mRes && mRes.status === 'fulfilled' && mRes.value && Array.isArray(mRes.value)) {
          const mMap = new Map<string, MedicineItem>();
          mRes.value.forEach(m => {
            if (m.id) mMap.set(String(m.id), m);
          });
          const uniqueMeds = Array.from(mMap.values());
          setMedicines(uniqueMeds);
          try { localStorage.setItem('cura_medicines_cache', JSON.stringify(uniqueMeds)); } catch {}
        }

        // 7. Medical Certificates with Map deduplication
        if (certRes && certRes.status === 'fulfilled' && certRes.value && Array.isArray(certRes.value) && certRes.value.length > 0) {
          const certMap = new Map<string, MedicalCertificate>();
          certRes.value.forEach(c => {
            if (c.id) certMap.set(String(c.id), c);
          });
          const uniqueCerts = Array.from(certMap.values());
          setMedicalCerts(uniqueCerts);
          try { localStorage.setItem('cura_medical_certs', JSON.stringify(uniqueCerts)); } catch {}
        }
      }).catch(() => {}).finally(() => {
        isPolling = false;
      });
    };

    const interval = setInterval(() => pollData(false), 12000);

    const handleFocusOrVisible = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        pollData(true);
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleFocusOrVisible);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocusOrVisible);
    }

    return () => {
      clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleFocusOrVisible);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocusOrVisible);
      }
    };
  }, []);

  useEffect(() => {
    if (purchaseRequests.length > 0) {
      try {
        localStorage.setItem('cura_purchase_requests_cache', JSON.stringify(purchaseRequests));
      } catch {}
    }
  }, [purchaseRequests]);

  // Check for upcoming and due medication doses, as well as bed timers
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    const checkAlertsAndTimers = () => {
      const [currHStr, currMStr] = getManilaTime().split(':');
      const currentHours = parseInt(currHStr, 10);
      const currentMinutes = parseInt(currMStr, 10);
      const today = getManilaDate();
      const currentTimeInMins = currentHours * 60 + currentMinutes;

      setNotifications(prev => {
        const newNotifs: AppNotification[] = [];
        
        // ─── 1. MEDICATION INTAKE REMINDERS ─────────────────────────────────
        consultations.forEach(c => {
          if (normalizeDate(c.date) !== today || !c.treatments) return;

          const patient = patients.find(p => p.id === c.patientId);
          const patientName = patient?.name || 'Unknown Patient';
          const rawCase = c.complaint || c.purposeOfVisit || (c.categories && c.categories.length > 0 ? c.categories.join(', ') : '');
          const caseName = (rawCase || (c.status === 'Non-Consultation' ? 'Non-Consultation Visit' : 'Consultation')).replace(' [CONVERTED]', '').trim();
          
          c.treatments.forEach(t => {
            if (t.remarks && t.remarks.includes('[INTAKED]')) {
              const notifDueId = `med-due-${c.id}-${t.medicineName}-${t.nextDose}`;
              const notifUpcomingId = `med-${c.id}-${t.medicineName}-${t.nextDose}`;
              dismissedNotifIdsRef.current.add(notifDueId);
              dismissedNotifIdsRef.current.add(notifUpcomingId);
              return;
            }

            if (t.nextDose) {
              const [doseHourStr, doseMinuteStr] = t.nextDose.split(':');
              const doseHour = parseInt(doseHourStr, 10);
              const doseMinute = parseInt(doseMinuteStr, 10);
              
              if (isNaN(doseHour) || isNaN(doseMinute)) return;
              
              const doseTimeInMins = doseHour * 60 + doseMinute;
              const diff = doseTimeInMins - currentTimeInMins;
              
              // Condition A: Time for next intake has arrived or passed recently (within 3 hours)
              if (diff <= 0 && diff >= -180) {
                const notifId = `med-due-${c.id}-${t.medicineName}-${t.nextDose}`;
                const upcomingNotifId = `med-${c.id}-${t.medicineName}-${t.nextDose}`;
                dismissedNotifIdsRef.current.add(upcomingNotifId);

                if (!dismissedNotifIdsRef.current.has(notifId)) {
                  // Fire toast & desktop alert once per dose when due
                  if (!alertedDosesRef.current.has(notifId)) {
                    alertedDosesRef.current.add(notifId);
                    toast.error(`🔔 Time for Next Intake: ${patientName} is due for ${t.medicineName} (${formatTime12(t.nextDose)})!`, {
                      description: `Case: ${caseName} • Remarks: ${t.remarks || 'Take as prescribed'}`,
                      duration: 10000,
                    });

                    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                      try {
                        new Notification('Medication Reminder - CURA', {
                          body: `Time for ${patientName}'s next dose of ${t.medicineName} (${formatTime12(t.nextDose)})`,
                          icon: '/favicon.ico',
                        });
                      } catch {}
                    }
                  }

                  if (!prev.find(n => n.id === notifId) && !newNotifs.find(n => n.id === notifId)) {
                    const isRead = readNotifIdsRef.current.has(notifId);
                    newNotifs.push({
                      id: notifId,
                      type: 'medication',
                      message: `Time for next intake: Medication (${t.medicineName}) is DUE NOW for ${patientName}`,
                      time: new Date().toISOString(),
                      read: isRead,
                      patientName,
                      patient_id: c.patientId,
                      nextDose: t.nextDose,
                      minutesLeft: 0,
                      caseName,
                      remarks: t.remarks || 'Take as prescribed',
                      timeGiven: t.timeGiven,
                      medicineName: t.medicineName,
                      isDue: true,
                    });
                  }
                }
              }
              // Condition B: Dose is approaching within 30 minutes (diff > 0 && diff <= 30)
              else if (diff > 0 && diff <= 30) {
                const notifId = `med-${c.id}-${t.medicineName}-${t.nextDose}`;
                if (!dismissedNotifIdsRef.current.has(notifId)) {
                  const alertKey = `${c.id}-${t.medicineName}-${t.nextDose}-upcoming`;
                  if (!alertedUpcomingDosesRef.current.has(alertKey)) {
                    alertedUpcomingDosesRef.current.add(alertKey);
                    toast.warning(`⏰ Upcoming Intake: ${patientName} is scheduled for ${t.medicineName} in ${diff} mins (${formatTime12(t.nextDose)})`, {
                      description: `Case: ${caseName} • Instructions: ${t.remarks || 'Take as prescribed'}`,
                      duration: 8000,
                    });

                    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                      try {
                        new Notification('Upcoming Medication - CURA', {
                          body: `${patientName} is due for ${t.medicineName} in ${diff} mins (${formatTime12(t.nextDose)})`,
                          icon: '/favicon.ico',
                        });
                      } catch {}
                    }
                  }

                  if (!prev.find(n => n.id === notifId) && !newNotifs.find(n => n.id === notifId)) {
                    const isRead = readNotifIdsRef.current.has(notifId);
                    newNotifs.push({
                      id: notifId,
                      type: 'medication',
                      message: `Medication (${t.medicineName}) due for ${patientName} in ${diff} mins (${formatTime12(t.nextDose)})`,
                      time: new Date().toISOString(),
                      read: isRead,
                      patientName,
                      patient_id: c.patientId,
                      nextDose: t.nextDose,
                      minutesLeft: diff,
                      caseName,
                      remarks: t.remarks || 'Take as prescribed',
                      timeGiven: t.timeGiven,
                      medicineName: t.medicineName,
                      isDue: false,
                    });
                  }
                }
              }
            }
          });
        });

        // ─── 2. BED MANAGEMENT TIMERS & NOTIFICATIONS ───────────────────────
        beds.forEach(b => {
          if (b.status === 'Occupied' && b.timeOccupied && b.allottedTime) {
            const start = new Date(b.timeOccupied).getTime();
            if (isNaN(start)) return;
            const elapsed = Date.now() - start;
            const allottedMs = b.allottedTime * 60000;
            const remainingMs = allottedMs - elapsed;
            const remainingMins = Math.ceil(remainingMs / 60000);

            // Condition 1: Time is UP (expired)
            if (remainingMs <= 0) {
              const notifId = `bed-due-${b.id}-${b.timeOccupied}`;
              const upcomingId = `bed-upcoming-${b.id}-${b.timeOccupied}`;
              dismissedNotifIdsRef.current.add(upcomingId);

              if (!dismissedNotifIdsRef.current.has(notifId)) {
                const alertKey = `${b.id}-${b.timeOccupied}-expired`;
                if (!alertedBedsRef.current.has(alertKey)) {
                  alertedBedsRef.current.add(alertKey);
                  toast.error(`🚨 Time's Up: Bed ${b.bedNumber} allotted time for ${b.patientName || 'Patient'} has expired!`, {
                    description: `Reason: ${b.reason || 'Observation/Rest'} • Allotted: ${b.allottedTime} mins`,
                    duration: 10000,
                  });

                  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    try {
                      new Notification('Bed Timer Expired - CURA', {
                        body: `Time's up for ${b.patientName || 'Patient'} in Bed ${b.bedNumber} (${b.allottedTime}m limit)`,
                        icon: '/favicon.ico',
                      });
                    } catch {}
                  }
                }

                if (!prev.find(n => n.id === notifId) && !newNotifs.find(n => n.id === notifId)) {
                  const isRead = readNotifIdsRef.current.has(notifId);
                  newNotifs.push({
                    id: notifId,
                    type: 'bed',
                    message: `Time's Up: Bed ${b.bedNumber} allotted time for ${b.patientName || 'Patient'} has expired!`,
                    time: new Date().toISOString(),
                    read: isRead,
                    patientName: b.patientName || undefined,
                    patient_id: b.patientId || undefined,
                    minutesLeft: 0,
                    isDue: true,
                  });
                }
              }
            }
            // Condition 2: Approaching / Malapit na (<= 5 minutes remaining)
            else if (remainingMins <= 5) {
              const notifId = `bed-upcoming-${b.id}-${b.timeOccupied}`;
              if (!dismissedNotifIdsRef.current.has(notifId)) {
                const alertKey = `${b.id}-${b.timeOccupied}-upcoming`;
                if (!alertedUpcomingBedsRef.current.has(alertKey)) {
                  alertedUpcomingBedsRef.current.add(alertKey);
                  toast.warning(`⚠️ Bed Reminder: Bed ${b.bedNumber} for ${b.patientName || 'Patient'} is ending soon (${remainingMins} min${remainingMins !== 1 ? 's' : ''} left)!`, {
                    description: `Reason: ${b.reason || 'Observation/Rest'} • Allotted: ${b.allottedTime} mins`,
                    duration: 8000,
                  });

                  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    try {
                      new Notification('Bed Ending Soon - CURA', {
                        body: `${b.patientName || 'Patient'} in Bed ${b.bedNumber} has ${remainingMins}m remaining`,
                        icon: '/favicon.ico',
                      });
                    } catch {}
                  }
                }

                if (!prev.find(n => n.id === notifId) && !newNotifs.find(n => n.id === notifId)) {
                  const isRead = readNotifIdsRef.current.has(notifId);
                  newNotifs.push({
                    id: notifId,
                    type: 'bed',
                    message: `Bed ${b.bedNumber} for ${b.patientName || 'Patient'} is ending in ${remainingMins} mins`,
                    time: new Date().toISOString(),
                    read: isRead,
                    patientName: b.patientName || undefined,
                    patient_id: b.patientId || undefined,
                    minutesLeft: remainingMins,
                    isDue: false,
                  });
                }
              }
            }
          }
        });

        // Clean dismissed or inactive notifications
        const cleanedPrev = prev.filter(n => {
          if (dismissedNotifIdsRef.current.has(n.id)) return false;
          if (n.type === 'bed' && n.id.startsWith('bed-')) {
            const bedMatch = beds.find(b => n.id.includes(b.id));
            if (!bedMatch || bedMatch.status === 'Available') return false;
          }
          return true;
        });

        if (newNotifs.length > 0) {
          return [...newNotifs, ...cleanedPrev];
        }
        return cleanedPrev;
      });
    };

    // Run immediately, then every 6 seconds for real-time checks
    checkAlertsAndTimers();
    const interval = setInterval(checkAlertsAndTimers, 6000);
    return () => clearInterval(interval);
  }, [consultations, patients, beds]);

  // Check for low stock medicines daily (auto-resolves when restocked, stays dismissed for today if cleared)
  useEffect(() => {
    if (!medicines || medicines.length === 0) return;
    const today = getManilaDate();

    const lowStockMeds = medicines.filter(m => {
      const threshold = m.threshold ?? 10;
      return Number(m.stock) <= threshold;
    });

    const healthyMedIds = new Set(
      medicines
        .filter(m => Number(m.stock) > (m.threshold ?? 10))
        .map(m => String(m.id))
    );

    setNotifications(prev => {
      // 1. Auto-resolve: remove alerts for medicines that are now restocked
      const pruned = prev.filter(n => {
        if (n.type !== 'stock') return true;
        return !Array.from(healthyMedIds).some(id => n.id.startsWith(`stock-low-${id}-`));
      });

      if (lowStockMeds.length === 0) return pruned;

      const newStockNotifs: AppNotification[] = [];

      lowStockMeds.forEach(m => {
        const notifId = `stock-low-${m.id}-${today}`;
        // If cleared or dismissed today, do NOT show again today
        if (dismissedNotifIdsRef.current.has(notifId)) return;
        if (pruned.some(n => n.id === notifId) || newStockNotifs.some(n => n.id === notifId)) return;

        const isOut = Number(m.stock) === 0;
        const msg = isOut
          ? `Out of Stock: ${m.name} has 0 stock remaining!`
          : `Low Stock Alert: ${m.name} is running low (${m.stock} ${m.unit || 'units'} left, threshold: ${m.threshold ?? 10})`;

        if (!alertedDosesRef.current.has(notifId)) {
          alertedDosesRef.current.add(notifId);
          toast.warning(msg, {
            description: `Check Inventory to restock or record a purchase request.`,
            duration: 8000,
          });

          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('Low Stock Warning - CURA', {
                body: msg,
                icon: '/favicon.ico',
              });
            } catch {}
          }
        }

        newStockNotifs.push({
          id: notifId,
          type: 'stock',
          message: msg,
          time: new Date().toISOString(),
          read: readNotifIdsRef.current.has(notifId),
          medicineName: m.name,
        });
      });

      if (newStockNotifs.length > 0) {
        return [...newStockNotifs, ...pruned];
      }
      return pruned;
    });
  }, [medicines]);

  const handleSavePatient = async (patient: Patient) => {
    const formattedPatient = {
      ...patient,
      name: patient.name ? patient.name.trim().toUpperCase() : patient.name,
    };
    if (editingPatientId) {
      setPatients(prev => prev.map(p => p.id === editingPatientId ? formattedPatient : p));
      try { 
        const updated = await patientService.updatePatient(editingPatientId, formattedPatient); 
        setPatients(prev => prev.map(p => p.id === editingPatientId ? updated : p));
      } 
      catch (error) { console.error('API failed, but state updated locally:', error); }
    } else {
      const tempId = formattedPatient.id;
      setPatients(prev => [formattedPatient, ...prev.filter(p => p.id !== tempId)]);
      try { 
        const created = await patientService.createPatient(formattedPatient); 
        setPatients(prev => {
          const map = new Map<string, Patient>();
          prev.forEach(p => { if (p.id !== tempId) map.set(String(p.id), p); });
          map.set(String(created.id), created);
          return Array.from(map.values());
        });
      } 
      catch (error) { console.error('API failed, but state updated locally:', error); }
    }
  };

  const processMedicineDeductions = async (consultationDate: string, patientId: string, treatments: Treatment[]) => {
    if (!treatments || treatments.length === 0) return;
    const patientName = patients.find(p => p.id === patientId)?.name || 'patient';
    
    const updates = treatments.map(async (t) => {
      const med = medicines.find(m => m.name === t.medicineName);
      if (med) {
        const currentDispensed = Math.max(
          Number(med.dispensed) || 0,
          (med.stockHistory || []).filter(h => h.type === 'dispense').reduce((sum, h) => sum + (Number(h.qty) || 0), 0)
        );
        const newStock = Math.max(0, med.stock - t.quantity);
        const updatedMed = {
          ...med,
          stock: newStock,
          dispensed: currentDispensed + t.quantity,
          status: newStock === 0 ? 'Out of Stock' : newStock <= (med.threshold ?? 10) ? 'Low Stock' : 'Normal' as any,
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
    if (savingConsultationRef.current) return;
    savingConsultationRef.current = true;
    try {
      const { id, ...rest } = consultation;
      const created = await consultationService.createConsultation(rest);
      setConsultations(prev => {
        if (prev.some(c => c.id === created.id)) return prev;
        const key = `${created.patientId}|${created.date}|${created.timeIn}|${(created.complaint || '').trim()}|${created.status}`;
        if (prev.some(c => `${c.patientId}|${c.date}|${c.timeIn}|${(c.complaint || '').trim()}|${c.status}` === key)) {
          return prev;
        }
        return [...prev, created];
      });
      
      await processMedicineDeductions(consultation.date, consultation.patientId, consultation.treatments);
      // Removed instant hardcoded notification; now handled by interval inside useEffect
    } catch (e) {
      console.error('Failed to save consultation', e);
      throw e;
    } finally {
      savingConsultationRef.current = false;
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
    if (!convertingId || savingConversionRef.current) return;
    savingConversionRef.current = true;
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
        if (mapped.some(c => c.id === created.id)) return mapped;
        return [...mapped, created];
      });
      setConvertingId(null);
    } catch (e) {
      console.error('Failed to save conversion', e);
      throw e;
    } finally {
      savingConversionRef.current = false;
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
    if (!id.startsWith('med-') && !id.startsWith('stock-')) {
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
      const backendUnread = notifications.filter(n => !n.read && !n.id.startsWith('med-') && !n.id.startsWith('stock-'));
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
    if (!id.startsWith('med-') && !id.startsWith('stock-')) {
      try {
        await notificationService.updateNotification(id, { read: true });
      } catch (error) {
        console.error('Failed to update notification read status on server:', error);
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
    // Show layout-matched skeleton for ALL pages ONLY when actively loading without cached/loaded data
    if (isLoading && !hasExistingData && skeletonVisible) {
      return <PageSkeleton page={currentPage} />;
    }

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
            onMarkDoseIntaked={handleMarkDoseIntaked}
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
          <Appointments patients={patients} searchQuery={searchQuery} onNavigate={navigate} />
        );
      case 'telemedicine':
        return (
          <Telemedicine patients={patients} searchQuery={searchQuery} onNavigate={navigate} />
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
