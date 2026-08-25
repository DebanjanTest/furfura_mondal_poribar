// Time of Day and Durga Puja Countdown Calculations

export const PUJA_TARGET_DATE = new Date('2026-10-10T00:00:00+05:30'); // Subho Mahalaya 2026

export function getTimeOfDay(forcedHour = null) {
  const now = new Date();
  const hour = forcedHour !== null ? forcedHour : now.getHours() + now.getMinutes() / 60;

  if (hour >= 4.5 && hour < 6.5) return 'early-morning'; // 4:30 AM - 6:30 AM (Bhorer Mahalaya & Agomoni)
  if (hour >= 6.5 && hour < 12.0) return 'morning';       // 6:30 AM - 12:00 PM (Sunny cheerful morning)
  if (hour >= 12.0 && hour < 17.0) return 'afternoon';   // 12:00 PM - 5:00 PM (Autumn bright sky)
  if (hour >= 17.0 && hour < 20.5) return 'evening';     // 5:00 PM - 8:30 PM (Sandhya Aarti & festoon lights)
  if (hour >= 20.5 || hour < 0.5) return 'night';        // 8:30 PM - 12:30 AM (Festive night celebrations)
  return 'midnight';                                     // 12:30 AM - 4:30 AM (Serene starry night)
}

export function getCountdown() {
  const now = new Date();
  const diff = PUJA_TARGET_DATE.getTime() - now.getTime();

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isPujoHere: true,
      label: "শুভ মহালয়া এসে গেছে! দেবীপক্ষের শুভ সূচনা!"
    };
  }

  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    isPujoHere: false,
    label: `${days} days until Subho Mahalaya 2026`
  };
}

// Bengali numerals converter
export function toBengaliNumerals(num) {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bengaliDigits[parseInt(d, 10)]);
}
