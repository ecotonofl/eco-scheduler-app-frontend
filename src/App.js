import React,{useEffect,useState} from "react";
import axios from "axios";
import {io} from "socket.io-client";
import "./styles.css";

const API=process.env.REACT_APP_API_URL||"http://localhost:4000";
const workTypes=["Line Clearance","Ground Water Sampling","Soil Grab","Soil Composite","Tap Water Grab","Waste Water Composite","Waste Water Grab","Drinking Water Grab","Deep Wells Grab","Surface Water Grab"];
const statuses=["Pending","In Progress","Completed","Canceled","Rescheduled"];
const TIME_ZONE="America/New_York";
const today=(date=new Date())=>{
 const parts=new Intl.DateTimeFormat("en-US",{timeZone:TIME_ZONE,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date);
 const part=type=>parts.find(p=>p.type===type).value;
 return `${part("year")}-${part("month")}-${part("day")}`;
};
const clock=(date=new Date())=>date.toLocaleTimeString("en-US",{timeZone:TIME_ZONE,hour:"2-digit",minute:"2-digit"});

function Brand(){
 return <div className="brand"><img className="company-logo" src={`${process.env.PUBLIC_URL}/ecotonofl-logo.jpg`} alt="EcotonoFL" width="104" height="78"/><div>ECO<span>GO</span></div></div>;
}

function Driver({tasks,refresh}){
 const update=async(t,patch)=>{await axios.put(`${API}/api/tasks/${t.id}`,patch);refresh()};
 return <main><div className="hero"><div><Brand/><h1>Driver Route</h1><p>Another beautiful day in paradise.</p></div><div className="clock">{clock()}<small>{today()}</small></div></div>
 <div className="cards">{tasks.length?tasks.map(t=><article className="task" key={t.id}><div className="taskTop"><b>STOP {t.stop_number}</b><span className={"pill "+t.status.replaceAll(" ","").toLowerCase()}>{t.status}</span></div><h2>{t.company}</h2><div className="work">{t.work_type}</div><a href={`https://maps.google.com/?q=${encodeURIComponent(t.address)}`} target="_blank" rel="noreferrer">{t.address}</a><div className="grid"><p><b>Contact</b><br/>{t.contact_name||"—"} {t.contact_phone&&<a href={"tel:"+t.contact_phone}>{t.contact_phone}</a>}</p><p><b>Lab</b><br/>{t.lab||"—"}</p></div>{t.instructions&&<div className="note">{t.instructions}</div>}<div className="actions">
 {t.status!=="In Progress"&&t.status!=="Completed"&&<button onClick={()=>update(t,{status:"In Progress",arrival_time:clock()})}>Arrived / Start</button>}
 {t.status==="In Progress"&&<button className="complete" onClick={()=>update(t,{status:"Completed",leaving_time:clock()})}>Complete Stop</button>}
 {t.coc_link&&<a className="button secondary" href={t.coc_link} target="_blank" rel="noreferrer">Open COC</a>}</div><div className="times">Arrival: {t.arrival_time||"—"} · Leaving: {t.leaving_time||"—"} · Miles: {t.miles||0}</div></article>):<div className="empty">No stops scheduled for today.</div>}</div></main>
}

function Supervisor({tasks,refresh}){
 const [form,setForm]=useState({stop_number:tasks.length+1,work_type:"Ground Water Sampling",company:"",address:"",contact_name:"",contact_phone:"",instructions:"",lab:"",coc_link:"",driver:"Driver 1",scheduled_date:today(),miles:0});
 const submit=async e=>{e.preventDefault();await axios.post(API+"/api/tasks",form);setForm({...form,stop_number:Number(form.stop_number)+1,company:"",address:"",contact_name:"",contact_phone:"",instructions:"",coc_link:"",miles:0});refresh()};
 return <main><div className="hero"><div><Brand/><h1>Supervisor Dashboard</h1><p>Schedule, dispatch and monitor field work.</p></div><div className="stats"><b>{tasks.length}</b><small>Stops Today</small></div></div>
 <section className="panel"><h2>Add Stop</h2><form onSubmit={submit} className="form">
 <input type="number" value={form.stop_number} onChange={e=>setForm({...form,stop_number:e.target.value})} placeholder="Stop #"/>
 <select value={form.work_type} onChange={e=>setForm({...form,work_type:e.target.value})}>{workTypes.map(x=><option key={x}>{x}</option>)}</select>
 <input required value={form.company} onChange={e=>setForm({...form,company:e.target.value})} placeholder="Company"/>
 <input required value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Full address"/>
 <input value={form.contact_name} onChange={e=>setForm({...form,contact_name:e.target.value})} placeholder="Contact name"/>
 <input value={form.contact_phone} onChange={e=>setForm({...form,contact_phone:e.target.value})} placeholder="Contact phone"/>
 <input value={form.lab} onChange={e=>setForm({...form,lab:e.target.value})} placeholder="Lab"/>
 <input value={form.driver} onChange={e=>setForm({...form,driver:e.target.value})} placeholder="Driver"/>
 <input type="date" value={form.scheduled_date} onChange={e=>setForm({...form,scheduled_date:e.target.value})}/>
 <input type="number" step="0.1" value={form.miles} onChange={e=>setForm({...form,miles:e.target.value})} placeholder="Miles"/>
 <input className="wide" value={form.coc_link} onChange={e=>setForm({...form,coc_link:e.target.value})} placeholder="COC link"/>
 <textarea className="wide" value={form.instructions} onChange={e=>setForm({...form,instructions:e.target.value})} placeholder="Special instructions"/>
 <button className="wide" type="submit">Schedule Stop</button></form></section>
 <section className="panel"><h2>Today's Operations</h2><div className="tableWrap"><table><thead><tr><th>#</th><th>Status</th><th>Company</th><th>Work</th><th>Driver</th><th>Arrival</th><th>Leaving</th></tr></thead><tbody>{tasks.map(t=><tr key={t.id}><td>{t.stop_number}</td><td><select value={t.status} onChange={async e=>{await axios.put(`${API}/api/tasks/${t.id}`,{status:e.target.value});refresh()}}>{statuses.map(s=><option key={s}>{s}</option>)}</select></td><td>{t.company}</td><td>{t.work_type}</td><td>{t.driver}</td><td>{t.arrival_time||"—"}</td><td>{t.leaving_time||"—"}</td></tr>)}</tbody></table></div></section></main>
}

export default function App(){
 const [mode,setMode]=useState("driver"),[tasks,setTasks]=useState([]),[error,setError]=useState("");
 const refresh=async()=>{try{const r=await axios.get(API+"/api/tasks",{params:{date:today()}});setTasks(r.data);setError("")}catch(e){setError("Backend is not reachable. Set REACT_APP_API_URL to the deployed EcoGo API.")}};
 useEffect(()=>{refresh();const s=io(API);s.on("taskUpdated",refresh);s.on("taskDeleted",refresh);return()=>s.disconnect()},[]);
 return <><nav><button className={mode==="driver"?"active":""} onClick={()=>setMode("driver")}>Driver</button><button className={mode==="supervisor"?"active":""} onClick={()=>setMode("supervisor")}>Supervisor</button></nav>{error&&<div className="error">{error}</div>}{mode==="driver"?<Driver tasks={tasks} refresh={refresh}/>:<Supervisor tasks={tasks} refresh={refresh}/>}</>;
}
