import type { AppData } from './repositories';
import { calculate } from '../domain/calories';
import { emptyDay } from '../domain/types';
import { dateDiff, shiftDate, todayKey, weekday } from '../domain/dates';
import { defaultPlan, planFor } from '../domain/program';
import { addImage } from './media/images';

export function demoData(base:AppData,date=todayKey()):AppData{
  const data=structuredClone(base);data.profile=[{...data.profile[0],name:'Deniz',age:30,sex:'unspecified',heightCm:172,startWeight:90,activityFactor:1.45,pinHash:undefined,pinSalt:undefined}];data.targets=[{...data.targets[0],kcal:1700,protein:110,goalWeight:80}];data.planSettings=[{...defaultPlan(shiftDate(date,-42)),horizon:'1y'}];data.dayLog=[];data.mealEntry=[];data.workoutLog=[];
  for(let i=0;i<43;i++){
    const current=shiftDate(date,i-42);const plan=planFor(current,data.planSettings[0]);const day=emptyDay(current);day.boxes={h:true,s:i%6!==0,k:true,u:i%4!==0};day.water=6+i%4;day.sleepAt=i%4===0?'00:15':'23:15';day.sleepQuality=3+i%3;day.energy=3+i%3;day.mood=3+i%3;day.steps=4500+i%7*700;day.tags=['demo'];day.note=i%7===0?'Kurgusal demo kaydı · kendi ritmimde bir gün.':'';if(i%7===0||i===42){day.weight=Math.round((90-i*.075)*10)/10;day.measurements={waist:Math.round((96-i*.05)*10)/10};}data.dayLog.push(day);
    for(const[mealId,meal]of Object.entries(data.menuPlan[0].days[weekday(current)]))for(const[itemIndex,item]of meal.items.entries()){const food=data.food.find(f=>f.id===item.foodId)!;data.mealEntry.push({id:`demo-meal-${i}-${mealId}-${itemIndex}`,date:current,mealId:mealId as 'kahvalti'|'ogle'|'ara'|'aksam',foodId:food.id,name:food.name,qty:item.qty,unit:food.unit,state:food.state,...calculate(food,item.qty),photoIds:[],createdAt:new Date(`${current}T12:00:00+03:00`).getTime()});}
    if(i%6!==0){const startedAt=new Date(`${current}T18:30:00+03:00`).getTime();data.workoutLog.push({id:`demo-workout-${i}`,date:current,type:plan.type,done:true,startedAt,endedAt:startedAt+(plan.type==='rest'?0:45*60000),rpe:6+i%3,distanceM:plan.type==='swim'?250+Math.floor(i/7)*50:undefined,sets:plan.type==='strength'?plan.exercises.flatMap(e=>Array.from({length:e.sets},(_,n)=>({exerciseId:e.exerciseId,setNo:n+1,kg:20+Math.floor(i/7)*2.5,reps:10+i%3,rpe:7,done:true}))):[]});}
  }
  data.food=data.food.map(food=>({...food,useCount:data.mealEntry.filter(m=>m.foodId===food.id).length,favorite:['egg','suzme','yogurt'].includes(food.id)}));
  data.meta=[...data.meta.filter(m=>!['demoData','onboardingDone'].includes(m.key)),{key:'demoData',value:'true'},{key:'onboardingDone',value:'true'}];return data;
}
export async function createDemoPhotos(date=todayKey()){
  for(const offset of[-42,-21,0]){const canvas=document.createElement('canvas');canvas.width=600;canvas.height=800;const c=canvas.getContext('2d')!;c.fillStyle='#e5eee9';c.fillRect(0,0,600,800);c.fillStyle='#126c6a';c.beginPath();c.arc(300,150,57,0,Math.PI*2);c.fill();const width=155-dateDiff(date,shiftDate(date,offset))*.35;c.fillRect(300-width/2,220,width,280);c.fillRect(235,490,52,210);c.fillRect(315,490,52,210);c.font='20px sans-serif';c.fillText('KURGUSAL DEMO · '+shiftDate(date,offset),45,755);const blob=await new Promise<Blob>(resolve=>canvas.toBlob(b=>resolve(b!),'image/png'));await addImage(blob,shiftDate(date,offset),'progress','Ön');}
}
