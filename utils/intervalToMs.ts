export const intervalToMs = (interval: string): number => {
  const unit = interval.slice(-1);
  const value = parseInt(interval.slice(0, -1));
  switch (unit) {
    case "m":
      return value * 60_000;
    case "h":
      return value * 3_600_000;
    case "d":
      return value * 86_400_000;
    case "w":
      return value * 604_800_000;
    case "M":
      return value * 30 * 86_400_000;
    default:
      throw new Error("Unsupported interval: " + interval);
  }
};
