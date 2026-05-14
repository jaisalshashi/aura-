// src/App.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuraData } from "./useAuraData.js";
import { createAudioEngine } from "./audioEngine.js";

const RANKS = ["Beginner", "Grinder", "Warrior", "Legend", "Aura Master"];
const RANK_THRESHOLDS = [0, 500, 1500, 3500, 7000];

const AI_MESSAGES = [
  "Aaj ka target complete karo 😎",
  "Consistency > Motivation. Keep going.",
  "Kal se better banna h? Start today.",
  "Focus pe focus karo — distractions ko ignore karo 🔥",
  "Every rep counts. Every page matters.",
  "You're building your future self right now.",
  "Aura rising... keep the streak alive ⚡",
];

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
];

const HABIT_ICONS  = ["⌨️","📖","💪","🧘","🧠","🎯","🎨","✍️","🏃","🎵","🌿","💊","🥗","🛌","📝"];
const MISSION_ICONS= ["📚","📖","💧","⚡","🔥","🎯","🏋️","🧘","🎨","💻","🌟","🎵","🍎","✅","💡"];

// ── Reusable ────────────────────────────────────────────────────────
function FloatingParticles() {
  const pts = useRef([...Array(20)].map(() => ({
    w: Math.random()*3+1, x: Math.random()*100, y: Math.random()*100,
    op: Math.random()*0.5+0.1, dur: Math.random()*10+8, delay: Math.random()*5, t: Math.floor(Math.random()*3)
  }))).current;
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
      {pts.map((p,i)=>(
        <div key={i} style={{ position:"absolute", width:p.w+"px", height:p.w+"px", borderRadius:"50%",
          background: p.t===0?"#a78bfa":p.t===1?"#60a5fa":"#f0abfc",
          left:p.x+"%", top:p.y+"%", opacity:p.op,
          animation:`float-${i%5} ${p.dur}s ease-in-out infinite`, animationDelay:p.delay+"s" }} />
      ))}
    </div>
  );
}

function ProgressRing({ percent, size=120, stroke=8, color="#a78bfa" }) {
  const r=(size-stroke)/2, circ=2*Math.PI*r;
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ-(percent/100)*circ} strokeLinecap="round"
        style={{ transition:"stroke-dashoffset 1s ease", filter:`drop-shadow(0 0 6px ${color})` }}/>
    </svg>
  );
}

function XPBar({ xp, maxXp }) {
  return (
    <div style={{ width:"100%", background:"rgba(255,255,255,0.07)", borderRadius:99, height:8, overflow:"hidden" }}>
      <div style={{ width:Math.min((xp/maxXp)*100,100)+"%", height:"100%", borderRadius:99,
        background:"linear-gradient(90deg,#7c3aed,#a78bfa,#60a5fa)", boxShadow:"0 0 12px #a78bfa",
        transition:"width 0.8s cubic-bezier(0.34,1.56,0.64,1)" }} />
    </div>
  );
}

function GlassCard({ children, style={}, glow=false, onClick }) {
  return (
    <div onClick={onClick} style={{ background:"rgba(255,255,255,0.04)", backdropFilter:"blur(20px)",
      WebkitBackdropFilter:"blur(20px)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:20, padding:"20px",
      boxShadow: glow?"0 0 30px rgba(167,139,250,0.15),0 8px 32px rgba(0,0,0,0.4)":"0 8px 32px rgba(0,0,0,0.3)",
      transition:"all 0.3s ease", cursor:onClick?"pointer":"default", ...style }}>
      {children}
    </div>
  );
}

function AddModal({ type, onAdd, onClose }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(type==="habit"?"🎯":"✅");
  const [xp, setXp]     = useState(40);
  const icons = type==="habit" ? HABIT_ICONS : MISSION_ICONS;
  return (
    <div style={{ position:"fixed", inset:0, zIndex:999, display:"flex", alignItems:"flex-end",
      background:"rgba(0,0,0,0.75)", backdropFilter:"blur(10px)" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ width:"100%", maxWidth:430, margin:"0 auto",
        background:"linear-gradient(180deg,#0d0d2b,#08081a)",
        border:"1px solid rgba(167,139,250,0.25)", borderRadius:"24px 24px 0 0",
        padding:"28px 20px 40px", animation:"slideUp 0.3s ease" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:"#fff" }}>
            {type==="habit"?"✦ New Habit":"⚡ New Task"}
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.08)", border:"none", color:"rgba(255,255,255,0.6)", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:16 }}>✕</button>
        </div>
        <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, color:"rgba(255,255,255,0.4)", letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>Choose Icon</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
          {icons.map(ic=>(
            <div key={ic} onClick={()=>setIcon(ic)} style={{ width:40, height:40, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, cursor:"pointer",
              background:icon===ic?"rgba(167,139,250,0.25)":"rgba(255,255,255,0.05)",
              border:icon===ic?"1px solid rgba(167,139,250,0.6)":"1px solid rgba(255,255,255,0.07)",
              transition:"all 0.15s" }}>{ic}</div>
          ))}
        </div>
        <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, color:"rgba(255,255,255,0.4)", letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>
          {type==="habit"?"Habit Name":"Task Name"}
        </div>
        <input value={name} onChange={e=>setName(e.target.value)}
          placeholder={type==="habit"?"e.g. Morning Walk":"e.g. Journal 5 mins"}
          style={{ width:"100%", padding:"14px 18px", borderRadius:14, marginBottom:16,
            background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.15)",
            color:"#fff", fontFamily:"'Poppins',sans-serif", fontSize:14, outline:"none" }}/>
        {type==="mission" && (
          <>
            <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, color:"rgba(255,255,255,0.4)", letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>XP Reward</div>
            <div style={{ display:"flex", gap:8, marginBottom:20 }}>
              {[20,40,60,80,100].map(v=>(
                <div key={v} onClick={()=>setXp(v)} style={{ flex:1, padding:"10px 0", borderRadius:10, textAlign:"center", cursor:"pointer",
                  background:xp===v?"rgba(167,139,250,0.25)":"rgba(255,255,255,0.05)",
                  border:xp===v?"1px solid rgba(167,139,250,0.6)":"1px solid rgba(255,255,255,0.07)",
                  fontFamily:"'Poppins',sans-serif", fontSize:12, color:xp===v?"#a78bfa":"rgba(255,255,255,0.5)" }}>+{v}</div>
              ))}
            </div>
          </>
        )}
        <button onClick={()=>{ if(!name.trim()) return; onAdd({ name:name.trim(), title:name.trim(), icon, xp:Number(xp), streak:0, done:false }); onClose(); }}
          style={{ width:"100%", padding:"16px", borderRadius:14, border:"none",
            cursor:name.trim()?"pointer":"not-allowed",
            background:name.trim()?"linear-gradient(135deg,#7c3aed,#60a5fa)":"rgba(255,255,255,0.08)",
            color:name.trim()?"#fff":"rgba(255,255,255,0.3)",
            fontFamily:"'Poppins',sans-serif", fontSize:15, fontWeight:600,
            boxShadow:name.trim()?"0 0 24px rgba(124,58,237,0.4)":"none", transition:"all 0.2s" }}>
          {type==="habit"?"Add Habit ✦":"Add Task ⚡"}
        </button>
      </div>
    </div>
  );
}

// ── Loading Screen ──────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"linear-gradient(145deg,#050510,#0a0520)" }}>
      <div style={{ width:70, height:70, borderRadius:"50%", background:"linear-gradient(135deg,#7c3aed,#a78bfa)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, marginBottom:20, boxShadow:"0 0 40px rgba(167,139,250,0.5)", animation:"pulse 1.5s ease infinite" }}>✦</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, color:"#fff", letterSpacing:4 }}>AURA</div>
      <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, color:"rgba(255,255,255,0.3)", marginTop:8, letterSpacing:3 }}>LOADING...</div>
    </div>
  );
}

// ── Home ────────────────────────────────────────────────────────────
function HomeScreen({ xp, streak, missions, onCompleteMission, aiMsg, quote, onAddMission }) {
  const [showAdd, setShowAdd] = useState(false);
  const done=missions.filter(m=>m.done).length, total=missions.length;
  const ringPct=total?Math.round((done/total)*100):0;
  const ri=RANK_THRESHOLDS.findIndex((t,i)=>xp>=t&&(RANK_THRESHOLDS[i+1]===undefined||xp<RANK_THRESHOLDS[i+1]));
  const rank=RANKS[ri]||RANKS[RANKS.length-1];
  const nextXp=RANK_THRESHOLDS[ri+1]||(RANK_THRESHOLDS[ri]+1000);
  const hour=new Date().getHours();
  const greeting=hour<12?"Good Morning":hour<17?"Good Afternoon":"Good Evening";
  return (
    <div style={{ padding:"0 0 100px" }}>
      {showAdd&&<AddModal type="mission" onAdd={m=>{ onAddMission({...m,title:m.name}); setShowAdd(false); }} onClose={()=>setShowAdd(false)}/>}
      <div style={{ padding:"32px 20px 0", marginBottom:24 }}>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", fontFamily:"'Poppins',sans-serif", letterSpacing:2, textTransform:"uppercase" }}>
          {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
        </div>
        <div style={{ fontSize:28, fontFamily:"'Playfair Display',serif", color:"#fff", marginTop:4, lineHeight:1.2 }}>
          {greeting}, <span style={{ color:"#a78bfa" }}>Suraj.</span>
        </div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", fontFamily:"'Poppins',sans-serif", marginTop:6 }}>
          {done}/{total} missions completed today.
        </div>
      </div>
      <div style={{ display:"flex", gap:12, padding:"0 20px", marginBottom:20 }}>
        {[{icon:"🔥",val:streak,label:"STREAK",color:"#f97316"},{icon:"⚡",val:xp,label:"XP",color:"#a78bfa"},{icon:"👑",val:rank,label:"RANK",color:"#60a5fa",sm:true}].map((s,i)=>(
          <GlassCard key={i} style={{ flex:1, padding:"14px", textAlign:"center" }} glow>
            <div style={{ fontSize:20, marginBottom:4 }}>{s.icon}</div>
            <div style={{ fontSize:s.sm?11:22, fontWeight:700, color:s.color, fontFamily:"'Poppins',sans-serif", lineHeight:1.3 }}>{s.val}</div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)", fontFamily:"'Poppins',sans-serif" }}>{s.label}</div>
          </GlassCard>
        ))}
      </div>
      <div style={{ padding:"0 20px", marginBottom:20 }}>
        <GlassCard glow style={{ display:"flex", alignItems:"center", gap:18 }}>
          <div style={{ position:"relative", flexShrink:0 }}>
            <ProgressRing percent={ringPct}/>
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
              <div style={{ fontSize:20, fontWeight:800, color:"#fff", fontFamily:"'Poppins',sans-serif" }}>{ringPct}%</div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)", fontFamily:"'Poppins',sans-serif" }}>DONE</div>
            </div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, color:"#fff", marginBottom:6 }}>Daily Progress</div>
            <XPBar xp={xp-(RANK_THRESHOLDS[ri]||0)} maxXp={nextXp-(RANK_THRESHOLDS[ri]||0)}/>
            <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:5 }}>{nextXp-xp} XP to {RANKS[ri+1]||"Max Rank"}</div>
          </div>
        </GlassCard>
      </div>
      <div style={{ padding:"0 20px", marginBottom:20 }}>
        <GlassCard style={{ background:"rgba(124,58,237,0.1)", border:"1px solid rgba(167,139,250,0.2)" }}>
          <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
            <div style={{ width:42, height:42, borderRadius:"50%", flexShrink:0, background:"linear-gradient(135deg,#7c3aed,#a78bfa)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, boxShadow:"0 0 18px rgba(167,139,250,0.4)" }}>🤖</div>
            <div>
              <div style={{ fontSize:10, color:"#a78bfa", fontFamily:"'Poppins',sans-serif", letterSpacing:1.5, textTransform:"uppercase", marginBottom:4 }}>Aura AI</div>
              <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:13, color:"rgba(255,255,255,0.85)", lineHeight:1.6 }}>{aiMsg}</div>
            </div>
          </div>
        </GlassCard>
      </div>
      <div style={{ padding:"0 20px", marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:"#fff" }}>Today's Tasks</div>
          <button onClick={()=>setShowAdd(true)} style={{ display:"flex", alignItems:"center", gap:5, padding:"8px 14px", borderRadius:99, background:"linear-gradient(135deg,rgba(124,58,237,0.3),rgba(96,165,250,0.2))", border:"1px solid rgba(167,139,250,0.4)", color:"#a78bfa", fontFamily:"'Poppins',sans-serif", fontSize:12, cursor:"pointer", fontWeight:600 }}>＋ Add Task</button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {missions.map(m=>(
            <GlassCard key={m.id} onClick={()=>!m.done&&onCompleteMission(m.id)}
              style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px", opacity:m.done?0.6:1, border:m.done?"1px solid rgba(34,197,94,0.3)":"1px solid rgba(255,255,255,0.09)" }}>
              <div style={{ fontSize:22 }}>{m.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:13, color:"#fff", textDecoration:m.done?"line-through":"none" }}>{m.title}</div>
                <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, color:"#a78bfa" }}>+{m.xp} XP</div>
              </div>
              <div style={{ width:24, height:24, borderRadius:"50%", border:m.done?"none":"2px solid rgba(255,255,255,0.2)", background:m.done?"linear-gradient(135deg,#22c55e,#16a34a)":"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#fff", boxShadow:m.done?"0 0 10px rgba(34,197,94,0.5)":"none" }}>
                {m.done?"✓":""}
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
      <div style={{ padding:"0 20px" }}>
        <GlassCard style={{ background:"rgba(96,165,250,0.05)", border:"1px solid rgba(96,165,250,0.12)", textAlign:"center" }}>
          <div style={{ fontSize:16, marginBottom:8 }}>💬</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontStyle:"italic", fontSize:14, color:"rgba(255,255,255,0.8)", lineHeight:1.7, marginBottom:8 }}>"{quote.text}"</div>
          <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, color:"rgba(255,255,255,0.3)" }}>— {quote.author}</div>
        </GlassCard>
      </div>
    </div>
  );
}

// ── Habits ──────────────────────────────────────────────────────────
function HabitsScreen({ habits, onToggle, onAddHabit }) {
  const [showAdd, setShowAdd] = useState(false);
  const weekDays=["M","T","W","T","F","S","S"];
  return (
    <div style={{ padding:"32px 20px 100px" }}>
      {showAdd&&<AddModal type="habit" onAdd={h=>{ onAddHabit(h); setShowAdd(false); }} onClose={()=>setShowAdd(false)}/>}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:"#fff", marginBottom:4 }}>Habit Tracker</div>
          <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:13, color:"rgba(255,255,255,0.4)" }}>Build systems, not motivation.</div>
        </div>
        <button onClick={()=>setShowAdd(true)} style={{ padding:"10px 16px", borderRadius:99, marginTop:4, background:"linear-gradient(135deg,rgba(124,58,237,0.3),rgba(96,165,250,0.2))", border:"1px solid rgba(167,139,250,0.4)", color:"#a78bfa", fontFamily:"'Poppins',sans-serif", fontSize:13, cursor:"pointer", fontWeight:600 }}>＋ Add</button>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {habits.map(h=>(
          <GlassCard key={h.id} onClick={()=>onToggle(h.id)} glow={h.done}
            style={{ border:h.done?"1px solid rgba(167,139,250,0.4)":"1px solid rgba(255,255,255,0.09)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:12 }}>
              <div style={{ width:48, height:48, borderRadius:14, background:h.done?"linear-gradient(135deg,#7c3aed,#a78bfa)":"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, transition:"all 0.3s", boxShadow:h.done?"0 0 18px rgba(167,139,250,0.4)":"none" }}>{h.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:15, fontWeight:600, color:"#fff" }}>{h.name}</div>
                <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, color:"#f97316" }}>🔥 {h.streak} day streak</div>
              </div>
              <div style={{ padding:"4px 12px", borderRadius:99, background:h.done?"rgba(34,197,94,0.15)":"rgba(255,255,255,0.06)", border:h.done?"1px solid rgba(34,197,94,0.3)":"1px solid rgba(255,255,255,0.1)", fontFamily:"'Poppins',sans-serif", fontSize:12, color:h.done?"#22c55e":"rgba(255,255,255,0.4)" }}>
                {h.done?"Done ✓":"Tap"}
              </div>
            </div>
            <XPBar xp={h.streak} maxXp={30}/>
            <div style={{ display:"flex", gap:6, justifyContent:"center", marginTop:12 }}>
              {weekDays.map((d,i)=>(
                <div key={i} style={{ width:32, height:32, borderRadius:8, background:i<(h.streak%7)?"linear-gradient(135deg,#7c3aed,#a78bfa)":"rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Poppins',sans-serif", fontSize:10, color:"rgba(255,255,255,0.5)" }}>{d}</div>
              ))}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

// ── Focus ───────────────────────────────────────────────────────────
function FocusScreen() {
  const [active,setActive]=useState(false);
  const [seconds,setSeconds]=useState(25*60);
  const [sound,setSound]=useState(null);
  const [volume,setVolume]=useState(0.5);
  const [sessions,setSessions]=useState(0);
  const [totalMins,setTotalMins]=useState(0);
  const [sessionLog,setSessionLog]=useState([]);
  const intervalRef=useRef(null);
  const engineRef=useRef(null);
  const SOUNDS=[
    {id:"rain",label:"Rain",icon:"🌧",color:"#60a5fa",desc:"Rainfall"},
    {id:"cafe",label:"Cafe",icon:"☕",color:"#f97316",desc:"Coffeeshop"},
    {id:"nature",label:"Nature",icon:"🌿",color:"#22c55e",desc:"Birds & wind"},
    {id:"lofi",label:"Lo-fi",icon:"🎵",color:"#a78bfa",desc:"Chill beats"},
  ];
  useEffect(()=>{ engineRef.current=createAudioEngine(); return ()=>engineRef.current?.stopAll(); },[]);
  const startSound=useCallback((id,vol)=>{
    const e=engineRef.current; if(!e) return;
    if(id==="rain") e.playRain(vol); else if(id==="cafe") e.playCafe(vol);
    else if(id==="nature") e.playNature(vol); else if(id==="lofi") e.playLofi(vol);
  },[]);
  const toggleSound=id=>{ if(sound===id){engineRef.current?.stopAll();setSound(null);}else{setSound(id);startSound(id,volume);} };
  const handleVol=v=>{ setVolume(v); if(sound) startSound(sound,v); };
  useEffect(()=>{
    if(active){
      intervalRef.current=setInterval(()=>{
        setSeconds(s=>{
          if(s<=1){
            setSessions(n=>n+1); setTotalMins(t=>t+25);
            setSessionLog(log=>[...log,{num:log.length+1,mins:25,time:new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}]);
            setActive(false); return 25*60;
          }
          return s-1;
        });
      },1000);
    } else clearInterval(intervalRef.current);
    return ()=>clearInterval(intervalRef.current);
  },[active]);
  const min=String(Math.floor(seconds/60)).padStart(2,"0");
  const sec=String(seconds%60).padStart(2,"0");
  const pct=((25*60-seconds)/(25*60))*100;
  return (
    <div style={{ padding:"32px 20px 100px" }}>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:"#fff", marginBottom:4 }}>Focus Mode</div>
      <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:13, color:"rgba(255,255,255,0.4)", marginBottom:24 }}>Deep work. Zero distractions.</div>
      <div style={{ display:"flex", justifyContent:"center", marginBottom:24 }}>
        <div style={{ position:"relative" }}>
          <ProgressRing percent={pct} size={190} stroke={10} color={active?"#60a5fa":"#a78bfa"}/>
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:42, fontWeight:700, color:"#fff", letterSpacing:-2 }}>{min}:{sec}</div>
            <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, color:active?"#60a5fa":"rgba(255,255,255,0.4)", letterSpacing:1 }}>{active?"● FOCUSING":"READY"}</div>
            {sound&&<div style={{ fontFamily:"'Poppins',sans-serif", fontSize:10, color:"#a78bfa", marginTop:4 }}>{SOUNDS.find(s=>s.id===sound)?.icon} {SOUNDS.find(s=>s.id===sound)?.label}</div>}
          </div>
        </div>
      </div>
      <div style={{ display:"flex", justifyContent:"center", gap:12, marginBottom:24 }}>
        <button onClick={()=>setActive(!active)} style={{ padding:"14px 36px", borderRadius:99, border:"none", cursor:"pointer", background:active?"rgba(239,68,68,0.2)":"linear-gradient(135deg,#7c3aed,#60a5fa)", color:"#fff", fontFamily:"'Poppins',sans-serif", fontSize:15, fontWeight:600, boxShadow:active?"0 0 20px rgba(239,68,68,0.3)":"0 0 28px rgba(124,58,237,0.5)", transition:"all 0.3s" }}>
          {active?"⏸ Pause":"▶ Start"}
        </button>
        <button onClick={()=>{setActive(false);setSeconds(25*60);}} style={{ padding:"14px 18px", borderRadius:99, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.5)", fontSize:16, cursor:"pointer" }}>↺</button>
      </div>
      <GlassCard style={{ marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, color:"rgba(255,255,255,0.4)", letterSpacing:1, textTransform:"uppercase" }}>Ambient Sound</div>
          {sound&&<div style={{ fontFamily:"'Poppins',sans-serif", fontSize:10, color:"#a78bfa" }}>🔊 Tap to stop</div>}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:sound?14:0 }}>
          {SOUNDS.map(s=>{
            const rgb=s.id==="rain"?"96,165,250":s.id==="cafe"?"249,115,22":s.id==="nature"?"34,197,94":"167,139,250";
            const on=sound===s.id;
            return (
              <div key={s.id} onClick={()=>toggleSound(s.id)} style={{ padding:"14px 10px", borderRadius:14, textAlign:"center", cursor:"pointer",
                background:on?`rgba(${rgb},0.15)`:"rgba(255,255,255,0.04)",
                border:on?`1px solid rgba(${rgb},0.5)`:"1px solid rgba(255,255,255,0.08)",
                boxShadow:on?`0 0 18px rgba(${rgb},0.2)`:"none", transition:"all 0.2s" }}>
                <div style={{ fontSize:28, marginBottom:4 }}>{s.icon}</div>
                <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:13, color:on?s.color:"rgba(255,255,255,0.5)", fontWeight:on?600:400 }}>{s.label}</div>
                <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:9, color:on?s.color:"rgba(255,255,255,0.25)", marginTop:2 }}>{on?"● Playing":s.desc}</div>
              </div>
            );
          })}
        </div>
        {sound&&(
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, color:"rgba(255,255,255,0.3)" }}>🔈 Volume</span>
              <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, color:"#a78bfa" }}>{Math.round(volume*100)}%</span>
            </div>
            <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e=>handleVol(Number(e.target.value))} style={{ width:"100%", accentColor:"#a78bfa", cursor:"pointer" }}/>
          </div>
        )}
      </GlassCard>
      <GlassCard>
        <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, color:"rgba(255,255,255,0.4)", letterSpacing:1, textTransform:"uppercase", marginBottom:14 }}>Session Stats</div>
        <div style={{ display:"flex", justifyContent:"space-around", textAlign:"center", marginBottom:sessionLog.length?16:0 }}>
          {[{val:sessions,label:"Sessions",color:"#a78bfa",icon:"🎯"},{val:totalMins+"m",label:"Focused",color:"#60a5fa",icon:"⏳"},{val:"#"+(sessions+1),label:"Up Next",color:"#f0abfc",icon:"🔥"}].map((s,i)=>(
            <div key={i} style={{ flex:1 }}>
              <div style={{ fontSize:18, marginBottom:4 }}>{s.icon}</div>
              <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:22, fontWeight:700, color:s.color }}>{s.val}</div>
              <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:10, color:"rgba(255,255,255,0.3)" }}>{s.label}</div>
            </div>
          ))}
        </div>
        {sessionLog.length>0&&(
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:12 }}>
            <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, color:"rgba(255,255,255,0.3)", letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>Session Log</div>
            {sessionLog.slice(-3).reverse().map((log,i)=>(
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8, padding:"8px 12px", borderRadius:10, background:"rgba(255,255,255,0.04)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:24, height:24, borderRadius:"50%", background:"linear-gradient(135deg,#7c3aed,#a78bfa)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Poppins',sans-serif", fontSize:10, color:"#fff" }}>#{log.num}</div>
                  <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, color:"#fff" }}>Session {log.num}</div>
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, color:"#a78bfa" }}>{log.mins} mins</span>
                  <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, color:"rgba(255,255,255,0.3)" }}>{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

// ── Analytics ───────────────────────────────────────────────────────
function AnalyticsScreen({ xp }) {
  const weekData=[65,80,45,90,70,85,95], days=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const maxBar=Math.max(...weekData), auraScore=Math.min(100,Math.round((xp/500)*60+40));
  return (
    <div style={{ padding:"32px 20px 100px" }}>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:"#fff", marginBottom:6 }}>Analytics</div>
      <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:13, color:"rgba(255,255,255,0.4)", marginBottom:24 }}>Track your growth visually.</div>
      <GlassCard glow style={{ marginBottom:16, textAlign:"center", background:"rgba(124,58,237,0.1)", border:"1px solid rgba(167,139,250,0.2)" }}>
        <div style={{ fontSize:12, fontFamily:"'Poppins',sans-serif", color:"rgba(255,255,255,0.4)", letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>Daily Aura Score</div>
        <div style={{ position:"relative", display:"inline-block" }}>
          <ProgressRing percent={auraScore} size={140} stroke={10} color="#f0abfc"/>
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:36, fontWeight:800, color:"#fff" }}>{auraScore}</div>
            <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:10, color:"rgba(255,255,255,0.3)" }}>/ 100</div>
          </div>
        </div>
        <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:13, color:"#f0abfc", marginTop:10 }}>
          {auraScore>=80?"🔥 Excellent!":auraScore>=60?"⚡ Good — push harder!":"💪 Keep rising!"}
        </div>
      </GlassCard>
      <GlassCard style={{ marginBottom:16 }}>
        <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, color:"rgba(255,255,255,0.4)", letterSpacing:1, textTransform:"uppercase", marginBottom:16 }}>Weekly Activity</div>
        <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:100 }}>
          {weekData.map((v,i)=>(
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
              <div style={{ width:"100%", height:(v/maxBar)*80+"px", borderRadius:"6px 6px 0 0", background:i===6?"linear-gradient(180deg,#a78bfa,#7c3aed)":"rgba(167,139,250,0.22)", boxShadow:i===6?"0 0 12px rgba(167,139,250,0.4)":"none" }}/>
              <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:10, color:"rgba(255,255,255,0.3)" }}>{days[i]}</div>
            </div>
          ))}
        </div>
      </GlassCard>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {[{label:"Focus Hours",value:"12.5h",icon:"⏳",color:"#60a5fa"},{label:"Habits Done",value:"34",icon:"✅",color:"#22c55e"},{label:"XP Earned",value:xp,icon:"⚡",color:"#a78bfa"},{label:"Consistency",value:"87%",icon:"📈",color:"#f0abfc"}].map((s,i)=>(
          <GlassCard key={i} style={{ textAlign:"center", padding:"18px" }}>
            <div style={{ fontSize:24, marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:22, fontWeight:700, color:s.color }}>{s.value}</div>
            <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, color:"rgba(255,255,255,0.35)" }}>{s.label}</div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

// ── AI ──────────────────────────────────────────────────────────────
function AIScreen({ xp, streak }) {
  const [messages,setMessages]=useState([{role:"assistant",text:"Hey Suraj! Main hun tera Aura AI. Focus, habits, goals — kuch bhi puch 🚀"}]);
  const [input,setInput]=useState(""); const [loading,setLoading]=useState(false);
  const endRef=useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[messages]);
  const send=async()=>{
    if(!input.trim()||loading) return;
    const msg=input.trim(); setInput("");
    setMessages(m=>[...m,{role:"user",text:msg}]); setLoading(true);
    try {
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:`You are Aura AI — premium motivational life coach. User is Suraj. Stats: ${xp} XP, ${streak} day streak. Energetic, concise, inspiring. Natural Hinglish. Under 100 words.`,messages:[...messages,{role:"user",content:msg}].map(m=>({role:m.role,content:m.text}))})});
      const data=await res.json();
      setMessages(m=>[...m,{role:"assistant",text:data.content?.map(c=>c.text||"").join("")||"Keep going! 🔥"}]);
    } catch { setMessages(m=>[...m,{role:"assistant",text:"Thodi der baad try karo. Consistency mat chhodna! 😤"}]); }
    setLoading(false);
  };
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", paddingTop:32 }}>
      <div style={{ padding:"0 20px 16px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:50, height:50, borderRadius:"50%", background:"linear-gradient(135deg,#7c3aed,#a78bfa)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, boxShadow:"0 0 24px rgba(167,139,250,0.5)" }}>🤖</div>
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:"#fff" }}>Aura AI</div>
            <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, color:"#22c55e" }}>● Online</div>
          </div>
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"0 16px 16px", display:"flex", flexDirection:"column", gap:12 }}>
        {messages.map((m,i)=>(
          <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
            <div style={{ maxWidth:"80%", padding:"12px 16px", borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px", background:m.role==="user"?"linear-gradient(135deg,#7c3aed,#60a5fa)":"rgba(255,255,255,0.06)", border:m.role==="user"?"none":"1px solid rgba(255,255,255,0.09)", fontFamily:"'Poppins',sans-serif", fontSize:14, color:"#fff", lineHeight:1.6 }}>{m.text}</div>
          </div>
        ))}
        {loading&&<div style={{ display:"flex", gap:6, padding:"8px 4px" }}>{[0,1,2].map(i=><div key={i} style={{ width:8, height:8, borderRadius:"50%", background:"#a78bfa", animation:"pulse 1.2s ease-in-out infinite", animationDelay:i*0.2+"s" }}/>)}</div>}
        <div ref={endRef}/>
      </div>
      <div style={{ padding:"12px 16px 24px", display:"flex", gap:10 }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask Aura anything..." style={{ flex:1, padding:"14px 18px", borderRadius:99, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", color:"#fff", fontFamily:"'Poppins',sans-serif", fontSize:14, outline:"none" }}/>
        <button onClick={send} style={{ width:50, height:50, borderRadius:"50%", border:"none", cursor:"pointer", background:"linear-gradient(135deg,#7c3aed,#a78bfa)", fontSize:18, boxShadow:"0 0 20px rgba(124,58,237,0.4)" }}>➤</button>
      </div>
    </div>
  );
}

// ── Profile ─────────────────────────────────────────────────────────
function ProfileScreen({ xp, streak, habits, missions }) {
  const ri=RANK_THRESHOLDS.findIndex((t,i)=>xp>=t&&(RANK_THRESHOLDS[i+1]===undefined||xp<RANK_THRESHOLDS[i+1]));
  const rank=RANKS[ri]||RANKS[RANKS.length-1];
  const badges=[{icon:"🔥",name:"Streak King",earned:streak>=7},{icon:"⚡",name:"XP Grinder",earned:xp>=100},{icon:"👑",name:"Warrior",earned:xp>=500},{icon:"💎",name:"Consistent",earned:habits.filter(h=>h.done).length>=3},{icon:"🎯",name:"Mission Pro",earned:missions.filter(m=>m.done).length>=3},{icon:"🌟",name:"Aura Rising",earned:xp>=50}];
  return (
    <div style={{ padding:"32px 20px 100px" }}>
      <div style={{ textAlign:"center", marginBottom:28 }}>
        <div style={{ width:90, height:90, borderRadius:"50%", margin:"0 auto 14px", background:"linear-gradient(135deg,#7c3aed,#a78bfa,#60a5fa)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, boxShadow:"0 0 40px rgba(167,139,250,0.4)" }}>👤</div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, color:"#fff" }}>Suraj</div>
        <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:13, color:"#a78bfa", marginTop:4 }}>⚡ {rank}</div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:20 }}>
        {[{label:"Total XP",value:xp,color:"#a78bfa"},{label:"Day Streak",value:streak,color:"#f97316"},{label:"Habits",value:habits.length,color:"#22c55e"}].map((s,i)=>(
          <GlassCard key={i} style={{ textAlign:"center", padding:14 }}>
            <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:22, fontWeight:700, color:s.color }}>{s.value}</div>
            <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:10, color:"rgba(255,255,255,0.35)" }}>{s.label}</div>
          </GlassCard>
        ))}
      </div>
      <GlassCard style={{ marginBottom:20 }}>
        <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, color:"rgba(255,255,255,0.4)", letterSpacing:1, textTransform:"uppercase", marginBottom:14 }}>Achievements</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
          {badges.map((b,i)=>(
            <div key={i} style={{ padding:"12px 8px", borderRadius:12, textAlign:"center", background:b.earned?"rgba(167,139,250,0.12)":"rgba(255,255,255,0.03)", border:b.earned?"1px solid rgba(167,139,250,0.3)":"1px solid rgba(255,255,255,0.06)", opacity:b.earned?1:0.4 }}>
              <div style={{ fontSize:24, marginBottom:4, filter:b.earned?"none":"grayscale(1)" }}>{b.icon}</div>
              <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:10, color:b.earned?"#a78bfa":"rgba(255,255,255,0.3)" }}>{b.name}</div>
            </div>
          ))}
        </div>
      </GlassCard>
      <GlassCard>
        <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, color:"rgba(255,255,255,0.4)", letterSpacing:1, textTransform:"uppercase", marginBottom:14 }}>Rank Journey</div>
        {RANKS.map((r,i)=>(
          <div key={r} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:xp>=RANK_THRESHOLDS[i]?"linear-gradient(135deg,#7c3aed,#a78bfa)":"rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>{xp>=RANK_THRESHOLDS[i]?"✓":i+1}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:13, color:xp>=RANK_THRESHOLDS[i]?"#fff":"rgba(255,255,255,0.35)" }}>{r}</div>
              <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, color:"rgba(255,255,255,0.25)" }}>{RANK_THRESHOLDS[i]} XP</div>
            </div>
            {r===rank&&<div style={{ padding:"3px 10px", borderRadius:99, background:"rgba(167,139,250,0.2)", border:"1px solid rgba(167,139,250,0.4)", fontFamily:"'Poppins',sans-serif", fontSize:10, color:"#a78bfa" }}>CURRENT</div>}
          </div>
        ))}
      </GlassCard>
    </div>
  );
}

// ── Root ────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home");
  const { loading, xp, streak, habits, missions, toggleHabit, completeMission, addHabit, addMission } = useAuraData();
  const [aiMsg] = useState(AI_MESSAGES[Math.floor(Math.random()*AI_MESSAGES.length)]);
  const [quote]  = useState(QUOTES[Math.floor(Math.random()*QUOTES.length)]);

  const tabs=[
    {id:"home",icon:"⊞",label:"Home"},{id:"habits",icon:"✦",label:"Habits"},
    {id:"focus",icon:"◎",label:"Focus"},{id:"analytics",icon:"⬡",label:"Stats"},
    {id:"ai",icon:"✧",label:"AI"},{id:"profile",icon:"◉",label:"Profile"},
  ];

  if (loading) return <LoadingScreen />;

  return (
    <>
      <style>{`
        ::-webkit-scrollbar{width:0}
        input::placeholder{color:rgba(255,255,255,0.25)}
        input[type=range]{accent-color:#a78bfa;cursor:pointer}
        @keyframes aurora{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(60px,-40px) scale(1.1)}66%{transform:translate(-40px,60px) scale(0.9)}}
        @keyframes float-0{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
        @keyframes float-1{0%,100%{transform:translateY(0) translateX(0)}50%{transform:translateY(-30px) translateX(10px)}}
        @keyframes float-2{0%,100%{transform:translateY(0)}50%{transform:translateY(-15px)}}
        @keyframes float-3{0%,100%{transform:translateY(0) translateX(0)}50%{transform:translateY(20px) translateX(-15px)}}
        @keyframes float-4{0%,100%{transform:translateY(0)}50%{transform:translateY(-25px)}}
        @keyframes pulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1)}}
        @keyframes slideUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}
      `}</style>
      <div style={{ width:"100%", maxWidth:430, margin:"0 auto", height:"100vh", position:"relative", overflow:"hidden", background:"linear-gradient(145deg,#050510 0%,#0a0520 50%,#050518 100%)" }}>
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", overflow:"hidden", zIndex:0 }}>
          <div style={{ position:"absolute", width:400, height:400, top:"-100px", left:"-100px", borderRadius:"50%", background:"radial-gradient(circle,rgba(124,58,237,0.15) 0%,transparent 70%)", animation:"aurora 12s ease-in-out infinite" }}/>
          <div style={{ position:"absolute", width:350, height:350, bottom:"10%", right:"-80px", borderRadius:"50%", background:"radial-gradient(circle,rgba(96,165,250,0.1) 0%,transparent 70%)", animation:"aurora 15s ease-in-out infinite reverse" }}/>
          <div style={{ position:"absolute", width:250, height:250, top:"40%", left:"30%", borderRadius:"50%", background:"radial-gradient(circle,rgba(240,171,252,0.07) 0%,transparent 70%)", animation:"aurora 10s ease-in-out infinite" }}/>
        </div>
        <FloatingParticles/>
        <div style={{ position:"relative", zIndex:1, height:"calc(100vh - 80px)", overflowY:"auto", animation:"slideUp 0.4s ease" }}>
          {screen==="home"     && <HomeScreen xp={xp} streak={streak} missions={missions} onCompleteMission={completeMission} aiMsg={aiMsg} quote={quote} onAddMission={addMission}/>}
          {screen==="habits"   && <HabitsScreen habits={habits} onToggle={toggleHabit} onAddHabit={addHabit}/>}
          {screen==="focus"    && <FocusScreen/>}
          {screen==="analytics"&& <AnalyticsScreen xp={xp}/>}
          {screen==="ai"       && <AIScreen xp={xp} streak={streak}/>}
          {screen==="profile"  && <ProfileScreen xp={xp} streak={streak} habits={habits} missions={missions}/>}
        </div>
        <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:"rgba(5,5,20,0.88)", backdropFilter:"blur(30px)", WebkitBackdropFilter:"blur(30px)", borderTop:"1px solid rgba(255,255,255,0.07)", display:"flex", justifyContent:"space-around", alignItems:"center", padding:"10px 4px 18px", zIndex:100 }}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setScreen(t.id)} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, border:"none", cursor:"pointer", padding:"6px 10px", borderRadius:14, transition:"all 0.2s", background:screen===t.id?"rgba(167,139,250,0.12)":"transparent" }}>
              <span style={{ fontSize:screen===t.id?22:18, color:screen===t.id?"#a78bfa":"rgba(255,255,255,0.3)", filter:screen===t.id?"drop-shadow(0 0 8px rgba(167,139,250,0.8))":"none", transition:"all 0.2s" }}>{t.icon}</span>
              <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:9, letterSpacing:0.5, color:screen===t.id?"#a78bfa":"rgba(255,255,255,0.25)", textTransform:"uppercase" }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
