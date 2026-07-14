
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const state = JSON.parse(localStorage.getItem('omm-state') || '{}');
const save = () => localStorage.setItem('omm-state', JSON.stringify(state));

const bindField = id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = state[id] || '';
  el.addEventListener('input', () => { state[id] = el.value; save(); });
};

['todayPark','top3','cooling','meals','dontLeave','liveTime','nextRide','currentWait','backupRide','returnTime','mobileOrder','coolingBreak','meetSpot','liveNotes','favoriteMemory'].forEach(bindField);

$$('nav button').forEach(btn => btn.onclick = () => {
  $$('nav button').forEach(b => b.classList.remove('active'));
  $$('.view').forEach(v => v.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(btn.dataset.view).classList.add('active');
});

const bagItems = [
'Phone','Portable charger','Charging cord','Wallet / ID','Neck ice packs','Mini fans','Gatorade / electrolytes',
'Refillable water bottle','Foldable stools','Sunglasses','Sunblock','Anti-chafing spray','Cooling towel',
'Motion sickness medicine','Band-Aids / moleskin','Ponchos','Wet wipes','Snacks'
];
const nightItems = [
'Charge phones','Charge portable chargers','Recharge mini fans','Freeze neck ice packs','Chill Gatorade',
'Refill water bottles','Restock park bag','Check tomorrow’s weather','Review tomorrow’s ride plan',
'Set alarms','Lay out clothes and shoes'
];

function renderChecklist(target, items, key){
  const box = document.getElementById(target);
  box.innerHTML = '';
  items.forEach((item,i)=>{
    const row=document.createElement('label'); row.className='check-item';
    const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=!!(state[key]||{})[i];
    cb.onchange=()=>{state[key]=state[key]||{};state[key][i]=cb.checked;save();}
    row.append(cb, document.createTextNode(item)); box.append(row);
  });
}
renderChecklist('bagList', bagItems, 'bag');
renderChecklist('nightList', nightItems, 'night');

fetch('data.json').then(r=>r.json()).then(data=>{
  const parks=data.parks;
  const select=$('#parkSelect');
  Object.keys(parks).forEach(p=>{const o=document.createElement('option');o.textContent=p;select.append(o);});
  select.value=state.selectedPark||'Magic Kingdom';
  select.onchange=()=>{state.selectedPark=select.value;save();renderRides();}
  $('#timeFilter').onchange=renderRides; $('#whoFilter').onchange=renderRides;

  function renderRides(){
    const list=$('#rideList'); list.innerHTML='';
    const time=$('#timeFilter').value, who=$('#whoFilter').value;
    parks[select.value].filter(r=>(!time||r[3]===time)&&(!who||r[2]===who)).forEach((r,idx)=>{
      const [land,name,group,best,risk]=r;
      const key=select.value+'|'+name;
      const rec=(state.rides||{})[key]||{};
      const card=document.createElement('div');
      card.className='card ride '+(best.startsWith('Morning')?'morning':best.startsWith('Midday')?'midday':'evening');
      card.innerHTML=`
        <div class="ride-top"><div><h3>${name}</h3><div class="meta">${land}</div></div><div>${group==='Everyone'?'⭐':group==='Some'?'👥':'🪑'}</div></div>
        <div><span class="badge">${best}</span><span class="badge risk-${risk.replaceAll(' ','-')}">Motion: ${risk}</span></div>
        <div class="row"><label>Current wait<input class="wait" placeholder="___ min" value="${rec.wait||''}"></label><label>Time ridden<input class="time" type="time" value="${rec.time||''}"></label></div>
        <label class="done"><input class="check" type="checkbox" ${rec.done?'checked':''}> Completed</label>
        <label>Notes<textarea class="notes">${rec.notes||''}</textarea></label>`;
      card.querySelector('.wait').oninput=e=>update(key,'wait',e.target.value);
      card.querySelector('.time').oninput=e=>update(key,'time',e.target.value);
      card.querySelector('.check').onchange=e=>update(key,'done',e.target.checked);
      card.querySelector('.notes').oninput=e=>update(key,'notes',e.target.value);
      list.append(card);
    })
  }
  function update(key,field,value){state.rides=state.rides||{};state.rides[key]=state.rides[key]||{};state.rides[key][field]=value;save();}
  renderRides();
});

function renderPhotos(){
  const list=$('#photoList'); list.innerHTML='';
  (state.photos||[]).forEach((p,i)=>{
    const row=document.createElement('div'); row.className='photo-row';
    row.innerHTML=`<input placeholder="Location / attraction" value="${p.place||''}"><input placeholder="Notes" value="${p.notes||''}"><button>✕</button>`;
    const inputs=row.querySelectorAll('input');
    inputs[0].oninput=e=>{state.photos[i].place=e.target.value;save();}
    inputs[1].oninput=e=>{state.photos[i].notes=e.target.value;save();}
    row.querySelector('button').onclick=()=>{state.photos.splice(i,1);save();renderPhotos();}
    list.append(row);
  })
}
$('#addPhoto').onclick=()=>{state.photos=state.photos||[];state.photos.push({place:'',notes:''});save();renderPhotos();}
renderPhotos();

let deferredPrompt;
window.addEventListener('beforeinstallprompt', e=>{
  e.preventDefault(); deferredPrompt=e; $('#installBtn').hidden=false;
});
$('#installBtn').onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt(); deferredPrompt=null; $('#installBtn').hidden=true;}};
if('serviceWorker' in navigator){navigator.serviceWorker.register('service-worker.js');}
