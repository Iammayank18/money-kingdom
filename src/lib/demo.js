import { CUR, NOW, addMonth, dim, pad, daysAgo, daysAhead } from './dates.js';
import { mulberry } from './format.js';
import { defaultBudgets } from './categories.js';
import { lsChar } from './storage.js';

/** Example data shown until the user starts their own. Seeded, so it is stable per day. */
export function makeDemo() {
  const rnd=mulberry(20261005), pick=a=>a[Math.floor(rnd()*a.length)], amt=(lo,hi,m)=>Math.round((lo+rnd()*(hi-lo))*m/10)*10;
  const start=addMonth(CUR,-5);
  const settings={income:50000,goal:15000,budgets:defaultBudgets(),startMonth:start,recurring:[
    {id:'r1',n:'Ghar ka rent',a:12000,c:'rent',day:1},{id:'r2',n:'Gym membership',a:1000,c:'health',day:3},
    {id:'r3',n:'Jio Fiber + recharge',a:999,c:'bills',day:5},{id:'r4',n:'Bijli bill',a:1350,c:'bills',day:10},{id:'r5',n:'Netflix',a:199,c:'fun',day:12}]};
  const mult={'-5':0.93,'-4':1.0,'-3':0.86,'-2':1.2,'-1':1.07,'0':1.1};
  const N={food:['Swiggy','Zomato','Chai + samosa','Office lunch','Dinner bahar','Dominos','Momos','Coffee'],groc:['Blinkit','Zepto','DMart','Sabzi','Doodh + bread'],travel:['Uber','Rapido','Petrol','Metro card','Auto'],shop:['Amazon','Myntra','Flipkart','Naye shoes','Shirt'],fun:['Movie (PVR)','Bowling','Dosto ke saath party','BookMyShow'],health:['Medicine','Doctor visit'],other:['Gift','Haircut','Laundry']};
  const months={};
  for(let off=-5;off<=0;off++){
    const k=addMonth(CUR,off),m=mult[off],last=off===0?NOW.getDate():dim(k),items=[];
    const add=(day,c,a)=>items.push({id:'d'+off+'_'+items.length,d:k+'-'+pad(day),a,c,n:pick(N[c]),t:'e'});
    for(let d=1;d<=last;d++){
      if(rnd()<0.75)add(d,'food',amt(90,480,m));
      if(rnd()<0.45)add(d,'travel',amt(70,320,m));
      if(rnd()<0.2)add(d,'groc',amt(400,1100,m));
      if(rnd()<0.075*m)add(d,'shop',amt(500,2600,m));
      if(rnd()<0.06*m)add(d,'fun',amt(300,1200,m));
      if(rnd()<0.03)add(d,'health',amt(200,900,1));
      if(rnd()<0.04)add(d,'other',amt(150,600,1));
    }
    if(off===-2)items.push({id:'dinc'+off,d:k+'-18',a:6000,c:'inc',n:'Freelance project',t:'i'});
    months[k]=items;
  }
  settings.char=lsChar()||'gullu';
  const ago = daysAgo, ahead = daysAhead;
  const loans=[
    {id:'L1',dir:'diya',who:'Rahul',a:5000,d:ago(12),due:ahead(30),n:'Bike service ke liye',paid:[]},
    {id:'L2',dir:'diya',who:'Priya',a:1200,d:ago(40),due:ago(3),n:'Concert ticket',paid:[{d:ago(10),a:500}]},
    {id:'L3',dir:'diya',who:'Aman',a:800,d:ago(60),due:ago(30),n:'Dinner split',paid:[{d:ago(28),a:800}],closed:true}];
  return {settings,months,loans,demo:true};
}
/** Blank own-data state; keeps income, goal and character from whatever was showing. */
export function freshState(prev) {
  const ps = prev && prev.settings;
  return {
    settings: {
      income: ps ? ps.income : 50000,
      goal: ps ? ps.goal : 15000,
      budgets: defaultBudgets(),
      startMonth: CUR,
      recurring: [],
      started: true,
      char: (ps && ps.char) || lsChar() || 'gullu',
    },
    months: {},
    loans: [],
  };
}
