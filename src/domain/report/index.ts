import type { AppData } from '../../data/repositories';
import { emptyDay } from '../types';
import { total } from '../calories';
import { score } from '../score';
import { average } from '../tdee';
import { volume } from '../progression';
import { dateDiff } from '../dates';
import { assistantMessages } from '../assistant';

export function dailyReport(data:AppData,date:string){const day=data.dayLog.find(d=>d.date===date)||emptyDay(date);const meals=data.mealEntry.filter(m=>m.date===date);const workouts=data.workoutLog.filter(w=>w.date===date);const macros=total(meals);const targets=data.targets[0];const points=score(day,macros,new Set(meals.map(m=>m.mealId)).size,workouts.some(w=>w.done),targets);return{date,day,meals,workouts,macros,points,comments:assistantMessages({day,macros,targets}).slice(0,3)};}
export function periodReport(data:AppData,date:string,days:number){const logs=data.dayLog.filter(d=>dateDiff(date,d.date)>=0&&dateDiff(date,d.date)<days).sort((a,b)=>a.date.localeCompare(b.date));const reports=logs.map(d=>dailyReport(data,d.date));const workouts=data.workoutLog.filter(w=>w.done&&dateDiff(date,w.date)>=0&&dateDiff(date,w.date)<days);const weights=logs.filter(d=>d.weight!==undefined);const waists=logs.filter(d=>d.measurements?.waist!==undefined);const best=[...reports].sort((a,b)=>b.points.total-a.points.total)[0];return{days,loggedDays:logs.length,averageKcal:average(reports.map(r=>r.macros.kcal)),averageProtein:average(reports.map(r=>r.macros.protein)),averageScore:average(reports.map(r=>r.points.total)),sessions:workouts.filter(w=>w.type!=='rest').length,volume:volume(workouts.flatMap(w=>w.sets)),swimM:workouts.filter(w=>w.type==='swim').reduce((a,w)=>a+(w.distanceM||0),0),weightChange:weights.length>=2?weights.at(-1)!.weight!-weights[0].weight!:undefined,waistChange:waists.length>=2?waists.at(-1)!.measurements!.waist!-waists[0].measurements!.waist!:undefined,bestDate:best?.date,highlights:[`${logs.length} günde kendine dönüp baktın.`,`${workouts.filter(w=>w.type!=='rest').length} seans kaydettin.`,...(best?[`En yüksek gün puanın ${best.points.total}.`]:[])]};}
