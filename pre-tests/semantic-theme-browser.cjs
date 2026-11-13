// Render the actual ThemeProvider and both app Chakra systems without an app server.
// Run from frontend root: node pre-tests/semantic-theme-browser.cjs
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const { chromium, expect } = require('@playwright/test');
const webpackModule = require('next/dist/compiled/webpack/webpack');
webpackModule.init();
(async () => {
  const root = process.cwd();
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'abe-semantic-theme-'));
  fs.writeFileSync(path.join(temp, 'ts-loader.cjs'), `const ts=require(${JSON.stringify(require.resolve('typescript'))});module.exports=function(source){return ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;};`);
  fs.writeFileSync(path.join(temp, 'entry.js'), `
    const React = require('react');
    const {createRoot} = require('react-dom/client');
    const {ChakraProvider, Box, Text, Input} = require('@chakra-ui/react');
    const {ColorModeProvider} = require(${JSON.stringify(path.join(root, 'packages/core/src/theme/color-mode.tsx'))});
    const {ThemeProvider, useTheme} = require(${JSON.stringify(path.join(root, 'packages/core/src/theme/theme-context.tsx'))});
    window.getSemanticThemeVars = require('/Users/marklilly/Sites/ml/active/mixtape/release/mixtape-release-frontend/packages/ui-tokens/src/semantic-tokens.ts').getSemanticThemeVars;
    const {themes} = require(${JSON.stringify(path.join(root, 'packages/ui-tokens/src/themes.ts'))});
    const mixtape = require(${JSON.stringify(path.join(root, 'apps/mixtape/src/theme/theme.ts'))}).system;
    const crossroads = require(${JSON.stringify(path.join(root, 'apps/crossroads/src/theme/theme.ts'))}).system;
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
        React.createElement(Panel,{name:'Crossroads',system:crossroads})
      );
    }
    createRoot(document.getElementById('root')).render(
      React.createElement(ColorModeProvider,{defaultTheme:'light',enableSystem:false},
        React.createElement(ThemeProvider,{themes,defaultThemeId:'gallery',storageKeyPrefix:'token-check'},React.createElement(Demo))));
  `);
  await new Promise((resolve, reject) => webpackModule.webpack({
    mode:'production', entry:path.join(temp,'entry.js'), cache:false,
    output:{path:temp,filename:'bundle.js'},
    resolve:{extensions:['.tsx','.ts','.js'],modules:[path.join(root,'node_modules')]},
    module:{rules:[{test:/\.tsx?$/,exclude:/node_modules/,use:path.join(temp,'ts-loader.cjs')}]},
    optimization:{minimize:false},
  },(error,stats)=>error||stats.hasErrors()?reject(error||new Error(stats.toString({all:false,errors:true}))):resolve()));
  const browser=await chromium.launch({headless:true});
  try {
    const page=await browser.newPage({viewport:{width:1200,height:800}});
    // Serve only this in-memory page to give next-themes a usable localStorage origin.
    await page.route('**/*',route=>route.request().url()==='http://theme.test/' ? route.fulfill({contentType:'text/html',body:'<style>body{margin:0}#root{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:20px}.token-panel{font-family:system-ui}</style><div id="root"></div>'}) : route.abort());
    await page.goto('http://theme.test/');
    await page.addScriptTag({content:fs.readFileSync(path.join(temp,'bundle.js'),'utf8')});
    await page.waitForFunction(()=>window.themeControls?.isLoaded);
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
      const image=path.join(temp,id+'-'+mode+'-'+contrast+'.png');
      await page.screenshot({path:image,fullPage:true,animations:'disabled'});screenshots.push(image);
    }
    fs.writeFileSync(path.join(temp,'screenshots.json'),JSON.stringify(screenshots,null,2));
    fs.writeFileSync('/private/tmp/abe-semantic-theme-browser-path.txt',temp);
    console.log('PASS: real root provider and both Chakra systems, gallery + earthy-slate × light/dark × normal/high contrast');
    console.log('Screenshots:',temp);
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
