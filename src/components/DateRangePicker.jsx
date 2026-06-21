import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

const DAY_LABELS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
const MONTH_LABELS = [
  'Yanvar',
  'Fevral',
  'Mart',
  'Aprel',
  'May',
  'Iyun',
  'Iyul',
  'Avgust',
  'Sentyabr',
  'Oktyabr',
  'Noyabr',
  'Dekabr'
];

const toIso = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const fromIso = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatDisplay = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
};

const buildMonthGrid = (viewDate) => {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const mondayIndex = (firstOfMonth.getDay() + 6) % 7;

  const cells = [];
  for (let i = 0; i < mondayIndex; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));

  return cells;
};

/**
 * Two-click date range picker: the first click sets a tentative single-day
 * selection, the second click completes the range (clicking the same day
 * twice keeps it as a single-day selection).
 *
 * The calendar panel renders into a portal anchored to the trigger button's
 * screen position, so it isn't clipped by ancestors with overflow:hidden
 * (e.g. rounded report cards elsewhere in the page).
 */
const DateRangePicker = ({ startDate, endDate, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pickingSecond, setPickingSecond] = useState(false);
  const [viewDate, setViewDate] = useState(() =>
    endDate ? fromIso(endDate) : new Date()
  );
  const [position, setPosition] = useState(null);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  const updatePosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    setPosition({
      top: rect.bottom + 8,
      left: rect.left
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        buttonRef.current?.contains(event.target) ||
        panelRef.current?.contains(event.target)
      ) {
        return;
      }
      setIsOpen(false);
      setPickingSecond(false);
    };

    const handleReposition = () => updatePosition();

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [isOpen]);

  const handleDayClick = (date) => {
    const iso = toIso(date);

    if (!pickingSecond) {
      onChange(iso, iso);
      setPickingSecond(true);
      return;
    }

    if (iso === startDate) {
      onChange(iso, iso);
    } else if (iso < startDate) {
      onChange(iso, startDate);
    } else {
      onChange(startDate, iso);
    }

    setPickingSecond(false);
    setIsOpen(false);
  };

  const changeMonth = (delta) => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const cells = buildMonthGrid(viewDate);
  const todayIso = toIso(new Date());

  const displayLabel =
    startDate && endDate
      ? startDate === endDate
        ? formatDisplay(startDate)
        : `${formatDisplay(startDate)} — ${formatDisplay(endDate)}`
      : 'Sanani tanlang';

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (!isOpen) updatePosition();
          setIsOpen((prev) => !prev);
        }}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      >
        <CalendarIcon size={16} className="text-slate-400" />
        {displayLabel}
      </button>

      {isOpen &&
        position &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: 'fixed', top: position.top, left: position.left }}
            className="z-[1000] w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl"
          >
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="text-sm font-bold text-slate-700">
                {MONTH_LABELS[viewDate.getMonth()]} {viewDate.getFullYear()}
              </div>

              <button
                type="button"
                onClick={() => changeMonth(1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-y-1 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">
              {DAY_LABELS.map((label) => (
                <div key={label}>{label}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1">
              {cells.map((date, index) => {
                if (!date) return <div key={`empty-${index}`} />;

                const iso = toIso(date);
                const isStart = iso === startDate;
                const isEnd = iso === endDate;
                const inRange = startDate && endDate && iso > startDate && iso < endDate;
                const isToday = iso === todayIso;
                const isEdge = isStart || isEnd;

                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => handleDayClick(date)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition ${
                      isEdge
                        ? 'bg-blue-600 text-white'
                        : inRange
                        ? 'bg-blue-50 text-blue-700'
                        : isToday
                        ? 'border border-blue-300 text-slate-700'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 border-t border-slate-100 pt-2 text-center text-[11px] font-medium text-slate-400">
              {pickingSecond
                ? "Davr uchun ikkinchi kunni tanlang (yoki bir kunlik bo'lishi uchun shu kunni qayta bosing)"
                : "Bir kun yoki davrning boshlanishini tanlang"}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default DateRangePicker;
