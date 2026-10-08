export const CATS = [
 {id:'food',n:'Khaana',c:'#2a78d6',b:6000,kw:['swiggy','zomato','chai','dinner','lunch','breakfast','nashta','cafe','pizza','burger','restaurant','khana','khaana','momos','coffee','dominos','kfc','biryani','thali','dhaba']},
 {id:'shop',n:'Shopping',c:'#eb6834',b:4000,kw:['amazon','myntra','flipkart','ajio','kapde','shoes','meesho','nykaa','shirt','tshirt','jeans','gift','watch','headphone']},
 {id:'groc',n:'Grocery',c:'#1baf7a',b:4000,kw:['blinkit','zepto','dmart','bigbasket','sabzi','doodh','milk','grocery','kirana','instamart','fruits','atta','ration']},
 {id:'travel',n:'Travel',c:'#eda100',b:2500,kw:['uber','ola','rapido','petrol','metro','auto','train','flight','bus','cab','fuel','irctc','toll','parking']},
 {id:'fun',n:'Masti',c:'#e87ba4',b:2000,kw:['movie','netflix','bookmyshow','party','game','pvr','spotify','prime','hotstar','concert','trip','outing']},
 {id:'health',n:'Health',c:'#008300',b:1500,kw:['doctor','medicine','pharmacy','gym','apollo','dawai','hospital','test','pharmeasy','1mg']},
 {id:'rent',n:'Rent',c:'#4a3aa7',b:12000,kw:['rent','kiraya','pg','maintenance','society']},
 {id:'bills',n:'Bills',c:'#e34948',b:2500,kw:['bijli','wifi','recharge','electricity','bill','jio','airtel','gas','water','broadband','emi','insurance']},
 {id:'other',n:'Other',c:'#8D948F',b:500,kw:[]},
];
export const CAT = Object.fromEntries(CATS.map((c) => [c.id, c]));
export const defaultBudgets = () => Object.fromEntries(CATS.map((c) => [c.id, c.b]));

export function guessCat(note) {
  const s = note.toLowerCase();
  for (const c of CATS) for (const k of c.kw) if (s.includes(k)) return c.id;
  return null;
}

export const CHARS = [
  { id: 'gullu', n: 'Gullu', d: 'Zinda gullak' },
  { id: 'chhotu', n: 'Chhotu', d: 'Chhota robot' },
  { id: 'babu', n: 'Babu', d: 'Apna seth' },
];
export const charName = (id) => (CHARS.find((c) => c.id === id) || CHARS[0]).n;

/** Tower floors, bottom to top, and the categories each one represents. */
export const FLOORS = [
  { cats: ['rent'] },
  { cats: ['bills'] },
  { cats: ['groc'] },
  { cats: ['food'] },
  { cats: ['travel'] },
  { cats: ['shop'] },
  { cats: ['fun', 'health', 'other'] },
];
export const FLOOR_NAMES = ['Ground floor', '1st floor', '2nd floor', '3rd floor', '4th floor', '5th floor', '6th floor'];
export const floorOf = (c) => {
  const i = FLOORS.findIndex((f) => f.cats.includes(c));
  return i < 0 ? 6 : i;
};
