export interface Skin {
  id: string;
  name: string;
  wall: { background: string };
  cabinet: { fill: string; accent: string };
  platter: { color: string; matColor: string };
  tonearm: { color: string; headshell: string };
  label: { ringColor: string };
}
