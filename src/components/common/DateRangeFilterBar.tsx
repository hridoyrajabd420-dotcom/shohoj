import React from 'react';
import { DateRangePreset, DATE_PRESETS, getDateRangeFromPreset } from '../../lib/dateRangeUtils';
import { Calendar, Filter, X } from 'lucide-react';

interface DateRangeFilterBarProps {
  preset: DateRangePreset;
  startDate: string;
  endDate: string;
  onPresetChange: (preset: DateRangePreset, startDate: string, endDate: string) => void;
  onStartDateChange: (startDate: string) => void;
  onEndDateChange: (endDate: string) => void;
  onReset?: () => void;
  extraRightAction?: React.ReactNode;
}

export const DateRangeFilterBar: React.FC<DateRangeFilterBarProps> = ({
  preset,
  startDate,
  endDate,
  onPresetChange,
  onStartDateChange,
  onEndDateChange,
  onReset,
  extraRightAction,
}) => {
  const handleSelectPreset = (p: DateRangePreset) => {
    if (p === 'custom') {
      onPresetChange('custom', startDate, endDate);
    } else {
      const range = getDateRangeFromPreset(p);
      onPresetChange(p, range.startDate, range.endDate);
    }
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Preset pill buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>সময়কাল:</span>
          </span>
          {DATE_PRESETS.map((p) => {
            const isActive = preset === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => handleSelectPreset(p.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{p.labelBn}</span>
                <span className="text-[10px] opacity-75 ml-1 hidden sm:inline">({p.labelEn})</span>
              </button>
            );
          })}
        </div>

        {/* Extra Action (e.g., Close Accounting Period button) */}
        {extraRightAction && (
          <div className="flex items-center gap-2 shrink-0">{extraRightAction}</div>
        )}
      </div>

      {/* Custom Date Inputs (shown if custom or if user wants to fine tune) */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">শুরুর তারিখ:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              onStartDateChange(e.target.value);
              if (preset !== 'custom') {
                onPresetChange('custom', e.target.value, endDate);
              }
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">শেষ তারিখ:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              onEndDateChange(e.target.value);
              if (preset !== 'custom') {
                onPresetChange('custom', startDate, e.target.value);
              }
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {(startDate || endDate || preset !== 'all') && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 font-medium ml-auto"
          >
            <X className="w-3.5 h-3.5" />
            <span>ফিল্টার রিসেট</span>
          </button>
        )}
      </div>
    </div>
  );
};
