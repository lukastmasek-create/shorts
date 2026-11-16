const pc=(await import('puppeteer-core')).default;
const b=await pc.launch({headless:true,executablePath:'/tmp/cb/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required'],env:{...process.env,LD_LIBRARY_PATH:'/tmp/cb/lib'},protocolTimeout:0});
const p=await b.newPage(); await p.setViewport({width:1200,height:1000});
p.on('pageerror',e=>console.log('PAGEERROR',String(e).slice(0,300)));
await p.goto('http://127.0.0.1:8080/index.html',{waitUntil:'networkidle2'});
await new Promise(r=>setTimeout(r,2500));
await p.click('#play');
for (let i=0;i<8;i++){
  await new Promise(r=>setTimeout(r,20000));
  console.log(i, await p.evaluate(()=>document.getElementById('play').textContent + ' | ' + document.querySelector('#player span.text-\\[\\#7fb0b7\\]')?.textContent));
}
await b.close();
