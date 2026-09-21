const PARTS_FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat>();

export interface ZonedDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  weekday: "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";
}

function formatterFor(timezone: string): Intl.DateTimeFormat {
  const cached = PARTS_FORMATTER_CACHE.get(timezone);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
  });
  PARTS_FORMATTER_CACHE.set(timezone, formatter);
  return formatter;
}

/** Return calendar fields for an instant in an IANA timezone. */
export function getZonedDateParts(date: Date, timezone = "UTC"): ZonedDateParts {
  const values = Object.fromEntries(
    formatterFor(timezone).formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    weekday: values.weekday as ZonedDateParts["weekday"],
  };
}

/** Validate an IANA timezone without maintaining a list that goes stale. */
export function isValidTimezone(value: unknown): value is string {
  if (typeof value !== "string" || value.length < 1 || value.length > 100) return false;
  try {
    formatterFor(value);
    return true;
  } catch {
    return false;
  }
}

export function detectBrowserTimezone(): string {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return isValidTimezone(timezone) ? timezone : "UTC";
  } catch {
    return "UTC";
  }
}
