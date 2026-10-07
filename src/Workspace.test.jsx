import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {Simulate} from 'react-dom/test-utils';
import Workspace from './Workspace';

global.IS_REACT_ACT_ENVIRONMENT=true;
let host,root;
beforeEach(()=>{host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});
const button=text=>[...host.querySelectorAll('button')].find(b=>b.textContent===text);
const input=label=>[...host.querySelectorAll('label')].find(l=>l.firstChild.textContent===label)?.querySelector('input,select');
const click=async text=>{await act(async()=>button(text).click());};
const change=async(label,value)=>{await act(async()=>{const el=input(label);el.value=value;Simulate.change(el);});};
const submit=async()=>{await act(async()=>Simulate.submit(host.querySelector('form')));};

test('Project workspace sends connected sample, test and invoice records, and retains schedule handoff',async()=>{
  const project={id:7,code:'DEMO-7',name:'Synthetic workflow',client:'Sample client',address:'Test address',contact_name:'',contact_phone:'',lab:'Test Lab',notes:'',status:'Active'};
  const data={project,tasks:[],samples:[],invoices:[]};
  let invoice;
  const api={get:jest.fn(async path=>({data:path.includes('/invoices/')?invoice:data})),put:jest.fn(),post:jest.fn(async(path,body)=>{
    if(path.endsWith('/samples'))data.samples.push({...body,id:9,tests:[]});
    if(path.endsWith('/tests'))data.samples[0].tests.push({...body,id:10});
    if(path.endsWith('/invoices')){invoice={...body,id:11,status:'Draft',project,total_cents:2501,items:body.items.map((i,n)=>({...i,id:n,amount_cents:2501}))};data.invoices.push(invoice);return {data:invoice};}
    return {data:{id:9}};
  })};
  const onSchedule=jest.fn();
  await act(async()=>root.render(<Workspace api={api} projects={[{...project,stop_count:0,sample_count:0}]} refreshProjects={jest.fn()} revision={0} onSchedule={onSchedule}/>));
  await act(async()=>host.querySelector('.project-choice').click());
  await click('Schedule fieldwork');expect(onSchedule).toHaveBeenCalledWith(project);
  expect(host.querySelector('img').getAttribute('src')).toContain('ecotono');
  await click('Samples & Tests');await click('Add sample');await change('Sample ID','SYN-1');await submit();
  expect(api.post).toHaveBeenCalledWith('/api/projects/7/samples',expect.objectContaining({sample_id:'SYN-1',status:'Planned'}));
  await click('Add test');await change('Test / analyte','Lead');await change('Test status','Reported');await change('Result (including ND or < values)','ND');await submit();
  expect(api.post).toHaveBeenCalledWith('/api/projects/7/samples/9/tests',expect.objectContaining({name:'Lead',result:'ND',status:'Reported'}));
  expect(host.textContent).toContain('ND');
  await click('Invoices');await click('New invoice');await change('Invoice number','SYN-INV');await change('Line 1 description','Synthetic fieldwork');await change('Line 1 unit price ($)','25.01');await submit();
  expect(api.post).toHaveBeenCalledWith('/api/projects/7/invoices',expect.objectContaining({items:[{description:'Synthetic fieldwork',quantity:1,unit_price_cents:2501}]}));
  expect(host.textContent).toContain('Total $25.01');
  expect(host.textContent).toContain('does not collect a payment');
});

test('API rejection is shown and preserves the entered project for retry',async()=>{
  const api={post:jest.fn(async()=>{throw {response:{data:{error:'Project code already exists'}}};}),get:jest.fn()};
  await act(async()=>root.render(<Workspace api={api} projects={[]} refreshProjects={jest.fn()} revision={0} onSchedule={jest.fn()}/>));
  await click('New');await change('Project code','DUPLICATE');await change('Project name','Synthetic');await change('Client / company','Test client');await submit();
  expect(host.querySelector('[role="alert"]').textContent).toBe('Project code already exists');
  expect(input('Project code').value).toBe('DUPLICATE');expect(button('Create project').disabled).toBe(false);
});
