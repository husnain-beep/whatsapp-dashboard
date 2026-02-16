export function computeMessageSchedule(
  contacts: { id: string; name: string; phone: string }[],
  startDate: Date,
  spreadOverDays: number,
  intervalSeconds: number
): { contactId: string; scheduledAt: Date }[] {
  const messagesPerDay = Math.ceil(contacts.length / spreadOverDays);
  const schedule: { contactId: string; scheduledAt: Date }[] = [];

  let currentTime = new Date(startDate);
  let dayMessageCount = 0;
  let currentDay = 0;

  for (const contact of contacts) {
    if (dayMessageCount >= messagesPerDay && currentDay < spreadOverDays - 1) {
      currentDay++;
      dayMessageCount = 0;
      currentTime = new Date(startDate);
      currentTime.setDate(currentTime.getDate() + currentDay);
    }

    schedule.push({
      contactId: contact.id,
      scheduledAt: new Date(currentTime),
    });

    currentTime = new Date(currentTime.getTime() + intervalSeconds * 1000);
    dayMessageCount++;
  }

  return schedule;
}
