// warung-sari-rasa v3.0 — recipebook.js
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
