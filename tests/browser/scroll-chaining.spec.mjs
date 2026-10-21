import {test, expect} from '@playwright/test';

test('Latest Updates passes wheel scrolling to the page at both boundaries', async({page})=>{
 await page.setViewportSize({width:1440,height:700});
 await page.goto('/',{waitUntil:'networkidle'});
 await page.locator('#portal-directory > summary').click();
 await page.locator('#portal-news > summary').click();
 await page.getByRole('button',{name:'Full',exact:true}).click();
 const scroller=page.locator('.wiki-portal-updates-window');
 await expect.poll(()=>page.locator('#portal-news').evaluate(el=>el.getAnimations().length)).toBe(0);
 await scroller.evaluate(el=>{window.scrollTo(0,window.scrollY+el.getBoundingClientRect().top-100);el.scrollTop=0;});
 const innerBox=await scroller.boundingBox();
 await page.mouse.move(innerBox.x+innerBox.width/2,innerBox.y+100);
 const initialPage=await page.evaluate(()=>scrollY);
 await page.mouse.wheel(0,100);
 await expect.poll(()=>scroller.evaluate(el=>el.scrollTop)).toBeGreaterThan(20);
 expect(await page.evaluate(()=>scrollY)).toBe(initialPage);
 await scroller.evaluate(el=>{
   window.scrollTo(0,window.scrollY+el.getBoundingClientRect().top-100);
   el.scrollTop=el.scrollHeight;
 });
 const box=await scroller.boundingBox();
 await page.mouse.move(box.x+box.width/2,Math.min(box.y+100,600));
 const before=await page.evaluate(()=>scrollY);
 expect(await page.evaluate(()=>document.documentElement.scrollHeight-innerHeight)).toBeGreaterThan(before+20);
 await page.mouse.wheel(0,500);
 await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(before+20);
 await scroller.evaluate(el=>{
   el.scrollTop=0;
   window.scrollTo(0,window.scrollY+el.getBoundingClientRect().top-100);
 });
 const topBox=await scroller.boundingBox();
 await page.mouse.move(topBox.x+topBox.width/2,Math.min(topBox.y+100,600));
 const beforeUp=await page.evaluate(()=>scrollY);
 await page.mouse.wheel(0,-400);
 await expect.poll(()=>page.evaluate(()=>scrollY)).toBeLessThan(beforeUp-20);
});
