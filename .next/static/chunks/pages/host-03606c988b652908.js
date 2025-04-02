(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[462],{340:(e,s,t)=>{(window.__NEXT_P=window.__NEXT_P||[]).push(["/host",function(){return t(2401)}])},2401:(e,s,t)=>{"use strict";t.r(s),t.d(s,{default:()=>h});var a=t(7876),l=t(4232),r=t(8230),n=t.n(r),i=t(4050);let d=e=>{let{players:s,onSelectPlayer:t,currentPlayer:l=null,displayMode:r="horizontal",showDrinks:n=!1,className:i=""}=e,d=function(e){let s=arguments.length>1&&void 0!==arguments[1]?arguments[1]:70;return"https://us-central1-pyramid-ninja.cloudfunctions.net/avatars/".concat(s,"/").concat(e,".png")},o="\n    flex flex-col items-center \n    p-2 rounded-lg \n    transition-all duration-300\n    ".concat(t?"cursor-pointer hover:bg-indigo-100":"","\n  ");return(0,a.jsxs)("div",{className:"".concat({horizontal:"flex flex-row flex-wrap justify-center gap-4",vertical:"flex flex-col items-center gap-4",grid:"grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"}[r]," ").concat(i),children:[s.map(e=>(0,a.jsxs)("div",{className:"".concat(o," ").concat(e.uid===l?"bg-indigo-100 border-2 border-indigo-500":""),onClick:()=>t&&t(e),children:[(0,a.jsxs)("div",{className:"relative",children:[(0,a.jsx)("img",{src:d(e.name),alt:"".concat(e.name,"'s avatar"),className:"w-16 h-16 rounded-full object-cover shadow-md"}),n&&e.drinks>0&&(0,a.jsx)("div",{className:"absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center shadow",children:e.drinks})]}),(0,a.jsxs)("div",{className:"mt-2 text-center",children:[(0,a.jsx)("p",{className:"font-semibold text-sm truncate max-w-[100px]",children:e.name}),n&&(0,a.jsxs)("p",{className:"text-xs text-gray-500",children:[e.drinks," drinks"]})]})]},e.uid)),0===s.length&&(0,a.jsx)("div",{className:"text-center text-gray-500 p-4",children:"No players have joined yet"})]})};var o=t(8894),c=t(3453);let m=e=>{let{cards:s,onCardSelect:t,isActive:r,className:n="",gameEnded:i=!1}=e,[d,m]=(0,l.useState)(Array(15).fill(!1));(0,l.useEffect)(()=>{s&&s.length>0&&m(s.map(e=>e.shown))},[s]);let x=e=>{!r||d[e]||i||t(e)};return(0,a.jsxs)("div",{className:"relative mx-auto ".concat(n),style:{width:"".concat(500,"px"),height:"".concat(550,"px")},children:[s.map((e,s)=>{let t=(0,c.Mf)(s),l=t.x+250-50,n=t.y;return(0,a.jsx)(o.A,{index:e.id,position:{x:l,y:n},faceUp:d[s],onClick:()=>x(s),className:"transition-transform duration-500 ease-out ".concat(!r||d[s]||i?"":"hover:scale-105 cursor-pointer")},s)}),(0,a.jsxs)("svg",{className:"absolute top-0 left-0 w-full h-full pointer-events-none opacity-25",style:{zIndex:-1},children:[(0,a.jsx)("line",{x1:"50",y1:"490",x2:"450",y2:"490",stroke:"#888",strokeWidth:"1"}),(0,a.jsx)("line",{x1:"100",y1:"360",x2:"400",y2:"360",stroke:"#888",strokeWidth:"1"}),(0,a.jsx)("line",{x1:"150",y1:"240",x2:"350",y2:"240",stroke:"#888",strokeWidth:"1"}),(0,a.jsx)("line",{x1:"200",y1:"120",x2:"300",y2:"120",stroke:"#888",strokeWidth:"1"}),(0,a.jsx)("line",{x1:"50",y1:"490",x2:"250",y2:"0",stroke:"#888",strokeWidth:"1"}),(0,a.jsx)("line",{x1:"450",y1:"490",x2:"250",y2:"0",stroke:"#888",strokeWidth:"1"})]})]})};var x=t(7187);let h=()=>{var e;let{createGame:s,gameId:t,gameData:r,players:o,startGame:h,selectCard:u}=(0,x.Im)(),[p,f]=(0,l.useState)(!1),[j,g]=(0,l.useState)(!1),[y,N]=(0,l.useState)(null),[v,b]=(0,l.useState)(null),[w,_]=(0,l.useState)(null),[k,R]=(0,l.useState)("Generating Game..."),[C,E]=(0,l.useState)([]),[S,L]=(0,l.useState)(!1),[W,T]=(0,l.useState)([]);(0,l.useEffect)(()=>((async()=>{if(!t)try{await s(),R("Waiting for players to join...")}catch(e){console.error("Failed to create game:",e),R("Error creating game. Please try again.")}})(),()=>{}),[s,t]),(0,l.useEffect)(()=>{if(r){if(r["__pyramid.meta"].started&&f(!0),r["__pyramid.summary"]&&(g(!0),R("That's the end of the game! Let's look at our cards!")),r["__pyramid.currentRound"]){let{round_number:e,round_row:s,round_card:a}=r["__pyramid.currentRound"];N(e),_(s),b(a),R((0,c.Er)(e,t||"")),L(!0),r["__pyramid.rounds"]&&r["__pyramid.rounds"][e]&&r["__pyramid.rounds"][e].round_transactions&&z(r["__pyramid.rounds"][e],e,s)}else p&&!S?R("Select another card from the pyramid to continue..."):!p&&o.length>0&&R(o.length<2?"Waiting for more players...":"Press Continue when ready...")}},[r,t,p,o,S]);let z=(e,s,t)=>{let a=[],l=[];e.round_transactions.forEach(e=>{let s=o.find(s=>s.uid===e.t_from),r=o.find(s=>s.uid===e.t_to);s&&r&&(a.push({from_player:s.name,to_player:r.name,result:e.status}),"accepted"===e.status?P(l,r.name,t):"bullshit_wrong"===e.status?P(l,s.name,2*t):"bullshit_correct"===e.status&&P(l,r.name,2*t))}),E(a),T(l)},P=(e,s,t)=>{let a=e.find(e=>e.name===s);a?a.drinks+=t:e.push({name:s,drinks:t})},G=async()=>{if(t)try{await h(t)}catch(e){console.error("Failed to start game:",e)}},H=async e=>{if(t&&p&&!j)try{await u(t,e)}catch(e){console.error("Failed to select card:",e)}},A=window.location.hostname;return(0,a.jsxs)(i.A,{pageTitle:"Host Game",children:[(0,a.jsx)("div",{className:"container mx-auto px-4 pt-6 pb-20",children:(0,a.jsxs)("div",{className:"bg-white bg-opacity-90 rounded-xl shadow-lg overflow-hidden",children:[t&&(0,a.jsxs)("div",{className:"bg-indigo-800 text-white p-4 flex justify-between items-center",children:[(0,a.jsxs)("h2",{className:"text-xl font-bold",children:["Room Code: ",t]}),r&&(0,a.jsxs)("div",{className:"text-sm",children:[(null===(e=r["__pyramid.deck"])||void 0===e?void 0:e.length)||0," Cards Left •"," ",o.length," Players"]})]}),!p&&(0,a.jsxs)("div",{className:"p-8 text-center",children:[(0,a.jsx)("h2",{className:"text-2xl font-bold mb-6",children:k}),t&&(0,a.jsxs)("div",{className:"mb-8",children:[(0,a.jsxs)("p",{className:"text-lg mb-4",children:["Open ",(0,a.jsx)("span",{className:"font-bold",children:A})," on your devices and enter"," ",(0,a.jsx)("span",{className:"font-bold text-rose-600",children:t})," to join this game."]}),(0,a.jsx)("div",{className:"my-8",children:(0,a.jsx)(d,{players:o,displayMode:"grid"})}),o.length>1&&(0,a.jsxs)("button",{onClick:G,className:"bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-8 rounded-full transition duration-300",children:["Continue",(0,a.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",className:"h-5 w-5 ml-2 inline",viewBox:"0 0 20 20",fill:"currentColor",children:(0,a.jsx)("path",{fillRule:"evenodd",d:"M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z",clipRule:"evenodd"})})]})]})]}),p&&(0,a.jsxs)("div",{className:"p-4",children:[(0,a.jsx)("div",{className:"mb-4 overflow-x-auto whitespace-nowrap py-2",children:(0,a.jsx)(d,{players:o,displayMode:"horizontal",showDrinks:!0})}),(0,a.jsxs)("div",{className:"text-center mb-6",children:[(0,a.jsx)("h3",{className:"text-xl font-bold",children:k}),!j&&(0,a.jsx)("p",{className:"text-gray-600",children:"Pick a card from below to continue..."}),j&&(0,a.jsx)(n(),{href:"/",children:(0,a.jsx)("button",{className:"mt-4 bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-6 rounded-full transition duration-300",children:"Start New Game"})})]}),r&&r["__pyramid.cards"]&&(0,a.jsx)("div",{className:"mb-8 overflow-hidden",children:(0,a.jsx)(m,{cards:r["__pyramid.cards"],onCardSelect:H,isActive:p&&!S&&!j,gameEnded:j,className:"transform scale-90 md:scale-100"})})]}),(0,a.jsx)("div",{className:"text-center pb-6",children:(0,a.jsxs)(n(),{href:"/",className:"text-blue-500 hover:text-blue-700 transition duration-300",children:[(0,a.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",className:"h-5 w-5 inline mr-1",viewBox:"0 0 20 20",fill:"currentColor",children:(0,a.jsx)("path",{fillRule:"evenodd",d:"M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z",clipRule:"evenodd"})}),"Exit Game"]})})]})}),S&&(0,a.jsx)("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4",children:(0,a.jsx)("div",{className:"bg-gray-900 text-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-auto",children:(0,a.jsxs)("div",{className:"p-6",children:[(0,a.jsxs)("h2",{className:"text-xl md:text-2xl font-bold text-center mb-4",children:["Round ",y,", Row ",w," - it's"," ",null!==v?(0,c.NR)(v):"","!"]}),(0,a.jsxs)("div",{className:"grid md:grid-cols-2 gap-6",children:[(0,a.jsx)("div",{className:"flex justify-center items-center bg-gray-800 rounded-lg p-4",children:null!==v&&(0,a.jsx)("div",{className:"transform scale-75 md:scale-100",children:(0,a.jsx)("div",{className:"w-64 h-96 bg-white rounded-lg shadow-lg relative flex items-center justify-center",children:(0,a.jsx)("span",{className:"text-4xl",children:(0,c.NR)(v)})})})}),(0,a.jsxs)("div",{children:[(0,a.jsxs)("p",{className:"mb-2",children:[k," ",(0,a.jsx)("span",{className:"text-gray-400",children:"The card on the left is currently in play. Use your device to call a drink to another player."})]}),C.length>0?(0,a.jsxs)("div",{className:"mt-4",children:[(0,a.jsx)("h4",{className:"font-semibold mb-2",children:"Round Log:"}),(0,a.jsx)("div",{className:"bg-gray-800 rounded-lg p-3 max-h-40 overflow-y-auto",children:C.map((e,s)=>(0,a.jsxs)("div",{className:"mb-2 pb-2 border-b border-gray-700 last:border-0",children:[(0,a.jsxs)("div",{className:"flex items-center",children:[(0,a.jsx)("img",{src:"https://us-central1-pyramid-ninja.cloudfunctions.net/avatars/40/".concat(e.from_player,".png"),alt:e.from_player,className:"w-6 h-6 rounded-full mr-1"}),(0,a.jsx)("span",{className:"font-semibold",children:e.from_player}),(0,a.jsx)("span",{className:"mx-1",children:"has called on"}),(0,a.jsx)("img",{src:"https://us-central1-pyramid-ninja.cloudfunctions.net/avatars/40/".concat(e.to_player,".png"),alt:e.to_player,className:"w-6 h-6 rounded-full mr-1"}),(0,a.jsx)("span",{className:"font-semibold",children:e.to_player}),(0,a.jsx)("span",{className:"ml-1",children:"to drink!"})]}),null===e.result&&(0,a.jsxs)("div",{className:"text-sm text-gray-400 ml-6 mt-1",children:["Waiting on response from ",e.to_player,"..."]}),"accepted"===e.result&&(0,a.jsxs)("div",{className:"text-sm text-green-400 ml-6 mt-1",children:[e.to_player," ",(0,a.jsx)("span",{className:"font-bold",children:"ACCEPTED"})," the drinks!"]}),"bullshit"===e.result&&(0,a.jsxs)("div",{className:"text-sm text-rose-400 ml-6 mt-1",children:[e.to_player," has called"," ",(0,a.jsx)("span",{className:"font-bold",children:"BULLSHIT!"})," ","Waiting for ",e.from_player," to show a card..."]}),"bullshit_wrong"===e.result&&(0,a.jsxs)("div",{className:"text-sm text-rose-400 ml-6 mt-1",children:[e.to_player," has called"," ",(0,a.jsx)("span",{className:"font-bold",children:"BULLSHIT!"})," ",e.from_player," turned over a card with the"," ",(0,a.jsx)("span",{className:"font-bold text-red-500",children:"WRONG"})," ","rank!"]}),"bullshit_correct"===e.result&&(0,a.jsxs)("div",{className:"text-sm text-rose-400 ml-6 mt-1",children:[e.to_player," has called"," ",(0,a.jsx)("span",{className:"font-bold",children:"BULLSHIT!"})," ",e.from_player," turned over a card with the"," ",(0,a.jsx)("span",{className:"font-bold text-green-500",children:"CORRECT"})," ","rank!"]})]},s))})]}):(0,a.jsx)("div",{className:"bg-gray-800 rounded-lg p-4 text-center text-gray-400 mt-4",children:"No updates yet..."})]})]}),W.length>0&&(0,a.jsxs)("div",{className:"mt-6 pt-4 border-t border-gray-700 text-center",children:[(0,a.jsx)("h4",{className:"font-semibold mb-2",children:"Round Results:"}),(0,a.jsx)("p",{children:W.map((e,s)=>(0,a.jsxs)("span",{children:[(0,a.jsxs)("span",{className:"inline-flex items-center",children:[(0,a.jsx)("img",{src:"https://us-central1-pyramid-ninja.cloudfunctions.net/avatars/40/".concat(e.name,".png"),alt:e.name,className:"w-6 h-6 rounded-full mr-1"}),(0,a.jsx)("span",{className:"font-semibold",children:e.name})]})," ","drinks ",(0,a.jsx)("span",{className:"font-bold",children:e.drinks}),s<W.length-1?", ":"!"]},s))})]}),(0,a.jsx)("div",{className:"mt-6 text-center",children:(0,a.jsx)("button",{onClick:()=>{L(!1),E([]),T([])},className:"bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-6 rounded-full transition duration-300",children:"Finish Round"})})]})})})]})}}},e=>{var s=s=>e(e.s=s);e.O(0,[8,675,636,593,792],()=>s(340)),_N_E=e.O()}]);