const linear: <T extends number[], K extends number[]>(x: number | K, knownX: T, knownY: T) => K = require('everpolate').linear;

// function to get the eta from the current queue position and start position
// more information: https://github.com/themoonisacheese/2bored2wait/issues/141
export function eta(position: number, length: number) {
  const b = Math.log(linear(length, ...queueData)[0]);
  function a(position: number) {
    return Math.log((position + c) / (length + c)) / b;
  }
  return a(0) - a(position);
}
// assumed queue length, offset for queue eta calculation
const c = 150;
// statistically acquired data by MrGeorgen
// todo: get more
const queueData: [number[], number[]] = [
  [93, 207, 231, 257, 412, 418, 486, 506, 550, 586, 666, 758, 789, 826],
  [0.9998618838664679, 0.9999220416881794, 0.9999234240704379, 0.9999291667668093, 0.9999410569845172, 0.9999168965649361, 0.9999440195022513, 0.9999262577896301, 0.9999462301738332, 0.999938895110192, 0.9999219189483673, 0.9999473463335498, 0.9999337457796981, 0.9999279556964097],
];
