import{c as a,t as e,i as S}from"./iframe-BQDcX1su.js";import{I as g,T as x,S as v}from"./Input--ZGeZUqs.js";import"./preload-helper-PPVm8Dsz.js";import"./design-system-CwcdUVvG.js";var y=e("<div style=width:300px>"),E=e("<option value>Select a country"),f=e("<option value=us>United States"),_=e("<option value=uk>United Kingdom"),W=e("<option value=ca>Canada"),w=e("<option value=au>Australia"),$=e("<option value>Select your timezone"),D=e("<option value=pst>Pacific Time (PST)"),P=e("<option value=mst>Mountain Time (MST)"),C=e("<option value=cst>Central Time (CST)"),I=e("<option value=est>Eastern Time (EST)"),A=e("<option value>Select a plan"),M=e("<option value=free>Free"),H=e("<option value=pro>Pro"),L=e("<option value=enterprise>Enterprise"),U=e("<option value>Choose an option"),O=e("<option value=1>Option 1"),z=e("<option value=2>Option 2"),B=e("<div style=display:flex;flex-direction:column;gap:24px>");const R={title:"Design System/Input",component:g,parameters:{layout:"centered"},tags:["autodocs"],decorators:[r=>(()=>{var b=y();return S(b,a(r,{})),b})()]},t={args:{placeholder:"Enter text..."}},o={args:{label:"Email Address",placeholder:"you@example.com",type:"email"}},l={args:{label:"Username",placeholder:"johndoe",helperText:"This will be your public display name"}},n={args:{label:"Email",placeholder:"you@example.com",value:"invalid-email",error:"Please enter a valid email address"}},s={args:{label:"Disabled Input",placeholder:"Cannot edit",disabled:!0,value:"Read only content"}},p={args:{label:"Password",placeholder:"Enter your password",type:"password",helperText:"Must be at least 8 characters"}},i={render:()=>a(x,{placeholder:"Enter your message...",rows:4}),name:"Textarea - Default"},c={render:()=>a(x,{label:"Description",placeholder:"Tell us about yourself...",rows:4,helperText:"Maximum 500 characters"}),name:"Textarea - With Label"},u={render:()=>a(x,{label:"Bio",value:"x",rows:4,error:"Bio must be at least 10 characters"}),name:"Textarea - With Error"},m={render:()=>a(v,{label:"Country",get children(){return[E(),f(),_(),W(),w()]}}),name:"Select - Default"},d={render:()=>a(v,{label:"Timezone",helperText:"This affects when notifications are sent",get children(){return[$(),D(),P(),C(),I()]}}),name:"Select - With Helper"},h={render:()=>a(v,{label:"Plan",error:"Please select a plan to continue",get children(){return[A(),M(),H(),L()]}}),name:"Select - With Error"},T={render:()=>(()=>{var r=B();return S(r,a(g,{label:"Text Input",placeholder:"Enter text..."}),null),S(r,a(x,{label:"Textarea",placeholder:"Enter description...",rows:3}),null),S(r,a(v,{label:"Select",get children(){return[U(),O(),z()]}}),null),r})(),name:"All Input Types"};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: "Enter text..."
  }
}`,...t.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    label: "Email Address",
    placeholder: "you@example.com",
    type: "email"
  }
}`,...o.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    label: "Username",
    placeholder: "johndoe",
    helperText: "This will be your public display name"
  }
}`,...l.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    label: "Email",
    placeholder: "you@example.com",
    value: "invalid-email",
    error: "Please enter a valid email address"
  }
}`,...n.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    label: "Disabled Input",
    placeholder: "Cannot edit",
    disabled: true,
    value: "Read only content"
  }
}`,...s.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    label: "Password",
    placeholder: "Enter your password",
    type: "password",
    helperText: "Must be at least 8 characters"
  }
}`,...p.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => <Textarea placeholder="Enter your message..." rows={4} />,
  name: "Textarea - Default"
}`,...i.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => <Textarea label="Description" placeholder="Tell us about yourself..." rows={4} helperText="Maximum 500 characters" />,
  name: "Textarea - With Label"
}`,...c.parameters?.docs?.source}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => <Textarea label="Bio" value="x" rows={4} error="Bio must be at least 10 characters" />,
  name: "Textarea - With Error"
}`,...u.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => <Select label="Country">
            <option value="">Select a country</option>
            <option value="us">United States</option>
            <option value="uk">United Kingdom</option>
            <option value="ca">Canada</option>
            <option value="au">Australia</option>
        </Select>,
  name: "Select - Default"
}`,...m.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <Select label="Timezone" helperText="This affects when notifications are sent">
            <option value="">Select your timezone</option>
            <option value="pst">Pacific Time (PST)</option>
            <option value="mst">Mountain Time (MST)</option>
            <option value="cst">Central Time (CST)</option>
            <option value="est">Eastern Time (EST)</option>
        </Select>,
  name: "Select - With Helper"
}`,...d.parameters?.docs?.source}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => <Select label="Plan" error="Please select a plan to continue">
            <option value="">Select a plan</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
        </Select>,
  name: "Select - With Error"
}`,...h.parameters?.docs?.source}}};T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    "flex-direction": "column",
    gap: "24px"
  }}>
            <Input label="Text Input" placeholder="Enter text..." />
            <Textarea label="Textarea" placeholder="Enter description..." rows={3} />
            <Select label="Select">
                <option value="">Choose an option</option>
                <option value="1">Option 1</option>
                <option value="2">Option 2</option>
            </Select>
        </div>,
  name: "All Input Types"
}`,...T.parameters?.docs?.source}}};const q=["Default","WithLabel","WithHelperText","WithError","Disabled","Password","TextareaDefault","TextareaWithLabel","TextareaWithError","SelectDefault","SelectWithHelper","SelectWithError","AllInputTypes"];export{T as AllInputTypes,t as Default,s as Disabled,p as Password,m as SelectDefault,h as SelectWithError,d as SelectWithHelper,i as TextareaDefault,u as TextareaWithError,c as TextareaWithLabel,n as WithError,l as WithHelperText,o as WithLabel,q as __namedExportsOrder,R as default};
