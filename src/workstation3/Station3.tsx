import './station3.css';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ================================================================
//  ASSET SYSTEM (unchanged — keep your image refs)
// ================================================================
const ASSETS = {
  hero_bg: "", city_night_bg: "", rain_overlay: "", logo_mark: "",
  role_operator: "", role_verifier: "", role_tactician: "",
  plate_bg: "", cam2_thumb_C3: "",
  road_sign_school: "", road_sign_residential: "", road_sign_urban: "", road_sign_highway: "",
  vehicle_ambulance: "", car_1: "", car_2: "", car_3: "", car_4: "", car_5: "", car_6: "",
  tier_rookie: "", tier_officer: "", tier_inspector: "", tier_dcp: "", ticket_texture: ""
};

// ================================================================
//  DATA (unchanged)
// ================================================================
const pA = [
  {q:"Which stage comes right after Threshold?", a:"Character segmentation", w:["Grayscale", "OCR", "Validation"]},
  {q:"Minimum confidence to auto-validate?", a:"90%", w:["75%", "89%", "100%"]},
  {q:"Which plate is valid?", a:"MH12AB4721", w:["MH1AB47212", "M12HAB4721", "12MHAB4721"]},
  {q:"School zone limit?", a:"30 km/h", w:["40 km/h", "50 km/h", "20 km/h"]},
  {q:"OCR reads MH 12 A8 4721; which character is misread?", a:"8 is really B", w:["A is really 4", "1 is really I", "2 is really Z"]},
  {q:"Code for a red-light violation?", a:"RLV-02", w:["SPD-01", "RLV-01", "RED-02"]}
];
const pB = [
  { id:"N1", p:"MH47R1105",  img:"/plate1.jpg", d:0, sc:25, st:90,  sd:false, tc:[60,75],  tt:[80,110],  cg:75,  bg:132 },
  { id:"N2", p:"MH02CN4901", img:"/plate2.jpg", d:1, sc:45, st:90,  sd:false, tc:[35,50],  tt:[150,180], cg:120, bg:220 },
  { id:"N3", p:"MH02DE1544", img:"/plate3.jpg", d:2, sc:60, st:115, sd:false, tc:[55,65],  tt:[100,130], cg:70,  bg:160, fd:true },
  { id:"N4", p:"MH47R1105",  img:"/plate1.jpg", d:3, sc:90, st:160, sd:false, tc:[70,85],  tt:[70,95],   cg:50,  bg:146 },
  { id:"N5", p:"MH02CN4901", img:"/plate2.jpg", d:1, sc:30, st:120, sd:false, tc:[60,80],  tt:[90,130],  cg:80,  bg:200 },
  { id:"N6", p:"MH02DE1544", img:"/plate3.jpg", d:0, sc:20, st:100, sd:false, tc:[65,85],  tt:[85,120],  cg:90,  bg:150 }
];
const pC = [
  {id:"C1", p:"MH12AB4721", c:96, dist:25, t:1.25, z:"U", o:1, ang:false, amb:false, ans:{ex:7,  fn:500,  rt:'Auto-validate',   cd:'UA211'}},
  {id:"C2", p:"DL01CA0099", c:96, dist:30, t:2.0,  z:"S", o:1, ang:false, amb:false, ans:{ex:19, fn:2000, rt:'Auto-validate',   cd:'SB991'}},
  {id:"C3", p:"MH14KT3308", c:82, dist:20, t:1.0,  z:"U", o:2, ang:true,  amb:false, ans:{ex:7,  fn:500,  rt:'Manual bypass',   cd:'UA082'}},
  {id:"C4", p:"TN09BX5516", c:71, dist:30, t:1.2,  z:"H", o:1, ang:false, amb:false, ans:{ex:5,  fn:500,  rt:'Reject / re-tune', cd:'HA161'}},
  {id:"C5", p:"KA05MN7788", c:96, dist:null, spd:95, z:"U", o:1, ang:false, amb:true,  ans:{ex:30, fn:2000, rt:'Void fine',       cd:'EX-1'}}
];

// ================================================================
//  HIGHWAY CAR TRANSITION
// ================================================================
function HighwayTransition({ onDone }) {
  const [phase, setPhase] = useState<'car-in'|'flash'|'car-out'>('car-in');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('flash'), 900);
    const t2 = setTimeout(() => setPhase('car-out'), 1200);
    const t3 = setTimeout(() => onDone(), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <motion.div
      className="highway-transition"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Dark overlay with road */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.85)' }}
        animate={{ opacity: phase === 'flash' ? 0 : 0.85 }}
        transition={{ duration: 0.15 }}
      />

      {/* Road surface */}
      <div className="absolute left-0 right-0" style={{ top: '45%', height: '10%', background: 'rgba(20,20,25,0.9)', borderTop: '1px solid rgba(255,170,0,0.2)', borderBottom: '1px solid rgba(255,170,0,0.2)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, transparent 0, transparent 40px, rgba(255,170,0,0.15) 40px, rgba(255,170,0,0.15) 80px)', animation: 'roadScroll 0.15s linear infinite' }} />
      </div>

      {/* Car SVG — moving from left to right */}
      <motion.div
        className="absolute"
        style={{ top: '41%', transform: 'translateY(-50%)' }}
        initial={{ left: '-20%' }}
        animate={{
          left: phase === 'car-in' ? '40%' : phase === 'flash' ? '50%' : '120%',
        }}
        transition={{
          duration: phase === 'car-in' ? 0.9 : phase === 'flash' ? 0.15 : 0.45,
          ease: phase === 'car-in' ? [0.1, 0.5, 0.3, 1] : phase === 'flash' ? 'linear' : [0.7, 0, 1, 0.5]
        }}
      >
        {/* Motion blur trails */}
        {phase === 'car-in' && (
          <div style={{
            position: 'absolute', right: '100%', top: '30%', height: '40%',
            width: '200px',
            background: 'linear-gradient(90deg, transparent, rgba(255,106,0,0.4), rgba(0,212,255,0.3))',
            filter: 'blur(4px)'
          }} />
        )}

        {/* Car body — minimalist SVG side view (Dodge Charger silhouette) */}
        <svg width="220" height="90" viewBox="0 0 220 90" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Underglow */}
          <ellipse cx="110" cy="84" rx="90" ry="6" fill="rgba(155,0,255,0.35)" />
          <ellipse cx="110" cy="84" rx="60" ry="3" fill="rgba(255,106,0,0.3)" />

          {/* Body */}
          <path d="M18 60 L25 40 L55 28 L90 22 L140 22 L165 30 L190 45 L198 60 L18 60Z"
            fill="#1a1a20" stroke="#ff6a00" strokeWidth="1.5" />

          {/* Roof */}
          <path d="M60 40 L75 24 L145 24 L162 38 Z"
            fill="#111115" stroke="#ff6a00" strokeWidth="1" />

          {/* Windshield */}
          <path d="M78 38 L88 24 L140 24 L155 38 Z" fill="rgba(0,212,255,0.15)" stroke="rgba(0,212,255,0.4)" strokeWidth="0.8" />

          {/* Side windows */}
          <path d="M80 38 L90 25 L118 25 L118 38 Z" fill="rgba(0,212,255,0.1)" stroke="rgba(0,212,255,0.3)" strokeWidth="0.6" />
          <path d="M122 25 L138 25 L152 38 L122 38 Z" fill="rgba(0,212,255,0.1)" stroke="rgba(0,212,255,0.3)" strokeWidth="0.6" />

          {/* Front bumper detail */}
          <rect x="185" y="52" width="14" height="6" rx="1" fill="#1a1a20" stroke="#ff6a00" strokeWidth="1" />
          <rect x="187" y="54" width="4" height="3" fill="rgba(255,200,100,0.8)" />

          {/* Headlights */}
          <ellipse cx="196" cy="52" rx="6" ry="5" fill="rgba(255,240,180,0.9)" />
          <ellipse cx="196" cy="52" rx="6" ry="5" fill="rgba(255,240,180,0.9)" filter="blur(3px)" opacity="0.8" />
          {phase !== 'car-in' && (
            <ellipse cx="196" cy="52" rx="20" ry="14" fill="rgba(255,240,200,0.4)" filter="blur(6px)" />
          )}

          {/* Tail lights */}
          <rect x="16" y="50" width="8" height="7" rx="1" fill="#ff2020" opacity="0.9" />
          <rect x="16" y="50" width="8" height="7" rx="1" fill="#ff2020" filter="blur(3px)" opacity="0.6" />

          {/* Wheels */}
          <circle cx="52" cy="68" r="16" fill="#0d0d10" stroke="#ff6a00" strokeWidth="2" />
          <circle cx="52" cy="68" r="10" fill="#111" stroke="rgba(255,106,0,0.4)" strokeWidth="1" />
          <circle cx="52" cy="68" r="4" fill="#333" />

          <circle cx="162" cy="68" r="16" fill="#0d0d10" stroke="#ff6a00" strokeWidth="2" />
          <circle cx="162" cy="68" r="10" fill="#111" stroke="rgba(255,106,0,0.4)" strokeWidth="1" />
          <circle cx="162" cy="68" r="4" fill="#333" />

          {/* Body accent lines */}
          <line x1="50" y1="48" x2="185" y2="48" stroke="rgba(255,106,0,0.4)" strokeWidth="1" />
          <line x1="50" y1="55" x2="185" y2="55" stroke="rgba(0,212,255,0.2)" strokeWidth="0.5" />
        </svg>

        {/* Speed lines from car */}
        {(phase === 'car-in') && (
          <motion.div
            className="absolute"
            style={{
              right: '95%', top: '20%', height: '60%', width: '300px',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,106,0,0.5) 60%, rgba(255,106,0,0.8) 100%)',
              filter: 'blur(2px)',
            }}
          />
        )}
      </motion.div>

      {/* Headlight flash bloom */}
      <AnimatePresence>
        {phase === 'flash' && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            style={{
              background: 'radial-gradient(ellipse at 50% 50%, rgba(255,240,200,0.95) 0%, rgba(255,180,80,0.7) 25%, rgba(255,106,0,0.3) 50%, transparent 75%)'
            }}
          />
        )}
      </AnimatePresence>

      {/* Tire skid marks (faint on floor) */}
      <div className="absolute" style={{ top: '53%', left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent 0%, rgba(60,60,60,0.6) 20%, rgba(80,80,80,0.8) 50%, rgba(60,60,60,0.4) 80%, transparent 100%)' }} />
    </motion.div>
  );
}

// ================================================================
//  HELPER COMPONENTS
// ================================================================
const GlitchText = ({ text, className = "" }) => (
  <span className={`glitch-text font-heading tracking-widest uppercase ${className}`} data-text={text}>{text}</span>
);

const Panel = ({ children, className = "", style = {} }) => (
  <div className={`ff-panel panel-clip p-5 relative ${className}`} style={style}>
    {children}
  </div>
);

const Btn = ({ children, onClick, danger = false, className = "" }) => (
  <motion.button
    whileHover={{ scale: 1.04 }}
    whileTap={{ scale: 0.96 }}
    onClick={onClick}
    className={`ff-btn btn-clip ${danger ? 'ff-btn-danger' : ''} ${className}`}
  >
    {children}
  </motion.button>
);

// Mini HUD stat display
const HUDStat = ({ label, value, color = '#ff6a00' }) => (
  <div className="flex flex-col items-center">
    <span style={{ fontFamily: 'var(--font-hud)', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'rgba(200,208,224,0.5)', textTransform: 'uppercase' }}>{label}</span>
    <span style={{ fontFamily: 'var(--font-hud)', fontSize: '1.1rem', fontWeight: 700, color, textShadow: `0 0 12px ${color}` }}>{value}</span>
  </div>
);

// ================================================================
//  MAIN STATION 3 COMPONENT
// ================================================================
function Station3() {
  const [phase, setPhase] = useState(0);
  const [team, setTeam] = useState({ name: '', size: 3 });
  const [score, setScore] = useState({ a: 40, ap: 0, b: 60, bp: 0, c: 50, cp: 0, bon: 0 });
  const [time, setTime] = useState(1800);
  const [shake, setShake] = useState(false);
  const [toast, setToast] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [nextPhase, setNextPhase] = useState<number|null>(null);

  const fxFail = () => { setShake(true); setTimeout(() => setShake(false), 500); };
  const showToast = (msg, err = false) => { setToast({ msg, err }); setTimeout(() => setToast(null), 3000); };

  // Trigger highway transition animation between phases
  const goToPhase = (p: number) => {
    setNextPhase(p);
    setTransitioning(true);
  };

  const handleTransitionDone = () => {
    if (nextPhase !== null) setPhase(nextPhase);
    setTransitioning(false);
    setNextPhase(null);
  };

  useEffect(() => {
    if (phase >= 2 && phase <= 4) {
      const t = setInterval(() => {
        setTime(prev => {
          if (prev <= 1) { clearInterval(t); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(t);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 2 && time <= 1680) goToPhase(3);
    if (phase === 3 && time <= 1200) goToPhase(4);
    if (phase === 4 && time === 0) goToPhase(5);
  }, [time, phase]);

  const totScore = Math.max(0, score.a - score.ap + score.b - score.bp + score.c - score.cp + score.bon);

  // Time percentage for progress
  const timeProgress = (1800 - time) / 1800;
  const isRedline = time <= 60;

  return (
    <motion.div
      animate={shake ? { x: [-12, 12, -8, 8, -4, 4, 0] } : {}}
      transition={{ duration: 0.5 }}
      className="h-full flex flex-col relative z-10"
    >
      {/* ── Background layers ── */}
      <div className="ambient-layer asphalt-bg" />
      <div className="ambient-layer road-grid" />
      <div className="ambient-layer underglow" />
      <div className="ambient-layer vignette" />

      {/* ── Toast notifications ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`fixed top-5 right-5 p-4 panel-clip-sm shadow-2xl z-50 ${toast.err ? 'toast-error' : 'toast-success'}`}
            style={{ minWidth: 280 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.2rem' }}>{toast.err ? '⚠' : '✓'}</span>
              <span>{toast.msg}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Highway Transition Overlay ── */}
      <AnimatePresence>
        {transitioning && <HighwayTransition onDone={handleTransitionDone} />}
      </AnimatePresence>

      {/* ── HUD Header (shown during modules) ── */}
      {phase >= 2 && phase <= 4 && (
        <header className="hud-header flex items-center px-6 py-3 gap-6 relative z-50">
          {/* Team callsign */}
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', letterSpacing: '0.15em', color: '#e8eaf0' }}>
            <span style={{ color: 'var(--color-nos-orange)' }}>OP: </span>{team.name}
          </div>

          {/* Gear-shift progress */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <span style={{ fontFamily: 'var(--font-hud)', fontSize: '0.55rem', letterSpacing: '0.3em', color: 'rgba(200,208,224,0.4)' }}>MISSION PROGRESS</span>
            <div className="gear-progress">
              {[...Array(6)].map((_, i) => {
                const prog = timeProgress * 6;
                return (
                  <div key={i} className={`gear-pip ${i < Math.floor(prog) ? (isRedline ? 'redline' : 'active') : ''}`} />
                );
              })}
            </div>
          </div>

          {/* Timer — tachometer style */}
          <div style={{ position: 'relative', textAlign: 'center' }}>
            <div style={{
              fontFamily: 'var(--font-hud)', fontSize: '2rem', fontWeight: 900,
              color: isRedline ? 'var(--color-danger-red)' : 'var(--color-nos-orange)',
              textShadow: `0 0 20px ${isRedline ? 'var(--color-danger-red)' : 'var(--color-nos-orange)'}`,
              letterSpacing: '0.05em',
              animation: isRedline ? 'redlinePulse 0.5s ease infinite alternate' : 'none'
            }}>
              {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
            </div>
            <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.5rem', letterSpacing: '0.3em', color: 'rgba(200,208,224,0.4)' }}>TIME REMAINING</div>
          </div>

          {/* Score — speedometer */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.5rem', letterSpacing: '0.3em', color: 'rgba(200,208,224,0.4)' }}>SCORE</div>
            <div style={{ fontFamily: 'var(--font-hud)', fontSize: '2.2rem', fontWeight: 900, color: 'var(--color-acid-green)', textShadow: '0 0 20px #39ff14' }}>
              {totScore}
            </div>
          </div>
        </header>
      )}

      {/* ── Main content ── */}
      <main className="flex-1 p-6 overflow-y-auto relative z-50 flex flex-col" style={{ fontFamily: 'var(--font-body)' }}>
        {phase === 0 && <BootScreen onDone={() => goToPhase(1)} />}
        {phase === 1 && <BriefingScreen onStart={(t) => { setTeam(t); goToPhase(2); }} />}
        {phase === 2 && (
          <ModuleA
            score={score} setScore={setScore}
            onComplete={(t) => { if (!t) setScore((s: any) => ({ ...s, bon: s.bon + Math.floor((time - 1680) / 5) })); goToPhase(3); }}
            fxFail={fxFail}
          />
        )}
        {phase === 3 && (
          <ModuleB
            score={score} setScore={setScore}
            onComplete={(t) => { if (!t) setScore((s: any) => ({ ...s, bon: s.bon + Math.floor((time - 1200) / 5) })); goToPhase(4); }}
            fxFail={fxFail} showToast={showToast}
          />
        )}
        {phase === 4 && (
          <ModuleC
            score={score} setScore={setScore}
            onComplete={() => { setScore((s: any) => ({ ...s, bon: s.bon + Math.floor(time / 5) })); goToPhase(5); }}
            fxFail={fxFail} showToast={showToast}
          />
        )}
        {phase === 5 && <OutroScreen score={score} team={team} totScore={totScore} />}
      </main>
    </motion.div>
  );
}

// ================================================================
//  BOOT SCREEN — Terminal with F&F flavor
// ================================================================
function BootScreen({ onDone }) {
  const [text, setText] = useState("");
  const [showGo, setShowGo] = useState(false);
  const fullText = "OPERATION REDLINE INITIATED\nANPR SURVEILLANCE GRID: ONLINE\nTARGET: ILLEGAL STREET RACE — SECTOR 7\nFAST CREW VEHICLES DETECTED ON HIGHWAY LOOP\nESTABLISHING UPLINK TO PURSUIT NETWORK...";

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      setText(fullText.substring(0, i) + (Math.random() > 0.5 ? '_' : ''));
      i++;
      if (i > fullText.length) {
        clearInterval(t);
        setShowGo(true);
        setTimeout(onDone, 1400);
      }
    }, 40);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8">
      {/* F&F Style Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: 'center' }}
      >
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '4rem', letterSpacing: '0.3em', color: 'var(--color-nos-orange)', textShadow: '0 0 40px rgba(255,106,0,0.6)', lineHeight: 1 }}>
          OPERATION
        </div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '6rem', letterSpacing: '0.1em', background: 'linear-gradient(135deg, #ff6a00, #ffaa00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1, textShadow: 'none', filter: 'drop-shadow(0 0 30px rgba(255,106,0,0.8))' }}>
          REDLINE
        </div>
        <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.75rem', letterSpacing: '0.5em', color: 'var(--color-speed-blue)', marginTop: 8 }}>
          ANPR PURSUIT GRID // SECTOR 7
        </div>
      </motion.div>

      {/* Terminal text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="terminal-text text-center whitespace-pre-wrap"
        style={{ maxWidth: 600 }}
      >
        {text}
      </motion.div>

      {/* GO signal */}
      <AnimatePresence>
        {showGo && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex gap-3"
          >
            {['red', 'yellow', 'yellow', 'green'].map((c, i) => (
              <motion.div
                key={i}
                className={`drag-light ${c}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.12 }}
                style={{ width: 20, height: 20 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ================================================================
//  BRIEFING SCREEN
// ================================================================
function BriefingScreen({ onStart }) {
  const [name, setName] = useState("");
  const [size, setSize] = useState(3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full py-8"
    >
      {/* Title */}
      <GlitchText text="OPERATION REDLINE" className="text-6xl mb-1" style={{ fontSize: '4rem' }} />
      <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.7rem', letterSpacing: '0.4em', color: 'var(--color-speed-blue)', marginBottom: 24 }}>
        ANPR GRID: SECTOR 7 // ILLEGAL STREET RACE IN PROGRESS
      </div>

      {/* Mission brief */}
      <Panel className="w-full mb-5">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 4, height: 40, background: 'var(--color-nos-orange)', boxShadow: '0 0 10px var(--color-nos-orange)' }} />
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', letterSpacing: '0.15em', color: 'var(--color-nos-orange)' }}>MISSION BRIEF</span>
        </div>
        <p style={{ color: 'rgba(220,224,240,0.8)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          The <strong style={{ color: '#fff' }}>Fast Crew</strong> is running the highway loop tonight — no permits, no speed limits.
          You have <strong style={{ color: 'var(--color-nos-orange)' }}>30 minutes</strong> to intercept, scan plates, verify identities,
          and issue citations before they scatter. <em style={{ color: 'var(--color-speed-blue)' }}>Precision is mandatory. Speed is everything.</em>
        </p>
      </Panel>

      {/* Team setup */}
      <div className="flex gap-4 w-full mb-5">
        <Panel className="flex-1">
          <label style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-nos-orange)', letterSpacing: '0.15em', display: 'block', marginBottom: 8, fontSize: '0.9rem' }}>
            CREW CALLSIGN
          </label>
          <input
            type="text"
            placeholder="ENTER CALLSIGN"
            value={name}
            onChange={e => setName(e.target.value.toUpperCase())}
            style={{
              width: '100%', background: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,106,0,0.3)', color: '#fff',
              padding: '10px 14px', fontFamily: 'var(--font-hud)', fontSize: '1rem',
              letterSpacing: '0.15em', outline: 'none', clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))'
            }}
          />
        </Panel>
        <Panel className="flex-1">
          <label style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-nos-orange)', letterSpacing: '0.15em', display: 'block', marginBottom: 8, fontSize: '0.9rem' }}>
            CREW SIZE
          </label>
          <select
            value={size}
            onChange={e => setSize(Number(e.target.value))}
            style={{
              width: '100%', background: 'rgba(0,0,0,0.7)',
              border: '1px solid rgba(255,106,0,0.3)', color: '#fff',
              padding: '10px 14px', fontFamily: 'var(--font-hud)', fontSize: '1rem',
              outline: 'none', appearance: 'none'
            }}
          >
            <option value={3}>3 OFFICERS</option>
            <option value={2}>2 OFFICERS</option>
          </select>
        </Panel>
      </div>

      {/* Role cards */}
      <div className="flex gap-4 mb-8 w-full justify-center">
        {[
          { t: "OPERATOR", c: "var(--color-nos-orange)", d: "Controls terminal.", icon: "🖥" },
          { t: "VERIFIER", c: "var(--color-speed-blue)", d: size === 2 ? "Maths & codes." : "Validates plates.", icon: "🔍" },
          ...(size === 3 ? [{ t: "TACTICIAN", c: "var(--color-nos-amber)", d: "Calculates speed & fines.", icon: "⚡" }] : [])
        ].map((r, i) => (
          <Panel key={i} className="flex-1 flex flex-col items-center text-center" style={{ minWidth: 160 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 10, filter: 'drop-shadow(0 0 8px rgba(255,106,0,0.4))' }}>{r.icon}</div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', letterSpacing: '0.1em', color: r.c, marginBottom: 4 }}>{r.t}</h3>
            <p style={{ fontSize: '0.85rem', color: 'rgba(200,208,224,0.6)', lineHeight: 1.4 }}>{r.d}</p>
          </Panel>
        ))}
      </div>

      <Btn className="text-2xl px-16 py-4" onClick={() => onStart({ name: name || "ROGUE", size })}>
        🏁 START MISSION
      </Btn>
    </motion.div>
  );
}

// ================================================================
//  MODULE A — Quiz questions
// ================================================================
function ModuleA({ score, setScore, onComplete, fxFail }) {
  const [qs] = useState(() => [...pA].sort(() => Math.random() - 0.5).slice(0, 2));
  const [qIdx, setQIdx] = useState(0);
  const [opts, setOpts] = useState<string[]>([]);
  const [ansd, setAnsd] = useState<string | null>(null);

  useEffect(() => {
    if (qIdx < 2) setOpts([qs[qIdx].a, ...qs[qIdx].w].sort(() => Math.random() - 0.5));
    else onComplete(false);
  }, [qIdx]);

  if (qIdx >= 2) return null;
  const q = qs[qIdx];

  const handleAns = (opt) => {
    if (ansd) return;
    setAnsd(opt);
    if (opt === q.a) {
      setScore((s: any) => ({ ...s, a: s.a + 10 }));
    } else {
      setScore((s: any) => ({ ...s, ap: s.ap + 3 }));
      fxFail();
    }
    setTimeout(() => { setAnsd(null); setQIdx(i => i + 1); }, 1200);
  };

  return (
    <motion.div
      key={qIdx}
      initial={{ x: 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -60, opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full gap-6"
    >
      {/* Module label */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', letterSpacing: '0.3em', color: 'var(--color-nos-orange)' }}>
          MODULE A — SYSTEM CHECK {qIdx + 1}/2
        </div>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(255,106,0,0.5), transparent)' }} />
      </div>

      <Panel className="w-full">
        <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.65rem', letterSpacing: '0.3em', color: 'rgba(200,208,224,0.4)', marginBottom: 16 }}>
          INTEL QUERY
        </div>
        <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', marginBottom: 28, lineHeight: 1.4 }}>{q.q}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {opts.map((o, i) => {
            let cls = 'option-card';
            if (ansd) {
              if (o === q.a) cls += ' correct';
              else if (o === ansd) cls += ' wrong';
              else cls += ' dimmed';
            }
            return (
              <motion.button
                key={i}
                whileHover={!ansd ? { scale: 1.02 } : {}}
                whileTap={!ansd ? { scale: 0.98 } : {}}
                onClick={() => handleAns(o)}
                className={cls}
              >
                {o}
              </motion.button>
            );
          })}
        </div>
      </Panel>
    </motion.div>
  );
}

// ================================================================
//  MODULE B — Camera / Plate calibration
// ================================================================
function ModuleB({ score, setScore, onComplete, fxFail, showToast }) {
  const [cap] = useState(() => pB[Math.floor(Math.random() * pB.length)]);
  const [c, setC] = useState(cap.sc);
  const [t, setT] = useState(cap.st);
  const [d, setD] = useState(cap.sd);
  const [diagDone, setDiagDone] = useState(false);
  const [ocrRunning, setOcr] = useState(false);
  const [sliderX, setSliderX] = useState(300);
  const [imgFailed, setImgFailed] = useState(false);
  const vWrapRef = useRef<HTMLDivElement>(null);

  let cf = 96;
  if (c < cap.tc[0]) cf -= 1.2 * (cap.tc[0] - c);
  else if (c > cap.tc[1]) cf -= 1.2 * (c - cap.tc[1]);
  if (t < cap.tt[0]) cf -= 0.6 * (cap.tt[0] - t);
  else if (t > cap.tt[1]) cf -= 0.6 * (t - cap.tt[1]);
  if (cap.fd && !d) cf -= 15;
  const conf = Math.max(0, Math.min(100, Math.floor(cf)));

  const handleDrag = (e) => {
    if (!vWrapRef.current) return;
    const rect = vWrapRef.current.getBoundingClientRect();
    let x = e.clientX || (e.touches && e.touches[0].clientX);
    if (!x) return;
    x = x - rect.left;
    setSliderX(Math.max(0, Math.min(rect.width, x)));
  };

  const cssRaw = `grayscale(100%) contrast(${cap.sc}%) brightness(${cap.st}%) ${(!cap.sd && cap.fd) ? 'blur(3px)' : ''}`;
  const cssProc = `grayscale(100%) contrast(${c}%) brightness(${t}%) ${(!d && cap.fd) ? 'blur(3px)' : ''}`;

  let confColor = conf >= 90 ? 'var(--color-acid-green)' : conf >= 75 ? 'var(--color-nos-amber)' : 'var(--color-danger-red)';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, height: '100%' }}>
      {/* Left: camera feed */}
      <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Panel className="flex-1 cam-bracket" style={{ maxHeight: 440 }}>
          <div className="relative bg-black border border-[#1a1a20] overflow-hidden cam-scanlines" style={{ height: '100%', minHeight: 320 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,5,10,0.6)' }} />

            {/* REC indicator */}
            <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10 }}>
              <div className="rec-indicator"><div className="rec-dot" />REC</div>
            </div>

            {/* Capture ID */}
            <div style={{ position: 'absolute', top: 12, right: 12, fontFamily: 'var(--font-hud)', fontSize: '0.6rem', color: 'rgba(0,212,255,0.5)', letterSpacing: '0.2em' }}>
              CAM-B // {cap.id}
            </div>

            {/* Slider comparison */}
            <div
              ref={vWrapRef}
              className="relative w-full cam-noise"
              style={{ height: 320, zIndex: 5, userSelect: 'none', overflow: 'hidden' }}
              onMouseMove={(e) => e.buttons === 1 && handleDrag(e)}
              onTouchMove={handleDrag}
            >
              {/* Processed */}
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#1a1a22', filter: cssProc }}>
                {(!cap.img || imgFailed)
                  ? <span style={{ fontFamily: 'var(--font-plate)', fontSize: '3.5rem', fontWeight: 700, color: '#88a' }}>{cap.p}</span>
                  : <img src={cap.img} onError={() => setImgFailed(true)} className="w-full h-full object-contain" />
                }
              </div>
              {/* Raw (clipped) */}
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#1a1a22', filter: cssRaw, clipPath: `inset(0 calc(100% - ${sliderX}px) 0 0)` }}>
                {(!cap.img || imgFailed)
                  ? <span style={{ fontFamily: 'var(--font-plate)', fontSize: '3.5rem', fontWeight: 700, color: '#88a' }}>{cap.p}</span>
                  : <img src={cap.img} onError={() => setImgFailed(true)} className="w-full h-full object-contain" />
                }
              </div>

              {/* OCR scan line */}
              {ocrRunning && (
                <motion.div
                  initial={{ left: '-5%' }}
                  animate={{ left: '105%' }}
                  transition={{ duration: 1.0, ease: 'linear' }}
                  style={{ position: 'absolute', top: '-10%', width: 6, height: '120%', background: 'linear-gradient(180deg, transparent, var(--color-speed-blue), transparent)', boxShadow: '0 0 20px var(--color-speed-blue)', skewX: '-15deg', zIndex: 20 }}
                />
              )}

              {/* Slider handle */}
              <div
                className="absolute top-0 bottom-0 cursor-ew-resize"
                style={{ left: sliderX, width: 2, background: 'var(--color-nos-orange)', boxShadow: '0 0 12px var(--color-nos-orange)' }}
                onMouseDown={e => e.preventDefault()}
              >
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--color-nos-orange)', color: '#000', fontSize: '0.6rem', padding: '3px 6px', fontFamily: 'var(--font-heading)', whiteSpace: 'nowrap', letterSpacing: '0.1em' }}>
                  ◀ ▶
                </div>
              </div>
            </div>

            {/* Bottom labels */}
            <div style={{ position: 'absolute', bottom: 8, left: 12, fontFamily: 'var(--font-hud)', fontSize: '0.6rem', color: 'rgba(0,212,255,0.5)', letterSpacing: '0.1em' }}>RAW</div>
            <div style={{ position: 'absolute', bottom: 8, right: 12, fontFamily: 'var(--font-hud)', fontSize: '0.6rem', color: 'rgba(255,106,0,0.5)', letterSpacing: '0.1em' }}>PROCESSED</div>
          </div>
        </Panel>

        {/* Confidence + OCR trigger */}
        <Panel className="flex items-center gap-8">
          {/* Semi-circle confidence gauge */}
          <div style={{ position: 'relative', width: 160, height: 90, flexShrink: 0 }}>
            <svg width="160" height="90" viewBox="0 0 160 90">
              <path d="M10 85 A70 70 0 0 1 150 85" fill="none" stroke="rgba(255,106,0,0.15)" strokeWidth="12" />
              {diagDone && (
                <motion.path
                  d="M10 85 A70 70 0 0 1 150 85"
                  fill="none"
                  stroke={confColor}
                  strokeWidth="12"
                  strokeDasharray="220"
                  initial={{ strokeDashoffset: 220 }}
                  animate={{ strokeDashoffset: 220 - (conf / 100) * 220 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{ filter: `drop-shadow(0 0 6px ${confColor})` }}
                />
              )}
            </svg>
            <div style={{ position: 'absolute', bottom: 0, width: '100%', textAlign: 'center', fontFamily: 'var(--font-hud)', fontSize: '2.2rem', fontWeight: 900, color: diagDone ? confColor : '#445', textShadow: diagDone ? `0 0 20px ${confColor}` : 'none' }}>
              {diagDone ? conf : '--'}%
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.7rem', color: 'rgba(200,208,224,0.5)', marginBottom: 10, letterSpacing: '0.1em' }}>
              CHAR GRAY: <span style={{ color: '#fff' }}>{cap.cg}</span> &nbsp;|&nbsp; BG GRAY: <span style={{ color: '#fff' }}>{cap.bg}</span>
            </div>
            <Btn danger className="w-full" onClick={() => {
              if (!diagDone || ocrRunning) return;
              setOcr(true);
              setTimeout(() => {
                setOcr(false);
                if (conf >= 90) {
                  setScore((s: any) => ({ ...s, b: s.b + 20 }));
                  showToast("✓ PLATE VERIFIED — SENDING TO CHALLAN");
                  setTimeout(() => onComplete(false), 1000);
                } else {
                  fxFail();
                  showToast("✗ CONFIDENCE TOO LOW — REJECTED", true);
                }
              }, 1100);
            }}>
              ⚡ SEND TO OCR
            </Btn>
          </div>
        </Panel>
      </div>

      {/* Right: controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Step 1: Diagnostics */}
        <Panel>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', letterSpacing: '0.2em', color: 'var(--color-nos-orange)', marginBottom: 8 }}>
            1. DIAGNOSTICS
          </h2>
          <div className="sys-assist" style={{ marginBottom: 12 }}>
            {["CONTRAST LOW", "THRESH LOW", "DENOISE OFF", "BOTH HIGH"][cap.d]}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {["CONTRAST LOW", "THRESH LOW", "DENOISE OFF", "BOTH HIGH"].map((dTxt, i) => (
              <motion.button
                key={i}
                whileHover={!diagDone ? { scale: 1.03 } : {}}
                whileTap={!diagDone ? { scale: 0.97 } : {}}
                onClick={() => {
                  if (diagDone) return;
                  if (i === cap.d) {
                    setDiagDone(true);
                    setScore((s: any) => ({ ...s, b: s.b + 10 }));
                  } else {
                    fxFail();
                    setScore((s: any) => ({ ...s, bp: s.bp + 3 }));
                  }
                }}
                style={{
                  fontFamily: 'var(--font-heading)', fontSize: '0.9rem', letterSpacing: '0.1em',
                  padding: '10px 8px', border: '1px solid',
                  cursor: diagDone ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                  ...(diagDone
                    ? (i === cap.d
                      ? { background: 'rgba(57,255,20,0.15)', borderColor: 'var(--color-acid-green)', color: 'var(--color-acid-green)', boxShadow: '0 0 12px rgba(57,255,20,0.3)' }
                      : { background: 'rgba(10,10,14,0.5)', borderColor: '#333', color: '#444', opacity: 0.5 })
                    : { background: 'rgba(10,10,14,0.8)', borderColor: 'rgba(255,106,0,0.25)', color: '#ccc' })
                }}
              >
                {dTxt}
              </motion.button>
            ))}
          </div>
        </Panel>

        {/* Step 2: Repair params */}
        <Panel className={`flex-1 relative ${!diagDone ? 'opacity-40 pointer-events-none' : ''}`}>
          {!diagDone && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--color-danger-red)', textAlign: 'center', padding: 20, zIndex: 10 }}>
              DIAGNOSE FAULT FIRST
            </div>
          )}
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', letterSpacing: '0.2em', color: 'var(--color-nos-orange)', marginBottom: 8 }}>
            2. REPAIR PARAMS
          </h2>
          <div className="sys-assist" style={{ marginBottom: 12 }}>
            Target Contrast: ~{Math.floor((cap.tc[0] + cap.tc[1]) / 2)}% | Thresh: ~{Math.floor((cap.tt[0] + cap.tt[1]) / 2)} | Denoise: {cap.fd ? 'ON' : 'OFF'}
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-heading)', fontSize: '0.9rem', color: 'rgba(200,208,224,0.5)', marginBottom: 6, letterSpacing: '0.1em' }}>
              <span>CONTRAST</span>
              <span style={{ color: 'var(--color-nos-orange)' }}>{c}</span>
            </div>
            <input type="range" min="10" max="100" value={c} onChange={e => setC(Number(e.target.value))} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-heading)', fontSize: '0.9rem', color: 'rgba(200,208,224,0.5)', marginBottom: 6, letterSpacing: '0.1em' }}>
              <span>THRESHOLD</span>
              <span style={{ color: 'var(--color-nos-orange)' }}>{t}</span>
            </div>
            <input type="range" min="50" max="200" value={t} onChange={e => setT(Number(e.target.value))} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: '1.1rem', letterSpacing: '0.1em', marginTop: 20, color: '#ccc' }}>
            <input type="checkbox" checked={d} onChange={e => setD(e.target.checked)} />
            DENOISE FILTER
          </label>
        </Panel>
      </div>
    </div>
  );
}

// ================================================================
//  MODULE C — Citation processing
// ================================================================
function ModuleC({ score, setScore, onComplete, fxFail, showToast }) {
  const [cap] = useState(() => pC[Math.floor(Math.random() * pC.length)]);
  const [step, setStep] = useState(1);
  const [ex, setEx] = useState(0);
  const [fn, setFn] = useState(0);
  const [pc, setPc] = useState("");
  const [showTkt, setTkt] = useState(false);
  const [rt, setRt] = useState("");

  const zMap = { 'S': 'SCHOOL', 'R': 'RESIDENTIAL', 'U': 'URBAN', 'H': 'HIGHWAY' };

  const handleS1 = () => {
    if (ex === cap.ans.ex && fn === cap.ans.fn) {
      setScore((s: any) => ({ ...s, c: s.c + 20 }));
      setStep(2);
    } else {
      fxFail();
      setScore((s: any) => ({ ...s, cp: s.cp + 3 }));
    }
  };
  const handleS2 = (r, e) => {
    if (r === cap.ans.rt) {
      setScore((s: any) => ({ ...s, c: s.c + 15 }));
      setRt(r);
      setStep(3);
    } else {
      fxFail();
      setScore((s: any) => ({ ...s, cp: s.cp + 3 }));
      e.currentTarget.style.opacity = '0.3';
      e.currentTarget.style.pointerEvents = 'none';
    }
  };
  const handleS3 = () => {
    if (pc === cap.ans.cd) {
      setScore((s: any) => ({ ...s, c: s.c + 15 }));
      setTkt(true);
    } else {
      fxFail();
      setScore((s: any) => ({ ...s, cp: s.cp + 3 }));
      setPc("");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      {/* Step indicators */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 40, position: 'relative', paddingBottom: 8 }}>
        <div style={{ position: 'absolute', top: '50%', left: '25%', right: '25%', height: 1, background: 'rgba(255,106,0,0.2)' }} />
        {[1, 2, 3].map(i => (
          <div key={i} className={`step-indicator ${step > i ? 'done' : step === i ? 'active' : 'pending'}`}>
            <span>{step > i ? '✓' : i}</span>
          </div>
        ))}
      </div>

      {/* Vehicle data row */}
      <div style={{ display: 'flex', gap: 12 }}>
        {[
          { label: 'TARGET PLATE', value: cap.p, color: '#fff' },
          { label: 'CONFIDENCE', value: `${cap.c}%`, color: cap.c >= 90 ? 'var(--color-acid-green)' : 'var(--color-nos-amber)' },
          { label: 'ZONE', value: zMap[cap.z], color: 'var(--color-speed-blue)' },
          { label: 'OFFICER LVL', value: `LVL ${cap.o}`, color: '#ccc' },
          ...(cap.ang ? [{ label: 'CAM 2', value: 'MATCH', color: 'var(--color-speed-blue)' }] : []),
          ...(cap.amb ? [{ label: 'EMERGENCY', value: 'BEACON ON', color: 'var(--color-danger-red)', pulse: true }] : [])
        ].map((item: any, i) => (
          <Panel key={i} className="flex-1 flex flex-col items-center py-3" style={item.pulse ? { borderColor: 'rgba(255,32,32,0.5)', animation: 'redlinePulse 1s ease infinite' } : {}}>
            <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.55rem', letterSpacing: '0.2em', color: 'rgba(200,208,224,0.4)', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontFamily: 'var(--font-plate)', fontSize: '1.2rem', fontWeight: 700, color: item.color }}>{item.value}</div>
          </Panel>
        ))}
      </div>

      {/* Radar speed visualizer */}
      <div className="radar-bar" style={{ height: 72, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
        <div style={{ position: 'absolute', left: '25%', top: 0, bottom: 0, width: 1, background: 'var(--color-nos-amber)', boxShadow: '0 0 8px var(--color-nos-amber)' }} />
        <div style={{ position: 'absolute', left: '75%', top: 0, bottom: 0, width: 1, background: 'var(--color-nos-amber)', boxShadow: '0 0 8px var(--color-nos-amber)' }} />
        <div style={{ position: 'absolute', bottom: 6, left: 12, fontFamily: 'var(--font-hud)', fontSize: '0.6rem', color: 'var(--color-speed-blue)', letterSpacing: '0.1em' }}>
          {cap.dist ? `RADAR A→B: ${cap.dist}m | TIME: ${cap.t}s` : `LASER MEASURED: ${cap.spd} KM/H`}
        </div>
        {cap.dist && (
          <motion.div
            animate={{ left: ['-15%', '115%'] }}
            transition={{ duration: cap.t, repeat: Infinity, repeatDelay: 1.5, ease: 'linear' }}
            style={{
              position: 'absolute', width: 80, height: 32,
              background: 'linear-gradient(90deg, transparent, rgba(255,106,0,0.6), rgba(0,212,255,0.4))',
              boxShadow: '0 0 20px rgba(0,212,255,0.3)', filter: 'blur(2px)'
            }}
          />
        )}
      </div>

      {/* Step content */}
      <Panel className="flex-1 flex flex-col justify-center px-8">
        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', letterSpacing: '0.2em', color: 'var(--color-nos-orange)', marginBottom: 12 }}>
              SEC 1 — TOLERANCE & FINE
            </h2>
            <div className="sys-assist" style={{ marginBottom: 20 }}>
              Raw Speed: {cap.dist ? Math.round((cap.dist / cap.t) * 3.6) : cap.spd} km/h | Effective (Raw-5): {cap.dist ? Math.round((cap.dist / cap.t) * 3.6) - 5 : cap.spd - 5} km/h | Zone Limit: {cap.z === 'S' ? 30 : cap.z === 'R' ? 40 : cap.z === 'U' ? 60 : 80} km/h
            </div>

            <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.1em', color: 'rgba(200,208,224,0.5)', marginBottom: 12 }}>EXCESS SPEED (KM/H)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEx(Math.max(0, ex - 1))}
                    style={{ width: 56, height: 56, background: 'rgba(255,106,0,0.1)', border: '1px solid rgba(255,106,0,0.4)', color: 'var(--color-nos-orange)', fontFamily: 'var(--font-heading)', fontSize: '2rem', cursor: 'pointer' }}>
                    -
                  </motion.button>
                  <input type="text" readOnly value={ex}
                    style={{ width: 100, height: 56, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,106,0,0.3)', color: '#fff', fontFamily: 'var(--font-hud)', fontSize: '1.5rem', textAlign: 'center', outline: 'none' }} />
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEx(Math.min(200, ex + 1))}
                    style={{ width: 56, height: 56, background: 'rgba(255,106,0,0.1)', border: '1px solid rgba(255,106,0,0.4)', color: 'var(--color-nos-orange)', fontFamily: 'var(--font-heading)', fontSize: '2rem', cursor: 'pointer' }}>
                    +
                  </motion.button>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.1em', color: 'rgba(200,208,224,0.5)', marginBottom: 12 }}>FINE SLAB SELECTOR</div>
                <select value={fn} onChange={e => setFn(Number(e.target.value))}
                  style={{ width: '100%', height: 48, background: 'rgba(0,0,0,0.7)', color: '#fff', border: '1px solid rgba(255,106,0,0.3)', fontFamily: 'var(--font-hud)', fontSize: '0.9rem', padding: '0 14px', outline: 'none', appearance: 'none' }}>
                  <option value={0}>Rs 0 (NO FINE)</option>
                  <option value={500}>Rs 500 (SLAB A)</option>
                  <option value={1000}>Rs 1000 (SLAB B)</option>
                  <option value={2000}>Rs 2000 (SLAB C / Ax2)</option>
                  <option value={4000}>Rs 4000 (SLAB D / Bx2)</option>
                  <option value={8000}>Rs 8000 (SLAB Dx2)</option>
                </select>
              </div>
            </div>
            <Btn className="mt-8" onClick={handleS1}>COMMIT SEC 1</Btn>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', letterSpacing: '0.2em', color: 'var(--color-nos-orange)', marginBottom: 12 }}>
              SEC 2 — ROUTING DECISION
            </h2>
            <div className="sys-assist" style={{ marginBottom: 20 }}>
              Confidence is {cap.c}%. Protocol: {cap.c >= 90 ? 'Auto-validate (≥ 90%)' : cap.c >= 75 ? 'Manual bypass (75-89%)' : 'Reject / re-tune (< 75%)'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { t: 'Auto-validate', d: 'DIRECT TO SYSTEM', icon: '✅' },
                { t: 'Manual bypass', d: 'OFFICER OVERRIDE', icon: '🔓' },
                { t: 'Reject / re-tune', d: 'DISCARD CAPTURE', icon: '🚫' },
                { t: 'Void fine', d: 'EMERGENCY ONLY', icon: '🚨' }
              ].map(r => (
                <motion.button
                  key={r.t}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => handleS2(r.t, e)}
                  style={{
                    background: 'rgba(10,10,14,0.9)', border: '1px solid rgba(255,106,0,0.2)',
                    padding: '20px 16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e: any) => { e.currentTarget.style.borderColor = 'rgba(255,106,0,0.6)'; e.currentTarget.style.background = 'rgba(255,106,0,0.08)'; }}
                  onMouseLeave={(e: any) => { e.currentTarget.style.borderColor = 'rgba(255,106,0,0.2)'; e.currentTarget.style.background = 'rgba(10,10,14,0.9)'; }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{r.icon}</div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', letterSpacing: '0.1em', color: '#fff', marginBottom: 4 }}>{r.t}</h3>
                  <p style={{ fontFamily: 'var(--font-hud)', fontSize: '0.65rem', color: 'rgba(200,208,224,0.4)', letterSpacing: '0.1em' }}>{r.d}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', letterSpacing: '0.2em', color: 'var(--color-nos-orange)', marginBottom: 12 }}>
              SEC 3 — AUTHORIZATION CODE
            </h2>
            <div className="sys-assist" style={{ marginBottom: 20, width: '100%', maxWidth: 400 }}>
              Required Passcode: {cap.ans.cd}
            </div>

            {/* Code display */}
            <div style={{
              width: '100%', maxWidth: 380, height: 72,
              background: 'rgba(0,0,0,0.8)',
              border: '1px solid var(--color-nos-orange)',
              marginBottom: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-plate)', fontSize: '2.5rem', letterSpacing: '0.6em',
              color: 'var(--color-nos-orange)',
              boxShadow: 'inset 0 0 20px rgba(255,106,0,0.1)'
            }}>
              {(pc + "_____").slice(0, 5).split('').join(' ')}
            </div>

            {/* Keypad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, width: '100%', maxWidth: 380 }}>
              {['U', 'S', 'H', 'A', 'B', 'E', '1', '2', '3', '8', '9', '0', 'X', '-', 'DEL'].map(k => (
                <motion.button
                  key={k}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { if (k === 'DEL') setPc(p => p.slice(0, -1)); else if (pc.length < 5) setPc(p => p + k); }}
                  style={{
                    padding: '12px 8px',
                    fontFamily: 'var(--font-heading)', fontSize: '1.2rem', letterSpacing: '0.1em',
                    border: '1px solid',
                    cursor: 'pointer', transition: 'all 0.15s',
                    ...(k === 'DEL'
                      ? { background: 'rgba(255,32,32,0.1)', borderColor: 'rgba(255,32,32,0.4)', color: 'var(--color-danger-red)' }
                      : { background: 'rgba(10,10,14,0.9)', borderColor: 'rgba(255,106,0,0.25)', color: '#ccc' })
                  }}
                >
                  {k}
                </motion.button>
              ))}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleS3}
                style={{
                  gridColumn: 'span 5', padding: '14px',
                  fontFamily: 'var(--font-heading)', fontSize: '1.3rem', letterSpacing: '0.2em',
                  background: 'rgba(255,106,0,0.15)', border: '2px solid var(--color-nos-orange)',
                  color: 'var(--color-nos-orange)', cursor: 'pointer',
                  boxShadow: '0 0 15px rgba(255,106,0,0.2)',
                  transition: 'all 0.2s'
                }}
              >
                🔑 AUTHORIZE
              </motion.button>
            </div>
          </motion.div>
        )}
      </Panel>

      {/* Ticket overlay */}
      {showTkt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div
            initial={{ scale: 0.7, opacity: 0, rotateY: 90 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="challan-paper"
            style={{ width: 360, padding: 32, position: 'relative', boxShadow: '0 30px 80px rgba(0,0,0,0.9)' }}
          >
            <div style={{ textAlign: 'center', borderBottom: '2px dashed #bbb', paddingBottom: 16, marginBottom: 16 }}>
              <div style={{ fontWeight: 900, fontSize: '1.3rem' }}>eCHALLAN CITATION</div>
              <div style={{ fontSize: '0.75rem', color: '#555', marginTop: 4 }}>REDLINE SURVEILLANCE GRID</div>
            </div>
            {[
              ['PLATE', cap.p],
              ['VIOLATION', cap.ans.fn > 0 && !cap.amb ? 'SPD-01' : 'NONE'],
              ['FINE', rt === 'Void fine' ? '0' : cap.ans.fn],
              ['ISSUER', `LVL-${cap.o}`],
              ['CODE', cap.ans.cd]
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.95rem', borderBottom: '1px dashed #ddd', paddingBottom: 6 }}>
                <span>{k}:</span><strong>{v}</strong>
              </div>
            ))}
            {cap.ans.fn >= 4000 && (
              <div style={{ background: '#000', color: '#ff2020', textAlign: 'center', padding: '10px', fontFamily: 'Impact', letterSpacing: '0.2em', marginTop: 12, border: '2px solid #ff2020', animation: 'redlinePulse 1s ease infinite' }}>
                VEHICLE IMPOUND FLAG
              </div>
            )}
            {/* Stamp */}
            <motion.div
              className="challan-stamp"
              initial={{ scale: 3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              style={{
                borderColor: rt === 'Void fine' ? '#ff9900' : '#ff2020',
                color: rt === 'Void fine' ? '#ff9900' : '#ff2020'
              }}
            >
              {rt === 'Void fine' ? 'VOID: EX-1' : rt === 'Reject / re-tune' ? 'REJECTED' : 'CHALLAN ISSUED'}
            </motion.div>
          </motion.div>
          <Btn className="mt-8 text-2xl" onClick={onComplete}>CLEAR DASHBOARD →</Btn>
        </div>
      )}
    </div>
  );
}

// ================================================================
//  OUTRO SCREEN — Finish line
// ================================================================
function OutroScreen({ score: S, team, totScore }) {
  let tr = "ROOKIE";
  let trIcon = "🏎";
  if (totScore >= 120) { tr = "DCP"; trIcon = "👑"; }
  else if (totScore >= 90) { tr = "INSPECTOR"; trIcon = "🏆"; }
  else if (totScore >= 60) { tr = "OFFICER"; trIcon = "🎖"; }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col items-center justify-center gap-8"
    >
      {/* Checkered flag line */}
      <div className="finish-line-bg w-full" />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
      >
        <GlitchText text="MISSION COMPLETE" className="text-6xl" style={{ fontSize: '4.5rem', color: 'var(--color-acid-green)' }} />
      </motion.div>

      {/* Score card */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="rank-badge panel-clip"
        style={{ display: 'flex', gap: 32, padding: 32, width: 680, position: 'relative', overflow: 'hidden' }}
      >
        {/* Rank badge */}
        <div style={{ width: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 20px rgba(255,106,0,0.6))' }}>{trIcon}</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', letterSpacing: '0.1em', color: 'var(--color-nos-orange)' }}>{tr}</div>
          <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.55rem', letterSpacing: '0.3em', color: 'rgba(200,208,224,0.4)' }}>RANK ACHIEVED</div>
        </div>

        {/* Stats */}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', letterSpacing: '0.2em', color: '#e8eaf0', borderBottom: '1px solid rgba(255,106,0,0.3)', paddingBottom: 12, marginBottom: 12 }}>
            OFFICER RECORD — {team.name}
          </div>
          {[
            { label: 'SEC A BASE', value: S.a, color: '#ccc' },
            { label: 'SEC A PENALTY', value: `-${S.ap}`, color: 'var(--color-danger-red)' },
            { label: 'SEC B BASE', value: S.b, color: '#ccc' },
            { label: 'SEC B PENALTY', value: `-${S.bp}`, color: 'var(--color-danger-red)' },
            { label: 'SEC C BASE', value: S.c, color: '#ccc' },
            { label: 'SEC C PENALTY', value: `-${S.cp}`, color: 'var(--color-danger-red)' },
            { label: 'SPEED BONUS', value: `+${S.bon}`, color: 'var(--color-speed-blue)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-hud)', fontSize: '0.85rem', marginBottom: 6, paddingBottom: 5, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'rgba(200,208,224,0.5)', letterSpacing: '0.1em' }}>{label}</span>
              <span style={{ color, fontWeight: 700 }}>{value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-hud)', fontSize: '1.6rem', fontWeight: 900, marginTop: 12, paddingTop: 12, borderTop: '2px solid rgba(255,106,0,0.4)', color: 'var(--color-acid-green)' }}>
            <span>TOTAL SCORE</span>
            <span style={{ textShadow: '0 0 20px #39ff14' }}>{totScore}</span>
          </div>
        </div>
      </motion.div>

      {/* Sync code */}
      <div style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,106,0,0.25)', padding: '14px 28px', fontFamily: 'var(--font-hud)', fontSize: '0.8rem', letterSpacing: '0.1em', color: 'rgba(200,208,224,0.5)' }}>
        SYNC CODE: <span style={{ color: 'var(--color-nos-orange)', userSelect: 'all' }}>
          {`${team.name} | ${team.size} | ${Math.max(0, S.a + S.b + S.c - S.ap - S.bp - S.cp)} | ${S.bon} | ${totScore}`}
        </span>
      </div>

      <Btn danger onClick={() => window.location.reload()}>🔄 NEXT TEAM [RESET]</Btn>

      {/* Finish line */}
      <div className="finish-line-bg w-full" />
    </motion.div>
  );
}

export default Station3;
