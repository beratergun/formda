import referenceFoods from './reference-foods.json';
import menu from './menu.json';
import usdaFoods from './usda-foods.json';
import type { Food, MenuPlan } from '../../domain/types';

export const FOODS = [...referenceFoods, ...usdaFoods] as Food[];
export const DEFAULT_MENU = menu as MenuPlan;
