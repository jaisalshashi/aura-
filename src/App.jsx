import { useState, useEffect, useRef, useCallback } from "react";
import { useAuraData } from "./useAuraData.js";
import { createAudioEngine } from "./audioEngine.js";
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "./firebase.js";

const RANKS = ["Beginner", "Grinder", "Warrior", "Legend", "Aura Master"];
const RANK_THRESHOLDS = [0, 500, 1500, 3500, 7000];
const AI_MESSAGES = [
  "Aaj ka target complete karo 😎",
  "Consistency > Motivation. Keep going.",
  "Focus pe focus karo 🔥",
  "Every rep counts. Every page matters.",
  "Aura rising... keep the streak alive ⚡",
];
const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "Your future is created by what you do today.", author: "Robert Kiyosaki" },
];
const HABIT_ICONS = ["⌨️","📖","💪","🧘","🧠","🎯","🎨","✍️","🏃","🎵","🌿","💊","🥗","🛌","📝"];
const MISSION_ICONS = ["📚","📖","💧","⚡","🔥","🎯","🏋️","🧘","🎨","💻","🌟","🎵","🍎","✅","💡"];

// ── Auth Screens ────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!email || !password) { setError("Email aur password daalo!"); return; }
    if (!isLogin && !name) { setError("Apna naam daalo!"); return; }
    setLoading(true); setError("");
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (e) {
      if (e.code === "auth/user-not-found") setError("User nahi mila!");
      else if (e.code === "auth/wrong-password") setError("Password galat hai!");
      else if (e.code === "auth/email-already-in-use") setError("Email pehle se registered hai!");
      else if (e.code === "auth/weak-password") setError("Password kam se kam 6 characters ka hona chahiye!");
      else if (e.code === "auth/invalid-email") setError("Valid email daalo!");
      else setError("Kuch error aaya, dobara try karo!");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"linear-gradient(145deg,#050510,#0a0520)", padding:"20px" }}>
      {/* Logo */}
      <div style={{ textAlign:"center", marginBottom:40 }}>
        <div style={{ width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg,#7c3aed,#a78bfa)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, margin:"0 auto 16px", boxShadow:"0 0 40px rgba(167,139,250,0.5)" }}>✦</div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:32, color:"#fff", letterSpacing:4 }}>AURA</div>
        <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, color:"rgba(255,255,255,0.4)", letterSpacing:3, marginTop:4 }}>UPGRADE YOUR LIFE</div>
      </div>

      {/* Card */}
      <div style={{ width:"100%", maxWidth:380, background:"rgba(255,255,255,0.04)", backdropFilter:"blur(20px)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:24, padding:"28px 24px" }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:"#fff", marginBottom:6 }}>
          {isLogin ? "Welcome Back 👋" : "Join AURA 🚀"}
        </div>
        <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:13, color:"rgba(255,255,255,0.4)", marginBottom:24 }}>
          {isLogin ? "Login karke apni journey continue karo" : "Account banao aur life upgrade shuru karo"}
        </div>

        {!isLogin && (
          <>
            <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, color:"rgba(255,255,255,0.4)", letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Your Name</div>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Suraj"
              style={{ width:"100%", padding:"14px 18px", borderRadius:14, marginBottom:16, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", color:"#fff", fontFamily:"'Poppins',sans-serif", fontSize:14, outline:"none" }} />
          </>
        )}

        <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, color:"rgba(255,255,255,0.4)", letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Email</div>
        <input value={email} onChange={e => setEmail(e.target.value)}
          placeholder="apna@email.com" type="email"
          style={{ width:"100%", padding:"14px 18px", borderRadius:14, marginBottom:16, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", color:"#fff", fontFamily:"'Poppins',sans-serif", fontSize:14, outline:"none" }} />

        <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:11, color:"rgba(255,255,255,0.4)", letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Password</div>
        <input value={password} onChange={e => setPassword(e.target.value)}
          placeholder="••••••••" type="password"
          style={{ width:"100%", padding:"14px 18px", borderRadius:14, marginBottom:16, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", color:"#fff", fontFamily:"'Poppins',sans-serif", fontSize:14, outline:"none" }} />

        {error && <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, color:"#f87171", marginBottom:14, padding:"10px 14px", borderRadius:10, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)" }}>⚠️ {error}</div>}

        <button onClick={handle} disabled={loading}
          style={{ width:"100%", padding:"16px", borderRadius:14, border:"none", cursor:"pointer", background:"linear-gradient(135deg,#7c3aed,#60a5fa)", color:"#fff", fontFamily:"'Poppins',sans-serif", fontSize:15, fontWeight:600, boxShadow:"0 0 24px rgba(124,58,237,0.4)", marginBottom:16, opacity:loading?0.7:1 }}>
          {loading ? "Loading..." : isLogin ? "Login karo ⚡" : "Account Banao 🚀"}
        </button>

        <div onClick={() => { setIsLogin(!isLogin); setError(""); }}
          style={{ textAlign:"center", fontFamily:"'Poppins',sans-serif", fontSize:13, color:"#a78bfa", cursor:"pointer" }}>
          {isLogin ? "Naya account banana hai? Sign up karo" : "Pehle se account hai? Login karo"}
        </div>
      </div>
    </div>
  );
}

// ── Base Components ─────────────────────────────────────────────────
function FloatingParticles() {
  const pts = useRef([...Array(20)].map(() => ({
    w: Math.random()*3+1, x: Math.random()*100, y: Math.random()*100,
    op: Math.random()*0.5+0.1, dur: Math.random()*10+8, delay: Math.random()*5, t: Math.floor(Math.random()*3)
  }))).current;
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
      {pts.map((p,i) => (
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
      boxShadow:glow?"0 0 30px rgba(167,139,250,0.15),0 8px 32px rgba(0,0,0,0.4)":"0 8px 32px rgba(0,0,0,0.3)",
      transition:"all 0.3s ease", cursor:onClick?"pointer":"default", ...style }}>
      {children}
    </div>
  );
}

function AddModal({ type, onAdd, onClose }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(type==="habit"?"🎯":"✅");
  const [xp, setXp] = useState(40);
  const icons = type==="habit" ? HABIT_ICONS : MISSION_ICONS;
  return (
    <div style={{ position:"fixed", inset:0, zIndex:999, display:"flex", alignItems:"flex-end", background:"rgba(0,0,0,0.75)", backdropFilter:"blur(10px)" }}
      onClick={e => e.target===e.currentTarget&&onClose()}>
      <div style={{ width:"100%", maxWidth:430, margin:"0 auto", background:"linear-gradient(180deg,#0d0d2b,#08081a)", border:"1px solid rgba(167,139,250,0.25)", borderRadius:"24px 24px 0 0", padding:"28px 20px 40px", animation:"slideUp 0.3s ease" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:"#fff" }}>{type==="habit"?"✦ New Habit":"⚡ New Task"}</div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.08)", border:"none", color:"rgba(255,255,255,0.6)", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:16 }}>✕</button>
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
          {icons.map(ic => (
            <div key={ic} onClick={() => setIcon(ic)} style={{ width:40, height:40, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, cursor:"pointer",
              background:icon===ic?"rgba(167,139,250,0.25)":"rgba(255,255,255,0.05)",
              border:icon===ic?"1px solid rgba(167,139,250,0.6)":"1px solid rgba(255,255,255,0.07)" }}>{ic}</div>
          ))}
        </div>
        <input value={name} onChange={e => setName(e.target.value)}
          placeholder={type==="habit"?"Habit name...":"Task name..."}
          style={{ width:"100%", padding:"14px 18px", borderRadius:14, marginBottom:16, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.15)", color:"#fff", fontFamily:"'Poppins',sans-serif", fontSize:14, outline:"none" }}/>
        {type==="mission" && (
          <div style={{ display:"flex", gap:8, marginBottom:20 }}>
            {[20,40,60,80,100].map(v => (
              <div key={v} onClick={() => setXp(v)} style={{ flex:1, padding:"10px 0", borderRadius:10, textAlign:"center", cursor:"pointer",
                background:xp===v?"rgba(167,139,250,0.25)":"rgba(255,255,255,0.05)",
                border:xp===v?"1px solid rgba(167,139,250,0.6)":"1px solid rgba(255,255,255,0.07)",
                fontFamily:"'Poppins',sans-serif", fontSize:12, color:xp===v?"#a78bfa":"rgba(255,255,255,0.5)" }}>+{v}</div>
            ))}
          </div>
        )}
        <button onClick={() => { if(!name.trim()) return; onAdd({name:name.trim(),title:name.trim(),icon,xp:Number(xp),streak:0,done:false}); onClose(); }}
          style={{ width:"100%", padding:"16px", borderRadius:14, border:"none", cursor:"pointer",
            background:name.trim()?"linear-gradient(135deg,#7c3aed,#60a5fa)":"rgba(255,255,255,0.08)",
            color:name.trim()?"#fff":"rgba(255,255,255,0.3)", fontFamily:"'Poppins',sans-serif", fontSize:15, fontWeight:600 }}>
          {type==="habit"?"Add Habit ✦":"Add Task ⚡"}
        </button>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"linear-gradient(145deg,#050510,#0a0520)" }}>
      <div style={{ width:70, height:70, borderRadius:"50%", background:"linear-gradient(135deg,#7c3aed,#a78bfa)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, marginBottom:20, boxShadow:"0 0 40px rgba(167,139,250,0.5)", animation:"pulse 1.5s ease infinite" }}>✦</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, color:"#fff", letterSpacing:4 }}>AURA</div>
      <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, color:"rgba(255,255,255,0.3)", marginTop:8, letterSpacing:3 }}>LOADING...</div>
    </div>
  );
}

function HomeScreen({ xp, streak, missions, onCompleteMission, aiMsg, quote, onAddMission, userName, onLogout }) {
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
      {showAdd&&<AddModal type="mission" onAdd={m=>{onAddMission({...m,title:m.name});setShowAdd(false);}} onClose={()=>setShowAdd(false)}/>}
      <div style={{ padding:"32px 20px 0", marginBottom:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", fontFamily:"'Poppins',sans-serif", letterSpacing:2, textTransform:"uppercase" }}>
              {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
            </div>
            <div style={{ fontSize:26, fontFamily:"'Playfair Display',serif", color:"#fff", marginTop:4, lineHeight:1.2 }}>
              {greeting}, <span style={{ color:"#a78bfa" }}>{userName || "Warrior"}.</span>
            </div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", fontFamily:"'Poppins',sans-serif", marginTop:6 }}>
              {done}/{total} missions completed today.
            </div>
          </div>
          <button onClick={onLogout} style={{ padding:"8px 14px", borderRadius:99, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.4)", fontFamily:"'Poppins',sans-serif", fontSize:11, cursor:"pointer", marginTop:8 }}>Logout</button>
        </div>
      </div>
      <div style={{ display:"flex", gap:12, padding:"0 20px", marginBottom:20 }}>
        {[{icon:"🔥",val:streak,label:"STREAK",color:"#f97316"},{icon:"⚡",val:xp,label:"XP",color:"#a78bfa"},{icon:"👑",val:rank,label:"RANK",color:"#60a5fa",sm:true}].map((s,i)=>(
          <GlassCard key={i} style={{ flex:1, padding:"14px", textAlign:"center" }} glow>
            <div style={{ fontSize:20, marginBottom:4 }}>{s.icon}</div>
            <div style={{ fontSize:s.sm?10:22, fontWeight:700, color:s.color, fontFamily:"'Poppins',sans-serif", lineHeight:1.3 }}>{s.val}</div>
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
          <button onClick={()=>setShowAdd(true)} style={{ padding:"8px 14px", borderRadius:99, background:"linear-gradient(135deg,rgba(124,58,237,0.3),rgba(96,165,250,0.2))", border:"1px solid rgba(167,139,250,0.4)", color:"#a78bfa", fontFamily:"'Poppins',sans-serif", fontSize:12, cursor:"pointer", fontWeight:600 }}>＋ Add Task</button>
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
              <div style={{ width:24, height:24, borderRadius:"50%", border:m.done?"none":"2px solid rgba(255,255,255,0.2)", background:m.done?"linear-gradient(135deg,#22c55e,#16a34a)":"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#fff" }}>
                {m.done?"✓":""}
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
      <div style={{ paddi