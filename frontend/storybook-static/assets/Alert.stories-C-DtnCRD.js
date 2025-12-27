import{l as P,t as s,n as Y,p as z,i as e,c as t,S as c,d as E,a as k,g as _,j as L}from"./iframe-BQDcX1su.js";import{d as u}from"./design-system-CwcdUVvG.js";import"./preload-helper-PPVm8Dsz.js";var M=s('<svg aria-hidden=true class="h-5 w-5"fill=currentColor viewBox="0 0 20 20"><path fill-rule=evenodd d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"clip-rule=evenodd>'),V=s('<svg aria-hidden=true class="h-5 w-5"fill=currentColor viewBox="0 0 20 20"><path fill-rule=evenodd d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"clip-rule=evenodd>'),q=s('<svg aria-hidden=true class="h-5 w-5"fill=currentColor viewBox="0 0 20 20"><path fill-rule=evenodd d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"clip-rule=evenodd>'),I=s('<svg aria-hidden=true class="h-5 w-5"fill=currentColor viewBox="0 0 20 20"><path fill-rule=evenodd d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"clip-rule=evenodd>'),B=s('<h3 class="font-medium text-sm">'),H=s('<button type=button><svg aria-hidden=true class="h-5 w-5"fill=none stroke=currentColor viewBox="0 0 24 24"><path stroke-linecap=round stroke-linejoin=round stroke-width=2 d="M6 18L18 6M6 6l12 12">'),N=s('<div role=alert><div></div><div class="min-w-0 flex-1"><div>');const O={success:"bg-green-50 border-green-200 text-green-800",warning:"bg-yellow-50 border-yellow-200 text-yellow-800",error:"bg-red-50 border-red-200 text-red-800",info:"bg-blue-50 border-blue-200 text-blue-800"},W={success:"text-green-500",warning:"text-yellow-500",error:"text-red-500",info:"text-blue-500"};function i(n){const[a,T]=P(n,["variant","title","children","class","onClose"]),o=a.variant??"info";return(()=>{var d=N(),l=d.firstChild,A=l.nextSibling,S=A.firstChild;return Y(d,z({get class(){return u("flex items-start space-x-3 rounded-lg border p-4",O[o],a.class)}},T),!1,!0),e(l,t(c,{when:o==="success",get children(){return M()}}),null),e(l,t(c,{when:o==="warning",get children(){return V()}}),null),e(l,t(c,{when:o==="error",get children(){return q()}}),null),e(l,t(c,{when:o==="info",get children(){return I()}}),null),e(A,t(c,{get when(){return a.title},get children(){var r=B();return e(r,()=>a.title),r}}),S),e(S,()=>a.children),e(d,t(c,{get when(){return a.onClose},get children(){var r=H();return E(r,"click",a.onClose,!0),k(()=>_(r,u("ml-auto shrink-0",W[o],"hover:opacity-70"))),r}}),null),k(r=>{var C=u("mt-0.5 shrink-0",W[o]),$=u("text-sm",a.title&&"mt-1");return C!==r.e&&_(l,r.e=C),$!==r.t&&_(S,r.t=$),r},{e:void 0,t:void 0}),d})()}L(["click"]);try{i.displayName="Alert",i.__docgenInfo={description:"",displayName:"Alert",props:{variant:{defaultValue:null,description:"",name:"variant",required:!1,type:{name:"enum",value:[{value:"undefined"},{value:'"success"'},{value:'"warning"'},{value:'"error"'},{value:'"info"'}]}},title:{defaultValue:null,description:"",name:"title",required:!1,type:{name:"string | undefined"}},onClose:{defaultValue:null,description:"",name:"onClose",required:!1,type:{name:"(() => void) | undefined"}}}}}catch{}var R=s("<div style=width:500px>"),j=s("<div style=display:flex;flex-direction:column;gap:16px>");const D={title:"Design System/Alert",component:i,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{variant:{control:"select",options:["success","warning","error","info"]}},decorators:[n=>(()=>{var a=R();return e(a,t(n,{})),a})()]},m={args:{variant:"success",children:"Your changes have been saved successfully."}},p={args:{variant:"warning",children:"Your session will expire in 5 minutes. Please save your work."}},g={args:{variant:"error",children:"There was an error processing your request. Please try again."}},v={args:{variant:"info",children:"A new version is available. Refresh to update."}},h={args:{variant:"success",title:"Payment Successful",children:"Your payment of $49.99 has been processed. A receipt has been sent to your email."}},f={args:{variant:"error",title:"Connection Failed",children:"Unable to connect to the streaming server. Check your internet connection and try again."}},w={args:{variant:"warning",title:"Stream Quality Warning",children:"Your upload speed is below recommended levels. Consider lowering your stream quality."}},y={args:{variant:"info",title:"Tip",children:"You can use keyboard shortcuts to control your stream. Press ? to see all available shortcuts."}},b={render:()=>(()=>{var n=j();return e(n,t(i,{variant:"success",title:"Success",children:"Operation completed successfully."}),null),e(n,t(i,{variant:"warning",title:"Warning",children:"Please review before continuing."}),null),e(n,t(i,{variant:"error",title:"Error",children:"Something went wrong."}),null),e(n,t(i,{variant:"info",title:"Information",children:"Here's something you should know."}),null),n})()},x={args:{variant:"info",title:"Stream Analytics Available",children:"Your stream analytics for the past 30 days are now ready to view. This includes detailed viewer statistics, chat engagement metrics, peak viewer times, and follower growth data. Visit the Analytics dashboard to explore your performance insights."}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "success",
    children: "Your changes have been saved successfully."
  }
}`,...m.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "warning",
    children: "Your session will expire in 5 minutes. Please save your work."
  }
}`,...p.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "error",
    children: "There was an error processing your request. Please try again."
  }
}`,...g.parameters?.docs?.source}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "info",
    children: "A new version is available. Refresh to update."
  }
}`,...v.parameters?.docs?.source}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "success",
    title: "Payment Successful",
    children: "Your payment of $49.99 has been processed. A receipt has been sent to your email."
  }
}`,...h.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "error",
    title: "Connection Failed",
    children: "Unable to connect to the streaming server. Check your internet connection and try again."
  }
}`,...f.parameters?.docs?.source}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "warning",
    title: "Stream Quality Warning",
    children: "Your upload speed is below recommended levels. Consider lowering your stream quality."
  }
}`,...w.parameters?.docs?.source}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "info",
    title: "Tip",
    children: "You can use keyboard shortcuts to control your stream. Press ? to see all available shortcuts."
  }
}`,...y.parameters?.docs?.source}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    "flex-direction": "column",
    gap: "16px"
  }}>
            <Alert variant="success" title="Success">
                Operation completed successfully.
            </Alert>
            <Alert variant="warning" title="Warning">
                Please review before continuing.
            </Alert>
            <Alert variant="error" title="Error">
                Something went wrong.
            </Alert>
            <Alert variant="info" title="Information">
                Here's something you should know.
            </Alert>
        </div>
}`,...b.parameters?.docs?.source}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "info",
    title: "Stream Analytics Available",
    children: "Your stream analytics for the past 30 days are now ready to view. This includes detailed viewer statistics, chat engagement metrics, peak viewer times, and follower growth data. Visit the Analytics dashboard to explore your performance insights."
  }
}`,...x.parameters?.docs?.source}}};const G=["Success","Warning","Error","Info","WithTitle","ErrorWithTitle","WarningWithTitle","InfoWithTitle","AllVariants","LongContent"];export{b as AllVariants,g as Error,f as ErrorWithTitle,v as Info,y as InfoWithTitle,x as LongContent,m as Success,p as Warning,w as WarningWithTitle,h as WithTitle,G as __namedExportsOrder,D as default};
