export const getDistance = (posA, posB) => {
  const [ax, ay] = posA;
  const [bx, by] = posB;

  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
};
