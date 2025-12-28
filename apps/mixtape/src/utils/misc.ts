export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}
