export const getDayNameInTimezone = (date: Date, timezone: string = 'UTC'): string => {
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: "long" });
  return formatter.format(date);
};

export const getDateInTimezone = (date: Date, timezone: string = 'UTC'): string => {
  const formatter = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, day: '2-digit', month: '2-digit', year: '2-digit' });
  const parts = formatter.formatToParts(date);
  
  const day = parts.find(part => part.type === 'day')?.value;
  const month = parts.find(part => part.type === 'month')?.value;

  return `${day}/${month}`;
};

export const getDayOrder = (date: Date): number => {
  const day = date.getDay();
  return day === 0 ? 7 : day; // Set Sunday (0) to 7 to place it after Saturday
};

export const formatDateTime = (date: Date, timezone: string = 'UTC'): string => {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  
  const hours = parts.find(part => part.type === 'hour')?.value;
  const minutes = parts.find(part => part.type === 'minute')?.value;
  const seconds = parts.find(part => part.type === 'second')?.value;
  const day = parts.find(part => part.type === 'day')?.value;
  const month = parts.find(part => part.type === 'month')?.value;
  const year = parts.find(part => part.type === 'year')?.value;

  return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
};
