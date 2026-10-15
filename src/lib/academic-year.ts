const TZ = "Africa/Cairo";

function cairoNow(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
}

export function currentAcademicYear(date?: Date): string {
  const d = date ?? cairoNow();
  const y = d.getFullYear();
  const m = d.getMonth();
  if (m >= 8) return `${y}-${y + 1}`;
  return `${y - 1}-${y}`;
}

export function academicYearOptions(count = 3): string[] {
  const now = currentAcademicYear();
  const [start] = now.split("-").map(Number);
  const years: string[] = [];
  for (let i = 0; i < count; i++) {
    years.push(`${start - 1 + i}-${start + i}`);
  }
  return years;
}

export function academicYearRange(academicYear: string): { startDate: Date; endDate: Date } {
  const [startY, endY] = academicYear.split("-").map(Number);
  return {
    startDate: new Date(Date.UTC(startY, 8, 1)),
    endDate: new Date(Date.UTC(endY, 7, 31)),
  };
}
