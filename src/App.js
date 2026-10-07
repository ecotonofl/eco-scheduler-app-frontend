import React,{useCallback,useEffect,useState} from "react";
import axios from "axios";
import {io} from "socket.io-client";
import "./styles.css";
import Workspace from "./Workspace";
import Brand from "./Brand";
import {today,clock,scheduledClock} from "./date";

const API=process.env.REACT_APP_API_URL||"http://localhost:4000";
const workTypes=["Line Clearance","Ground Water Sampling","Soil Grab","Soil Composite","Tap Water Grab","Waste Water Composite","Waste Water Grab","Drinking Water Grab","Deep Wells Grab","Surface Water Grab"];
const statuses=["Pending","In Progress","Completed","Canceled","Rescheduled"];
function Driver({tasks,refresh}){
 const [updateError,setUpdateError]=useState("");
 const update=async(t,patch)=>{setUpdateError("");try{await axios.put(`${API}/api/tasks/${t.id}`,patch);await refresh();}catch(e){setUpdateError(e.response?.data?.error||"Unable to update stop. Please try again.");}};
 return <main><div className="hero"><div><Brand/><h1>Driver Route</h1><p>Another beautiful day in paradise.</p></div><div className="clock">{clock()}<small>{today()}</small></div></div>
 {updateError&&<p role="alert" className="form-error">{updateError}</p>}<div className="cards">{tasks.length?tasks.map(t=><article className="task" key={t.id}><div className="taskTop"><b>STOP {t.stop_number}</b><span className={"pill "+t.status.replaceAll(" ","").toLowerCase()}>{t.status}</span></div><h2>{t.company}</h2>{t.project_code&&<p className="project-code">{t.project_code} · {t.project_name}</p>}<div className="work">{t.work_type}</div><p><b>Scheduled:</b> {scheduledClock(t.scheduled_time)} {t.scheduled_time&&"(Florida time)"}</p><a href={`https://maps.google.com/?q=${encodeURIComponent(t.address)}`} target="_blank" rel="noreferrer">{t.address}</a><div className="grid"><p><b>Contact</b><br/>{t.contact_name||"—"} {t.contact_phone&&<a href={"tel:"+t.contact_phone}>{t.contact_phone}</a>}</p><p><b>Lab</b><br/>{t.lab||"—"}</p></div>{t.instructions&&<div className="note">{t.instructions}</div>}<div className="actions">
 {t.status!=="In Progress"&&t.status!=="Completed"&&<button onClick={()=>update(t,{status:"In Progress",arrival_time:clock()})}>Arrived / Start</button>}
 {t.status==="In Progress"&&<button className="complete" onClick={()=>update(t,{status:"Completed",leaving_time:clock()})}>Complete Stop</button>}
 {t.coc_link&&<a className="button secondary" href={t.coc_link} target="_blank" rel="noreferrer">Open COC</a>}</div><div className="times">Arrival: {t.arrival_time||"—"} · Leaving: {t.leaving_time||"—"} · Miles: {t.miles||0}</div></article>):<div className="empty">No stops scheduled for today.</div>}</div></main>
}

function Supervisor({tasks,refresh,projects,preset,viewDate,setViewDate}){
 const [form,setForm]=useState({stop_number:tasks.length+1,work_type:"Ground Water Sampling",company:"",address:"",contact_name:"",contact_phone:"",instructions:"",lab:"",coc_link:"",driver:"Driver 1",scheduled_date:viewDate,scheduled_time:"",project_id:"",miles:0});
 const [busy,setBusy]=useState(false),[saveError,setSaveError]=useState("");
 const selectProject=useCallback(p=>setForm(f=>({...f,project_id:p?.id||"",company:p?.client||"",address:p?.address||"",contact_name:p?.contact_name||"",contact_phone:p?.contact_phone||"",lab:p?.lab||""})),[]);
 useEffect(()=>{if(preset)selectProject(preset);},[preset,selectProject]);
 useEffect(()=>{setForm(f=>({...f,scheduled_date:viewDate}));},[viewDate]);
 const submit=async e=>{e.preventDefault();if(busy)return;setBusy(true);setSaveError("");try{await axios.post(API+"/api/tasks",form);setForm({...form,stop_number:Number(form.stop_number)+1,instructions:"",coc_link:"",miles:0});setViewDate(form.scheduled_date);await refresh();}catch(error){setSaveError(error.response?.data?.error||"Unable to save stop. Please try again.");}finally{setBusy(false);}};
 return <main><div className="hero"><div><Brand/><h1>Supervisor Dashboard</h1><p>Schedule, dispatch and monitor field work.</p></div><div className="stats"><b>{tasks.length}</b><small>Stops on {viewDate}</small></div></div>
 <section className="panel"><h2>Add Stop</h2><form onSubmit={submit} className="form">
 <label className="wide">Project<select value={form.project_id} onChange={e=>selectProject(projects.find(p=>p.id===Number(e.target.value)))}><option value="">Standalone stop</option>{projects.map(p=><option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}</select></label>
 <input type="number" value={form.stop_number} onChange={e=>setForm({...form,stop_number:e.target.value})} placeholder="Stop #"/>
 <select value={form.work_type} onChange={e=>setForm({...form,work_type:e.target.value})}>{workTypes.map(x=><option key={x}>{x}</option>)}</select>
 <input required value={form.company} onChange={e=>setForm({...form,company:e.target.value})} placeholder="Company"/>
 <input required value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Full address"/>
 <input value={form.contact_name} onChange={e=>setForm({...form,contact_name:e.target.value})} placeholder="Contact name"/>
 <input value={form.contact_phone} onChange={e=>setForm({...form,contact_phone:e.target.value})} placeholder="Contact phone"/>
 <input value={form.lab} onChange={e=>setForm({...form,lab:e.target.value})} placeholder="Lab"/>
 <input value={form.driver} onChange={e=>setForm({...form,driver:e.target.value})} placeholder="Driver"/>
 <div className="wide" style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10}}><label style={{display:"grid",gap:6,minWidth:0}}>Scheduled date<input type="date" required value={form.scheduled_date} onChange={e=>setForm({...form,scheduled_date:e.target.value})}/></label>
 <label style={{display:"grid",gap:6,minWidth:0}}>Scheduled time (Florida)<input type="time" value={form.scheduled_time} onChange={e=>setForm({...form,scheduled_time:e.target.value})}/></label></div>
 <input type="number" step="0.1" value={form.miles} onChange={e=>setForm({...form,miles:e.target.value})} placeholder="Miles"/>
 <input className="wide" value={form.coc_link} onChange={e=>setForm({...form,coc_link:e.target.value})} placeholder="COC link"/>
 <textarea className="wide" value={form.instructions} onChange={e=>setForm({...form,instructions:e.target.value})} placeholder="Special instructions"/>
 {saveError&&<p className="wide form-error" role="alert">{saveError}</p>}<button className="wide" type="submit" disabled={busy}>{busy?"Saving…":"Schedule Stop"}</button></form></section>
 <section className="panel"><div className="section-heading"><h2>Scheduled Operations</h2><label>View date<input aria-label="View schedule date" type="date" value={viewDate} onChange={e=>{if(e.target.value)setViewDate(e.target.value);}}/></label></div><div className="tableWrap"><table><thead><tr><th>#</th><th>Status</th><th>Company</th><th>Work</th><th>Driver</th><th>Scheduled</th><th>Arrival</th><th>Leaving</th></tr></thead><tbody>{tasks.map(t=><tr key={t.id}><td>{t.stop_number}</td><td><select value={t.status} onChange={async e=>{try{await axios.put(`${API}/api/tasks/${t.id}`,{status:e.target.value});await refresh();}catch(error){setSaveError(error.response?.data?.error||"Unable to update stop.");}}}>{statuses.map(s=><option key={s}>{s}</option>)}</select></td><td>{t.company}</td><td>{t.work_type}</td><td>{t.driver}</td><td>{scheduledClock(t.scheduled_time)}</td><td>{t.arrival_time||"—"}</td><td>{t.leaving_time||"—"}</td></tr>)}</tbody></table></div></section></main>
}

const workspaceApi=axios.create({baseURL:API});
export default function App(){
 const [mode,setMode]=useState("driver"),[tasks,setTasks]=useState([]),[error,setError]=useState(""),[projects,setProjects]=useState([]),[revision,setRevision]=useState(0),[preset,setPreset]=useState(null),[viewDate,setViewDate]=useState(today()),[now,setNow]=useState(new Date());
 const day=today(now),requestDate=mode==="supervisor"?viewDate:day;
 const refreshProjects=useCallback(async()=>{const r=await workspaceApi.get("/api/projects");setProjects(r.data);},[]);
 const refresh=useCallback(async()=>{try{const r=await axios.get(API+"/api/tasks",{params:{date:requestDate}});setTasks(r.data);setError("");}catch(e){setError("Unable to load stops. Check the API connection and try again.");}},[requestDate]);
 useEffect(()=>{let active=true;setTasks([]);axios.get(API+"/api/tasks",{params:{date:requestDate}}).then(r=>{if(active){setTasks(r.data);setError("");}}).catch(()=>{if(active)setError("Unable to load stops. Check the API connection and try again.");});return()=>{active=false;};},[requestDate]);
 useEffect(()=>{refreshProjects().catch(()=>setError("Unable to load the project workspace. Its companion API must be installed."));},[refreshProjects]);
 useEffect(()=>{const s=io(API);const change=()=>{refresh();refreshProjects().catch(()=>{});setRevision(r=>r+1);};s.on("taskUpdated",change);s.on("taskDeleted",change);s.on("workspaceUpdated",change);return()=>s.disconnect();},[refresh,refreshProjects]);
 useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),30000);return()=>clearInterval(timer);},[]);
 const scheduleProject=p=>{setPreset(p);setMode("supervisor");setViewDate(day);};
 return <div className="app-shell"><aside className="app-sidebar"><Brand/><p className="sidebar-caption">Environmental operations</p><nav aria-label="Main navigation">{[["driver","Driver"],["supervisor","Supervisor"],["projects","Projects"]].map(([value,label])=><button key={value} className={mode===value?"active":""} onClick={()=>setMode(value)}><svg className="nav-symbol" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={value==="driver"?"M3 5h11v12H3z M14 9h4l3 4v4h-7 M6 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4 M18 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4":value==="supervisor"?"M4 5h16v15H4z M8 3v4 M16 3v4 M4 10h16 M8 14h2 M14 14h2":"M3 6h7l2 3h9v11H3z M3 6V4h7l2 2"}/></svg>{label}</button>)}</nav><div className="sidebar-note"><b>Every project connected.</b><p>Schedule fieldwork.<br/>Track samples.<br/>Keep work moving.</p></div></aside><div className="app-content">{error&&<div className="error" role="alert">{error}</div>}{mode==="driver"?<Driver tasks={tasks} refresh={refresh}/>:mode==="supervisor"?<Supervisor tasks={tasks} refresh={refresh} projects={projects} preset={preset} viewDate={viewDate} setViewDate={setViewDate}/>:<Workspace api={workspaceApi} projects={projects} refreshProjects={refreshProjects} revision={revision} onSchedule={scheduleProject}/>}</div></div>;
}
