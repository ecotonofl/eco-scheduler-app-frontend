import {today,clock,priceCents,scheduledClock} from './date';

test('Florida midnight and daylight saving boundaries are independent of device timezone',()=>{
  expect(today(new Date('2026-10-07T03:59:59Z'))).toBe('2026-10-06');
  expect(today(new Date('2026-10-07T04:00:00Z'))).toBe('2026-10-07');
  expect(clock(new Date('2026-01-07T15:30:00Z'))).toBe('10:30 AM');
  expect(clock(new Date('2026-07-07T14:30:00Z'))).toBe('10:30 AM');
  expect(scheduledClock('00:05')).toBe('12:05 AM');
  expect(scheduledClock('14:30')).toBe('2:30 PM');
});
test('Currency input preserves exact cents and rejects unsupported precision',()=>{
  expect(priceCents('10.01')).toBe(1001);
  expect(priceCents('0.29')).toBe(29);
  expect(priceCents('1.2')).toBe(120);
  for(const value of ['-1','1.001','NaN','1e3','1000001'])expect(()=>priceCents(value)).toThrow();
});
