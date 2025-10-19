const ISO_WEEK_PATTERN = /^(\d{4})-W(\d{2})$/;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const formatWeekLabel = (isoWeek: string): string => {
  const match = ISO_WEEK_PATTERN.exec(isoWeek.trim());
  if (!match) {
    return isoWeek;
  }

  const [, yearString, weekString] = match;
  const year = Number(yearString);
  const week = Number(weekString);

  if (!Number.isFinite(year) || !Number.isFinite(week) || week < 1 || week > 53) {
    return isoWeek;
  }

  const fourthJanuary = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = fourthJanuary.getUTCDay() || 7;
  const weekStart = new Date(fourthJanuary);
  weekStart.setUTCDate(fourthJanuary.getUTCDate() - dayOfWeek + 1 + (week - 1) * 7);

  const monthFormatter = new Intl.DateTimeFormat("id-ID", { month: "long" });
  const monthName = monthFormatter.format(weekStart);

  return `Minggu ke-${week} (${monthName} ${year})`;
};

export const percent = (value: number, fractionDigits = 1): string => {
  if (!Number.isFinite(value)) {
    return "0%";
  }

  const normalized = clamp(value, -1000, 1000);
  return `${normalized.toLocaleString("id-ID", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}%`;
};
