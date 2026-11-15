/** All story cues are seconds, converted from the existing 630-frame / 30 fps edit. */
export const T = {start:0, create:3, join:6.5, assignment:10.5, chart:14.5, finish:18, end:21, chat:4.1, type:6.8, gesture:10.7, reaction:15.2, audioFade:19.5};
export const beats = [
 {start:T.start,end:T.create,title:'Jedna třída. Jeden tým.',body:'Učení společně.'},
 {start:T.create,end:T.join,title:'Vytvořte třídu.',body:'V sekci Týmy.'},
 {start:T.join,end:T.assignment,title:'Pozvěte žáky.',body:'Připojí se kódem.'},
 {start:T.assignment,end:T.chart,title:'Zadejte úkol.',body:'Kurz, komu a dokdy.'},
 {start:T.chart,end:T.finish,title:'Sledujte pokrok.',body:'Výsledky na jednom místě.'},
 {start:T.finish,end:T.end,title:'Učte se společně.',body:'Zdarma. Bez reklam.'},
];
