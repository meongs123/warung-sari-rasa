// recipebook.js — static recipe list + overlay data (Revision 1).
// The book is help only: all 4 recipes listed, always visible. No discovery
// states, no "???" silhouettes, no "Buku Resep Lengkap". Open with B; timers pause.
// The overlay is a pause screen: the shift clock and burners freeze while it is open.

import { RECIPE_ORDER, RECIPES, FINISHERS } from './config.js';

export function recipeBookEntries() {
  return RECIPE_ORDER.map((id) => {
    const r = RECIPES[id];
    const finisher = FINISHERS.find((f) => f.id === r.finisher);
    return {
      id: r.id,
      name: r.name,
      gloss: r.gloss,
      price: r.price,
      steps: recipeSteps(r),
      finisher: finisher ? finisher.name : null,
    };
  });
}

// Human-readable chain steps for the book panel.
export function recipeSteps(recipe) {
  const steps = [];
  for (const comp of recipe.plate) {
    if (comp.prep === 'cooked') {
      const ing = comp.kind === 'teh' ? 'Seduh Teh' : `Masak ${dishWord(comp.kind)}`;
      steps.push(ing);
    } else if (comp.prep === 'chopped') {
      steps.push(`Potong ${dishWord(comp.kind)}`);
    }
  }
  if (recipe.finisher) {
    const fin = FINISHERS.find((f) => f.id === recipe.finisher);
    steps.push(`+ ${fin ? fin.name : recipe.finisher}`);
  }
  steps.push('Antar');
  return steps;
}

function dishWord(kind) {
  return { nasi: 'Nasi', mie: 'Mie', telur: 'Telur', ayam: 'Ayam', sayur: 'Sayur', teh: 'Teh' }[kind] || kind;
}
