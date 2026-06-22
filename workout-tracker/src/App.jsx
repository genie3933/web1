import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Camera, Download, Clock, Dumbbell, Pencil } from 'lucide-react';

const STORAGE_KEY = 'workout-entries';

function pad(n) { return String(n).padStart(2, '0'); }
function dateKey(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function formatDisplayDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${y}년 ${m}월 ${d}일 (${days[date.getDay()]})`;
}

const MOODS = [
  { id: 'great', label: '최고', color: '#9C7A4A' },
  { id: 'good', label: '좋음', color: '#B59A6E' },
  { id: 'normal', label: '보통', color: '#C9BBA0' },
  { id: 'tired', label: '힘듦', color: '#A98F7A' },
];

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export default function App() {
  const [entries, setEntries] = useState(() => loadEntries());
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [exportRange, setExportRange] = useState({ start: '', end: '' });
  const [exportText, setExportText] = useState('');
  const [toast, setToast] = useState('');

  const persist = (next) => {
    setEntries(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      showToast('저장 중 문제가 발생했어요');
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = dateKey(new Date());

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthLabel = `${year}.${pad(month + 1)}`;

  const goMonth = (delta) => {
    setViewDate(new Date(year, month + delta, 1));
  };

  const openDay = (day) => {
    const key = dateKey(new Date(year, month, day));
    setSelectedDay(key);
    const existing = entries[key];
    if (existing) {
      setDraft({ ...existing });
      setEditing(false);
    } else {
      setDraft({ time: '', activity: '', note: '', mood: 'normal', photo: null });
      setEditing(true);
    }
  };

  const closeModal = () => {
    setSelectedDay(null);
    setDraft(null);
    setEditing(false);
  };

  const saveDraft = () => {
    if (!draft.activity.trim()) {
      showToast('종목을 입력해 주세요');
      return;
    }
    const next = { ...entries, [selectedDay]: draft };
    persist(next);
    setEditing(false);
    showToast('저장됐어요');
  };

  const deleteEntry = () => {
    const next = { ...entries };
    delete next[selectedDay];
    persist(next);
    closeModal();
    showToast('삭제됐어요');
  };

  const handlePhoto = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      showToast('사진 용량이 너무 커요 (4MB 이하)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDraft((d) => ({ ...d, photo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const buildExportText = () => {
    const { start, end } = exportRange;
    if (!start || !end) {
      showToast('기간을 선택해 주세요');
      return;
    }
    const keys = Object.keys(entries)
      .filter((k) => k >= start && k <= end)
      .sort();
    if (keys.length === 0) {
      setExportText('해당 기간에 기록된 운동이 없어요.');
      return;
    }
    const lines = keys.map((k) => {
      const e = entries[k];
      const mood = MOODS.find((m) => m.id === e.mood);
      const detail = [];
      if (e.time) detail.push(`${e.time}`);
      if (e.activity) detail.push(`${e.activity}`);
      let line = formatDisplayDate(k);
      if (detail.length) line += `\n${detail.join(' · ')}`;
      if (mood) line += `  [${mood.label}]`;
      if (e.note) line += `\n"${e.note}"`;
      return line;
    });
    setExportText(lines.join('\n\n'));
  };

  const copyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      showToast('복사됐어요');
    } catch (e) {
      showToast('복사에 실패했어요');
    }
  };

  return (
    <div style={styles.page}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes toastIn { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>

      <header style={styles.header}>
        <div style={styles.headerTop}>
          <div>
            <div style={styles.eyebrow}>WORKOUT LOG</div>
            <h1 style={styles.title}>운동 기록</h1>
          </div>
          <button style={styles.exportBtn} onClick={() => { setShowExport(true); setExportText(''); }}>
            <Download size={16} strokeWidth={2} />
          </button>
        </div>

        <div style={styles.monthNav}>
          <button style={styles.navBtn} onClick={() => goMonth(-1)}><ChevronLeft size={18} /></button>
          <div style={styles.monthLabel}>{monthLabel}</div>
          <button style={styles.navBtn} onClick={() => goMonth(1)}><ChevronRight size={18} /></button>
        </div>
      </header>

      <div style={styles.weekRow}>
        {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
          <div key={d} style={{ ...styles.weekCell, color: i === 0 ? '#B98A6E' : '#9A9088' }}>{d}</div>
        ))}
      </div>

      <div style={styles.grid}>
        {cells.map((day, idx) => {
          if (day === null) return <div key={idx} style={styles.cellEmpty} />;
          const key = dateKey(new Date(year, month, day));
          const entry = entries[key];
          const isToday = key === todayKey;
          return (
            <button key={idx} style={styles.cell} onClick={() => openDay(day)}>
              <div style={{
                ...styles.dayNum,
                ...(isToday ? styles.dayNumToday : {}),
              }}>{day}</div>
              {entry && (
                <div style={styles.cellMark}>
                  <div style={{ ...styles.dot, background: (MOODS.find(m => m.id === entry.mood) || MOODS[2]).color }} />
                  {entry.photo && <Camera size={10} color="#B98A6E" strokeWidth={2.2} />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div style={styles.legend}>
        {MOODS.map((m) => (
          <div key={m.id} style={styles.legendItem}>
            <div style={{ ...styles.legendDot, background: m.color }} />
            <span style={styles.legendLabel}>{m.label}</span>
          </div>
        ))}
      </div>

      {selectedDay && draft && (
        <div style={styles.overlay} onClick={closeModal}>
          <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div style={styles.sheetHandle} />
            <div style={styles.sheetHeader}>
              <div style={styles.sheetDate}>{formatDisplayDate(selectedDay)}</div>
              <button style={styles.closeBtn} onClick={closeModal}><X size={20} /></button>
            </div>

            {!editing ? (
              <div style={styles.viewMode}>
                {draft.photo && (
                  <img src={draft.photo} alt="운동 사진" style={styles.photoView} />
                )}
                <div style={styles.viewRow}>
                  <Clock size={15} color="#B98A6E" />
                  <span style={styles.viewText}>{draft.time || '시간 미입력'}</span>
                </div>
                <div style={styles.viewRow}>
                  <Dumbbell size={15} color="#B98A6E" />
                  <span style={styles.viewText}>{draft.activity}</span>
                </div>
                <div style={styles.moodBadgeRow}>
                  {MOODS.map((m) => (
                    <div key={m.id} style={{
                      ...styles.moodBadge,
                      opacity: draft.mood === m.id ? 1 : 0.25,
                      background: m.color,
                    }}>{m.label}</div>
                  ))}
                </div>
                {draft.note && <div style={styles.noteView}>"{draft.note}"</div>}

                <div style={styles.actionRow}>
                  <button style={styles.secondaryBtn} onClick={deleteEntry}>삭제</button>
                  <button style={styles.primaryBtn} onClick={() => setEditing(true)}>
                    <Pencil size={14} /> 수정
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.editMode}>
                <label style={styles.photoLabel}>
                  {draft.photo ? (
                    <div style={styles.photoPreviewWrap}>
                      <img src={draft.photo} alt="미리보기" style={styles.photoPreview} />
                      <div style={styles.photoOverlayText}>탭하여 변경</div>
                    </div>
                  ) : (
                    <div style={styles.photoPlaceholder}>
                      <Camera size={22} color="#B98A6E" strokeWidth={1.6} />
                      <span style={styles.photoPlaceholderText}>사진 추가 (선택)</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
                </label>

                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>시간</label>
                  <input
                    type="text"
                    placeholder="예: 오전 7시 · 45분"
                    style={styles.input}
                    value={draft.time}
                    onChange={(e) => setDraft({ ...draft, time: e.target.value })}
                  />
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>종목</label>
                  <input
                    type="text"
                    placeholder="예: 러닝 5km, 필라테스"
                    style={styles.input}
                    value={draft.activity}
                    onChange={(e) => setDraft({ ...draft, activity: e.target.value })}
                  />
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>컨디션</label>
                  <div style={styles.moodPicker}>
                    {MOODS.map((m) => (
                      <button
                        key={m.id}
                        style={{
                          ...styles.moodOption,
                          background: draft.mood === m.id ? m.color : '#F4EFE7',
                          color: draft.mood === m.id ? '#FFF9F2' : '#8A8074',
                        }}
                        onClick={() => setDraft({ ...draft, mood: m.id })}
                      >{m.label}</button>
                    ))}
                  </div>
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>한줄평</label>
                  <textarea
                    placeholder="오늘 기분이나 컨디션을 적어보세요"
                    style={styles.textarea}
                    value={draft.note}
                    onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                  />
                </div>

                <button style={styles.saveBtn} onClick={saveDraft}>저장하기</button>
              </div>
            )}
          </div>
        </div>
      )}

      {showExport && (
        <div style={styles.overlay} onClick={() => setShowExport(false)}>
          <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div style={styles.sheetHandle} />
            <div style={styles.sheetHeader}>
              <div style={styles.sheetDate}>기록 내보내기</div>
              <button style={styles.closeBtn} onClick={() => setShowExport(false)}><X size={20} /></button>
            </div>

            <div style={styles.editMode}>
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>시작일</label>
                <input
                  type="date"
                  style={styles.input}
                  value={exportRange.start}
                  onChange={(e) => setExportRange({ ...exportRange, start: e.target.value })}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>종료일</label>
                <input
                  type="date"
                  style={styles.input}
                  value={exportRange.end}
                  onChange={(e) => setExportRange({ ...exportRange, end: e.target.value })}
                />
              </div>
              <button style={styles.saveBtn} onClick={buildExportText}>기록 모아보기</button>

              {exportText && (
                <>
                  <textarea
                    readOnly
                    style={{ ...styles.textarea, minHeight: 180, marginTop: 14, fontFamily: 'inherit' }}
                    value={exportText}
                  />
                  <button style={{ ...styles.primaryBtn, width: '100%', justifyContent: 'center', marginTop: 10 }} onClick={copyExport}>
                    텍스트 복사하기
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#FBF8F2',
    fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif",
    color: '#4A4339',
    paddingBottom: 40,
  },
  header: {
    padding: '28px 22px 14px',
    borderBottom: '1px solid #EAE2D3',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: '0.18em',
    color: '#B98A6E',
    fontWeight: 600,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    margin: 0,
    color: '#3A352D',
    letterSpacing: '-0.01em',
  },
  exportBtn: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    border: '1px solid #E4DAC6',
    background: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#9C7A4A',
    cursor: 'pointer',
  },
  monthNav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    marginTop: 20,
  },
  navBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    color: '#9A9088',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: 600,
    letterSpacing: '0.04em',
    color: '#5A5347',
    minWidth: 90,
    textAlign: 'center',
  },
  weekRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    padding: '16px 14px 4px',
  },
  weekCell: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 600,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    padding: '4px 10px',
    gap: 2,
  },
  cellEmpty: { aspectRatio: '1' },
  cell: {
    aspectRatio: '1',
    border: 'none',
    background: 'transparent',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    cursor: 'pointer',
    borderRadius: 10,
  },
  dayNum: {
    fontSize: 14,
    color: '#6B6356',
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
  },
  dayNumToday: {
    background: '#3A352D',
    color: '#FBF8F2',
    fontWeight: 700,
  },
  cellMark: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    height: 10,
  },
  dot: { width: 5, height: 5, borderRadius: '50%' },
  legend: {
    display: 'flex',
    justifyContent: 'center',
    gap: 16,
    marginTop: 22,
    flexWrap: 'wrap',
  },
  legendItem: { display: 'flex', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: '50%' },
  legendLabel: { fontSize: 11, color: '#9A9088' },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(58, 53, 45, 0.4)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 50,
  },
  sheet: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '88vh',
    overflowY: 'auto',
    background: '#FFFDF9',
    borderRadius: '24px 24px 0 0',
    padding: '10px 22px 28px',
    animation: 'fadeIn 0.25s ease',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    background: '#E4DAC6',
    margin: '6px auto 14px',
  },
  sheetHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  sheetDate: { fontSize: 17, fontWeight: 700, color: '#3A352D' },
  closeBtn: {
    border: 'none',
    background: 'transparent',
    color: '#9A9088',
    cursor: 'pointer',
    padding: 4,
  },
  viewMode: { display: 'flex', flexDirection: 'column', gap: 12 },
  photoView: {
    width: '100%',
    maxHeight: 260,
    objectFit: 'cover',
    borderRadius: 14,
    marginBottom: 4,
  },
  viewRow: { display: 'flex', alignItems: 'center', gap: 8 },
  viewText: { fontSize: 15, color: '#4A4339' },
  moodBadgeRow: { display: 'flex', gap: 6, marginTop: 4 },
  moodBadge: {
    padding: '4px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    color: '#FFF9F2',
  },
  noteView: {
    fontSize: 14,
    color: '#7A7264',
    fontStyle: 'italic',
    lineHeight: 1.5,
    marginTop: 4,
    padding: '12px 14px',
    background: '#F7F1E6',
    borderRadius: 12,
  },
  actionRow: { display: 'flex', gap: 10, marginTop: 10 },
  secondaryBtn: {
    flex: 1,
    padding: '12px 0',
    borderRadius: 12,
    border: '1px solid #E4DAC6',
    background: 'transparent',
    color: '#A98F7A',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  primaryBtn: {
    flex: 2,
    padding: '12px 0',
    borderRadius: 12,
    border: 'none',
    background: '#3A352D',
    color: '#FBF8F2',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  editMode: { display: 'flex', flexDirection: 'column', gap: 16 },
  photoLabel: { cursor: 'pointer' },
  photoPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 120,
    borderRadius: 14,
    border: '1.5px dashed #DDD1B8',
    background: '#FAF6EC',
  },
  photoPlaceholderText: { fontSize: 13, color: '#B0A38A' },
  photoPreviewWrap: { position: 'relative', borderRadius: 14, overflow: 'hidden' },
  photoPreview: { width: '100%', height: 160, objectFit: 'cover', display: 'block' },
  photoOverlayText: {
    position: 'absolute',
    bottom: 8,
    right: 10,
    fontSize: 11,
    color: '#FFF',
    background: 'rgba(0,0,0,0.45)',
    padding: '3px 8px',
    borderRadius: 8,
  },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: 600, color: '#9C7A4A', letterSpacing: '0.02em' },
  input: {
    border: '1px solid #E4DAC6',
    borderRadius: 10,
    padding: '11px 13px',
    fontSize: 14,
    color: '#3A352D',
    background: '#FFFFFF',
    outline: 'none',
  },
  textarea: {
    border: '1px solid #E4DAC6',
    borderRadius: 10,
    padding: '11px 13px',
    fontSize: 14,
    color: '#3A352D',
    background: '#FFFFFF',
    outline: 'none',
    minHeight: 70,
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  moodPicker: { display: 'flex', gap: 7 },
  moodOption: {
    flex: 1,
    padding: '9px 0',
    borderRadius: 10,
    border: 'none',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '14px 0',
    borderRadius: 12,
    border: 'none',
    background: '#9C7A4A',
    color: '#FFF9F2',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 4,
  },
  toast: {
    position: 'fixed',
    bottom: 28,
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#3A352D',
    color: '#FBF8F2',
    padding: '10px 18px',
    borderRadius: 20,
    fontSize: 13,
    animation: 'toastIn 0.2s ease',
    zIndex: 100,
  },
};
