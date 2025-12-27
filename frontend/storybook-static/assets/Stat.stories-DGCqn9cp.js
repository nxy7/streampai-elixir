import{l as M,t as s,n as D,p as R,i as l,c as e,S as g,a as L,g as G}from"./iframe-BQDcX1su.js";import{C as T}from"./Card-tIayDlwk.js";import{d as c}from"./design-system-CwcdUVvG.js";import"./preload-helper-PPVm8Dsz.js";var A=s('<div class="mb-2 flex justify-center">'),q=s('<svg aria-hidden=true class="mr-0.5 h-3 w-3"fill=currentColor viewBox="0 0 20 20"><path fill-rule=evenodd d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"clip-rule=evenodd>'),N=s('<span class="ml-1 text-gray-400">'),P=s("<div><span>%"),W=s("<div><p></p><p>"),j=s('<svg aria-hidden=true class="mr-0.5 h-3 w-3"fill=currentColor viewBox="0 0 20 20"><path fill-rule=evenodd d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"clip-rule=evenodd>'),B=s("<div>");const F={sm:"text-lg font-semibold",md:"text-2xl font-semibold",lg:"text-3xl font-bold"};function r(t){const[a,V]=M(t,["value","label","size","highlight","icon","trend","class"]),v=a.size??"md",o=a.trend&&a.trend.value>=0;return(()=>{var u=W(),p=u.firstChild,E=p.nextSibling;return D(u,R({get class(){return c("text-center",a.class)}},V),!1,!0),l(u,e(g,{get when(){return a.icon},get children(){var n=A();return l(n,()=>a.icon),n}}),p),l(p,()=>a.value),l(E,()=>a.label),l(u,e(g,{get when(){return a.trend},get children(){var n=P(),i=n.firstChild,d=i.firstChild;return l(n,e(g,{when:o,get fallback(){return j()},get children(){return q()}}),i),l(i,o?"+":"",d),l(i,()=>a.trend?.value,d),l(n,e(g,{get when(){return a.trend?.label},get children(){var k=N();return l(k,()=>a.trend?.label),k}}),null),L(()=>G(n,c("mt-1 flex items-center justify-center text-xs",o?"text-green-600":"text-red-600"))),n}}),null),L(n=>{var i=c(F[v],a.highlight?"text-indigo-600":"text-gray-900"),d=c(v==="sm"?"text-xs":"text-sm","text-gray-500");return i!==n.e&&G(p,n.e=i),d!==n.t&&G(E,n.t=d),n},{e:void 0,t:void 0}),u})()}function m(t){const[a,V]=M(t,["children","columns","class"]),v={2:"grid-cols-2",3:"grid-cols-3",4:"grid-cols-4"};return(()=>{var o=B();return D(o,R({get class(){return c("grid gap-4",v[a.columns??3],a.class)}},V),!1,!0),l(o,()=>a.children),o})()}try{r.displayName="Stat",r.__docgenInfo={description:"",displayName:"Stat",props:{value:{defaultValue:null,description:"",name:"value",required:!0,type:{name:"string | number"}},label:{defaultValue:null,description:"",name:"label",required:!0,type:{name:"string"}},size:{defaultValue:null,description:"",name:"size",required:!1,type:{name:"enum",value:[{value:"undefined"},{value:'"sm"'},{value:'"md"'},{value:'"lg"'}]}},highlight:{defaultValue:null,description:"",name:"highlight",required:!1,type:{name:"boolean | undefined"}},icon:{defaultValue:null,description:"",name:"icon",required:!1,type:{name:"Element"}},trend:{defaultValue:null,description:"",name:"trend",required:!1,type:{name:"{ value: number; label?: string | undefined; } | undefined"}}}}}catch{}try{m.displayName="StatGroup",m.__docgenInfo={description:"",displayName:"StatGroup",props:{columns:{defaultValue:null,description:"",name:"columns",required:!1,type:{name:"enum",value:[{value:"undefined"},{value:"2"},{value:"3"},{value:"4"}]}}}}}catch{}var H=s('<svg class="h-8 w-8 text-purple-500"fill=none stroke=currentColor viewBox="0 0 24 24"><path stroke-linecap=round stroke-linejoin=round stroke-width=2 d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z">'),I=s("<div style=width:500px>"),J=s("<div style=width:600px>"),X=s("<div style=width:800px>"),K=s("<div style=display:flex;gap:48px;align-items:flex-end>");const Z={title:"Design System/Stat",component:r,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{size:{control:"select",options:["sm","md","lg"]},highlight:{control:"boolean"}}},h={args:{value:"1,234",label:"Total Viewers"}},S={args:{value:"89%",label:"Engagement Rate",highlight:!0}},b={args:{value:"456",label:"Followers",size:"sm"}},f={args:{value:"$12,500",label:"Total Revenue",size:"lg"}},x={args:{value:"2,450",label:"Monthly Viewers",trend:{value:12.5,label:"vs last month"}}},y={args:{value:"1,890",label:"Active Subscribers",trend:{value:-3.2,label:"vs last month"}}},_={args:{value:"42",label:"Live Streams",icon:H()}},z={render:()=>e(T,{get children(){return e(m,{columns:3,get children(){return[e(r,{value:"3",label:"Days streamed"}),e(r,{value:"170",label:"Peak viewers",highlight:!0}),e(r,{value:"114",label:"Avg viewers"})]}})}}),name:"Stat Group (3 columns)",decorators:[t=>(()=>{var a=I();return l(a,e(t,{})),a})()]},w={render:()=>e(T,{get children(){return e(m,{columns:4,get children(){return[e(r,{value:"12",label:"Streams",size:"sm"}),e(r,{value:"8.4h",label:"Total Time",size:"sm"}),e(r,{value:"2.1K",label:"Viewers",size:"sm"}),e(r,{value:"89%",label:"Retention",size:"sm"})]}})}}),name:"Stat Group (4 columns)",decorators:[t=>(()=>{var a=J();return l(a,e(t,{})),a})()]},$={render:()=>e(T,{get children(){return e(m,{columns:4,get children(){return[e(r,{value:"$2,450",label:"Revenue",trend:{value:12.5,label:"vs last month"}}),e(r,{value:"1,234",label:"Subscribers",trend:{value:8.2,label:"vs last month"}}),e(r,{value:"89%",label:"Engagement",highlight:!0,trend:{value:-2.1,label:"vs last month"}}),e(r,{value:"42h",label:"Stream Time",trend:{value:15,label:"vs last month"}})]}})}}),name:"Dashboard Stats Example",decorators:[t=>(()=>{var a=X();return l(a,e(t,{})),a})()]},C={render:()=>(()=>{var t=K();return l(t,e(r,{value:"Small",label:"Size: sm",size:"sm"}),null),l(t,e(r,{value:"Medium",label:"Size: md",size:"md"}),null),l(t,e(r,{value:"Large",label:"Size: lg",size:"lg"}),null),t})()};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    value: "1,234",
    label: "Total Viewers"
  }
}`,...h.parameters?.docs?.source}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    value: "89%",
    label: "Engagement Rate",
    highlight: true
  }
}`,...S.parameters?.docs?.source}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    value: "456",
    label: "Followers",
    size: "sm"
  }
}`,...b.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    value: "$12,500",
    label: "Total Revenue",
    size: "lg"
  }
}`,...f.parameters?.docs?.source}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    value: "2,450",
    label: "Monthly Viewers",
    trend: {
      value: 12.5,
      label: "vs last month"
    }
  }
}`,...x.parameters?.docs?.source}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    value: "1,890",
    label: "Active Subscribers",
    trend: {
      value: -3.2,
      label: "vs last month"
    }
  }
}`,...y.parameters?.docs?.source}}};_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    value: "42",
    label: "Live Streams",
    icon: <svg class="h-8 w-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
  }
}`,..._.parameters?.docs?.source}}};z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  render: () => <Card>
            <StatGroup columns={3}>
                <Stat value="3" label="Days streamed" />
                <Stat value="170" label="Peak viewers" highlight />
                <Stat value="114" label="Avg viewers" />
            </StatGroup>
        </Card>,
  name: "Stat Group (3 columns)",
  decorators: [(Story: () => JSX.Element) => <div style={{
    width: "500px"
  }}>
                <Story />
            </div>]
}`,...z.parameters?.docs?.source}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  render: () => <Card>
            <StatGroup columns={4}>
                <Stat value="12" label="Streams" size="sm" />
                <Stat value="8.4h" label="Total Time" size="sm" />
                <Stat value="2.1K" label="Viewers" size="sm" />
                <Stat value="89%" label="Retention" size="sm" />
            </StatGroup>
        </Card>,
  name: "Stat Group (4 columns)",
  decorators: [(Story: () => JSX.Element) => <div style={{
    width: "600px"
  }}>
                <Story />
            </div>]
}`,...w.parameters?.docs?.source}}};$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`{
  render: () => <Card>
            <StatGroup columns={4}>
                <Stat value="$2,450" label="Revenue" trend={{
        value: 12.5,
        label: "vs last month"
      }} />
                <Stat value="1,234" label="Subscribers" trend={{
        value: 8.2,
        label: "vs last month"
      }} />
                <Stat value="89%" label="Engagement" highlight trend={{
        value: -2.1,
        label: "vs last month"
      }} />
                <Stat value="42h" label="Stream Time" trend={{
        value: 15.0,
        label: "vs last month"
      }} />
            </StatGroup>
        </Card>,
  name: "Dashboard Stats Example",
  decorators: [(Story: () => JSX.Element) => <div style={{
    width: "800px"
  }}>
                <Story />
            </div>]
}`,...$.parameters?.docs?.source}}};C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    gap: "48px",
    "align-items": "flex-end"
  }}>
            <Stat value="Small" label="Size: sm" size="sm" />
            <Stat value="Medium" label="Size: md" size="md" />
            <Stat value="Large" label="Size: lg" size="lg" />
        </div>
}`,...C.parameters?.docs?.source}}};const ee=["Default","Highlighted","Small","Large","WithPositiveTrend","WithNegativeTrend","WithIcon","StatGroupExample","StatGroupFourColumns","DashboardStats","AllSizes"];export{C as AllSizes,$ as DashboardStats,h as Default,S as Highlighted,f as Large,b as Small,z as StatGroupExample,w as StatGroupFourColumns,_ as WithIcon,y as WithNegativeTrend,x as WithPositiveTrend,ee as __namedExportsOrder,Z as default};
