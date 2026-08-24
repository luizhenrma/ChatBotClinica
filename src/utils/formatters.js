const formatDate = (date) => {
  try {
    return date.toLocaleString("pt-BR");
  } catch (error) {
    return date.toString();
  }
};

const formatDuration = (milliseconds) => {
  if (!milliseconds || milliseconds <= 0) return "0s";

  let totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const parts = [];

  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds) parts.push(`${seconds}s`);
  return parts.join(" ");
};

module.exports = { formatDate, formatDuration };
