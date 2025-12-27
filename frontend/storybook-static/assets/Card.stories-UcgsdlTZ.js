import{c as t,t as e,i as a}from"./iframe-BQDcX1su.js";import{B as v}from"./Button-_cU9cDJe.js";import{C as i,a as C,b as y,c as f}from"./Card-tIayDlwk.js";import"./preload-helper-PPVm8Dsz.js";import"./design-system-CwcdUVvG.js";var x=e("<div style=width:400px>"),_=e('<div><h3 style="margin:0 0 8px 0;font-weight:600">Card Title</h3><p style=margin:0;color:#6b7280>This is a default card with some content inside. Cards are used to group related information.'),$=e('<div><h3 style="margin:0 0 8px 0;font-weight:600">Clickable Card</h3><p style=margin:0;color:#6b7280>Hover over this card to see the interactive effect.'),b=e('<div><h3 style="margin:0 0 8px 0;font-weight:600">Premium Feature</h3><p style=margin:0;opacity:0.9>Upgrade to unlock this amazing feature and many more.'),S=e('<div><h3 style="margin:0 0 8px 0;font-weight:600">Outline Card</h3><p style=margin:0;color:#6b7280>A subtle card variant with just a border.'),w=e('<div><div style="padding:16px;border-bottom:1px solid #e5e7eb"><h3 style=margin:0;font-weight:600>Card Header</h3></div><div style=padding:16px><p style=margin:0;color:#6b7280>Card body content'),H=e("<p style=margin:0;color:#6b7280>Configure your stream settings here. You can change the title, description, and other options."),A=e("<div style=margin-top:16px>"),T=e("<p style=margin:0>Default Card"),O=e("<p style=margin:0>Interactive Card (hover me)"),P=e("<p style=margin:0>Outline Card"),D=e("<p style=margin:0>Gradient Card"),u=e("<div style=display:flex;flex-direction:column;gap:16px>"),k=e("<p style=margin:0>Small padding"),B=e("<p style=margin:0>Medium padding (default)"),G=e("<p style=margin:0>Large padding");const M={title:"Design System/Card",component:i,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{variant:{control:"select",options:["default","interactive","gradient","outline"]},padding:{control:"select",options:["none","sm","md","lg"]}},decorators:[n=>(()=>{var r=x();return a(r,t(n,{})),r})()]},d={args:{children:(()=>{var n=_(),r=n.firstChild;return r.nextSibling,n})()}},l={args:{variant:"interactive",children:(()=>{var n=$(),r=n.firstChild;return r.nextSibling,n})()}},s={args:{variant:"gradient",children:(()=>{var n=b(),r=n.firstChild;return r.nextSibling,n})()}},o={args:{variant:"outline",children:(()=>{var n=S(),r=n.firstChild;return r.nextSibling,n})()}},p={args:{padding:"none",children:(()=>{var n=w(),r=n.firstChild;r.firstChild;var h=r.nextSibling;return h.firstChild,n})()}},c={render:()=>t(i,{padding:"none",get children(){return[t(C,{get children(){return t(y,{children:"Stream Settings"})}}),t(f,{get children(){return[H(),(()=>{var n=A();return a(n,t(v,{children:"Save Settings"})),n})()]}})]}})},g={render:()=>(()=>{var n=u();return a(n,t(i,{variant:"default",get children(){return T()}}),null),a(n,t(i,{variant:"interactive",get children(){return O()}}),null),a(n,t(i,{variant:"outline",get children(){return P()}}),null),a(n,t(i,{variant:"gradient",get children(){return D()}}),null),n})()},m={render:()=>(()=>{var n=u();return a(n,t(i,{padding:"sm",get children(){return k()}}),null),a(n,t(i,{padding:"md",get children(){return B()}}),null),a(n,t(i,{padding:"lg",get children(){return G()}}),null),n})()};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    children: <div>
                <h3 style={{
        margin: "0 0 8px 0",
        "font-weight": "600"
      }}>
                    Card Title
                </h3>
                <p style={{
        margin: 0,
        color: "#6b7280"
      }}>
                    This is a default card with some content inside. Cards are used to
                    group related information.
                </p>
            </div>
  }
}`,...d.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "interactive",
    children: <div>
                <h3 style={{
        margin: "0 0 8px 0",
        "font-weight": "600"
      }}>
                    Clickable Card
                </h3>
                <p style={{
        margin: 0,
        color: "#6b7280"
      }}>
                    Hover over this card to see the interactive effect.
                </p>
            </div>
  }
}`,...l.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "gradient",
    children: <div>
                <h3 style={{
        margin: "0 0 8px 0",
        "font-weight": "600"
      }}>
                    Premium Feature
                </h3>
                <p style={{
        margin: 0,
        opacity: 0.9
      }}>
                    Upgrade to unlock this amazing feature and many more.
                </p>
            </div>
  }
}`,...s.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "outline",
    children: <div>
                <h3 style={{
        margin: "0 0 8px 0",
        "font-weight": "600"
      }}>
                    Outline Card
                </h3>
                <p style={{
        margin: 0,
        color: "#6b7280"
      }}>
                    A subtle card variant with just a border.
                </p>
            </div>
  }
}`,...o.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    padding: "none",
    children: <div>
                <div style={{
        padding: "16px",
        "border-bottom": "1px solid #e5e7eb"
      }}>
                    <h3 style={{
          margin: 0,
          "font-weight": "600"
        }}>Card Header</h3>
                </div>
                <div style={{
        padding: "16px"
      }}>
                    <p style={{
          margin: 0,
          color: "#6b7280"
        }}>Card body content</p>
                </div>
            </div>
  }
}`,...p.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => <Card padding="none">
            <CardHeader>
                <CardTitle>Stream Settings</CardTitle>
            </CardHeader>
            <CardContent>
                <p style={{
        margin: 0,
        color: "#6b7280"
      }}>
                    Configure your stream settings here. You can change the title,
                    description, and other options.
                </p>
                <div style={{
        "margin-top": "16px"
      }}>
                    <Button>Save Settings</Button>
                </div>
            </CardContent>
        </Card>
}`,...c.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    "flex-direction": "column",
    gap: "16px"
  }}>
            <Card variant="default">
                <p style={{
        margin: 0
      }}>Default Card</p>
            </Card>
            <Card variant="interactive">
                <p style={{
        margin: 0
      }}>Interactive Card (hover me)</p>
            </Card>
            <Card variant="outline">
                <p style={{
        margin: 0
      }}>Outline Card</p>
            </Card>
            <Card variant="gradient">
                <p style={{
        margin: 0
      }}>Gradient Card</p>
            </Card>
        </div>
}`,...g.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    "flex-direction": "column",
    gap: "16px"
  }}>
            <Card padding="sm">
                <p style={{
        margin: 0
      }}>Small padding</p>
            </Card>
            <Card padding="md">
                <p style={{
        margin: 0
      }}>Medium padding (default)</p>
            </Card>
            <Card padding="lg">
                <p style={{
        margin: 0
      }}>Large padding</p>
            </Card>
        </div>
}`,...m.parameters?.docs?.source}}};const N=["Default","Interactive","Gradient","Outline","NoPadding","WithHeaderAndContent","AllVariants","AllPaddings"];export{m as AllPaddings,g as AllVariants,d as Default,s as Gradient,l as Interactive,p as NoPadding,o as Outline,c as WithHeaderAndContent,N as __namedExportsOrder,M as default};
