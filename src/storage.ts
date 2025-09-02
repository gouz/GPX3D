export const getMapboxKey = (): string => {
  const ls = localStorage.getItem("mapboxkey") ?? "";
  if (ls === "") {
    const k = prompt("Set your mapbox api key") ?? "";
    localStorage.setItem("mapboxkey", k);
    return k;
  }
  return ls;
};
