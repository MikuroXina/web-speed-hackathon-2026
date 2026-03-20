import { Temporal } from "@js-temporal/polyfill";

export function longYearMonthDay(timestamp: string): string {
  return Temporal.Instant.from(timestamp).toLocaleString("ja", {
    dateStyle: "long",
  });
}
