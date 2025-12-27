import{e as T,t as v,i as o,c as h,a as A,m as ct,S as D,F as it,v as l,g as K}from"./iframe-BQDcX1su.js";import{w as X,e as u}from"./index-CTbdOwF5.js";import"./preload-helper-PPVm8Dsz.js";var dt=v("<div class=poll-title style=font-size:1.25em;font-weight:bold;text-align:center;margin-bottom:1.5rem>"),gt=v('<div class=poll-active style=flex:1;display:flex;flex-direction:column><div class=poll-options style=flex:1;display:flex;flex-direction:column;gap:1rem></div><div class=poll-footer style="margin-top:1.5rem;display:flex;justify-content:space-between;align-items:center;font-size:0.875em;opacity:0.7;padding-top:1rem;border-top:1px solid rgba(0, 0, 0, 0.1)"><div class=total-votes> total votes'),ut=v('<div class=poll-ended style=flex:1><div class=winner-announcement style=text-align:center;font-size:1.125em;font-weight:bold;margin-bottom:1.5rem>Poll Results</div><div class=poll-results style=display:flex;flex-direction:column;gap:0.75rem></div><div class=poll-footer style="margin-top:1.5rem;display:flex;justify-content:space-between;align-items:center;font-size:0.875em;opacity:0.7;padding-top:1rem;border-top:1px solid rgba(0, 0, 0, 0.1)"><div class=total-votes> total votes</div><div class=poll-ended-text>Poll ended'),pt=v("<div class=poll-waiting style=flex:1;display:flex;align-items:center;justify-content:center><div class=waiting-message style=font-size:1.125em;opacity:0.6;text-align:center>Waiting for poll..."),ft=v(`<div style="font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;padding:1rem"><style></style><div class=poll-container style="border-radius:0.75rem;padding:1.5rem;box-shadow:0 4px 6px rgba(0, 0, 0, 0.1);min-height:200px;display:flex;flex-direction:column">`),mt=v('<div style="position:relative;border-radius:0.5rem;overflow:hidden;transition:all 0.3s ease"><div class=option-content style=position:relative;z-index:2;padding:1rem;display:flex;justify-content:space-between;align-items:center><div class=option-text style=font-weight:500;flex:1></div><div class=option-stats style=display:flex;gap:1rem;font-size:0.875em;opacity:0.8><span class=option-votes> votes</span><span class=option-percentage>%</span></div></div><div class=option-bar style="position:absolute;top:0;left:0;width:100%;height:100%;background-color:rgba(0, 0, 0, 0.05)"><div class=option-progress style=height:100%>'),vt=v("<div class=time-remaining>Ends "),wt=v('<div style=position:relative;border-radius:0.5rem;overflow:hidden><div class=result-content style="position:relative;z-index:2;padding:0.75rem 1rem;display:flex;align-items:center;gap:1rem"><div class=result-position style=font-weight:bold;font-size:1.125em;min-width:2rem>#</div><div class=result-text style=font-weight:500;flex:1></div><div class=result-stats style=display:flex;gap:1rem;font-size:0.875em;opacity:0.8><span class=result-votes> votes</span><span class=result-percentage>%</span></div></div><div class=result-bar style="position:absolute;top:0;left:0;width:100%;height:100%;background-color:rgba(0, 0, 0, 0.03)"><div class=result-progress style=height:100%>');function Q(t){const n=T(()=>t.pollStatus?.options?t.pollStatus.options.reduce((a,f)=>a+f.votes,0):0),st=T(()=>t.pollStatus?.options?[...t.pollStatus.options].sort((a,f)=>f.votes-a.votes):[]),P=a=>n()===0?0:Math.round(a.votes/n()*100),z=a=>{if(!t.config.highlightWinner||n()===0)return!1;const f=Math.max(...t.pollStatus?.options.map(w=>w.votes)||[0]);return a.votes===f&&a.votes>0},lt=a=>{const f=new Date,e=new Date(a).getTime()-f.getTime();if(e<=0)return"now";const c=Math.floor(e/(1e3*60)),p=Math.floor(e%(1e3*60)/1e3);return c>0?`in ${c}m ${p}s`:`in ${p}s`},rt=T(()=>{const a=[];return a.push(`font-${t.config.fontSize}`),a.push(`animation-${t.config.animationType}`),a.join(" ")}),Y=T(()=>{switch(t.config.animationType){case"smooth":return"1.2s";case"bounce":return"0.8s";default:return"0.3s"}}),Z=T(()=>{switch(t.config.animationType){case"smooth":return"cubic-bezier(0.25, 0.46, 0.45, 0.94)";case"bounce":return"cubic-bezier(0.68, -0.55, 0.265, 1.55)";default:return"ease"}});return(()=>{var a=ft(),f=a.firstChild,w=f.nextSibling;return o(f,()=>`
        .poll-widget .option-progress {
          transition: width ${Y()} ${Z()};
        }
        .poll-widget .result-progress {
          transition: width ${Y()} ${Z()};
        }
        .poll-widget.animation-none .option-progress,
        .poll-widget.animation-none .result-progress {
          transition: width 0.3s ease;
        }
        .poll-option.winning {
          animation: winnerGlow 2s infinite alternate;
        }
        @keyframes winnerGlow {
          0% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.3); }
          100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.6); }
        }
        .result-option.winner {
          animation: resultWinner 1s ease-in-out;
        }
        @keyframes resultWinner {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
      `),o(w,h(D,{get when(){return ct(()=>!!t.config.showTitle)()&&t.pollStatus?.title},get children(){var e=dt();return o(e,()=>t.pollStatus?.title),A(c=>l(e,"color",t.config.primaryColor)),e}}),null),o(w,h(D,{get when(){return t.pollStatus?.status==="active"},get children(){var e=gt(),c=e.firstChild,p=c.nextSibling,b=p.firstChild,W=b.firstChild;return o(c,h(it,{get each(){return t.pollStatus?.options},children:d=>(()=>{var s=mt(),g=s.firstChild,y=g.firstChild,k=y.nextSibling,x=k.firstChild,O=x.firstChild,E=x.nextSibling,$=E.firstChild,J=g.nextSibling,S=J.firstChild;return o(y,()=>d.text),o(x,()=>d.votes,O),o(E,()=>P(d),$),A(r=>{var F=`poll-option ${z(d)?"winning":""}`,C=`2px solid ${z(d)?t.config.winnerColor:"transparent"}`,i=`${P(d)}%`,V=z(d)?t.config.winnerColor:t.config.primaryColor,_=z(d)?"0.3":"0.2";return F!==r.e&&K(s,r.e=F),C!==r.t&&l(s,"border",r.t=C),i!==r.a&&l(S,"width",r.a=i),V!==r.o&&l(S,"background-color",r.o=V),_!==r.i&&l(S,"opacity",r.i=_),r},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0}),s})()})),o(b,n,W),o(p,h(D,{get when(){return t.pollStatus?.endsAt},children:d=>(()=>{var s=vt();return s.firstChild,o(s,()=>lt(d()),null),s})()}),null),e}}),null),o(w,h(D,{get when(){return t.pollStatus?.status==="ended"},get children(){var e=ut(),c=e.firstChild,p=c.nextSibling,b=p.nextSibling,W=b.firstChild,d=W.firstChild;return o(p,h(it,{get each(){return st()},children:(s,g)=>(()=>{var y=wt(),k=y.firstChild,x=k.firstChild;x.firstChild;var O=x.nextSibling,E=O.nextSibling,$=E.firstChild,J=$.firstChild,S=$.nextSibling,r=S.firstChild,F=k.nextSibling,C=F.firstChild;return o(x,()=>g()+1,null),o(O,()=>s.text),o($,()=>s.votes,J),o(S,()=>P(s),r),A(i=>{var V=`result-option ${g()===0?"winner":""} ${g()===1?"runner-up":""}`,_=`2px solid ${g()===0?t.config.winnerColor:g()===1?t.config.secondaryColor:"transparent"}`,tt=g()===0?"0 0 15px rgba(255, 215, 0, 0.4)":"none",et=g()===0?t.config.winnerColor:"inherit",nt=`${P(s)}%`,ot=g()===0?t.config.winnerColor:t.config.primaryColor,at=g()===0?"0.25":"0.15";return V!==i.e&&K(y,i.e=V),_!==i.t&&l(y,"border",i.t=_),tt!==i.a&&l(y,"box-shadow",i.a=tt),et!==i.o&&l(x,"color",i.o=et),nt!==i.i&&l(C,"width",i.i=nt),ot!==i.n&&l(C,"background-color",i.n=ot),at!==i.s&&l(C,"opacity",i.s=at),i},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0,n:void 0,s:void 0}),y})()})),o(W,n,d),A(s=>l(c,"color",t.config.primaryColor)),e}}),null),o(w,h(D,{get when(){return!t.pollStatus||t.pollStatus.status==="waiting"},get children(){var e=pt();return e.firstChild,e}}),null),A(e=>{var c=`poll-widget ${rt()}`,p=t.config.textColor,b=t.config.backgroundColor;return c!==e.e&&K(a,e.e=c),p!==e.t&&l(a,"color",e.t=p),b!==e.a&&l(w,"background-color",e.a=b),e},{e:void 0,t:void 0,a:void 0}),a})()}try{Q.displayName="PollWidget",Q.__docgenInfo={description:"",displayName:"PollWidget",props:{config:{defaultValue:null,description:"",name:"config",required:!0,type:{name:"PollConfig"}},pollStatus:{defaultValue:null,description:"",name:"pollStatus",required:!1,type:{name:"PollStatus | undefined"}}}}}catch{}var yt=v("<div style=width:400px>");const St={title:"Widgets/Poll",component:Q,parameters:{layout:"centered",backgrounds:{default:"dark"}},tags:["autodocs"],decorators:[t=>(()=>{var n=yt();return o(n,h(t,{})),n})()]},m={showTitle:!0,showPercentages:!0,showVoteCounts:!0,fontSize:"medium",primaryColor:"#8b5cf6",secondaryColor:"#c4b5fd",backgroundColor:"#1e293b",textColor:"#e2e8f0",winnerColor:"#fbbf24",animationType:"smooth",highlightWinner:!0,autoHideAfterEnd:!1,hideDelay:5e3},B=[{id:"1",text:"Option A",votes:45},{id:"2",text:"Option B",votes:32},{id:"3",text:"Option C",votes:18},{id:"4",text:"Option D",votes:5}],R={args:{config:m,pollStatus:void 0},play:async({canvasElement:t})=>{const n=X(t);await u(n.getByText("Waiting for poll...")).toBeVisible()}},N={args:{config:m,pollStatus:{id:"poll-1",title:"What game should we play next?",status:"active",options:B,totalVotes:100,createdAt:new Date,endsAt:new Date(Date.now()+300*1e3)}},play:async({canvasElement:t})=>{const n=X(t);await u(n.getByText("What game should we play next?")).toBeVisible(),await u(n.getByText("Option A")).toBeVisible(),await u(n.getByText("Option B")).toBeVisible(),await u(n.getByText("100 total votes")).toBeVisible(),await u(n.getByText("45%")).toBeVisible(),await u(n.getByText("32%")).toBeVisible()}},M={args:{config:m,pollStatus:{id:"poll-2",title:"Close Vote!",status:"active",options:[{id:"1",text:"Team A",votes:48},{id:"2",text:"Team B",votes:52}],totalVotes:100,createdAt:new Date,endsAt:new Date(Date.now()+120*1e3)}}},j={args:{config:m,pollStatus:{id:"poll-3",title:"Best Snack?",status:"ended",options:[{id:"1",text:"Pizza",votes:120},{id:"2",text:"Tacos",votes:85},{id:"3",text:"Burgers",votes:65},{id:"4",text:"Salad",votes:30}],totalVotes:300,createdAt:new Date(Date.now()-600*1e3)}},play:async({canvasElement:t})=>{const n=X(t);await u(n.getByText("Poll Results")).toBeVisible(),await u(n.getByText("Poll ended")).toBeVisible(),await u(n.getByText("#1")).toBeVisible(),await u(n.getByText("Pizza")).toBeVisible(),await u(n.getByText("300 total votes")).toBeVisible()}},H={args:{config:{...m,animationType:"bounce"},pollStatus:{id:"poll-4",title:"Favorite Color?",status:"active",options:[{id:"1",text:"Blue",votes:40},{id:"2",text:"Red",votes:35},{id:"3",text:"Green",votes:25}],totalVotes:100,createdAt:new Date}}},G={args:{config:{...m,animationType:"none"},pollStatus:{id:"poll-5",title:"Static Poll",status:"active",options:B,totalVotes:100,createdAt:new Date}}},L={args:{config:{...m,fontSize:"small"},pollStatus:{id:"poll-6",title:"Small Font Poll",status:"active",options:B,totalVotes:100,createdAt:new Date}}},I={args:{config:{...m,fontSize:"large"},pollStatus:{id:"poll-7",title:"Large Font Poll",status:"active",options:B,totalVotes:100,createdAt:new Date}}},q={args:{config:{...m,primaryColor:"#ec4899",backgroundColor:"#fdf2f8",textColor:"#831843",winnerColor:"#f59e0b"},pollStatus:{id:"poll-8",title:"Custom Styled Poll",status:"active",options:B,totalVotes:100,createdAt:new Date}}},U={args:{config:{...m,highlightWinner:!1},pollStatus:{id:"poll-9",title:"No Highlight",status:"active",options:B,totalVotes:100,createdAt:new Date}}};R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  args: {
    config: defaultConfig,
    pollStatus: undefined
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Waiting for poll...")).toBeVisible();
  }
}`,...R.parameters?.docs?.source}}};N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  args: {
    config: defaultConfig,
    pollStatus: {
      id: "poll-1",
      title: "What game should we play next?",
      status: "active",
      options: activeOptions,
      totalVotes: 100,
      createdAt: new Date(),
      endsAt: new Date(Date.now() + 5 * 60 * 1000)
    }
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("What game should we play next?")).toBeVisible();
    await expect(canvas.getByText("Option A")).toBeVisible();
    await expect(canvas.getByText("Option B")).toBeVisible();
    await expect(canvas.getByText("100 total votes")).toBeVisible();
    // Check percentages are displayed
    await expect(canvas.getByText("45%")).toBeVisible();
    await expect(canvas.getByText("32%")).toBeVisible();
  }
}`,...N.parameters?.docs?.source}}};M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  args: {
    config: defaultConfig,
    pollStatus: {
      id: "poll-2",
      title: "Close Vote!",
      status: "active",
      options: [{
        id: "1",
        text: "Team A",
        votes: 48
      }, {
        id: "2",
        text: "Team B",
        votes: 52
      }],
      totalVotes: 100,
      createdAt: new Date(),
      endsAt: new Date(Date.now() + 2 * 60 * 1000)
    }
  }
}`,...M.parameters?.docs?.source}}};j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: {
    config: defaultConfig,
    pollStatus: {
      id: "poll-3",
      title: "Best Snack?",
      status: "ended",
      options: [{
        id: "1",
        text: "Pizza",
        votes: 120
      }, {
        id: "2",
        text: "Tacos",
        votes: 85
      }, {
        id: "3",
        text: "Burgers",
        votes: 65
      }, {
        id: "4",
        text: "Salad",
        votes: 30
      }],
      totalVotes: 300,
      createdAt: new Date(Date.now() - 10 * 60 * 1000)
    }
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Poll Results")).toBeVisible();
    await expect(canvas.getByText("Poll ended")).toBeVisible();
    // Winner should be #1
    await expect(canvas.getByText("#1")).toBeVisible();
    await expect(canvas.getByText("Pizza")).toBeVisible();
    await expect(canvas.getByText("300 total votes")).toBeVisible();
  }
}`,...j.parameters?.docs?.source}}};H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...defaultConfig,
      animationType: "bounce" as const
    },
    pollStatus: {
      id: "poll-4",
      title: "Favorite Color?",
      status: "active",
      options: [{
        id: "1",
        text: "Blue",
        votes: 40
      }, {
        id: "2",
        text: "Red",
        votes: 35
      }, {
        id: "3",
        text: "Green",
        votes: 25
      }],
      totalVotes: 100,
      createdAt: new Date()
    }
  }
}`,...H.parameters?.docs?.source}}};G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...defaultConfig,
      animationType: "none" as const
    },
    pollStatus: {
      id: "poll-5",
      title: "Static Poll",
      status: "active",
      options: activeOptions,
      totalVotes: 100,
      createdAt: new Date()
    }
  }
}`,...G.parameters?.docs?.source}}};L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...defaultConfig,
      fontSize: "small" as const
    },
    pollStatus: {
      id: "poll-6",
      title: "Small Font Poll",
      status: "active",
      options: activeOptions,
      totalVotes: 100,
      createdAt: new Date()
    }
  }
}`,...L.parameters?.docs?.source}}};I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...defaultConfig,
      fontSize: "large" as const
    },
    pollStatus: {
      id: "poll-7",
      title: "Large Font Poll",
      status: "active",
      options: activeOptions,
      totalVotes: 100,
      createdAt: new Date()
    }
  }
}`,...I.parameters?.docs?.source}}};q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...defaultConfig,
      primaryColor: "#ec4899",
      backgroundColor: "#fdf2f8",
      textColor: "#831843",
      winnerColor: "#f59e0b"
    },
    pollStatus: {
      id: "poll-8",
      title: "Custom Styled Poll",
      status: "active",
      options: activeOptions,
      totalVotes: 100,
      createdAt: new Date()
    }
  }
}`,...q.parameters?.docs?.source}}};U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...defaultConfig,
      highlightWinner: false
    },
    pollStatus: {
      id: "poll-9",
      title: "No Highlight",
      status: "active",
      options: activeOptions,
      totalVotes: 100,
      createdAt: new Date()
    }
  }
}`,...U.parameters?.docs?.source}}};const Ct=["Waiting","Active","ActiveCloseRace","Ended","BounceAnimation","NoAnimation","SmallFont","LargeFont","CustomColors","NoWinnerHighlight"];export{N as Active,M as ActiveCloseRace,H as BounceAnimation,q as CustomColors,j as Ended,I as LargeFont,G as NoAnimation,U as NoWinnerHighlight,L as SmallFont,R as Waiting,Ct as __namedExportsOrder,St as default};
