export const DRINK_SHOTS = Object.freeze({ Americano: 2, Latte: 1, Mocha: 1 });

export const SYRUPS = [
  { id: 'vanilla', name: 'Vanilla', color: '#d5a257', note: 'Soft & sweet' },
  { id: 'caramel', name: 'Caramel', color: '#b96b34', note: 'Golden & cozy' },
  { id: 'hazelnut', name: 'Hazelnut', color: '#996748', note: 'A little nutty' },
  { id: 'lavender', name: 'Lavender', color: '#aa89c2', note: 'Floral & dreamy' },
  { id: 'none', name: 'No syrup', color: '#e5ded7', note: 'Simply coffee' },
];

export const MILKS = [
  { id: 'dairy', name: '2% milk', short: '2% milk', icon: 'milk', group: 'dairy', color: '#fff6e7', note: 'Classic & creamy' },
  { id: 'oat', name: 'Oat milk', short: 'Oat', icon: 'oat', group: 'non-dairy', color: '#ecd6ad', note: 'Smooth & plant-based' },
  { id: 'soy', name: 'Soy milk', short: 'Soy', icon: 'soy', group: 'non-dairy', color: '#f0e7c4', note: 'Light & plant-based' },
];

export function cupLevels(pumps, milkFraction = 0) {
  if (!Number.isInteger(pumps) || pumps < 0 || pumps > 6 || !Number.isFinite(milkFraction) || milkFraction < 0 || milkFraction > 1) {
    throw new Error('Cup fill requires 0-6 pumps and a milk fraction between 0 and 1.');
  }
  const syrup = pumps * 8;
  return { syrup, milk: (154 - syrup) * milkFraction };
}

export function createOrder(draft, orders, now = Date.now()) {
  const firstName = String(draft.firstName || '').trim();
  const lastName = String(draft.lastName || '').trim();
  if (!firstName || !lastName || firstName.length > 40 || lastName.length > 40) {
    throw new Error('Please enter a first and last name, up to 40 characters each.');
  }
  if (!['hot', 'cold'].includes(draft.temperature)) throw new Error('Choose hot or cold.');
  if (!Object.hasOwn(DRINK_SHOTS, draft.drink)) throw new Error('Choose a drink.');
  const americano = draft.drink === 'Americano';
  if (!americano && !MILKS.some(milk => milk.id === draft.milk)) throw new Error('Choose a milk.');
  if (!americano && !SYRUPS.some(syrup => syrup.id === draft.syrup)) throw new Error('Choose a syrup.');
  if (!americano && (!Number.isInteger(draft.pumps) || draft.pumps < 0 || draft.pumps > 6)) {
    throw new Error('Choose between 0 and 6 syrup pumps.');
  }
  return {
    id: crypto.randomUUID(),
    number: Math.max(100, ...orders.map(order => order.number)) + 1,
    firstName, lastName,
    temperature: draft.temperature,
    drink: draft.drink,
    shots: DRINK_SHOTS[draft.drink],
    syrup: americano || draft.pumps === 0 ? 'none' : draft.syrup,
    pumps: americano || draft.syrup === 'none' ? 0 : draft.pumps,
    milk: americano ? null : draft.milk,
    milkDone: americano,
    status: 'preparing',
    createdAt: now,
    readyAt: null,
  };
}

export function milkQueue(orders, filter) {
  return orders.filter(order => order.status !== 'ready' && !order.milkDone && order.milk &&
    (filter === 'both' || MILKS.find(milk => milk.id === order.milk)?.group === filter));
}

export function finishMilk(orders, ids) {
  return orders.map(order => ids.includes(order.id) && order.status !== 'ready' && order.milk
    ? { ...order, milkDone: true }
    : order);
}

export function markReady(orders, ids, now = Date.now()) {
  return orders.map(order => ids.includes(order.id) && order.status !== 'ready'
    ? { ...order, status: 'ready', readyAt: now }
    : order);
}

export function isOrder(value) {
  return value && typeof value.id === 'string' && Number.isInteger(value.number) &&
    typeof value.firstName === 'string' && typeof value.lastName === 'string' &&
    ['hot', 'cold'].includes(value.temperature) && Object.hasOwn(DRINK_SHOTS, value.drink) &&
    (value.shots === undefined || value.shots === DRINK_SHOTS[value.drink]) &&
    ['preparing', 'ready'].includes(value.status) && typeof value.milkDone === 'boolean' &&
    (value.milk === null || MILKS.some(milk => milk.id === value.milk)) &&
    SYRUPS.some(syrup => syrup.id === value.syrup) && Number.isInteger(value.pumps) &&
    value.pumps >= 0 && value.pumps <= 6 && Number.isFinite(value.createdAt) &&
    (value.readyAt === null || Number.isFinite(value.readyAt));
}

export function seedOrders() {
  const orders = [];
  const samples = [
    ['Emma', 'Lee', 'hot', 'Latte', 'vanilla', 2, 'oat'],
    ['Noah', 'Kim', 'cold', 'Mocha', 'caramel', 1, 'dairy'],
    ['Olivia', 'Park', 'hot', 'Latte', 'lavender', 2, 'soy'],
    ['Liam', 'Chen', 'hot', 'Americano', 'none', 0, null],
  ];
  for (const [firstName, lastName, temperature, drink, syrup, pumps, milk] of samples) {
    orders.push(createOrder({ firstName, lastName, temperature, drink, syrup, pumps, milk }, orders));
  }
  return orders;
}
