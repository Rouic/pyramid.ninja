"use strict";(()=>{var e={};e.id=462,e.ids=[462,636],e.modules={361:e=>{e.exports=require("next/dist/compiled/next-server/pages.runtime.prod.js")},2015:e=>{e.exports=require("react")},2326:e=>{e.exports=require("react-dom")},3431:(e,s,t)=>{t.d(s,{A:()=>i});var a=t(8732),r=t(2015),l=t(2743),n=t(224);let i=({cards:e,onCardSelect:s,isActive:t,className:i="",gameEnded:d=!1})=>{let[o,c]=(0,r.useState)(Array(15).fill(!1));(0,r.useEffect)(()=>{e&&e.length>0&&c(e.map(e=>e.shown))},[e]);let m=e=>{!t||o[e]||d||s(e)};return(0,a.jsxs)("div",{className:`relative mx-auto ${i}`,style:{width:"500px",height:"550px"},children:[e.map((e,s)=>{let r=(0,n.Mf)(s),i=r.x+250-50,c=r.y;return(0,a.jsx)(l.A,{index:e.id,position:{x:i,y:c},faceUp:o[s],onClick:()=>m(s),className:`transition-transform duration-500 ease-out ${!t||o[s]||d?"":"hover:scale-105 cursor-pointer"}`},s)}),(0,a.jsxs)("svg",{className:"absolute top-0 left-0 w-full h-full pointer-events-none opacity-25",style:{zIndex:-1},children:[(0,a.jsx)("line",{x1:"50",y1:"490",x2:"450",y2:"490",stroke:"#888",strokeWidth:"1"}),(0,a.jsx)("line",{x1:"100",y1:"360",x2:"400",y2:"360",stroke:"#888",strokeWidth:"1"}),(0,a.jsx)("line",{x1:"150",y1:"240",x2:"350",y2:"240",stroke:"#888",strokeWidth:"1"}),(0,a.jsx)("line",{x1:"200",y1:"120",x2:"300",y2:"120",stroke:"#888",strokeWidth:"1"}),(0,a.jsx)("line",{x1:"50",y1:"490",x2:"250",y2:"0",stroke:"#888",strokeWidth:"1"}),(0,a.jsx)("line",{x1:"450",y1:"490",x2:"250",y2:"0",stroke:"#888",strokeWidth:"1"})]})]})}},3646:e=>{e.exports=require("seedrandom")},3843:(e,s,t)=>{t.a(e,async(e,a)=>{try{t.r(s),t.d(s,{config:()=>p,default:()=>m,getServerSideProps:()=>u,getStaticPaths:()=>h,getStaticProps:()=>x,reportWebVitals:()=>f,routeModule:()=>N,unstable_getServerProps:()=>b,unstable_getServerSideProps:()=>v,unstable_getStaticParams:()=>y,unstable_getStaticPaths:()=>j,unstable_getStaticProps:()=>g});var r=t(3885),l=t(237),n=t(1413),i=t(1779),d=t(2081),o=t(5227),c=e([d,o]);[d,o]=c.then?(await c)():c;let m=(0,n.M)(o,"default"),x=(0,n.M)(o,"getStaticProps"),h=(0,n.M)(o,"getStaticPaths"),u=(0,n.M)(o,"getServerSideProps"),p=(0,n.M)(o,"config"),f=(0,n.M)(o,"reportWebVitals"),g=(0,n.M)(o,"unstable_getStaticProps"),j=(0,n.M)(o,"unstable_getStaticPaths"),y=(0,n.M)(o,"unstable_getStaticParams"),b=(0,n.M)(o,"unstable_getServerProps"),v=(0,n.M)(o,"unstable_getServerSideProps"),N=new r.PagesRouteModule({definition:{kind:l.A.PAGES,page:"/host",pathname:"/host",bundlePath:"",filename:""},components:{App:d.default,Document:i.default},userland:o});a()}catch(e){a(e)}})},3873:e=>{e.exports=require("path")},4075:e=>{e.exports=require("zlib")},4337:e=>{e.exports=import("firebase/firestore")},5227:(e,s,t)=>{t.a(e,async(e,a)=>{try{t.r(s),t.d(s,{default:()=>u});var r=t(8732),l=t(2015),n=t(9918),i=t.n(n),d=t(9522),o=t(7629),c=t(3431),m=t(2506),x=t(224),h=e([m]);m=(h.then?(await h)():h)[0];let u=()=>{let{createGame:e,gameId:s,gameData:t,players:a,startGame:n,selectCard:h}=(0,m.Im)(),[u,p]=(0,l.useState)(!1),[f,g]=(0,l.useState)(!1),[j,y]=(0,l.useState)(null),[b,v]=(0,l.useState)(null),[N,w]=(0,l.useState)(null),[_,S]=(0,l.useState)("Generating Game..."),[k,P]=(0,l.useState)([]),[R,M]=(0,l.useState)(!1),[C,A]=(0,l.useState)([]);(0,l.useEffect)(()=>((async()=>{if(!s)try{await e(),S("Waiting for players to join...")}catch(e){console.error("Failed to create game:",e),S("Error creating game. Please try again.")}})(),()=>{}),[e,s]),(0,l.useEffect)(()=>{if(t){if(t["__pyramid.meta"].started&&p(!0),t["__pyramid.summary"]&&(g(!0),S("That's the end of the game! Let's look at our cards!")),t["__pyramid.currentRound"]){let{round_number:e,round_row:a,round_card:r}=t["__pyramid.currentRound"];y(e),w(a),v(r),S((0,x.Er)(e,s||"")),M(!0),t["__pyramid.rounds"]&&t["__pyramid.rounds"][e]&&t["__pyramid.rounds"][e].round_transactions&&W(t["__pyramid.rounds"][e],e,a)}else u&&!R?S("Select another card from the pyramid to continue..."):!u&&a.length>0&&S(a.length<2?"Waiting for more players...":"Press Continue when ready...")}},[t,s,u,a,R]);let W=(e,s,t)=>{let r=[],l=[];e.round_transactions.forEach(e=>{let s=a.find(s=>s.uid===e.t_from),n=a.find(s=>s.uid===e.t_to);s&&n&&(r.push({from_player:s.name,to_player:n.name,result:e.status}),"accepted"===e.status?$(l,n.name,t):"bullshit_wrong"===e.status?$(l,s.name,2*t):"bullshit_correct"===e.status&&$(l,n.name,2*t))}),P(r),A(l)},$=(e,s,t)=>{let a=e.find(e=>e.name===s);a?a.drinks+=t:e.push({name:s,drinks:t})},E=async()=>{if(s)try{await n(s)}catch(e){console.error("Failed to start game:",e)}},q=async e=>{if(s&&u&&!f)try{await h(s,e)}catch(e){console.error("Failed to select card:",e)}};return(0,r.jsxs)(d.A,{pageTitle:"Host Game",children:[(0,r.jsx)("div",{className:"container mx-auto px-4 pt-6 pb-20",children:(0,r.jsxs)("div",{className:"bg-white bg-opacity-90 rounded-xl shadow-lg overflow-hidden",children:[s&&(0,r.jsxs)("div",{className:"bg-indigo-800 text-white p-4 flex justify-between items-center",children:[(0,r.jsxs)("h2",{className:"text-xl font-bold",children:["Room Code: ",s]}),t&&(0,r.jsxs)("div",{className:"text-sm",children:[t["__pyramid.deck"]?.length||0," Cards Left •"," ",a.length," Players"]})]}),!u&&(0,r.jsxs)("div",{className:"p-8 text-center",children:[(0,r.jsx)("h2",{className:"text-2xl font-bold mb-6",children:_}),s&&(0,r.jsxs)("div",{className:"mb-8",children:[(0,r.jsxs)("p",{className:"text-lg mb-4",children:["Open ",(0,r.jsx)("span",{className:"font-bold",children:"pyramid.ninja"})," on your devices and enter"," ",(0,r.jsx)("span",{className:"font-bold text-rose-600",children:s})," to join this game."]}),(0,r.jsx)("div",{className:"my-8",children:(0,r.jsx)(o.A,{players:a,displayMode:"grid"})}),a.length>1&&(0,r.jsxs)("button",{onClick:E,className:"bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-8 rounded-full transition duration-300",children:["Continue",(0,r.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",className:"h-5 w-5 ml-2 inline",viewBox:"0 0 20 20",fill:"currentColor",children:(0,r.jsx)("path",{fillRule:"evenodd",d:"M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z",clipRule:"evenodd"})})]})]})]}),u&&(0,r.jsxs)("div",{className:"p-4",children:[(0,r.jsx)("div",{className:"mb-4 overflow-x-auto whitespace-nowrap py-2",children:(0,r.jsx)(o.A,{players:a,displayMode:"horizontal",showDrinks:!0})}),(0,r.jsxs)("div",{className:"text-center mb-6",children:[(0,r.jsx)("h3",{className:"text-xl font-bold",children:_}),!f&&(0,r.jsx)("p",{className:"text-gray-600",children:"Pick a card from below to continue..."}),f&&(0,r.jsx)(i(),{href:"/",children:(0,r.jsx)("button",{className:"mt-4 bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-6 rounded-full transition duration-300",children:"Start New Game"})})]}),t&&t["__pyramid.cards"]&&(0,r.jsx)("div",{className:"mb-8 overflow-hidden",children:(0,r.jsx)(c.A,{cards:t["__pyramid.cards"],onCardSelect:q,isActive:u&&!R&&!f,gameEnded:f,className:"transform scale-90 md:scale-100"})})]}),(0,r.jsx)("div",{className:"text-center pb-6",children:(0,r.jsxs)(i(),{href:"/",className:"text-blue-500 hover:text-blue-700 transition duration-300",children:[(0,r.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",className:"h-5 w-5 inline mr-1",viewBox:"0 0 20 20",fill:"currentColor",children:(0,r.jsx)("path",{fillRule:"evenodd",d:"M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z",clipRule:"evenodd"})}),"Exit Game"]})})]})}),R&&(0,r.jsx)("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4",children:(0,r.jsx)("div",{className:"bg-gray-900 text-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-auto",children:(0,r.jsxs)("div",{className:"p-6",children:[(0,r.jsxs)("h2",{className:"text-xl md:text-2xl font-bold text-center mb-4",children:["Round ",j,", Row ",N," - it's"," ",null!==b?(0,x.NR)(b):"","!"]}),(0,r.jsxs)("div",{className:"grid md:grid-cols-2 gap-6",children:[(0,r.jsx)("div",{className:"flex justify-center items-center bg-gray-800 rounded-lg p-4",children:null!==b&&(0,r.jsx)("div",{className:"transform scale-75 md:scale-100",children:(0,r.jsx)("div",{className:"w-64 h-96 bg-white rounded-lg shadow-lg relative flex items-center justify-center",children:(0,r.jsx)("span",{className:"text-4xl",children:(0,x.NR)(b)})})})}),(0,r.jsxs)("div",{children:[(0,r.jsxs)("p",{className:"mb-2",children:[_," ",(0,r.jsx)("span",{className:"text-gray-400",children:"The card on the left is currently in play. Use your device to call a drink to another player."})]}),k.length>0?(0,r.jsxs)("div",{className:"mt-4",children:[(0,r.jsx)("h4",{className:"font-semibold mb-2",children:"Round Log:"}),(0,r.jsx)("div",{className:"bg-gray-800 rounded-lg p-3 max-h-40 overflow-y-auto",children:k.map((e,s)=>(0,r.jsxs)("div",{className:"mb-2 pb-2 border-b border-gray-700 last:border-0",children:[(0,r.jsxs)("div",{className:"flex items-center",children:[(0,r.jsx)("img",{src:`https://us-central1-pyramid-ninja.cloudfunctions.net/avatars/40/${e.from_player}.png`,alt:e.from_player,className:"w-6 h-6 rounded-full mr-1"}),(0,r.jsx)("span",{className:"font-semibold",children:e.from_player}),(0,r.jsx)("span",{className:"mx-1",children:"has called on"}),(0,r.jsx)("img",{src:`https://us-central1-pyramid-ninja.cloudfunctions.net/avatars/40/${e.to_player}.png`,alt:e.to_player,className:"w-6 h-6 rounded-full mr-1"}),(0,r.jsx)("span",{className:"font-semibold",children:e.to_player}),(0,r.jsx)("span",{className:"ml-1",children:"to drink!"})]}),null===e.result&&(0,r.jsxs)("div",{className:"text-sm text-gray-400 ml-6 mt-1",children:["Waiting on response from ",e.to_player,"..."]}),"accepted"===e.result&&(0,r.jsxs)("div",{className:"text-sm text-green-400 ml-6 mt-1",children:[e.to_player," ",(0,r.jsx)("span",{className:"font-bold",children:"ACCEPTED"})," the drinks!"]}),"bullshit"===e.result&&(0,r.jsxs)("div",{className:"text-sm text-rose-400 ml-6 mt-1",children:[e.to_player," has called"," ",(0,r.jsx)("span",{className:"font-bold",children:"BULLSHIT!"})," ","Waiting for ",e.from_player," to show a card..."]}),"bullshit_wrong"===e.result&&(0,r.jsxs)("div",{className:"text-sm text-rose-400 ml-6 mt-1",children:[e.to_player," has called"," ",(0,r.jsx)("span",{className:"font-bold",children:"BULLSHIT!"})," ",e.from_player," turned over a card with the"," ",(0,r.jsx)("span",{className:"font-bold text-red-500",children:"WRONG"})," ","rank!"]}),"bullshit_correct"===e.result&&(0,r.jsxs)("div",{className:"text-sm text-rose-400 ml-6 mt-1",children:[e.to_player," has called"," ",(0,r.jsx)("span",{className:"font-bold",children:"BULLSHIT!"})," ",e.from_player," turned over a card with the"," ",(0,r.jsx)("span",{className:"font-bold text-green-500",children:"CORRECT"})," ","rank!"]})]},s))})]}):(0,r.jsx)("div",{className:"bg-gray-800 rounded-lg p-4 text-center text-gray-400 mt-4",children:"No updates yet..."})]})]}),C.length>0&&(0,r.jsxs)("div",{className:"mt-6 pt-4 border-t border-gray-700 text-center",children:[(0,r.jsx)("h4",{className:"font-semibold mb-2",children:"Round Results:"}),(0,r.jsx)("p",{children:C.map((e,s)=>(0,r.jsxs)("span",{children:[(0,r.jsxs)("span",{className:"inline-flex items-center",children:[(0,r.jsx)("img",{src:`https://us-central1-pyramid-ninja.cloudfunctions.net/avatars/40/${e.name}.png`,alt:e.name,className:"w-6 h-6 rounded-full mr-1"}),(0,r.jsx)("span",{className:"font-semibold",children:e.name})]})," ","drinks ",(0,r.jsx)("span",{className:"font-bold",children:e.drinks}),s<C.length-1?", ":"!"]},s))})]}),(0,r.jsx)("div",{className:"mt-6 text-center",children:(0,r.jsx)("button",{onClick:()=>{M(!1),P([]),A([])},className:"bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-6 rounded-full transition duration-300",children:"Finish Round"})})]})})})]})};a()}catch(e){a(e)}})},6551:e=>{e.exports=import("firebase/app")},6958:e=>{e.exports=import("firebase/auth")},7629:(e,s,t)=>{t.d(s,{A:()=>r});var a=t(8732);t(2015);let r=({players:e,onSelectPlayer:s,currentPlayer:t=null,displayMode:r="horizontal",showDrinks:l=!1,className:n=""})=>{let i=(e,s=70)=>`https://us-central1-pyramid-ninja.cloudfunctions.net/avatars/${s}/${e}.png`,d=`
    flex flex-col items-center 
    p-2 rounded-lg 
    transition-all duration-300
    ${s?"cursor-pointer hover:bg-indigo-100":""}
  `;return(0,a.jsxs)("div",{className:`${{horizontal:"flex flex-row flex-wrap justify-center gap-4",vertical:"flex flex-col items-center gap-4",grid:"grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"}[r]} ${n}`,children:[e.map(e=>(0,a.jsxs)("div",{className:`${d} ${e.uid===t?"bg-indigo-100 border-2 border-indigo-500":""}`,onClick:()=>s&&s(e),children:[(0,a.jsxs)("div",{className:"relative",children:[(0,a.jsx)("img",{src:i(e.name),alt:`${e.name}'s avatar`,className:"w-16 h-16 rounded-full object-cover shadow-md"}),l&&e.drinks>0&&(0,a.jsx)("div",{className:"absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center shadow",children:e.drinks})]}),(0,a.jsxs)("div",{className:"mt-2 text-center",children:[(0,a.jsx)("p",{className:"font-semibold text-sm truncate max-w-[100px]",children:e.name}),l&&(0,a.jsxs)("p",{className:"text-xs text-gray-500",children:[e.drinks," drinks"]})]})]},e.uid)),0===e.length&&(0,a.jsx)("div",{className:"text-center text-gray-500 p-4",children:"No players have joined yet"})]})}},7910:e=>{e.exports=require("stream")},7912:e=>{e.exports=require("next/head")},8444:e=>{e.exports=import("firebase/analytics")},8732:e=>{e.exports=require("react/jsx-runtime")},9021:e=>{e.exports=require("fs")},9970:e=>{e.exports=import("firebase/performance")}};var s=require("../webpack-runtime.js");s.C(e);var t=e=>s(s.s=e),a=s.X(0,[341,844,81,354],()=>t(3843));module.exports=a})();