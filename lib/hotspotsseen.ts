// The appliance dots pulse until one has been opened, and then stay still
// for the rest of the visit
const KEY = "hotspotsSeen";

export const loadHotspotsSeen = () =>
  window.sessionStorage.getItem(KEY) === "true";

export const saveHotspotsSeen = () =>
  window.sessionStorage.setItem(KEY, "true");
