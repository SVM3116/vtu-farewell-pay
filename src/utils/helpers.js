export const getCooldownTime = (createdAt) => {
  const now = new Date();
  const created = new Date(createdAt);
  const diffInMs = now - created;
  const twentyFourHoursInMs = 24 * 60 * 60 * 1000;

  if (diffInMs < twentyFourHoursInMs) {
    const remainingMs = twentyFourHoursInMs - diffInMs;
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    return { isLocked: true, time: `${hours}h ${minutes}m` };
  }
  return { isLocked: false, time: null };
};