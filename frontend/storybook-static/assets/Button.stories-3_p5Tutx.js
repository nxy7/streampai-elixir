import{t as y,i as e,c as a}from"./iframe-BQDcX1su.js";import{B as n}from"./Button-_cU9cDJe.js";import"./preload-helper-PPVm8Dsz.js";import"./design-system-CwcdUVvG.js";var A=y("<div style=width:300px>"),f=y("<div style=display:flex;gap:12px;flex-wrap:wrap>"),L=y("<div style=display:flex;gap:12px;align-items:center>");const G={title:"Design System/Button",component:n,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{variant:{control:"select",options:["primary","secondary","danger","success","ghost","gradient"]},size:{control:"select",options:["sm","md","lg"]},disabled:{control:"boolean"},fullWidth:{control:"boolean"}}},t={args:{variant:"primary",children:"Primary Button"}},s={args:{variant:"secondary",children:"Secondary Button"}},o={args:{variant:"danger",children:"Delete"}},c={args:{variant:"success",children:"Save Changes"}},i={args:{variant:"ghost",children:"Cancel"}},l={args:{variant:"gradient",children:"Get Started"}},d={args:{size:"sm",children:"Small Button"}},u={args:{size:"lg",children:"Large Button"}},m={args:{disabled:!0,children:"Disabled Button"}},p={args:{fullWidth:!0,children:"Full Width Button"},decorators:[r=>(()=>{var x=A();return e(x,a(r,{})),x})()]},g={render:()=>(()=>{var r=f();return e(r,a(n,{variant:"primary",children:"Primary"}),null),e(r,a(n,{variant:"secondary",children:"Secondary"}),null),e(r,a(n,{variant:"danger",children:"Danger"}),null),e(r,a(n,{variant:"success",children:"Success"}),null),e(r,a(n,{variant:"ghost",children:"Ghost"}),null),e(r,a(n,{variant:"gradient",children:"Gradient"}),null),r})()},h={render:()=>(()=>{var r=L();return e(r,a(n,{size:"sm",children:"Small"}),null),e(r,a(n,{size:"md",children:"Medium"}),null),e(r,a(n,{size:"lg",children:"Large"}),null),r})()},v={args:{as:"a",href:"https://example.com",children:"External Link (a)"}},B={args:{as:"link",href:"/dashboard",children:"Internal Link (A)"}},S={render:()=>(()=>{var r=f();return e(r,a(n,{children:"Button (default)"}),null),e(r,a(n,{as:"a",href:"https://example.com",children:"External (a)"}),null),e(r,a(n,{as:"link",href:"/dashboard",children:"Internal (A)"}),null),r})()};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "primary",
    children: "Primary Button"
  }
}`,...t.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "secondary",
    children: "Secondary Button"
  }
}`,...s.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "danger",
    children: "Delete"
  }
}`,...o.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "success",
    children: "Save Changes"
  }
}`,...c.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "ghost",
    children: "Cancel"
  }
}`,...i.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "gradient",
    children: "Get Started"
  }
}`,...l.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    size: "sm",
    children: "Small Button"
  }
}`,...d.parameters?.docs?.source}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    size: "lg",
    children: "Large Button"
  }
}`,...u.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: true,
    children: "Disabled Button"
  }
}`,...m.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    fullWidth: true,
    children: "Full Width Button"
  },
  decorators: [(Story: () => JSX.Element) => <div style={{
    width: "300px"
  }}>
                <Story />
            </div>]
}`,...p.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    gap: "12px",
    "flex-wrap": "wrap"
  }}>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="success">Success</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="gradient">Gradient</Button>
        </div>
}`,...g.parameters?.docs?.source}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    gap: "12px",
    "align-items": "center"
  }}>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
        </div>
}`,...h.parameters?.docs?.source}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    as: "a",
    href: "https://example.com",
    children: "External Link (a)"
  }
}`,...v.parameters?.docs?.source}}};B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  args: {
    as: "link",
    href: "/dashboard",
    children: "Internal Link (A)"
  }
}`,...B.parameters?.docs?.source}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    gap: "12px",
    "flex-wrap": "wrap"
  }}>
            <Button>Button (default)</Button>
            <Button as="a" href="https://example.com">
                External (a)
            </Button>
            <Button as="link" href="/dashboard">
                Internal (A)
            </Button>
        </div>
}`,...S.parameters?.docs?.source}}};const _=["Primary","Secondary","Danger","Success","Ghost","Gradient","Small","Large","Disabled","FullWidth","AllVariants","AllSizes","AsAnchor","AsRouterLink","LinkVariants"];export{h as AllSizes,g as AllVariants,v as AsAnchor,B as AsRouterLink,o as Danger,m as Disabled,p as FullWidth,i as Ghost,l as Gradient,u as Large,S as LinkVariants,t as Primary,s as Secondary,d as Small,c as Success,_ as __namedExportsOrder,G as default};
