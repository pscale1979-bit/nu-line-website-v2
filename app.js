const header=document.querySelector('.site-header');
const menu=document.querySelector('.menu-toggle');
const nav=document.querySelector('.main-nav');
window.addEventListener('scroll',()=>header.classList.toggle('scrolled',scrollY>40),{passive:true});
menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));document.body.style.overflow=open?'hidden':''});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');document.body.style.overflow=''}));
const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
document.getElementById('year').textContent=new Date().getFullYear();
const hyline=[
 ['HY28','hy28_UK.pdf'],['HY30','hy30_UK.pdf'],['HY40','hy40__UK.pdf'],['HY50','hy50_UK.pdf'],['HYSLIM','hyslim_UK.pdf'],['HYSTYLE','hystyle_UK.pdf'],['HYSTYLE X','hystyle x_UK.pdf'],['HYWOOD','hywood_UK.pdf'],['HYSTYLEWOOD','hystylewood_UK.pdf'],['HYWIN 48/58','hywin48_58_UK.pdf'],['HYWALL','hywall_UK.pdf'],['HYPI','hypi_UK.pdf'],['HYPI WOOD','hypiWOOD_UK.pdf'],['HYSHUTTER','hyshutter__UK.pdf']
];
document.getElementById('hylineDownloads').innerHTML=hyline.map(([name,file])=>`<a href="assets/downloads/hyline/${encodeURI(file)}" download><span>${name} Brochure</span><em>PDF ↓</em></a>`).join('');
