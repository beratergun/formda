import referenceFoods from './reference-foods.json';
import recipeFoods from './recipe-foods.json';
import legacyFoods from './legacy-foods.json';
import recipes from './turkish-recipes.json';
import menu from './menu.json';
import usdaFoods from './usda-foods.json';
import type { Food, MenuPlan, Recipe } from '../../domain/types';

export const FOODS = [...referenceFoods, ...usdaFoods, ...recipeFoods] as Food[];
export const DEFAULT_MENU = menu as MenuPlan;

export const LEGACY_FOODS = legacyFoods as Food[];
export const TURKISH_RECIPES = recipes as Recipe[];
