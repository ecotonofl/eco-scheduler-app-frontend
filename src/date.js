export const TIME_ZONE = 'America/New_York';
export const today = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', {timeZone:TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  return ['year','month','day'].map(type => parts.find(p => p.type === type).value).join('-');
};
export const clock = (date = new Date()) => date.toLocaleTimeString('en-US',{timeZone:TIME_ZONE,hour:'2-digit',minute:'2-digit'});
export const scheduledClock = time => {
  if(!time) return 'Not set';
  const [hour,minute]=time.split(':');
  return `${Number(hour)%12||12}:${minute} ${Number(hour)>=12?'PM':'AM'}`;
};
export const money = cents => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents / 100);
export function priceCents(value) {
  if(!/^\d+(\.\d{1,2})?$/.test(String(value))) throw new Error('Unit price must have no more than two decimal places.');
  const [dollars,decimal='']=String(value).split('.');
  const cents=Number(dollars)*100+Number(decimal.padEnd(2,'0'));
  if(!Number.isSafeInteger(cents)||cents>100000000)throw new Error('Unit price is too large.');
  return cents;
}
