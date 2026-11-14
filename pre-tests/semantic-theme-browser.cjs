// Render the actual ThemeProvider and both app Chakra systems without an app server.
// Run from frontend root: node pre-tests/semantic-theme-browser.cjs
// Add --public-forms for actual public forms; --public-nav also checks desktop/mobile navigation.
// Services, auth and the navbar theme-selector are inert fixtures; external requests are blocked.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const { chromium, expect } = require('@playwright/test');
const webpackModule = require('next/dist/compiled/webpack/webpack');
webpackModule.init();
(async () => {
  const root = process.cwd();
  const publicNav = process.argv.includes('--public-nav');
  const publicForms = process.argv.includes('--public-forms') || publicNav;
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'abe-semantic-theme-'));
  fs.writeFileSync(path.join(temp, 'ts-loader.cjs'), `const ts=require(${JSON.stringify(require.resolve('typescript'))});module.exports=function(source){return ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;};`);
  fs.writeFileSync(path.join(temp, 'api-stub.js'), "exports.axiosInstance={post:async(url)=>{if(url.includes('client-intake'))throw {response:{data:{detail:'Please try again.'}}};return {data:{}};}};");
  fs.writeFileSync(path.join(temp, 'toaster-stub.js'), "exports.toaster={create:()=>{}};");
  fs.writeFileSync(path.join(temp, 'navigation-stub.js'), "exports.usePathname=()=>'/contact';exports.useRouter=()=>({replace:()=>{}});exports.useSearchParams=()=>new URLSearchParams('tab=contact');");
  fs.writeFileSync(path.join(temp, 'link-stub.js'), "const React=require('react');module.exports=React.forwardRef((props,ref)=>React.createElement('a',{...props,ref}));");
  fs.writeFileSync(path.join(temp,'auth-stub.js'), "const React=require('react');exports.useAuth=()=>{const [state,setState]=React.useState({user:null,isLoading:false});React.useEffect(()=>{const update=e=>setState(e.detail);window.addEventListener('nav-fixture-auth',update);return()=>window.removeEventListener('nav-fixture-auth',update);},[]);return {...state,logout:async()=>{}};};");
  fs.writeFileSync(path.join(temp,'selector-stub.js'), "const React=require('react');exports.ThemeSelector=()=>React.createElement('span',null,'Theme fixture');");
  fs.writeFileSync(path.join(temp, 'entry.js'), `
    const React = require('react');
    const {createRoot} = require('react-dom/client');
    const {ChakraProvider, Box, Text, Input, Textarea, Button} = require('@chakra-ui/react');
    const {ColorModeProvider} = require(${JSON.stringify(path.join(root, 'packages/core/src/theme/color-mode.tsx'))});
    const {ThemeProvider, useTheme} = require(${JSON.stringify(path.join(root, 'packages/core/src/theme/theme-context.tsx'))});
    window.getSemanticThemeVars = require(${JSON.stringify(path.join(root, 'packages/ui-tokens/src/semantic-tokens.ts'))}).getSemanticThemeVars;
    const {themes} = require(${JSON.stringify(path.join(root, 'packages/ui-tokens/src/themes.ts'))});
    const mixtape = require(${JSON.stringify(path.join(root, 'apps/mixtape/src/theme/theme.ts'))}).system;
    const crossroads = require(${JSON.stringify(path.join(root, 'apps/crossroads/src/theme/theme.ts'))}).system;
    const publicForms = ${publicForms};
    const Contact = publicForms ? require(${JSON.stringify(path.join(root, 'apps/crossroads/src/app/(main)/(site)/contact/page.tsx'))}).default : null;
    const GetStarted = publicForms ? require(${JSON.stringify(path.join(root, 'apps/crossroads/src/app/(main)/(site)/get-started/page.tsx'))}).default : null;
    const Footer = publicForms ? require(${JSON.stringify(path.join(root, 'apps/crossroads/src/components/layout/Footer.tsx'))}).default : null;
    const Navbar = ${publicNav} ? require(${JSON.stringify(path.join(root,'apps/crossroads/src/components/layout/UnifiedNavbar.tsx'))}).default : null;
    function Panel({name,system}) {
      return React.createElement(ChakraProvider, {value:system},
        React.createElement(Box, {className:'token-panel', 'data-app':name, bg:'theme.bg', color:'theme.text', p:5, border:'2px solid', borderColor:'ui.borderControl'},
          React.createElement('h2', null, name),
          name==='Crossroads' && React.createElement('div', {'data-controls':true},
            ...[Input,Textarea].flatMap((Control,index)=>['outline','filled','subtle','flushed','ghost'].map(variant=>
              React.createElement(Control,{key:index+variant,'aria-label':'fixture '+index+' '+variant,'data-control':true,variant,placeholder:'Readable placeholder',mt:3}))),
            React.createElement(Input,{'aria-label':'Disabled fixture',disabled:true,placeholder:'Disabled'}),
            React.createElement(Textarea,{'aria-label':'Invalid fixture','aria-invalid':true,placeholder:'Invalid'})),
          name==='Crossroads' && React.createElement('div',{'data-buttons':true},
            ...['solid','outline','ghost','subtle'].map(variant=>React.createElement(Button,{key:variant,'data-button':variant,variant,mt:3},variant+' button')),
            React.createElement(Button,{'data-disabled-button':true,disabled:true,mt:3},'Disabled button'),
            React.createElement(Button,{'data-loading-button':true,loading:true,loadingText:'Please wait',mt:3},'Loading button')),
          React.createElement(Text, {'data-muted':true, color:'theme.textMuted'}, 'Readable secondary text, dates and metadata'),
          React.createElement(Input, {'aria-label':name+' sample', placeholder:'Optional note', _placeholder:{color:'theme.textPlaceholder'}, borderColor:'ui.borderControl', mt:3}),
          React.createElement(Box, {'data-subtle':true, bg:'ui.surfaceSubtle', border:'1px solid', borderColor:'ui.borderSubtle', p:3, mt:3}, 'Subtle surface'),
          ...['danger','success','warning','info'].map(tone => React.createElement(Box, {key:tone, 'data-status':tone, color:'status.'+tone+'.fg', bg:'status.'+tone+'.bg', border:'1px solid', borderColor:'status.'+tone+'.fg', p:2, mt:2}, tone+' — status is also named in text'))
        ));
    }
    function Demo() {
      const theme=useTheme();
      React.useEffect(()=>{ window.themeControls=theme; },[theme]);
      return React.createElement(React.Fragment,null,
        ${publicNav} && React.createElement(ChakraProvider,{value:crossroads},React.createElement(Box,{'data-navbar-fixture':true,gridColumn:'1 / -1'},React.createElement(Navbar,{sticky:false}))),
        React.createElement(Panel,{name:'Mixtape',system:mixtape}),
        React.createElement(Panel,{name:'Crossroads',system:crossroads}),
        publicForms && React.createElement(ChakraProvider,{value:crossroads},
          React.createElement(Box,{'data-public-form':'contact',bg:'theme.bg',color:'theme.text',p:5},React.createElement(Contact)),
          React.createElement(Box,{'data-public-form':'get-started',bg:'theme.bg',color:'theme.text',p:5},React.createElement(GetStarted)),
          React.createElement(Footer))
      );
    }
    createRoot(document.getElementById('root')).render(
      React.createElement(ColorModeProvider,{defaultTheme:'light',enableSystem:false},
        React.createElement(ThemeProvider,{themes,defaultThemeId:'gallery',storageKeyPrefix:'token-check'},React.createElement(Demo))));
  `);
  await new Promise((resolve, reject) => webpackModule.webpack({
    mode:'production', entry:path.join(temp,'entry.js'), cache:false,
    output:{path:temp,filename:'bundle.js'},
    plugins:[new webpackModule.webpack.DefinePlugin({'process.env.NEXT_PUBLIC_DEFAULT_NEWSLETTER_SLUG':JSON.stringify('fixture-news'),'process.env.NEXT_PUBLIC_SITE_URL':JSON.stringify('http://theme.test')})],
    resolve:{extensions:['.tsx','.ts','.js'],modules:[path.join(root,'node_modules')],alias:{
      '@chakra-ui/react$':require.resolve('@chakra-ui/react'),
      '@/lib/auth/AuthContext':path.join(temp,'auth-stub.js'),
      '@components/common/ThemeSelector':path.join(temp,'selector-stub.js'),
      '@components':path.join(root,'apps/crossroads/src/components'),
      '@mixtape/api/lib/axiosInstance':path.join(temp,'api-stub.js'),
      '@mixtape/core/lib/toaster':path.join(temp,'toaster-stub.js'),
      'next/navigation$':path.join(temp,'navigation-stub.js'),
      'next/link$':path.join(temp,'link-stub.js'),
    }},
    module:{rules:[{test:/\.tsx?$/,exclude:/node_modules/,use:path.join(temp,'ts-loader.cjs')}]},
    optimization:{minimize:false},
  },(error,stats)=>error||stats.hasErrors()?reject(error||new Error(stats.toString({all:false,errors:true}))):resolve()));
  const browser=await chromium.launch({headless:true});
  try {
    const page=await browser.newPage({viewport:{width:1200,height:800}});
    page.on('pageerror', error=>console.error('Browser error:',error.message));
    // Serve only this in-memory page to give next-themes a usable localStorage origin.
    await page.route('**/*',route=>route.request().url()==='http://theme.test/' ? route.fulfill({contentType:'text/html',body:'<style>body{margin:0}#root{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:20px;padding:20px}.token-panel{font-family:system-ui}@media(max-width:600px){#root{grid-template-columns:minmax(0,1fr)}}</style><div id="root"></div>'}) : route.abort());
    await page.goto('http://theme.test/');
    await page.addScriptTag({content:fs.readFileSync(path.join(temp,'bundle.js'),'utf8')});
    await page.waitForFunction(()=>window.themeControls?.isLoaded);
    if(publicForms) {
      const intake=page.locator('[data-public-form="get-started"]');
      await intake.getByRole('textbox',{name:'Organization name',exact:false}).fill('Example group');
      await intake.getByRole('textbox',{name:'Email',exact:false}).fill('example@example.test');
      await intake.getByRole('button',{name:'Request access'}).click();
      await expect(intake.getByText('Please try again.',{exact:true})).toBeVisible();
    }
    const screenshots=[];
    for(const id of ['gallery','earthy-slate']) for(const mode of ['light','dark']) for(const contrast of ['normal','high']) {
      await page.evaluate(({id,mode,contrast})=>{
        const theme=window.themeControls;
        theme.setTheme(id);theme.setContrastMode(contrast);
        if(theme.colorMode!==mode)theme.toggleColorMode();
      },{id,mode,contrast});
      await page.waitForFunction(({id,mode,contrast})=>window.themeControls.currentTheme.id===id&&window.themeControls.colorMode===mode&&window.themeControls.contrastMode===contrast,{id,mode,contrast});
      await page.waitForFunction(({mode,contrast})=>{
        const c=window.themeControls.currentTheme[contrast==='high'?mode+'HighContrast':mode];
        const expected=window.getSemanticThemeVars(c,mode,contrast);
        return document.documentElement.style.getPropertyValue('--theme-bg')===c.bg && Object.entries(expected).every(([key,value])=>document.documentElement.style.getPropertyValue(key)===value);
      },{mode,contrast});
      await expect(page.locator('.token-panel')).toHaveCount(2);
      const expected=await page.evaluate(({mode,contrast})=>{
        const c=window.themeControls.currentTheme[contrast==='high'?mode+'HighContrast':mode];
        const vars=window.getSemanticThemeVars(c,mode,contrast);
        const probe=document.createElement('span');document.body.appendChild(probe);
        const color=value=>{probe.style.color=value;return getComputedStyle(probe).color;};
        const result={muted:color(vars['--theme-text-muted']),background:color(c.bg),border:color(vars['--ui-border-control']),subtle:color(vars['--ui-surface-subtle']),statuses:['danger','success','warning','info'].map(tone=>({fg:color(vars['--status-'+tone+'-fg']),bg:color(vars['--status-'+tone+'-bg'])}))};
        probe.remove();return result;
      },{mode,contrast});
      const colors=await page.locator('.token-panel').evaluateAll(panels=>panels.map(panel=>{
        const muted=panel.querySelector('[data-muted]'),subtle=panel.querySelector('[data-subtle]');
        return {muted:getComputedStyle(muted).color,background:getComputedStyle(panel).backgroundColor,border:getComputedStyle(panel).borderTopColor,subtle:getComputedStyle(subtle).backgroundColor,statuses:[...panel.querySelectorAll('[data-status]')].map(el=>({fg:getComputedStyle(el).color,bg:getComputedStyle(el).backgroundColor}))};
      }));
      assert.deepEqual(colors[0],expected,'actual Chakra roles match the selected approved values');
      assert.deepEqual(colors[0],colors[1],'both Chakra systems resolve the same shared roles');
      assert.ok(colors[0].statuses.every(v=>v.fg!==v.bg));
      assert.equal(new Set(colors[0].statuses.map(v=>v.fg)).size,4,'HC preserves four hues');
      // No per-element colour overrides: these assertions exercise the recipes.
      const controlExpected=await page.evaluate(()=>{
        const probe=document.createElement('span');document.body.appendChild(probe);
        const color=value=>{probe.style.color=value;return getComputedStyle(probe).color;};
        const result={scrim:color('var(--ui-overlay-scrim)'),accent:color('var(--theme-accent)'),accentText:color('var(--theme-accent-text)'),text:color('var(--theme-text)'),surface:color('var(--theme-surface)'),placeholder:color('var(--theme-text-placeholder)'),danger:color('var(--status-danger-fg)')};
        probe.remove();return result;
      });
      await page.waitForTimeout(300);
      const controls=page.locator('[data-controls] [data-control]');
      for(const control of await controls.all()) {
        const variant=await control.getAttribute('aria-label');
        const style=await control.evaluate(el=>({text:getComputedStyle(el).color,placeholder:getComputedStyle(el,'::placeholder').color,border:getComputedStyle(el).borderBottomColor,borderWidth:getComputedStyle(el).borderBottomWidth}));
        assert.equal(style.text,controlExpected.text,variant+' text');
        assert.equal(style.placeholder,controlExpected.placeholder,variant+' placeholder');
        if(!variant.endsWith('ghost')) {
          assert.equal(style.border,expected.border,variant+' meaningful boundary');
          assert.notEqual(style.borderWidth,'0px');
        }
        await control.focus();
        // Keyboard focus must retain a visible, offset indicator in every variant.
        const focus=await control.evaluate(el=>({color:getComputedStyle(el).outlineColor,width:getComputedStyle(el).outlineWidth,offset:getComputedStyle(el).outlineOffset}));
        assert.deepEqual(focus,{color:expected.border,width:'3px',offset:'2px'},variant+' keyboard focus '+JSON.stringify(focus));
      }
      const invalid=page.getByRole('textbox',{name:'Invalid fixture'});
      assert.equal(await invalid.evaluate(el=>getComputedStyle(el).borderBottomColor),controlExpected.danger);
      await invalid.hover();
      assert.equal(await invalid.evaluate(el=>getComputedStyle(el).borderBottomColor),controlExpected.danger,'invalid boundary survives hover');
      await page.keyboard.press('Tab');
      await invalid.focus();
      assert.equal(await invalid.evaluate(el=>getComputedStyle(el).outlineColor),controlExpected.danger);
      await expect(page.getByRole('textbox',{name:'Disabled fixture'})).toBeDisabled();
      const buttonStyle=button=>button.evaluate(el=>{const s=getComputedStyle(el);return {text:s.color,bg:s.backgroundColor,border:s.borderTopColor,opacity:s.opacity};});
      for(const variant of ['solid','outline','ghost','subtle']) {
        const button=page.locator('[data-button="'+variant+'"]');
        await page.mouse.move(0,0);
        const text=variant==='solid'?controlExpected.accentText:controlExpected.text;
        const rest={text,bg:variant==='solid'?controlExpected.accent:variant==='subtle'?expected.subtle:'rgba(0, 0, 0, 0)',border:variant==='ghost'?'rgba(0, 0, 0, 0)':expected.border,opacity:'1'};
        await expect.poll(()=>buttonStyle(button),{message:variant+' resting pair'}).toEqual(rest);
        await button.hover();
        const hovered={...rest,bg:variant==='solid'?controlExpected.accent:variant==='subtle'?controlExpected.surface:expected.subtle};
        await expect.poll(()=>buttonStyle(button),{message:variant+' hover pair'}).toEqual(hovered);
        await page.mouse.move(0,0);
        await button.evaluate(el=>el.setAttribute('aria-expanded','true'));
        await expect.poll(()=>buttonStyle(button),{message:variant+' expanded pair'}).toEqual(hovered);
        await button.evaluate(el=>el.removeAttribute('aria-expanded'));
        await page.keyboard.press('Tab');
        await button.focus();
        await expect.poll(()=>button.evaluate(el=>{const s=getComputedStyle(el);return {color:s.outlineColor,width:s.outlineWidth,offset:s.outlineOffset};}),{message:variant+' button keyboard focus'}).toEqual({color:expected.border,width:'3px',offset:'2px'});
      }
      await expect(page.locator('[data-disabled-button]')).toBeDisabled();
      await expect(page.locator('[data-loading-button]')).toBeDisabled();
      await expect(page.locator('[data-loading-button]')).toHaveText('Please wait');
      if(publicForms) {
        const contact=page.locator('[data-public-form="contact"]');
        await contact.getByRole('textbox',{name:'Name',exact:false}).fill('Example person');
        await contact.getByRole('textbox',{name:'Email',exact:false}).fill('example@example.test');
        await contact.getByRole('textbox',{name:'Message',exact:false}).fill('A synthetic contact request.');
        const submit=contact.getByRole('button',{name:'Send Message'});
        await submit.hover();
        await expect.poll(()=>submit.evaluate(el=>({bg:getComputedStyle(el).backgroundColor,text:getComputedStyle(el).color}))).toEqual({bg:controlExpected.accent,text:controlExpected.accentText});
        await submit.click();
        const success=contact.getByText('✅ Your message has been sent!',{exact:true});
        await expect(success).toBeVisible();
        const error=page.locator('[data-public-form="get-started"]').getByText('Please try again.',{exact:true});
        await expect(error).toBeVisible();
        const expectedStatus=await page.locator('[data-app="Crossroads"]').locator('[data-status]').evaluateAll(elements=>Object.fromEntries(elements.map(el=>[el.getAttribute('data-status'),getComputedStyle(el).color])));
        assert.equal(await success.evaluate(el=>getComputedStyle(el).color),expectedStatus.success,'contact success token');
        assert.equal(await error.evaluate(el=>getComputedStyle(el).color),expectedStatus.danger,'intake error token');
        for(const container of [contact,page.locator('[data-public-form="get-started"]')]) {
          for(const field of await container.getByRole('textbox').all()) {
            const style=await field.evaluate(el=>({text:getComputedStyle(el).color,bg:getComputedStyle(el).backgroundColor,border:getComputedStyle(el).borderBottomColor,placeholder:getComputedStyle(el,'::placeholder').color}));
            assert.deepEqual(style,{text:controlExpected.text,bg:controlExpected.surface,border:expected.border,placeholder:controlExpected.placeholder},'live public field uses recipe roles');
          }
        }
        const footer=await page.locator('.ftr-root').evaluate(el=>getComputedStyle(el).borderTopColor);
        assert.equal(footer,await page.locator('[data-app="Crossroads"] [data-subtle]').evaluate(el=>getComputedStyle(el).borderTopColor),'footer uses decorative separator');
      }
      if(publicNav) {
        const setAuth=state=>page.evaluate(state=>window.dispatchEvent(new CustomEvent('nav-fixture-auth',{detail:state})),state);
        const nav=page.locator('.unav-root');
        await page.setViewportSize({width:1200,height:800});
        await setAuth({user:null,isLoading:true});
        await expect(page.locator('.unav-loading')).toBeVisible();
        assert.equal(await page.locator('.unav-loading').evaluate(el=>getComputedStyle(el).backgroundColor),controlExpected.surface);
        assert.deepEqual(await page.locator('.unav-placeholder').evaluateAll(elements=>elements.map(el=>getComputedStyle(el).backgroundColor)),Array(5).fill(expected.subtle),'loading placeholders use selected subtle surface');
        await setAuth({user:null,isLoading:false});
        await expect(nav).toBeVisible();
        assert.equal(await nav.evaluate(el=>getComputedStyle(el).backgroundColor),controlExpected.surface,'opaque selected-theme nav surface');
        assert.equal(await nav.locator('svg text').evaluate(el=>getComputedStyle(el).fill),controlExpected.text,'logo follows readable theme text');
        const products=nav.getByRole('button',{name:'Products',exact:true});
        await products.click();
        const menu=page.locator('.unav-menu:visible');
        await expect(menu).toBeVisible();
        assert.equal(await menu.evaluate(el=>getComputedStyle(el).backgroundColor),controlExpected.surface);
        await page.keyboard.press('ArrowDown');
        const overview=menu.getByRole('menuitem',{name:'Overview',exact:true});
        await expect.poll(()=>overview.evaluate(el=>getComputedStyle(el).color)).toBe(controlExpected.text);
        await page.keyboard.press('Escape');
        await page.setViewportSize({width:390,height:844});
        await nav.getByRole('button',{name:'Menu',exact:true}).click();
        const drawer=page.locator('.unav-drawer');
        await expect(drawer).toBeVisible();
        assert.equal(await drawer.evaluate(el=>getComputedStyle(el).backgroundColor),controlExpected.surface);
        await expect.poll(()=>page.locator('.unav-scrim').evaluate(el=>getComputedStyle(el).backgroundColor)).toBe(controlExpected.scrim);
        const contactLink=drawer.getByRole('link',{name:'Contact',exact:true});
        await expect(contactLink).toHaveAttribute('aria-current','location');
        await contactLink.hover();
        await expect.poll(()=>contactLink.evaluate(el=>getComputedStyle(el).color)).toBe(controlExpected.text);
        await page.keyboard.press('Tab');await contactLink.focus();
        await expect.poll(()=>contactLink.evaluate(el=>getComputedStyle(el).outlineColor)).toBe(expected.border);
        const mobileImage=path.join(temp,id+'-'+mode+'-'+contrast+'-nav-mobile.png');
        await page.screenshot({path:mobileImage,fullPage:false,animations:'disabled'});screenshots.push(mobileImage);
        await drawer.getByRole('button',{name:'Close menu'}).click();
        await expect(drawer).not.toBeVisible();
        await page.setViewportSize({width:1200,height:800});
        await setAuth({user:{username:'fixture-member',roles:[]},isLoading:false});
        await nav.getByRole('button',{name:'fixture-member'}).click();
        const logout=page.getByRole('menuitem',{name:'Logout',exact:true});
        await logout.hover();
        await expect.poll(()=>logout.evaluate(el=>getComputedStyle(el).color)).toBe(controlExpected.danger);
        const dangerBg=await page.locator('[data-app="Crossroads"] [data-status="danger"]').evaluate(el=>getComputedStyle(el).backgroundColor);
        await expect.poll(()=>logout.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe(dangerBg);
        await page.keyboard.press('Escape');
        await setAuth({user:null,isLoading:false});
      }
      const image=path.join(temp,id+'-'+mode+'-'+contrast+'.png');
      await page.screenshot({path:image,fullPage:true,animations:'disabled'});screenshots.push(image);
    }
    fs.writeFileSync(path.join(temp,'screenshots.json'),JSON.stringify(screenshots,null,2));
    fs.writeFileSync('/private/tmp/abe-semantic-theme-browser-path.txt',temp);
    console.log('PASS: real root provider and both Chakra systems, gallery + earthy-slate × light/dark × normal/high contrast');
    console.log('PASS: Crossroads input/textarea variants, readable placeholders, control boundaries, keyboard focus, invalid hover/focus and native disabled state');
    console.log('PASS: common Crossroads buttons retain semantic resting/hover/expanded pairs, keyboard focus and disabled/loading behavior');
    if(publicForms) console.log('PASS: actual public contact submission, intake error and footer separator in all eight theme/mode variants; API/routing/toaster are inert fixtures');
    if(publicNav) console.log('PASS: actual public navbar loading, desktop dropdown, mobile drawer/current-link focus and authenticated logout colours in eight theme/mode combinations; auth/theme-selector are inert fixtures');
    console.log('Screenshots:',temp);
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
