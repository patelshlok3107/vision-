"use client";
export type ThinkMode = "fast"|"think"|"vision"|"code"|"agent";
const MODES: {id: ThinkMode, label: string, icon: string, desc: string}[] = [
  {id:"fast", label:"Fast", icon:"⚡", desc:"Quick answers"},
  {id:"think", label:"Think", icon:"🧠", desc:"Deeper reasoning"},
  {id:"vision", label:"Vision", icon:"👁", desc:"Image analysis"},
  {id:"code", label:"Code", icon:"💻", desc:"Developer mode"},
  {id:"agent", label:"Agent", icon:"🤖", desc:"Tools + actions"},
];
export default function ThinkModeSelector({value, onChange, available}: {value: ThinkMode, onChange:(m:ThinkMode)=>void, available?: Record<string,boolean>}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {MODES.map(m=>{
        const active = value===m.id;
        const disabled = available && available[m.id]===false;
        return (
          <button key={m.id} onClick={()=>!disabled && onChange(m.id)} disabled={!!disabled}
            title={m.desc}
            className={`px-3 py-1.5 rounded-full text-xs border transition ${active?"bg-white text-black border-white":"bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white"} ${disabled?"opacity-30 cursor-not-allowed":""}`}>
            <span className="mr-1">{m.icon}</span>{m.label}
          </button>
        );
      })}
    </div>
  );
}
