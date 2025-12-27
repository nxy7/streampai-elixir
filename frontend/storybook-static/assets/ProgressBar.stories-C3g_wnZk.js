import{l as E,t as o,n as L,p as W,i as r,c as s,S as P,v as A,s as G,a as j,g as M}from"./iframe-BQDcX1su.js";import{d as B}from"./design-system-CwcdUVvG.js";import"./preload-helper-PPVm8Dsz.js";var N=o("<span class=text-gray-600>"),F=o('<span class="font-medium text-gray-900">'),I=o('<div class="mb-1 flex justify-between text-sm">'),O=o("<div><div><div role=progressbar aria-valuemin=0>");const R={primary:"bg-indigo-600",success:"bg-green-600",warning:"bg-yellow-500",danger:"bg-red-600"},T={sm:"h-1",md:"h-2",lg:"h-3"};function l(e){const[a,_]=E(e,["value","max","variant","size","label","showValue","class"]),u=a.max??100,q=Math.min(100,Math.max(0,a.value/u*100));return(()=>{var i=O(),$=i.firstChild,c=$.firstChild;return L(i,W({get class(){return B("w-full",a.class)}},_),!1,!0),r(i,s(P,{get when(){return a.label||a.showValue},get children(){var n=I();return r(n,s(P,{get when(){return a.label},get children(){var t=N();return r(t,()=>a.label),t}}),null),r(n,s(P,{get when(){return a.showValue},get children(){var t=F();return r(t,()=>a.value,null),r(t,u!==100&&`/${u}`,null),t}}),null),n}}),$),A(c,"width",`${q}%`),G(c,"aria-valuemax",u),j(n=>{var t=B("w-full overflow-hidden rounded-full bg-gray-200",T[a.size??"md"]),C=B("h-full rounded-full transition-all duration-500",R[a.variant??"primary"]),D=a.value;return t!==n.e&&M($,n.e=t),C!==n.t&&M(c,n.t=C),D!==n.a&&G(c,"aria-valuenow",n.a=D),n},{e:void 0,t:void 0,a:void 0}),i})()}try{l.displayName="ProgressBar",l.__docgenInfo={description:"",displayName:"ProgressBar",props:{value:{defaultValue:null,description:"",name:"value",required:!0,type:{name:"number"}},max:{defaultValue:null,description:"",name:"max",required:!1,type:{name:"number | undefined"}},variant:{defaultValue:null,description:"",name:"variant",required:!1,type:{name:"enum",value:[{value:"undefined"},{value:'"primary"'},{value:'"success"'},{value:'"warning"'},{value:'"danger"'}]}},size:{defaultValue:null,description:"",name:"size",required:!1,type:{name:"enum",value:[{value:"undefined"},{value:'"sm"'},{value:'"md"'},{value:'"lg"'}]}},label:{defaultValue:null,description:"",name:"label",required:!1,type:{name:"string | undefined"}},showValue:{defaultValue:null,description:"",name:"showValue",required:!1,type:{name:"boolean | undefined"}}}}}catch{}var k=o("<div style=width:400px>"),U=o("<div style=display:flex;flex-direction:column;gap:16px>"),H=o("<div style=display:flex;flex-direction:column;gap:16px><p style=font-size:12px;color:#6b7280;margin:0>2.5 GB of 10 GB used"),J=o("<div style=display:flex;flex-direction:column;gap:8px><div style=display:flex;justify-content:space-between;font-size:14px><span style=color:#059669;font-weight:600>$340</span><span style=color:#6b7280>Goal: $500");const Y={title:"Design System/ProgressBar",component:l,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{variant:{control:"select",options:["primary","success","warning","danger"]},size:{control:"select",options:["sm","md","lg"]},value:{control:{type:"range",min:0,max:100}}},decorators:[e=>(()=>{var a=k();return r(a,s(e,{})),a})()]},d={args:{value:60}},m={args:{value:75,label:"Upload Progress",showValue:!0}},p={args:{value:50,variant:"primary",label:"Processing",showValue:!0}},g={args:{value:100,variant:"success",label:"Complete",showValue:!0}},v={args:{value:80,variant:"warning",label:"Storage Used",showValue:!0}},f={args:{value:95,variant:"danger",label:"Storage Critical",showValue:!0}},y={args:{value:40,size:"sm"}},b={args:{value:60,size:"md"}},x={args:{value:80,size:"lg"}},h={args:{value:750,max:1e3,label:"Followers",showValue:!0}},w={render:()=>(()=>{var e=U();return r(e,s(l,{value:60,variant:"primary",label:"Primary",showValue:!0}),null),r(e,s(l,{value:80,variant:"success",label:"Success",showValue:!0}),null),r(e,s(l,{value:50,variant:"warning",label:"Warning",showValue:!0}),null),r(e,s(l,{value:90,variant:"danger",label:"Danger",showValue:!0}),null),e})()},S={render:()=>(()=>{var e=U();return r(e,s(l,{value:60,size:"sm",label:"Small"}),null),r(e,s(l,{value:60,size:"md",label:"Medium"}),null),r(e,s(l,{value:60,size:"lg",label:"Large"}),null),e})()},V={render:()=>(()=>{var e=H(),a=e.firstChild;return r(e,s(l,{value:2.5,max:10,variant:"primary",label:"Storage",showValue:!0}),a),e})(),name:"Storage Usage Example"},z={render:()=>(()=>{var e=J(),a=e.firstChild,_=a.firstChild;return _.nextSibling,r(e,s(l,{value:340,max:500,variant:"success",size:"lg"}),a),e})(),name:"Donation Goal Example"};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    value: 60
  }
}`,...d.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    value: 75,
    label: "Upload Progress",
    showValue: true
  }
}`,...m.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    value: 50,
    variant: "primary",
    label: "Processing",
    showValue: true
  }
}`,...p.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    value: 100,
    variant: "success",
    label: "Complete",
    showValue: true
  }
}`,...g.parameters?.docs?.source}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    value: 80,
    variant: "warning",
    label: "Storage Used",
    showValue: true
  }
}`,...v.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    value: 95,
    variant: "danger",
    label: "Storage Critical",
    showValue: true
  }
}`,...f.parameters?.docs?.source}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    value: 40,
    size: "sm"
  }
}`,...y.parameters?.docs?.source}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    value: 60,
    size: "md"
  }
}`,...b.parameters?.docs?.source}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    value: 80,
    size: "lg"
  }
}`,...x.parameters?.docs?.source}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    value: 750,
    max: 1000,
    label: "Followers",
    showValue: true
  }
}`,...h.parameters?.docs?.source}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    "flex-direction": "column",
    gap: "16px"
  }}>
            <ProgressBar value={60} variant="primary" label="Primary" showValue />
            <ProgressBar value={80} variant="success" label="Success" showValue />
            <ProgressBar value={50} variant="warning" label="Warning" showValue />
            <ProgressBar value={90} variant="danger" label="Danger" showValue />
        </div>
}`,...w.parameters?.docs?.source}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    "flex-direction": "column",
    gap: "16px"
  }}>
            <ProgressBar value={60} size="sm" label="Small" />
            <ProgressBar value={60} size="md" label="Medium" />
            <ProgressBar value={60} size="lg" label="Large" />
        </div>
}`,...S.parameters?.docs?.source}}};V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    "flex-direction": "column",
    gap: "16px"
  }}>
            <ProgressBar value={2.5} max={10} variant="primary" label="Storage" showValue />
            <p style={{
      "font-size": "12px",
      color: "#6b7280",
      margin: 0
    }}>
                2.5 GB of 10 GB used
            </p>
        </div>,
  name: "Storage Usage Example"
}`,...V.parameters?.docs?.source}}};z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    "flex-direction": "column",
    gap: "8px"
  }}>
            <ProgressBar value={340} max={500} variant="success" size="lg" />
            <div style={{
      display: "flex",
      "justify-content": "space-between",
      "font-size": "14px"
    }}>
                <span style={{
        color: "#059669",
        "font-weight": "600"
      }}>$340</span>
                <span style={{
        color: "#6b7280"
      }}>Goal: $500</span>
            </div>
        </div>,
  name: "Donation Goal Example"
}`,...z.parameters?.docs?.source}}};const Z=["Default","WithLabel","Primary","Success","Warning","Danger","SmallSize","MediumSize","LargeSize","CustomMax","AllVariants","AllSizes","StorageUsage","DonationGoal"];export{S as AllSizes,w as AllVariants,h as CustomMax,f as Danger,d as Default,z as DonationGoal,x as LargeSize,b as MediumSize,p as Primary,y as SmallSize,V as StorageUsage,g as Success,v as Warning,m as WithLabel,Z as __namedExportsOrder,Y as default};
