import { Video, Search } from 'lucide-react';
import { Patient } from '../types';

interface TelemedicineProps {
  patients: Patient[];
  onNavigate?: (page: string) => void;
}

const PRIMARY = '#1B3A6B';

export function Telemedicine({ patients }: TelemedicineProps) {
  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">Telemedicine</h1>
          <p className="text-sm text-gray-500">Manage virtual consultation requests</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Search requests..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B3A6B] transition-colors"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: `${PRIMARY}10`, color: PRIMARY }}>
            <Video size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No Telemedicine Requests</h3>
          <p className="text-sm text-gray-500 max-w-sm mb-6">
            There are currently no pending telemedicine requests from patients. New virtual consultation requests will appear here for you to review and schedule.
          </p>
        </div>
      </div>
    </div>
  );
}
