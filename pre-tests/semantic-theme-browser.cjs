// Render the actual ThemeProvider and both app Chakra systems without an app server.
// Run from frontend root: node pre-tests/semantic-theme-browser.cjs
// Add --public-forms for actual public forms; --public-nav also checks desktop/mobile navigation.
// --public-groups adds actual group templates, admission and content components.
// --public-group-route checks the separate /group/[slug] page with inert services/onboarding.
// --public-confirmation checks the subscription opt-in route with inert confirmation requests.
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
  const publicGroups = process.argv.includes('--public-groups');
  const publicGroupRoute = process.argv.includes('--public-group-route');
  const publicConfirmation = process.argv.includes('--public-confirmation');
  const publicNav = process.argv.includes('--public-nav');
  const publicForms = process.argv.includes('--public-forms') || publicNav || publicGroups || publicGroupRoute || publicConfirmation;
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'abe-semantic-theme-'));
  fs.writeFileSync(path.join(temp, 'ts-loader.cjs'), `const ts=require(${JSON.stringify(require.resolve('typescript'))});module.exports=function(source){return ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;};`);
  fs.writeFileSync(path.join(temp, 'api-stub.js'), "exports.axiosInstance={post:async(url)=>{if(url.includes('client-intake'))throw {response:{data:{detail:'Please try again.'}}};return {data:{}};},get:async(url,options)=>{window.confirmationRequests.push({url,...options});if(options.params.uuid.includes('loading'))return new Promise(()=>{});if(options.params.uuid.includes('failure'))throw new Error('Synthetic confirmation refusal');return {data:{}};}};");
  fs.writeFileSync(path.join(temp, 'toaster-stub.js'), "exports.toaster={create:()=>{}};");
  fs.writeFileSync(path.join(temp, 'navigation-stub.js'), "const React=require('react');exports.RouteParams=React.createContext({slug:'route-guest'});exports.useParams=()=>React.useContext(exports.RouteParams);exports.usePathname=()=>'/contact';exports.useRouter=()=>({replace:()=>{}});exports.useSearchParams=()=>new URLSearchParams(React.useContext(exports.RouteParams).query||'tab=contact');");
  fs.writeFileSync(path.join(temp, 'link-stub.js'), "const React=require('react');module.exports=React.forwardRef((props,ref)=>React.createElement('a',{...props,ref}));");
  fs.writeFileSync(path.join(temp,'group-api-stub.js'), "exports.joinGroup=exports.requestToJoinGroup=async(slug)=>{if(slug.includes('failure'))throw new Error('Synthetic refusal');};exports.fetchAdmissionStatus=async(slug)=>({is_member:false,policy:'open',fixture_slug:slug});");
  fs.writeFileSync(path.join(temp,'auth-stub.js'), "const React=require('react');exports.useAuth=()=>{const [state,setState]=React.useState(window.fixtureAuth||{user:null,isLoading:false});React.useEffect(()=>{const update=e=>setState(e.detail);window.addEventListener('nav-fixture-auth',update);return()=>window.removeEventListener('nav-fixture-auth',update);},[]);return {...state,isAuthenticated:!!state.user,logout:async()=>{}};};");
  fs.writeFileSync(path.join(temp,'tour-stub.js'), 'exports.GroupOnboardingTour=()=>null;');
  fs.writeFileSync(path.join(temp,'group-route-api-stub.js'), `
    exports.fetchPublicGroup=async slug=>{
      if(slug==='route-loading')return new Promise(()=>{});
      if(slug==='route-error')throw new Error('Synthetic missing group');
      return {slug,title:'Fixture public group',group_type:'circle',quick_intro:'Public group introduction',description:'Public group description',member_count:4,
        background_image_url:slug.includes('banner-')?'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="220"><rect width="1200" height="220" fill="'+(slug.endsWith('bright')?'white':'black')+'"/></svg>'):null,
        decorators:['isA__community'],parent_title:{slug:'parent',title:'Parent group'},
        member_preview:[{username:'alice',display_name:'Alice',avatar_url:null},{username:'bob',display_name:'Bob',avatar_url:'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"><rect width="36" height="36" fill="teal"/></svg>')}],
        child_groups:[{slug:'child',title:'Child group',group_type:'circle'}]};
    };
    exports.fetchAdmissionStatus=async slug=>{
      if(!slug.startsWith('route-'))return {is_member:false,policy:'open',fixture_slug:slug};
      const status={is_member:['route-member','route-moderator'].includes(slug),is_moderator:slug==='route-moderator',has_pending_request:slug==='route-pending',
        can_join:slug.includes('join-')||slug==='route-parent',can_request:slug.includes('request-'),policy:slug==='route-invite'?'invite_only':slug==='route-closed'?'closed':'open',
        requires_parent_membership:slug==='route-parent',is_parent_member:false,parent_group:{slug:'parent',title:'Parent group'}};
      if(window.routeActions?.[slug])return new Promise(resolve=>{window.releaseRouteRefresh=()=>resolve({...status,can_join:false,can_request:false,is_member:slug.includes('join-'),has_pending_request:slug.includes('request-')});});
      return status;
    };
    exports.joinGroup=exports.requestToJoinGroup=async slug=>{if(slug.includes('failure'))throw new Error('Synthetic refusal');if(slug.startsWith('route-'))window.routeActions[slug]=true;};
  `);
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
    const GroupRoute = ${publicGroupRoute} ? require(${JSON.stringify(path.join(root,'apps/crossroads/src/app/(main)/(site)/group/[slug]/page.tsx'))}).default : null;
    const Confirmation = ${publicConfirmation} ? require(${JSON.stringify(path.join(root,'apps/crossroads/src/app/(main)/(site)/subscription/optin/[uuid]/page.tsx'))}).default : null;
    function ConfirmationFixture() {
      const [scenario,setScenario]=React.useState({name:'missing-uuid',revision:0});
      React.useEffect(()=>{window.setConfirmationScenario=name=>{window.confirmationRequests=[];setScenario(old=>({name,revision:old.revision+1}));};},[]);
      const {RouteParams}=require('next/navigation');
      return React.createElement(Box,{'data-confirmation':scenario.name,gridColumn:'1 / -1',color:'theme.accentText'},
        React.createElement(RouteParams.Provider,{value:{uuid:scenario.name==='missing-uuid'?'':'fixture-'+scenario.name,query:scenario.name==='missing-list'?'x=1':'l=fixture-list'}},React.createElement(Confirmation,{key:scenario.revision})));
    }
    function GroupRouteFixture() {
      const [scenario,setScenario]=React.useState({name:'guest',revision:0});
      React.useEffect(()=>{window.setGroupRouteScenario=name=>{
        window.routeActions={};window.releaseRouteRefresh=null;
        window.fixtureAuth={user:name==='guest'?null:{username:'fixture-member'},isLoading:name==='auth-loading'};
        window.dispatchEvent(new CustomEvent('nav-fixture-auth',{detail:window.fixtureAuth}));
        setScenario(old=>({name,revision:old.revision+1}));
      };},[]);
      const {RouteParams}=require('next/navigation');
      return React.createElement(Box,{'data-group-route':scenario.name,gridColumn:'1 / -1',color:'theme.accentText'},
        React.createElement(RouteParams.Provider,{value:{slug:'route-'+scenario.name}},React.createElement(GroupRoute,{key:scenario.revision})));
    }
    const GroupParts = ${publicGroups} ? require(${JSON.stringify(path.join(root,'apps/crossroads/src/app/(main)/(site)/[slug]/templates/shared.tsx'))}) : null;
    const GroupTemplates = ${publicGroups} ? {
      standard: require(${JSON.stringify(path.join(root,'apps/crossroads/src/app/(main)/(site)/[slug]/templates/StandardTemplate.tsx'))}).default,
      focus: require(${JSON.stringify(path.join(root,'apps/crossroads/src/app/(main)/(site)/[slug]/templates/FocusTemplate.tsx'))}).default,
      hero: require(${JSON.stringify(path.join(root,'apps/crossroads/src/app/(main)/(site)/[slug]/templates/HeroTemplate.tsx'))}).default,
      directory: require(${JSON.stringify(path.join(root,'apps/crossroads/src/app/(main)/(site)/[slug]/templates/DirectoryTemplate.tsx'))}).default,
    } : {};
    function TemplateFixture() {
      const [heroScenario,setHeroScenario]=React.useState('missing');
      React.useEffect(()=>{window.setHeroScenario=setHeroScenario;},[]);
      const banner=heroScenario==='missing'?null:'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="'+(heroScenario==='bright'?'white':'black')+'"/></svg>');
      const group={slug:'fixture-group',title:'Example group',group_type:'circle',quick_intro:'Group introduction',description:'Group description',member_count:2,
        decorators:['isA__community'],parent_title:{slug:'parent',title:'Parent group'},
        member_preview:[{username:'alice',display_name:'Alice',avatar_url:null},{username:'bob',display_name:'Bob',avatar_url:'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="teal"/></svg>'}],child_groups:[{slug:'child',title:'Child group'}]};
      const components=[{id:'text',slot:'about',component_type:'text',content_json:{heading:'About the group',body:'Readable group content'}},
        {id:'link',slot:'links',component_type:'link',content_json:{url:'https://example.test/resource',label:'Group resource',description:'Resource description'}},
        {id:'image',slot:'extra',component_type:'image',content_json:{caption:'Image caption'}},
        {id:'hero-link',slot:'hero',component_type:'link',content_json:{url:'https://example.test/hero',label:'Hero resource',description:'Hero resource description'}},
        {id:'hero-text',slot:'hero',component_type:'text',content_json:{heading:'Hero slot heading',body:'Hero slot body'}},
        {id:'hero-image',slot:'hero',component_type:'image',content_json:{url:'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><rect width="100" height="30" fill="teal"/></svg>'),alt:'Synthetic hero image',caption:'Hero image caption'}},
        {id:'hero-callout',slot:'hero',component_type:'callout',content_json:{heading:'Hero callout',body:'Hero callout body'}}];
      return React.createElement(Box,{'data-template-fixture':true,'data-hero-scenario':heroScenario,gridColumn:'1 / -1',color:'theme.accentText'},
        ...Object.entries(GroupTemplates).map(([name,Template])=>React.createElement('section',{key:name,'data-template':name},
          React.createElement(Template,{group:name==='hero'?{...group,background_image_url:banner,
            ...(heroScenario==='long'?{title:'LongGroupTitle'.repeat(10),quick_intro:'A longer introduction that should wrap without hiding any content. '.repeat(12)}:{})}:group,
            components,isAuthenticated:false,authLoading:false,admissionStatus:null,onStatusChange:()=>{}}))));
    }
    function GroupFixture() {
      const status={is_member:false,is_moderator:false,has_pending_request:false,can_join:false,can_request:false,policy:'open'};
      const cases=[['guest',false,status],['member',true,{...status,is_member:true,is_moderator:true}],
        ['join-success',true,{...status,can_join:true}],['join-failure',true,{...status,can_join:true}],
        ['request-success',true,{...status,can_request:true}],['request-failure',true,{...status,can_request:true}],
        ['pending',true,{...status,has_pending_request:true}],['invite',true,{...status,policy:'invite_only'}],
        ['closed',true,{...status,policy:'closed'}],['parent',true,{...status,can_join:true,requires_parent_membership:true,is_parent_member:false,parent_group:{slug:'parent',title:'Parent group'}}]];
      return React.createElement(Box,{'data-group-fixture':true,gridColumn:'1 / -1',bg:'theme.surface',color:'theme.text',p:4},
        ...cases.map(([name,authenticated,admission])=>React.createElement('section',{key:name,'data-admission':name},
          React.createElement('h3',null,name),React.createElement(GroupParts.AdmissionStrip,{isAuthenticated:authenticated,authLoading:false,admissionStatus:admission,groupSlug:name,groupTitle:'Example group',onStatusChange:s=>{window.groupStatusUpdates=(window.groupStatusUpdates||[]).concat([s]);}}))),
        ...['highlight','info'].map(style=>React.createElement(Box,{key:style,'data-callout':style,color:'theme.accentText'},React.createElement(GroupParts.PageComponentBlock,{component:{id:style,component_type:'callout',content_json:{style,heading:style+' heading',body:'A readable callout.'}},mutedColor:'theme.textMuted',borderColor:'ui.borderSubtle'}))));
    }
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
        ${publicGroups} && React.createElement(ChakraProvider,{value:crossroads},React.createElement(GroupFixture)),
        ${publicGroups} && React.createElement(ChakraProvider,{value:crossroads},React.createElement(TemplateFixture)),
        ${publicGroupRoute} && React.createElement(ChakraProvider,{value:crossroads},React.createElement(GroupRouteFixture)),
        ${publicConfirmation} && React.createElement(ChakraProvider,{value:crossroads},React.createElement(ConfirmationFixture)),
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
      '@mixtape/api/clients/public/publicApi':path.join(temp,publicGroupRoute?'group-route-api-stub.js':'group-api-stub.js'),
      '@/features/onboarding/GroupOnboardingTour':path.join(temp,'tour-stub.js'),
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
    if(publicGroups) {
      for(const name of ['join-success','join-failure','request-success','request-failure']) {
        await page.locator('[data-admission="'+name+'"]').getByRole('button').click();
      }
      await expect(page.locator('[data-admission="join-success"]')).toContainText('You have joined this group!');
      await expect(page.locator('[data-admission="join-failure"]')).toContainText('Could not join. Please try again.');
      await expect(page.locator('[data-admission="request-success"]')).toContainText('Your request has been submitted.');
      await expect(page.locator('[data-admission="request-failure"]')).toContainText('Could not submit request. Please try again.');
      assert.equal(await page.evaluate(()=>window.groupStatusUpdates.length),2,'successful admissions report refreshed status');
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
      if(publicGroups) {
        const group=page.locator('[data-group-fixture]');
        for(const strip of await group.locator('.cp-cta, .cp-admission-member').all()) {
          assert.deepEqual(await strip.evaluate(el=>({text:getComputedStyle(el).color,bg:getComputedStyle(el).backgroundColor})),{text:controlExpected.text,bg:expected.subtle},'admission owns readable foreground and surface');
        }
        for(const link of await group.locator('.cp-cta a, .cp-admission-member a').all()) {
          assert.equal(await link.evaluate(el=>getComputedStyle(el).color),controlExpected.text);
          assert.ok((await link.evaluate(el=>getComputedStyle(el).textDecorationLine)).includes('underline'),'admission links have a non-colour signal');
        }
        for(const [name,text,tone] of [['join-success','You have joined this group!','success'],['join-failure','Could not join. Please try again.','danger'],['request-success','Your request has been submitted.','success'],['request-failure','Could not submit request. Please try again.','danger']]) {
          const expectedFg=await page.locator('[data-app="Crossroads"] [data-status="'+tone+'"]').evaluate(el=>getComputedStyle(el).color);
          assert.equal(await group.locator('[data-admission="'+name+'"]').getByText(text,{exact:true}).evaluate(el=>getComputedStyle(el).color),expectedFg);
        }
        for(const [style,tone] of [['highlight','warning'],['info','info']]) {
          const callout=group.locator('[data-callout="'+style+'"] .cp-callout');
          const pair=await page.locator('[data-app="Crossroads"] [data-status="'+tone+'"]').evaluate(el=>({text:getComputedStyle(el).color,bg:getComputedStyle(el).backgroundColor}));
          assert.deepEqual(await callout.evaluate(el=>({text:getComputedStyle(el).color,bg:getComputedStyle(el).backgroundColor})),pair,'callout owns pair despite contrasting ancestor text');
          assert.equal(await callout.getByRole('heading').evaluate(el=>getComputedStyle(el).color),pair.text);
        }
        const login=group.locator('[data-admission="guest"]').getByRole('link',{name:'Log in',exact:true});
        await login.hover();await page.keyboard.press('Tab');await login.focus();
        assert.equal(await login.evaluate(el=>getComputedStyle(el).outlineColor),expected.border);
        const templates=page.locator('[data-template-fixture]');
        for(const name of ['standard','focus','hero','directory']) {
          const template=templates.locator('[data-template="'+name+'"]');
          const root=template.locator('.cpt-'+name+'-root');
          assert.deepEqual(await root.evaluate(el=>({text:getComputedStyle(el).color,bg:getComputedStyle(el).backgroundColor})),{text:controlExpected.text,bg:expected.background},name+' owns its canvas and text');
          assert.equal(await template.getByText('Image caption',{exact:true}).evaluate(el=>getComputedStyle(el).color),expected.muted,name+' caption');
          assert.equal(await template.getByText('Group description',{exact:true}).evaluate(el=>getComputedStyle(el).color),name==='focus'?controlExpected.text:expected.muted,name+' description');
          for(const badge of await template.locator('.chakra-badge').all()) {
            assert.deepEqual(await badge.evaluate(el=>({text:getComputedStyle(el).color,bg:getComputedStyle(el).backgroundColor})),{text:controlExpected.text,bg:expected.subtle},name+' badge pair');
          }
        }
        assert.equal(await templates.locator('.cpt-focus-header').evaluate(el=>getComputedStyle(el).backgroundColor),expected.subtle);
        for(const avatar of await templates.locator('.cp-member-avatar, .cpt-directory-avatar').all()) {
          assert.equal(await avatar.evaluate(el=>getComputedStyle(el).backgroundColor),expected.subtle,'member fallback surface');
          if(await avatar.locator('img').count()===0) assert.equal(await avatar.locator('div').evaluate(el=>getComputedStyle(el).color),controlExpected.text,'member initial foreground');
        }
        for(const block of await templates.locator('.cp-content-link').all()) {
          assert.deepEqual(await block.evaluate(el=>({text:getComputedStyle(el).color,bg:getComputedStyle(el).backgroundColor})),{text:controlExpected.text,bg:controlExpected.surface},'content links own a surface even in the media slot');
          assert.equal(await block.locator('p').evaluate(el=>getComputedStyle(el).color),expected.muted);
        }
        for(const link of await templates.getByRole('link').all()) {
          await link.hover();
          await expect.poll(()=>link.evaluate(el=>getComputedStyle(el).color)).toBe(controlExpected.text);
          if(!(await link.getAttribute('href')).includes('/member/')) assert.ok((await link.evaluate(el=>getComputedStyle(el).textDecorationLine)).includes('underline'));
          await page.keyboard.press('Tab');await link.focus();
          await expect.poll(()=>link.evaluate(el=>({color:getComputedStyle(el).outlineColor,width:getComputedStyle(el).outlineWidth,offset:getComputedStyle(el).outlineOffset}))).toEqual({color:expected.border,width:'3px',offset:'2px'});
        }
        const card=templates.locator('.cpt-directory-member-card').first();
        await card.hover();
        await expect.poll(()=>card.evaluate(el=>({text:getComputedStyle(el).color,bg:getComputedStyle(el).backgroundColor,border:getComputedStyle(el).borderTopColor}))).toEqual({text:controlExpected.text,bg:expected.subtle,border:expected.border});
        const templateImage=path.join(temp,id+'-'+mode+'-'+contrast+'-group-templates.png');
        await templates.screenshot({path:templateImage,animations:'disabled'});screenshots.push(templateImage);
        const hero=templates.locator('[data-template="hero"]');
        for(const width of [1200,390]) {
          await page.setViewportSize({width,height:844});
          for(const scenario of ['bright','dark','missing','long']) {
            await page.evaluate(scenario=>window.setHeroScenario(scenario),scenario);
            await expect(templates).toHaveAttribute('data-hero-scenario',scenario);
            const artwork=hero.locator('.cpt-hero-artwork');
            if(scenario==='missing') await expect(hero.locator('.cpt-hero-fallback-artwork')).toHaveCount(1);
            else {
              await expect(artwork).toHaveCount(1);
              await expect.poll(()=>artwork.evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
            }
            const copy=hero.locator('.cpt-hero-copy');
            assert.deepEqual(await copy.evaluate(el=>({text:getComputedStyle(el).color,bg:getComputedStyle(el).backgroundColor})),{text:controlExpected.text,bg:controlExpected.surface},'opaque hero copy pair over '+scenario);
            assert.equal(await copy.getByRole('heading').first().evaluate(el=>getComputedStyle(el).color),controlExpected.text,'hero title');
            assert.equal(await copy.getByText('Hero slot body',{exact:true}).evaluate(el=>getComputedStyle(el).color),controlExpected.text,'hero slot body');
            assert.equal(await copy.getByText('Hero image caption',{exact:true}).evaluate(el=>getComputedStyle(el).color),expected.muted,'hero image caption');
            assert.equal(await copy.locator(':scope > p').evaluate(el=>getComputedStyle(el).color),expected.muted,'hero introduction');
            const info=await page.locator('[data-app="Crossroads"] [data-status="info"]').evaluate(el=>({text:getComputedStyle(el).color,bg:getComputedStyle(el).backgroundColor}));
            assert.deepEqual(await copy.locator('.cp-callout').evaluate(el=>({text:getComputedStyle(el).color,bg:getComputedStyle(el).backgroundColor})),info,'hero callout pair');
            const geometry=await hero.locator('.cpt-hero-banner').evaluate(el=>{
              const banner=el.getBoundingClientRect(),copy=el.querySelector('.cpt-hero-copy').getBoundingClientRect();
              return {contains:copy.left>=banner.left&&copy.right<=banner.right&&copy.top>=banner.top&&copy.bottom<=banner.bottom,
                noOverflow:el.scrollWidth<=el.clientWidth+1,allTextContained:[...el.querySelectorAll('.cpt-hero-copy p,.cpt-hero-copy h2,.cpt-hero-copy a')].every(child=>{const r=child.getBoundingClientRect();return r.left>=copy.left&&r.right<=copy.right+1&&r.bottom<=copy.bottom;})};
            });
            assert.deepEqual(geometry,{contains:true,noOverflow:true,allTextContained:true},'hero content remains in flow at '+width+'px with '+scenario+' media: '+JSON.stringify(geometry));
            if(scenario==='long') {
              const heroImage=path.join(temp,id+'-'+mode+'-'+contrast+'-hero-'+width+'.png');
              await hero.locator('.cpt-hero-banner').screenshot({path:heroImage,animations:'disabled'});screenshots.push(heroImage);
            }
          }
        }
        await page.evaluate(()=>window.setHeroScenario('missing'));
        await expect(templates).toHaveAttribute('data-hero-scenario','missing');
        await page.setViewportSize({width:1200,height:800});
      }
      if(publicGroupRoute) {
        const fixture=page.locator('[data-group-route]');
        const setScenario=async name=>{
          await page.evaluate(name=>window.setGroupRouteScenario(name),name);
          await expect(fixture).toHaveAttribute('data-group-route',name);
          if(!['loading','error'].includes(name))await expect(fixture.locator('.gpp-root')).toBeVisible();
        };
        for(const name of ['loading','error']) {
          await setScenario(name);
          const state=fixture.locator('.gpp-'+name);
          await expect(state).toBeVisible();
          assert.deepEqual(await state.evaluate(el=>({text:getComputedStyle(el).color,bg:getComputedStyle(el).backgroundColor})),{text:controlExpected.text,bg:expected.background},name+' owns canvas pair');
          if(name==='error')assert.equal(await state.getByText('Group not found.').evaluate(el=>getComputedStyle(el).color),expected.muted);
        }
        for(const name of ['guest','banner-bright','banner-dark','member','moderator','pending','invite','closed','parent','auth-loading','join-success','join-failure','request-success','request-failure']) {
          await setScenario(name);
          const root=fixture.locator('.gpp-root');
          assert.deepEqual(await root.evaluate(el=>({text:getComputedStyle(el).color,bg:getComputedStyle(el).backgroundColor})),{text:controlExpected.text,bg:expected.background},'public group route canvas');
          assert.deepEqual(await root.locator('.gpp-heading').evaluate(el=>({text:getComputedStyle(el).color,bg:getComputedStyle(el).backgroundColor})),{text:controlExpected.text,bg:expected.background},'header copy owns an opaque surface where it overlaps the banner');
          if(name.startsWith('banner-'))await expect.poll(()=>root.locator('.gpp-banner img').evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
          assert.equal(await root.getByText('Public group description',{exact:true}).evaluate(el=>getComputedStyle(el).color),expected.muted);
          const viewer=root.locator('.gpp-viewer-guest, .gpp-viewer-member, .gpp-viewer-actions');
          if(name==='auth-loading'){await expect(viewer).toHaveCount(0);continue;}
          await expect(viewer).toHaveCount(1);
          assert.deepEqual(await viewer.evaluate(el=>({text:getComputedStyle(el).color,bg:getComputedStyle(el).backgroundColor})),{text:controlExpected.text,bg:expected.subtle},name+' viewer pair');
          const states={guest:'viewing as a guest',member:'You are a member',moderator:'You are a member',pending:'Your request to join is pending review.',invite:'This group is invite-only.',closed:'This group is not accepting new members.',parent:'first to join this group.'};
          if(states[name])await expect(viewer).toContainText(states[name]);
          if(name==='moderator') {
            await expect(viewer.getByRole('link',{name:'Join requests'})).toHaveAttribute('href','/group/route-moderator/admin/join-requests');
            await expect(viewer.getByRole('link',{name:'Settings'})).toHaveAttribute('href','/group/route-moderator/admin/settings');
          }
          if(name==='parent')await expect(viewer.getByRole('button')).toHaveCount(0);
          for(const link of await viewer.getByRole('link').all()) {
            assert.equal(await link.evaluate(el=>getComputedStyle(el).color),controlExpected.text);
            assert.ok((await link.evaluate(el=>getComputedStyle(el).textDecorationLine)).includes('underline'));
            await page.keyboard.press('Tab');await link.focus();
            assert.equal(await link.evaluate(el=>getComputedStyle(el).outlineColor),expected.border);
          }
          if(name.includes('success')||name.includes('failure')) {
            const button=viewer.getByRole('button');
            const request=name.startsWith('request');
            const success=name.endsWith('success');
            await page.mouse.move(0,0);
            await expect.poll(()=>button.evaluate(el=>({text:getComputedStyle(el).color,bg:getComputedStyle(el).backgroundColor})),{message:name+' page CTA resting pair'}).toEqual({text:request?controlExpected.text:controlExpected.accentText,bg:request?'rgba(0, 0, 0, 0)':controlExpected.accent});
            await button.click();
            const message=success?(request?'Your request has been submitted.':'You have joined this group!'):(request?'Could not submit request. Please try again.':'Could not join. Please try again.');
            const feedback=viewer.getByText(message,{exact:true});
            await expect(feedback).toBeVisible();
            const tone=success?'success':'danger';
            const fg=await page.locator('[data-app="Crossroads"] [data-status="'+tone+'"]').evaluate(el=>getComputedStyle(el).color);
            assert.equal(await feedback.evaluate(el=>getComputedStyle(el).color),fg,'page action feedback foreground');
            if(success) {
              await expect(button).toBeDisabled();
              await page.waitForFunction(()=>typeof window.releaseRouteRefresh==='function');
              await page.evaluate(()=>window.releaseRouteRefresh());
              await expect(root).toContainText(request?'Your request to join is pending review.':'You are a member of Fixture public group.');
              await expect(root.getByRole('button')).toHaveCount(0);
            } else await expect(button).toBeEnabled();
          }
        }
        await setScenario('guest');
        const root=fixture.locator('.gpp-root');
        for(const badge of await root.locator('.chakra-badge').all())assert.deepEqual(await badge.evaluate(el=>({text:getComputedStyle(el).color,bg:getComputedStyle(el).backgroundColor})),{text:controlExpected.text,bg:expected.subtle});
        assert.equal(await root.locator('.gpp-member-avatar').first().evaluate(el=>getComputedStyle(el).backgroundColor),expected.subtle);
        assert.equal(await root.locator('.gpp-member-avatar').first().locator('div').evaluate(el=>getComputedStyle(el).color),controlExpected.text);
        assert.equal(await root.locator('.gpp-member-overflow').evaluate(el=>getComputedStyle(el).backgroundColor),expected.subtle);
        assert.equal(await root.locator('.gpp-member-overflow p').evaluate(el=>getComputedStyle(el).color),expected.muted);
        for(const link of await root.getByRole('link').all()) {
          await link.hover();
          await expect.poll(()=>link.evaluate(el=>getComputedStyle(el).color)).toBe(controlExpected.text);
          await page.keyboard.press('Tab');await link.focus();
          await expect.poll(()=>link.evaluate(el=>({color:getComputedStyle(el).outlineColor,width:getComputedStyle(el).outlineWidth,offset:getComputedStyle(el).outlineOffset}))).toEqual({color:expected.border,width:'3px',offset:'2px'});
        }
        const child=root.locator('.gpp-child-card');
        await child.hover();
        await expect.poll(()=>child.evaluate(el=>getComputedStyle(el).borderTopColor)).toBe(expected.border);
        for(const width of [1200,390]) {
          await page.setViewportSize({width,height:844});
          const routeImage=path.join(temp,id+'-'+mode+'-'+contrast+'-group-route-'+width+'.png');
          await root.screenshot({path:routeImage,animations:'disabled'});screenshots.push(routeImage);
        }
        await page.setViewportSize({width:1200,height:800});
      }
      if(publicConfirmation) {
        const fixture=page.locator('[data-confirmation]');
        for(const scenario of ['loading','success','failure','missing-uuid','missing-list']) {
          await page.evaluate(scenario=>window.setConfirmationScenario(scenario),scenario);
          await expect(fixture).toHaveAttribute('data-confirmation',scenario);
          const root=fixture.locator('.csc-root');
          await expect(root.getByRole('heading',{name:'Confirm Subscription'})).toBeVisible();
          assert.deepEqual(await root.evaluate(el=>({text:getComputedStyle(el).color,bg:getComputedStyle(el).backgroundColor})),{text:controlExpected.text,bg:expected.background},'confirmation owns its foreground and canvas');
          const message=scenario==='loading'?'Confirming your subscription...':scenario==='success'?'You’re confirmed and subscribed.':scenario==='failure'?'We couldn’t confirm your subscription. Please try again.':'Missing confirmation parameters.';
          const feedback=root.getByText(message,{exact:true});
          await expect(feedback).toBeVisible();
          const error=['failure','missing-uuid','missing-list'].includes(scenario);
          const tone=scenario==='success'?'success':'danger';
          const color=scenario==='loading'?expected.muted:await page.locator('[data-app="Crossroads"] [data-status="'+tone+'"]').evaluate(el=>getComputedStyle(el).color);
          assert.equal(await feedback.evaluate(el=>getComputedStyle(el).color),color,'confirmation '+scenario+' feedback');
          const requests=await page.evaluate(()=>window.confirmationRequests);
          assert.deepEqual(requests,scenario.startsWith('missing')?[]:[{url:'/api/lanternmail/confirm',params:{uuid:'fixture-'+scenario,list:'fixture-list'}}],'actual confirmation request receives route/search params');
          const retry=root.getByRole('button',{name:'Try Again'});
          await expect(retry).toHaveCount(error?1:0);
          if(error) {
            await retry.hover();
            await expect.poll(()=>retry.evaluate(el=>({text:getComputedStyle(el).color,bg:getComputedStyle(el).backgroundColor}))).toEqual({text:controlExpected.accentText,bg:controlExpected.accent});
            await page.keyboard.press('Tab');await retry.focus();
            await expect.poll(()=>retry.evaluate(el=>({color:getComputedStyle(el).outlineColor,width:getComputedStyle(el).outlineWidth,offset:getComputedStyle(el).outlineOffset}))).toEqual({color:expected.border,width:'3px',offset:'2px'});
          }
          if(['success','failure'].includes(scenario))for(const width of [1200,390]) {
            await page.setViewportSize({width,height:844});
            const confirmationImage=path.join(temp,id+'-'+mode+'-'+contrast+'-confirmation-'+scenario+'-'+width+'.png');
            await root.screenshot({path:confirmationImage,animations:'disabled'});screenshots.push(confirmationImage);
          }
          await page.setViewportSize({width:1200,height:800});
        }
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
    if(publicGroups) console.log('PASS: actual group admission guest/member/policy states, join/request success and failure, link focus and paired callouts in all eight theme/mode combinations; API/status refresh are inert fixtures');
    if(publicGroups) console.log('PASS: all four actual templates own canvas/text, metadata, badge pairs, member initials, content/child/parent links and keyboard focus in eight theme/mode combinations');
    if(publicGroups) console.log('PASS: opaque hero title/intro/text/image-caption/link/callout surfaces over bright, dark and absent banner media; long copy stays within a growing banner at desktop and mobile widths in eight theme/mode combinations; emblem and image artwork contrast is not certified');
    if(publicNav) console.log('PASS: actual public navbar loading, desktop dropdown, mobile drawer/current-link focus and authenticated logout colours in eight theme/mode combinations; auth/theme-selector are inert fixtures');
    if(publicGroupRoute) console.log('PASS: actual /group/[slug] page loading/error, guest/member/moderator/policy states, join/request success/refusal and parent-page refresh, semantic surfaces/initials/badges/link focus; eight theme/mode combinations and desktop/mobile screenshots; APIs/auth/onboarding are inert fixtures');
    if(publicConfirmation) console.log('PASS: actual subscription confirmation loading/success/refusal/missing-parameter feedback and request params, retry hover/focus, desktop/mobile screenshots in eight theme/mode combinations; requests are inert fixtures, retry reload is not invoked');
    console.log('Screenshots:',temp);
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
