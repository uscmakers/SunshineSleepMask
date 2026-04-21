export function formatAlarmTime(date: Date) {
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
}

export function formatDaysLabel(days: string[]) {
  if (days.length === 0) return "No repeat";
  if (days.length === 7) return "Every day";
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const weekends = ["Sat", "Sun"];
  if (
    weekdays.every((d) => days.includes(d)) &&
    !days.includes("Sat") &&
    !days.includes("Sun")
  ) {
    return "Weekdays";
  }
  if (weekends.every((d) => days.includes(d)) && days.length === 2) {
    return "Weekends";
  }
  return days.join(", ");
}
