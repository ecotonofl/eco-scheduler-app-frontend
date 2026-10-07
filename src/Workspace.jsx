import React,{useCallback,useEffect,useRef,useState} from 'react';
import Brand from './Brand';
import {today,scheduledClock,money,priceCents} from './date';

const message = error => error.response?.data?.error || error.message || 'Unable to save. Please try again.';
const projectStatuses=['Active','On Hold','Completed'];
const matrices=['Groundwater','Drinking Water','Wastewater','Soil','Surface Water','Reclaimed Water'];
const blankProject={code:'',name:'',client:'',address:'',contact_name:'',contact_phone:'',lab:'',status:'Active',notes:''};

function Field({label,...props}){return <label>{label}<input {...props}/></label>;}
function Select({label,options,...props}){return <label>{label}<select {...props}>{options.map(value=><option key={value}>{value}</option>)}</select></label>;}
function Form({onSubmit,children,button='Save',onCancel}){
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  return <form className="workspace-form" onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);setError('');try{await onSubmit();}catch(e){setError(message(e));}finally{setBusy(false);}}}>
    {children}{error&&<p className="form-error wide" role="alert">{error}</p>}<div className="actions wide"><button disabled={busy} type="submit">{busy?'Saving…':button}</button>{onCancel&&<button type="button" className="secondary" onClick={onCancel}>Cancel</button>}</div>
  </form>;
}
function ProjectForm({initial,onSave,onCancel}){
  const [form,setForm]=useState(initial||blankProject);
  const field=(name,label,extra={})=><Field label={label} value={form[name]} onChange={e=>setForm({...form,[name]:e.target.value})} {...extra}/>;
  return <Form button={initial?'Save project':'Create project'} onSubmit={()=>onSave(form)} onCancel={onCancel}>
    {field('code','Project code',{required:true,maxLength:80})}{field('name','Project name',{required:true,maxLength:200})}
    {field('client','Client / company',{required:true})}{field('address','Site address')}
    {field('contact_name','Contact name')}{field('contact_phone','Contact phone',{type:'tel'})}{field('lab','Preferred lab')}
    <Select label="Project status" value={form.status} options={projectStatuses} onChange={e=>setForm({...form,status:e.target.value})}/>
    <label className="wide">Project notes<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
  </Form>;
}
function SampleForm({initial,lab,onSave,onCancel}){
  const [form,setForm]=useState(initial||{sample_id:'',matrix:'Groundwater',status:'Planned',collected_date:'',collected_time:'',lab:lab||'',coc_link:'',notes:''});
  const field=(name,label,extra={})=><Field label={label} value={form[name]} onChange={e=>setForm({...form,[name]:e.target.value})} {...extra}/>;
  return <Form button={initial?'Save sample':'Add sample'} onSubmit={()=>onSave(form)} onCancel={onCancel}>
    {field('sample_id','Sample ID',{required:true,maxLength:120})}<Select label="Matrix" options={matrices} value={form.matrix} onChange={e=>setForm({...form,matrix:e.target.value})}/>
    <Select label="Sample status" options={['Planned','Collected','At Lab','Reported']} value={form.status} onChange={e=>setForm({...form,status:e.target.value})}/>{field('lab','Laboratory')}
    <div className="date-time wide">{field('collected_date','Collection date',{type:'date',required:form.status!=='Planned'})}{field('collected_time','Collection time (Florida)',{type:'time',required:form.status!=='Planned'})}</div>
    {field('coc_link','COC link',{type:'url'})}<label>Notes<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
  </Form>;
}
function TestForm({initial,onSave,onCancel}){
  const [form,setForm]=useState(initial||{name:'',method:'',status:'Requested',result:'',units:'',qualifier:''});
  return <Form button={initial?'Save test':'Add test'} onSubmit={()=>onSave(form)} onCancel={onCancel}>
    <Field label="Test / analyte" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><Field label="Method" value={form.method} onChange={e=>setForm({...form,method:e.target.value})}/>
    <Select label="Test status" options={['Requested','In Progress','Reported']} value={form.status} onChange={e=>setForm({...form,status:e.target.value})}/>
    <Field label="Result (including ND or < values)" required={form.status==='Reported'} value={form.result} onChange={e=>setForm({...form,result:e.target.value})}/>
    <Field label="Units" value={form.units} onChange={e=>setForm({...form,units:e.target.value})}/><Field label="Qualifier" value={form.qualifier} onChange={e=>setForm({...form,qualifier:e.target.value})}/>
  </Form>;
}
function SampleCard({sample,saveSample,saveTest}){
  const [editing,setEditing]=useState(false),[testForm,setTestForm]=useState(null);
  return <article className="sample-card"><div className="section-heading"><div><h3>{sample.sample_id}</h3><span className="muted">{sample.matrix} · {sample.lab||'Lab not set'}</span></div><span className="pill">{sample.status}</span></div>
    {sample.collected_date&&<p>Collected {sample.collected_date} at {scheduledClock(sample.collected_time)} (Florida)</p>}
    {sample.coc_link&&<a href={sample.coc_link} target="_blank" rel="noreferrer">Open chain of custody</a>}{sample.notes&&<p>{sample.notes}</p>}
    <div className="actions"><button className="secondary" onClick={()=>setEditing(!editing)}>Edit sample</button><button className="secondary" onClick={()=>setTestForm({})}>Add test</button></div>
    {editing&&<SampleForm initial={sample} onCancel={()=>setEditing(false)} onSave={async values=>{await saveSample(sample.id,values);setEditing(false);}}/>}
    <div className="tableWrap"><table><caption className="sr-only">Tests for {sample.sample_id}</caption><thead><tr><th>Test</th><th>Method</th><th>Status</th><th>Result</th><th>Units</th><th>Qualifier</th><th/></tr></thead><tbody>{sample.tests.map(test=><tr key={test.id}><td>{test.name}</td><td>{test.method||'—'}</td><td>{test.status}</td><td>{test.result||'—'}</td><td>{test.units||'—'}</td><td>{test.qualifier||'—'}</td><td><button className="secondary" onClick={()=>setTestForm(test)}>Edit test</button></td></tr>)}</tbody></table></div>
    {!sample.tests.length&&<p className="muted">No tests requested for this sample.</p>}
    {testForm&&<TestForm key={testForm.id||'new'} initial={testForm.id?testForm:null} onCancel={()=>setTestForm(null)} onSave={async values=>{await saveTest(sample.id,testForm.id,values);setTestForm(null);}}/>}
  </article>;
}
const newItem=()=>({description:'',quantity:'1',price:'0.00'});
function InvoiceForm({onSave,onCancel}){
  const [form,setForm]=useState({number:'',issued_date:today(),due_date:today(),notes:''}),[items,setItems]=useState([newItem()]);
  const changeItem=(index,key,value)=>setItems(items.map((item,i)=>i===index?{...item,[key]:value}:item));
  let total=null;try{total=items.reduce((sum,item)=>sum+Math.round(Number(item.quantity)*priceCents(item.price)),0);}catch{}
  return <Form button="Create draft invoice" onCancel={onCancel} onSubmit={()=>onSave({...form,items:items.map(item=>({description:item.description,quantity:Number(item.quantity),unit_price_cents:priceCents(item.price)}))})}>
    <Field label="Invoice number" required value={form.number} maxLength={80} onChange={e=>setForm({...form,number:e.target.value})}/>
    <div className="date-time"><Field label="Issue date" type="date" required value={form.issued_date} onChange={e=>setForm({...form,issued_date:e.target.value})}/><Field label="Due date" type="date" required min={form.issued_date} value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})}/></div>
    <div className="wide invoice-lines">{items.map((item,index)=><div className="invoice-line" key={index}>
      <Field label={`Line ${index+1} description`} required value={item.description} onChange={e=>changeItem(index,'description',e.target.value)}/>
      <Field label={`Line ${index+1} quantity`} type="number" min="0.001" max="100000" step="0.001" required value={item.quantity} onChange={e=>changeItem(index,'quantity',e.target.value)}/>
      <Field label={`Line ${index+1} unit price ($)`} type="number" min="0" max="1000000" step="0.01" required value={item.price} onChange={e=>changeItem(index,'price',e.target.value)}/>
      <button type="button" className="secondary" disabled={items.length===1} onClick={()=>setItems(items.filter((_,i)=>i!==index))} aria-label={`Remove line ${index+1}`}>Remove</button>
    </div>)}<button type="button" className="secondary" disabled={items.length>=100} onClick={()=>setItems([...items,newItem()])}>Add line</button><p><b>Preview total: {total===null?'Enter valid prices':money(total)}</b></p></div>
    <label className="wide">Invoice notes<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
  </Form>;
}
function InvoiceDetails({invoice,changeStatus,close}){
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const transitions={Draft:['Sent','Void'],Sent:['Paid','Void'],Paid:[],Void:[]};
  return <section className="invoice-detail"><div className="section-heading"><div><h3>Invoice {invoice.number}</h3><p>{invoice.project.client} · {invoice.project.code}</p></div><span className="pill">{invoice.status}</span></div>
    <p>Issued {invoice.issued_date} · Due {invoice.due_date}</p><div className="tableWrap"><table><thead><tr><th>Description</th><th>Quantity</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>{invoice.items.map(item=><tr key={item.id}><td>{item.description}</td><td>{item.quantity}</td><td>{money(item.unit_price_cents)}</td><td>{money(item.amount_cents)}</td></tr>)}</tbody></table></div>
    <p className="invoice-total">Total {money(invoice.total_cents)}</p>{invoice.notes&&<p>{invoice.notes}</p>}
    <p className="muted">Status tracking only. Marking Sent does not email an invoice; marking Paid does not collect a payment.</p>{error&&<p role="alert" className="form-error">{error}</p>}
    <div className="actions">{transitions[invoice.status].map(status=><button disabled={busy} key={status} onClick={async()=>{setBusy(true);setError('');try{await changeStatus(status);}catch(e){setError(message(e));}finally{setBusy(false);}}}>Mark {status}</button>)}<button className="secondary" onClick={close}>Close invoice</button></div>
  </section>;
}
export default function Workspace({api,projects,refreshProjects,revision,onSchedule}){
  const [selected,setSelected]=useState(null),[data,setData]=useState(null),[tab,setTab]=useState('Overview'),[create,setCreate]=useState(false),[edit,setEdit]=useState(false),[addSample,setAddSample]=useState(false),[addInvoice,setAddInvoice]=useState(false),[invoice,setInvoice]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(false);
  const selectedRef=useRef(selected);selectedRef.current=selected;
  const load=useCallback(async()=>{if(!selected)return;const r=await api.get(`/api/projects/${selected}`);if(selectedRef.current===selected)setData(r.data);},[api,selected]);
  useEffect(()=>{let active=true;setData(null);setError('');setInvoice(null);setEdit(false);setAddSample(false);setAddInvoice(false);setTab('Overview');if(!selected)return;setLoading(true);api.get(`/api/projects/${selected}`).then(r=>{if(active)setData(r.data);}).catch(e=>{if(active)setError(message(e));}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[api,selected]);
  useEffect(()=>{if(!selected)return;let active=true;api.get(`/api/projects/${selected}`).then(r=>{if(active)setData(r.data);}).catch(e=>{if(active)setError(message(e));});return()=>{active=false;};},[api,selected,revision]);
  const save=async action=>{await action();await Promise.all([load(),refreshProjects()]);};
  const openInvoice=async id=>{setError('');try{const r=await api.get(`/api/projects/${selected}/invoices/${id}`);if(selectedRef.current===selected)setInvoice(r.data);}catch(e){if(selectedRef.current===selected)setError(message(e));}};
  const project=data?.project;
  return <main className="workspace"><div className="hero"><div><Brand/><h1>Project Workspace</h1><p>Every sample. Every project. Connected.</p></div><div className="stats"><b>{projects.length}</b><small>Projects</small></div></div>
    <div className="workspace-layout"><aside className="project-list panel"><div className="section-heading"><h2>Projects</h2><button onClick={()=>setCreate(true)}>New</button></div>
      {!projects.length&&<p className="muted">Create a project to connect its stops, samples and invoices.</p>}
      {projects.map(p=><button className={`project-choice ${selected===p.id?'selected':''}`} key={p.id} onClick={()=>setSelected(p.id)}><span className="project-code">{p.code}</span><b>{p.name}</b><span>{p.client}</span><span className="muted">{p.status} · {p.sample_count} samples · {p.stop_count} stops</span></button>)}
    </aside><div className="workspace-content">
      {create&&<section className="panel"><h2>New project</h2><ProjectForm onCancel={()=>setCreate(false)} onSave={async values=>{const r=await api.post('/api/projects',values);await refreshProjects();setSelected(r.data.id);setCreate(false);}}/></section>}
      {error&&<p role="alert" className="form-error panel">{error}</p>}{loading&&<p role="status">Loading project…</p>}
      {!selected&&!create&&<section className="panel empty">Select a project or create your first one.</section>}
      {project&&<><section className="panel"><div className="section-heading"><div><p className="project-code">{project.code}</p><h2>{project.name}</h2><p>{project.client} · {project.status}</p></div><button className="secondary" onClick={()=>setEdit(!edit)}>Edit project</button></div>
        {edit&&<ProjectForm key={project.id} initial={project} onCancel={()=>setEdit(false)} onSave={async values=>{await save(()=>api.put(`/api/projects/${selected}`,values));setEdit(false);}}/>}
        <div className="workspace-tabs" role="tablist" aria-label="Project sections">{['Overview','Schedule','Samples & Tests','Invoices'].map(value=><button role="tab" aria-selected={tab===value} className={tab===value?'active':''} key={value} onClick={()=>{setTab(value);setInvoice(null);}}>{value}</button>)}</div>
      </section>
      {tab==='Overview'&&<section className="panel"><div className="metric-grid"><div><b>{data.tasks.length}</b><span>Field stops</span></div><div><b>{data.samples.length}</b><span>Samples</span></div><div><b>{data.samples.reduce((n,s)=>n+s.tests.length,0)}</b><span>Tests</span></div><div><b>{money(data.invoices.filter(i=>['Draft','Sent'].includes(i.status)).reduce((n,i)=>n+i.total_cents,0))}</b><span>Open invoices</span></div></div>
        <dl className="project-facts"><dt>Site</dt><dd>{project.address||'Not set'}</dd><dt>Contact</dt><dd>{project.contact_name||'Not set'} {project.contact_phone}</dd><dt>Preferred lab</dt><dd>{project.lab||'Not set'}</dd><dt>Notes</dt><dd>{project.notes||'No notes yet.'}</dd></dl><div className="actions"><button onClick={()=>onSchedule(project)}>Schedule fieldwork</button><button className="secondary" onClick={()=>{setTab('Samples & Tests');setAddSample(true);}}>Add sample</button></div>
      </section>}
      {tab==='Schedule'&&<section className="panel"><div className="section-heading"><h3>Project fieldwork</h3><button onClick={()=>onSchedule(project)}>Schedule stop</button></div>{data.tasks.length?<div className="tableWrap"><table><thead><tr><th>Stop</th><th>Date / time (Florida)</th><th>Driver</th><th>Work</th><th>Status</th></tr></thead><tbody>{data.tasks.map(t=><tr key={t.id}><td>{t.stop_number}</td><td>{t.scheduled_date}<br/>{scheduledClock(t.scheduled_time)}</td><td>{t.driver||'Unassigned'}</td><td>{t.work_type}</td><td>{t.status}</td></tr>)}</tbody></table></div>:<p className="muted">No stops linked to this project yet.</p>}</section>}
      {tab==='Samples & Tests'&&<section className="panel"><div className="section-heading"><h3>Samples & Tests</h3><button onClick={()=>setAddSample(true)}>Add sample</button></div>{addSample&&<SampleForm lab={project.lab} onCancel={()=>setAddSample(false)} onSave={async values=>{await save(()=>api.post(`/api/projects/${selected}/samples`,values));setAddSample(false);}}/>}
        {!data.samples.length&&<p className="muted">Plan samples, request tests and track laboratory results here.</p>}{data.samples.map(s=><SampleCard key={s.id} sample={s} saveSample={(sampleId,values)=>save(()=>api.put(`/api/projects/${selected}/samples/${sampleId}`,values))} saveTest={(sampleId,testId,values)=>save(()=>testId?api.put(`/api/projects/${selected}/samples/${sampleId}/tests/${testId}`,values):api.post(`/api/projects/${selected}/samples/${sampleId}/tests`,values))}/>)}
        <p className="muted">Results are entered records; regulatory compliance is not calculated.</p></section>}
      {tab==='Invoices'&&<section className="panel"><div className="section-heading"><h3>Project invoices</h3><button onClick={()=>setAddInvoice(true)}>New invoice</button></div>{addInvoice&&<InvoiceForm onCancel={()=>setAddInvoice(false)} onSave={async values=>{const r=await api.post(`/api/projects/${selected}/invoices`,values);await Promise.all([load(),refreshProjects()]);setAddInvoice(false);await openInvoice(r.data.id);}}/>}
        {!data.invoices.length&&<p className="muted">Create a draft invoice using this project's client details.</p>}{data.invoices.map(i=><button className="invoice-choice" key={i.id} onClick={()=>openInvoice(i.id)}><b>{i.number}</b><span>{i.status} · Due {i.due_date}</span><b>{money(i.total_cents)}</b></button>)}
        {invoice&&<InvoiceDetails key={invoice.id} invoice={invoice} close={()=>setInvoice(null)} changeStatus={async status=>{await save(()=>api.put(`/api/projects/${selected}/invoices/${invoice.id}/status`,{status}));await openInvoice(invoice.id);}}/>}
      </section>}</>}
    </div></div></main>;
}
