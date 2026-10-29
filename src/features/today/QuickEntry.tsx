import { useState } from 'react';
import { useStore } from '../../app/Store';
import { emptyDay } from '../../domain/types';
import { Button, Sheet } from '../../ui';

export function QuickEntry({kind,onClose}:{kind:'weight'|'note';onClose:()=>void}){const{data,date,updateDay}=useStore();const day=data.dayLog.find(d=>d.date===date)||emptyDay(date);const[weight,setWeight]=useState(day.weight?.toString()||'');const[note,setNote]=useState(day.note||'');return <Sheet title={kind==='weight'?'Tartı kaydı':'Bugünden bir not'} onClose={onClose}>{kind==='weight'?<label className="field">Kilo (kg)<input autoFocus type="number" inputMode="decimal" min={30} max={400} step={.1} value={weight} onChange={e=>setWeight(e.target.value)}/></label>:<label className="field">Notun<textarea autoFocus rows={4} value={note} onChange={e=>setNote(e.target.value)}/></label>}<Button disabled={kind==='weight'&&(+weight<30||+weight>400)} onClick={()=>{updateDay(kind==='weight'?{weight:+weight}:{note});onClose();}}>Kaydet</Button></Sheet>;}
