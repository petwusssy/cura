import { Link } from 'react-router';
import {
  ShieldCheck,
  Lock,
  Clock,
  UserCheck,
  Mail,
  ExternalLink,
  X,
  ArrowLeft,
  Phone,
  MapPin,
} from 'lucide-react';

export const PRIVACY_POLICY_VERSION = '2026-06';
export const PRIVACY_EFFECTIVE_DATE = 'June 2026';

export const DPO_CONTACT = {
  controller: 'University of the Assumption — Medical-Dental Clinic',
  email: 'clinic@ua.edu.ph',
  phone: '(045) 961-3617 local 115',
  address: 'Archbishop Emilio Cinense Gym Ground Floor, Del Pilar, City of San Fernando, Pampanga 2000',
  hours: 'Monday – Friday, 8:00 AM – 5:00 PM',
};

const POLICY_SECTIONS = [
  {
    number: '1',
    title: 'Personal Information Controller & Scope',
    body: 'CURA (Clinical Unified Records & Access) is operated by the University of the Assumption (UA) Medical-Dental Clinic across the Clinic Staff Web Portal and CURA Mobile App. This Notice governs personal and sensitive personal information collected in accordance with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173) and its Implementing Rules and Regulations.',
  },
  {
    number: '2',
    title: 'Personal & Health Information Collected',
    body: 'We collect only data strictly needed for campus healthcare: (a) Identity & Affiliation — full name, Student/Employee/Visitor ID, institutional or personal email, course/year level or department/position, phone number, home address, and emergency contact/guardian; (b) Clinical & Sensitive Health Data — date of birth, age, sex, vital signs, chief complaints, clinical diagnosis, prescribed medications, bed/triage logs, teleconsultation records, and issued Medical Certificates.',
  },
  {
    number: '3',
    title: 'Purpose & Legal Basis of Processing (RA 10173 Sec. 12 & 13)',
    body: 'Your records are processed based on your explicit informed consent and institutional healthcare mandate solely to: (1) deliver on-campus medical/dental consultations and emergency first aid; (2) verify patient identity and grant secure portal/telemedicine access; (3) notify your designated emergency contact when medically necessary; (4) issue verified Medical Certificates; and (5) generate anonymized aggregate institutional health statistics.',
  },
  {
    number: '4',
    title: 'Data Storage, Safeguards & Authorized Sharing',
    body: 'All network communications are encrypted over HTTPS/TLS. Databases enforce role-based access control, JWT authentication, mandatory nurse/physician 4-digit PIN shift attribution, a 7-day security edit cooldown against account tampering, and immutable audit trail logging. Clinic reports and audit backups are securely mirrored to the authorized UA Clinic Google Drive workspace. CURA never sells, rents, or discloses patient data to advertisers or unauthorized third parties.',
  },
  {
    number: '5',
    title: 'Data Retention & Lifecycle Policy',
    body: 'Patient records follow strict storage limitation schedules: active account data is kept throughout UA enrollment or employment plus 2 years for portal continuity; routine first-aid / non-consultation logs are retained for 3 to 5 years; clinical consultation records and medical certificates are retained for 10 years for adult patients, or until age 18 plus 10 years for minor patients. Upon expiration, records undergo secure anonymization or authorized disposal.',
  },
  {
    number: '6',
    title: 'Your Rights Under RA 10173',
    body: 'As a data subject, you hold the Right to be Informed, Right to Access your medical history and profile via CURA Mobile or the Clinic, Right to Rectification of inaccurate records, Right to Erasure or Blocking subject to mandatory healthcare record retention laws, Right to Object or withdraw non-essential consent, and Right to file a concern with the UA Data Protection Officer or the National Privacy Commission (NPC).',
  },
];

export function PrivacyPolicyContent({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      {/* Summary Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            icon: <ShieldCheck size={16} className="text-[#1E5AA8]" />,
            label: 'Compliance Standard',
            value: 'Philippine RA 10173',
          },
          {
            icon: <Clock size={16} className="text-[#1E5AA8]" />,
            label: 'Retention Schedule',
            value: '3–5 yrs routine · 10 yrs clinical',
          },
          {
            icon: <Lock size={16} className="text-[#1E5AA8]" />,
            label: 'Zero Commercial Use',
            value: 'Never sold or shared for ads',
          },
          {
            icon: <UserCheck size={16} className="text-[#1E5AA8]" />,
            label: 'Patient Rights',
            value: 'Access, Correction & DPO Support',
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-200 dark:border-border bg-slate-50/70 dark:bg-slate-900/40 p-3 flex items-start gap-2.5"
          >
            <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg bg-[#1E5AA8]/10 flex items-center justify-center">
              {item.icon}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {item.label}
              </div>
              <div className="text-xs font-semibold text-slate-800 dark:text-foreground mt-0.5 leading-snug">
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Policy Sections */}
      <div className="space-y-3">
        {POLICY_SECTIONS.map((sec) => (
          <section
            key={sec.number}
            className="rounded-xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-4"
          >
            <h4 className="text-sm font-bold text-[#1B3A6B] dark:text-sky-300 flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[#1E5AA8] text-white text-[11px] font-bold flex-shrink-0">
                {sec.number}
              </span>
              {sec.title}
            </h4>
            <p className="text-xs sm:text-[13px] text-slate-600 dark:text-muted-foreground leading-relaxed pl-7">
              {sec.body}
            </p>
          </section>
        ))}
      </div>

      {/* DPO Contact & Account Deletion Card */}
      <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-gradient-to-br from-[#F4F9FD] to-white dark:from-slate-900 dark:to-slate-900/70 p-4 space-y-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#1E5AA8] mb-1.5">
            7. Data Protection Officer &amp; Account Deletion Requests
          </div>
          <p className="text-xs text-slate-600 dark:text-muted-foreground leading-relaxed">
            To request medical record copies, corrections, or permanent portal account deletion (subject to mandatory Philippine medical record retention periods under Section 5), use <strong className="text-slate-700 dark:text-foreground">Profile → Privacy &amp; Security → Request Data Copy / Account Deletion</strong> in CURA Mobile or contact the UA Clinic Data Protection Officer directly:
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-700 dark:text-foreground">
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-[#1E5AA8] flex-shrink-0" />
            <a href={`mailto:${DPO_CONTACT.email}`} className="font-semibold text-[#1E5AA8] hover:underline truncate">
              {DPO_CONTACT.email}
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-[#1E5AA8] flex-shrink-0" />
            <span className="font-medium">{DPO_CONTACT.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-[#1E5AA8] flex-shrink-0" />
            <span className="truncate" title={DPO_CONTACT.address}>UA Clinic, San Fernando, Pampanga</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  acceptLabel?: string;
}

export function PrivacyPolicyModal({
  isOpen,
  onClose,
  onAccept,
  acceptLabel = 'I Understand & Confirm',
}: PrivacyPolicyModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cura-privacy-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-card shadow-2xl border border-slate-200 dark:border-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-5 py-4 text-white flex items-center justify-between gap-3 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #1B3A6B 0%, #1E5AA8 100%)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div className="min-w-0">
              <h3 id="cura-privacy-modal-title" className="text-base font-bold truncate">
                CURA Data Privacy Policy & Notice
              </h3>
              <p className="text-[11px] text-sky-100/90 truncate">
                Philippine RA 10173 Compliant · Effective {PRIVACY_EFFECTIVE_DATE} · Version {PRIVACY_POLICY_VERSION}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold transition-colors"
            >
              <span>Full Page</span>
              <ExternalLink size={12} />
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Privacy Policy"
              className="p-1.5 rounded-lg hover:bg-white/15 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-[#F8FBFE] dark:bg-background">
          <PrivacyPolicyContent compact />
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-border bg-white dark:bg-card flex items-center justify-between gap-3 flex-shrink-0">
          <span className="text-[11px] text-slate-400">
            {DPO_CONTACT.controller}
          </span>
          <div className="flex items-center gap-2">
            {onAccept && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close
              </button>
            )}
            <button
              type="button"
              onClick={onAccept ? () => { onAccept(); onClose(); } : onClose}
              className="px-5 py-2 rounded-xl bg-[#1E5AA8] hover:bg-[#17488a] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              {onAccept ? acceptLabel : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PublicPrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F4F9FD] text-slate-800">
      {/* Top Bar */}
      <header
        className="text-white shadow-md"
        style={{ background: 'linear-gradient(135deg, #1B3A6B 0%, #1E5AA8 100%)' }}
      >
        <div className="max-w-4xl mx-auto px-5 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-sky-200">
                University of the Assumption Medical-Dental Clinic
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                CURA Data Privacy Policy
              </h1>
              <p className="text-xs text-sky-100/90 mt-0.5">
                RA 10173 Compliance · Effective {PRIVACY_EFFECTIVE_DATE} (v{PRIVACY_POLICY_VERSION})
              </p>
            </div>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to CURA</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-5 py-8">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-7">
          <PrivacyPolicyContent />
        </div>
        <p className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} {DPO_CONTACT.controller} · {DPO_CONTACT.hours}
        </p>
      </main>
    </div>
  );
}
