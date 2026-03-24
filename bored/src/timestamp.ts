const millisPerSecond = 1000;
const secondsPerDay = 60 * 60 * 24;
const secondsPerMonth = secondsPerDay * 30;

export function getTimestamp() {
  return Date.now() / millisPerSecond;
}

export function roundTimestampToDay(ts: number) {
  return Math.trunc(ts / secondsPerDay) * secondsPerDay;
}

export function roundTimestampToMonth(ts: number) {
  return Math.trunc(ts / secondsPerMonth) * secondsPerMonth;
}

export function timestampToDate(ts: number) {
  return new Date(ts * millisPerSecond);
}

const relTimeFmt = new Intl.RelativeTimeFormat("en-GB", { style: "short" });

export function timestampToString(ts: number) {
  ts = roundTimestampToDay(ts);
  const currentTs = roundTimestampToDay(getTimestamp());
  const diff = (ts - currentTs) / secondsPerDay;
  const diffAbs = Math.abs(diff);

  if (diffAbs < 1) {
    return "Today";
  }

  if (diffAbs < 30) {
    return relTimeFmt.format(diff, "day");
  }

  if (diffAbs < 180) {
    return relTimeFmt.format(Math.trunc(diff / 30), "month");
  }

  return timestampToDate(ts).toLocaleDateString("en-GB", {
    dateStyle: "medium",
    timeZone: "UTC",
  });
}
