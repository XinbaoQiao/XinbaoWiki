import {test,expect} from '@playwright/test';

for(const width of [1440,390]) test(`measured disclosure opening, closing and reversal at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1000});
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto('/',{waitUntil:'networkidle'});
 const news=page.locator('#portal-news');
 const initialWidth=(await news.boundingBox()).width;
 const sample=async()=>news.evaluate(async el=>{
  const frames=[];const start=performance.now();
  el.querySelector(':scope > summary').click();
  await new Promise(resolve=>{function frame(){frames.push({h:el.getBoundingClientRect().height,w:el.getBoundingClientRect().width,open:el.open,images:el.querySelectorAll('img').length});if(performance.now()-start<640)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});
  return frames;
 });
 const opening=await sample();
 expect(opening.at(-1).h).toBeGreaterThan(opening[0].h+20);
 expect(opening.filter(f=>f.h>opening[0].h+2&&f.h<opening.at(-1).h-2).length).toBeGreaterThan(2);
 await page.getByRole('button',{name:'Full',exact:true}).click();
 const closing=await sample();
 expect(closing[0].open).toBe(true);
 expect(closing[0].images).toBeGreaterThan(0);
 expect(closing.at(-1).open).toBe(false);
 expect(Math.abs(initialWidth-closing.at(-1).w)).toBeLessThan(1);
 if(width>1023) expect(closing.filter(f=>!f.open&&f.w>initialWidth+2&&f.w<closing[0].w-2).length).toBeGreaterThan(2);
 await expect(news).toHaveAttribute('data-updates-view','compact');
 expect(closing.filter(f=>f.h>closing.at(-1).h+2&&f.h<closing[0].h-2).length).toBeGreaterThan(2);
 await expect(news.locator('img')).toHaveCount(0);
 await news.locator(':scope > summary').click();
 await expect.poll(()=>news.evaluate(el=>el.getAnimations().length)).toBe(0);
 await page.getByRole('button',{name:'Full',exact:true}).click();
 await news.evaluate(async el=>{el.querySelector(':scope > summary').click();await new Promise(r=>setTimeout(r,80));el.querySelector(':scope > summary').click();});
 await expect.poll(()=>news.evaluate(el=>el.getAnimations().length)).toBe(0);
 await expect(news).toHaveAttribute('open','');
 await expect(news).toHaveAttribute('data-updates-view','detailed');
 await expect(news.locator('img')).toHaveCount(5);
 await page.getByRole('button',{name:'Collapse homepage sections',exact:true}).click();
 await expect(news).not.toHaveAttribute('open','');
 await expect(news).toHaveAttribute('data-updates-view','compact');
 await expect.poll(async()=>Math.abs((await news.boundingBox()).width-initialWidth)).toBeLessThan(1);
});

test('research topic images load in both languages',async({page})=>{
 for(const slug of ['AI_and_Networks','Machine_Unlearning','Synthetic_Data_and_Model_Collapse','Data_Centric_Machine_Learning']){
  for(const suffix of ['', '_zh']){
   await page.goto(`/wiki/${slug}${suffix}/`,{waitUntil:'domcontentloaded'});
   const img=page.locator('img[src^="/topics/"]').first();
   await img.scrollIntoViewIfNeeded();
   await expect.poll(()=>img.evaluate(el=>el.complete&&el.naturalWidth===1400)).toBe(true);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }
 }
});
