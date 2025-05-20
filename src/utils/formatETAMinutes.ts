export function formatEtaMinutes(minutes: number | undefined): string {
  const totalSeconds = Math.round((minutes ?? 0) * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  return [
    hours > 0 ? `${hours}h` : null,
    mins > 0 ? `${mins}m` : null,
    `${secs}s`
  ].filter(Boolean).join(" ");
}