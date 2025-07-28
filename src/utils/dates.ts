export const getDayNameInTimezone = (date: Date, timezone: string = 'UTC'): string => {
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: "long" });
  return formatter.format(date);
};

export const getUTCOffsetMinutes = (date: Date, timezone: string = 'UTC'): number => {
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour12: false, hour: '2-digit', minute: '2-digit' });
  const parts = formatter.formatToParts(date);
  const hour = parseInt(parts.find(part => part.type === 'hour')?.value ?? '0');
  const minute = parseInt(parts.find(part => part.type === 'minute')?.value ?? '0');

  const utcHour = date.getUTCHours();
  const utcMinute = date.getUTCMinutes();

  return (hour - utcHour) * 60 + (minute - utcMinute);
};

export const parseDateWithTimezone = (input: string, timeZone: string = 'UTC'): Date  => {
  const [day, month, yearRaw] = input.split(/[\/\-]/).map(Number);
  const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;

  const utcMidnight = new Date(Date.UTC(year, month - 1, day));

  const offsetMinutes = getUTCOffsetMinutes(utcMidnight, timeZone);

  const utcOffsetMidnight = new Date(Date.UTC(year, month - 1, day, 0, 0));
  utcOffsetMidnight.setUTCMinutes(utcMidnight.getUTCMinutes() + offsetMinutes);

  if (process.env.DEBUG_MODE === "true") console.log(utcOffsetMidnight.toISOString(), "UTC Offset Minutes:", offsetMinutes, "Timezone:", timeZone);
  return utcOffsetMidnight;
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
