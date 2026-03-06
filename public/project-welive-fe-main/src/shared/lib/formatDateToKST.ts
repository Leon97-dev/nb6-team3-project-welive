export const formatDateToKST = (dateStr: string) => {
  if (!dateStr) return '-';

  // ISO(예: 2026-02-23T08:54:38.395Z)와 공백 포맷(예: 2026-02-23 08:54:38) 모두 허용
  const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return '-';

  return date
    .toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .replace(/\. /g, '-')
    .replace(/\./g, '');
};
