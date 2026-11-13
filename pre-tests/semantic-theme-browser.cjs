// Render the actual ThemeProvider and both app Chakra systems without an app server.
// Run from frontend root: node pre-tests/semantic-theme-browser.cjs
// Add --public-forms to exercise the live public form components with inert services.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const { chromium, expect } = require('@playwright/test');
const webpackModule = require('next/dist/compiled/webpack/webpack');
webpackModule.init();
(async () => {
  const root = process.cwd();
  const publicForms = process.argv.includes('--public-forms');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'abe-semantic-theme-'));
  fs.writeFileSync(path.join(temp, 'ts-loader.cjs'), `const ts=require(${JSON.stringify(require.resolve('typescript'))});module.exports=function(source){return ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;};`);
  fs.writeFileSync(path.join(temp, 'api-stub.js'), "exports.axiosInstance={post:async(url)=>{if(url.includes('client-intake'))throw {response:{data:{detail:'Please try again.'}}};return {data:{}};}};");
  fs.writeFileSync(path.join(temp, 'toaster-stub.js'), "exports.toaster={create:()=>{}};");
  fs.writeFileSync(path.join(temp, 'navigation-stub.js'), "exports.useRouter=()=>({replace:()=>{}});exports.useSearchParams=()=>new URLSearchParams('tab=contact');");
  fs.writeFileSync(path.join(temp, 'link-stub.js'), "const React=require('react');module.exports=React.forwardRef((props,ref)=>React.createElement('a',{...props,ref}));");
  fs.writeFileSync(path.join(temp, 'entry.js'), `
    const React = require('react');
    const {createRoot} = require('react-dom/client');
    const {ChakraProvider, Box, Text, Input} = require('@chakra-ui/react');
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
    function Panel({name,system}) {
      return React.createElement(ChakraProvider, {value:system},
        React.createElement(Box, {className:'token-panel', 'data-app':name, bg:'theme.bg', color:'theme.text', p:5, border:'2px solid', borderColor:'ui.borderControl'},
          React.createElement('h2', null, name),
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
    plugins:[new webpackModule.webpack.DefinePlugin({'process.env.NEXT_PUBLIC_DEFAULT_NEWSLETTER_SLUG':JSON.stringify('fixture-news')})],
    resolve:{extensions:['.tsx','.ts','.js'],modules:[path.join(root,'node_modules')],alias:{
      '@chakra-ui/react$':require.resolve('@chakra-ui/react'),
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
    await page.route('**/*',route=>route.request().url()==='http://theme.test/' ? route.fulfill({contentType:'text/html',body:'<style>body{margin:0}#root{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:20px}.token-panel{font-family:system-ui}</style><div id="root"></div>'}) : route.abort());
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
      if(publicForms) {
        const contact=page.locator('[data-public-form="contact"]');
        await contact.getByRole('textbox',{name:'Name',exact:false}).fill('Example person');
        await contact.getByRole('textbox',{name:'Email',exact:false}).fill('example@example.test');
        await contact.getByRole('textbox',{name:'Message',exact:false}).fill('A synthetic contact request.');
        await contact.getByRole('button',{name:'Send Message'}).click();
        const success=contact.getByText('✅ Your message has been sent!',{exact:true});
        await expect(success).toBeVisible();
        const error=page.locator('[data-public-form="get-started"]').getByText('Please try again.',{exact:true});
        await expect(error).toBeVisible();
        const expectedStatus=await page.locator('[data-app="Crossroads"]').locator('[data-status]').evaluateAll(elements=>Object.fromEntries(elements.map(el=>[el.getAttribute('data-status'),getComputedStyle(el).color])));
        assert.equal(await success.evaluate(el=>getComputedStyle(el).color),expectedStatus.success,'contact success token');
        assert.equal(await error.evaluate(el=>getComputedStyle(el).color),expectedStatus.danger,'intake error token');
        const footer=await page.locator('.ftr-root').evaluate(el=>getComputedStyle(el).borderTopColor);
        assert.equal(footer,await page.locator('[data-app="Crossroads"] [data-subtle]').evaluate(el=>getComputedStyle(el).borderTopColor),'footer uses decorative separator');
      }
      const image=path.join(temp,id+'-'+mode+'-'+contrast+'.png');
      await page.screenshot({path:image,fullPage:true,animations:'disabled'});screenshots.push(image);
    }
    fs.writeFileSync(path.join(temp,'screenshots.json'),JSON.stringify(screenshots,null,2));
    fs.writeFileSync('/private/tmp/abe-semantic-theme-browser-path.txt',temp);
    console.log('PASS: real root provider and both Chakra systems, gallery + earthy-slate × light/dark × normal/high contrast');
    if(publicForms) console.log('PASS: actual public contact submission, intake error and footer separator in all eight theme/mode variants; API/routing/toaster are inert fixtures');
    console.log('Screenshots:',temp);
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
