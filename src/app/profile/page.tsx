"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { getProfile, updateProfile, uploadAvatar, deleteAvatar } from "@/lib/profile";
import VisionLogo from "@/components/VisionLogo";
import ThemeToggle from "@/components/ThemeToggle";

function initials(name: string, email: string) {
  if (name && name.trim().length >= 1) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0,2).toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return "V";
}

export default function ProfilePage() {
  const { isAuthenticated, user, loading, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{type:"error"|"success", text:string} | null>(null);
  const [form, setForm] = useState({ name:"", username:"", email:"", bio:"" });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) { setFetching(false); return; }
    getProfile().then(p=>{
      setProfile(p);
      setForm({ name: p.name || "", username: p.username || "", email: p.email || "", bio: p.bio || "" });
    }).catch(()=> setMsg({type:"error", text:"Unable to load profile"}))
    .finally(()=> setFetching(false));
  }, [loading, isAuthenticated]);

  const handleSave = async () => {
    setSaving(true); setMsg(null);
    try {
      // validations
      if (form.name.trim().length < 2) throw new Error("Name must be at least 2 characters");
      if (form.username.trim().length < 3) throw new Error("Username must be at least 3 characters");
      if (!form.email.includes("@")) throw new Error("Invalid email");
      if (form.bio.length > 500) throw new Error("Bio too long (max 500)");
      const updated = await updateProfile({ name: form.name.trim(), username: form.username.trim().toLowerCase(), email: form.email.trim().toLowerCase(), bio: form.bio.trim() });
      setProfile(updated);
      setEditing(false);
      setMsg({type:"success", text:"Profile updated ✓"});
      setTimeout(()=> setMsg(null), 2000);
    } catch(e:any) { setMsg({type:"error", text:e.message || "Save failed"}); }
    finally { setSaving(false); }
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!["image/jpeg","image/png","image/webp","image/gif"].includes(f.type)) { setMsg({type:"error", text:"Only JPG, PNG, WEBP, GIF allowed"}); return; }
    if (f.size > 5*1024*1024) { setMsg({type:"error", text:"File too large (max 5MB)"}); return; }
    setUploading(true); setMsg({type:"success", text:"Uploading..."});
    try {
      const res = await uploadAvatar(f);
      const p = await getProfile();
      setProfile(p);
      setMsg({type:"success", text:"Uploaded ✓"});
      setTimeout(()=> setMsg(null), 1500);
    } catch(e:any){ setMsg({type:"error", text:e.message}); }
    finally { setUploading(false); if(fileRef.current) fileRef.current.value=""; }
  };

  const handleRemove = async () => {
    if (!confirm("Remove profile photo?")) return;
    setUploading(true);
    try { await deleteAvatar(); const p = await getProfile(); setProfile(p); setMsg({type:"success", text:"Photo removed"}); }
    catch(e:any){ setMsg({type:"error", text:e.message}); }
    finally{ setUploading(false); }
  };

  if (loading || fetching) {
    return <div className="h-[100dvh] w-full flex items-center justify-center overflow-hidden" style={{background:"var(--bg)", color:"var(--text)"}}><div className="text-xs tracking-widest" style={{color:"var(--muted)"}}>LOADING PROFILE</div></div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="h-[100dvh] w-full flex flex-col overflow-hidden" style={{background:"var(--bg)", color:"var(--text)"}}>
        <div className="h-14 flex items-center justify-between px-4 md:px-6 border-b" style={{borderColor:"var(--border)"}}>
          <Link href="/chat" className="text-xs" style={{color:"var(--muted)"}}>← Back to VISION</Link>
          <ThemeToggle />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center p-6 text-center" style={{WebkitOverflowScrolling:"touch"}}>
          <div className="h-20 w-20 rounded-full grid place-items-center text-2xl font-light border" style={{background:"var(--surface)", borderColor:"var(--border)", color:"var(--text)"}}>?</div>
          <h1 className="mt-4 text-lg font-medium">Sign in to view your profile</h1>
          <p className="text-sm mt-1 max-w-sm" style={{color:"var(--muted)"}}>Create a free account to manage your profile, avatar, and preferences.</p>
          <div className="mt-6 flex gap-3">
            <Link href="/login" className="px-6 py-2.5 rounded-full text-sm font-medium" style={{background:"var(--text)", color:"var(--bg)"}}>Log in</Link>
            <Link href="/register" className="px-6 py-2.5 rounded-full text-sm border" style={{borderColor:"var(--border)", color:"var(--text)"}}>Create account</Link>
          </div>
          <Link href="/chat" className="mt-4 text-xs underline" style={{color:"var(--muted)"}}>Continue as guest →</Link>
        </div>
      </div>
    );
  }

  const displayName = profile?.name || user?.name || "User";
  const displayEmail = profile?.email || user?.email || "";
  const avatarUrl = profile?.avatar || null;
  const memberSince = profile?.date_joined ? new Date(profile.date_joined).toLocaleDateString("en-US",{month:"long", year:"numeric"}) : "—";

  return (
    <div className="h-[100dvh] w-full flex flex-col overflow-hidden" style={{background:"var(--bg)", color:"var(--text)"}}>
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 md:px-6 border-b shrink-0" style={{borderColor:"var(--border)", background:"var(--bg)"}}>
        <div className="flex items-center gap-3">
          <Link href="/chat" className="h-8 w-8 grid place-items-center rounded-full border text-xs" style={{borderColor:"var(--border)"}}>←</Link>
          <span className="text-sm font-medium">Profile</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings" className="text-xs px-3 py-1.5 rounded-full border hidden sm:inline-flex" style={{borderColor:"var(--border)", color:"var(--muted)"}}>Settings</Link>
          <ThemeToggle />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain" style={{WebkitOverflowScrolling:"touch"}}>
        <div className="max-w-[720px] mx-auto px-4 md:px-6 py-8 md:py-10 pb-[max(32px,env(safe-area-inset-bottom))]">
          {/* Avatar block */}
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-24 w-24 md:h-28 md:w-28 rounded-full object-cover border" style={{borderColor:"var(--border)"}} />
              ) : (
                <div className="h-24 w-24 md:h-28 md:w-28 rounded-full grid place-items-center text-3xl font-light border" style={{background:"var(--surface)", borderColor:"var(--border)", color:"var(--text)"}}>
                  {initials(displayName, displayEmail)}
                </div>
              )}
              {uploading && <div className="absolute inset-0 rounded-full bg-black/50 grid place-items-center text-xs text-white">Uploading...</div>}
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={()=> fileRef.current?.click()} disabled={uploading} className="text-xs px-3 py-1.5 rounded-full border" style={{borderColor:"var(--border)", color:"var(--text)"}}>{avatarUrl ? "Change photo" : "Add photo"}</button>
              {avatarUrl && <button onClick={handleRemove} disabled={uploading} className="text-xs px-3 py-1.5 rounded-full border" style={{borderColor:"var(--border)", color:"var(--muted)"}}>Remove</button>}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleAvatar} />
            </div>
            <h1 className="mt-5 text-xl font-medium">{displayName}</h1>
            <div className="text-sm" style={{color:"var(--muted)"}}>{displayEmail}</div>
            {!editing && <button onClick={()=> setEditing(true)} className="mt-4 px-5 py-2 rounded-full text-sm border" style={{borderColor:"var(--border)", color:"var(--text)"}}>Edit Profile</button>}
          </div>

          {msg && <div className={`mt-6 rounded-xl px-4 py-3 text-sm border ${msg.type==="error" ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"}`}>{msg.text}</div>}

          {/* Edit form */}
          {editing && (
            <div className="mt-8 rounded-2xl border p-5 md:p-6 space-y-4" style={{background:"var(--surface)", borderColor:"var(--border)"}}>
              <h3 className="text-sm font-medium">Edit Profile</h3>
              <div className="grid gap-4">
                <div>
                  <label className="text-[11px] tracking-widest" style={{color:"var(--muted)"}}>NAME</label>
                  <input value={form.name} onChange={e=> setForm({...form, name:e.target.value})} placeholder="Shlok" className="mt-1 w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{background:"var(--bg)", border:"1px solid var(--border)", color:"var(--text)"}} />
                </div>
                <div>
                  <label className="text-[11px] tracking-widest" style={{color:"var(--muted)"}}>USERNAME</label>
                  <div className="mt-1 flex">
                    <span className="px-3 py-2.5 rounded-l-xl text-sm border-y border-l" style={{background:"var(--surface-2)", borderColor:"var(--border)", color:"var(--muted)"}}>@</span>
                    <input value={form.username} onChange={e=> setForm({...form, username:e.target.value})} placeholder="shlok" className="flex-1 rounded-r-xl px-3 py-2.5 text-sm outline-none" style={{background:"var(--bg)", border:"1px solid var(--border)", color:"var(--text)"}} />
                  </div>
                  <div className="text-[11px] mt-1" style={{color:"var(--muted)"}}>3–30 characters, letters, numbers, . and _</div>
                </div>
                <div>
                  <label className="text-[11px] tracking-widest" style={{color:"var(--muted)"}}>EMAIL</label>
                  <input value={form.email} onChange={e=> setForm({...form, email:e.target.value})} type="email" className="mt-1 w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{background:"var(--bg)", border:"1px solid var(--border)", color:"var(--text)"}} />
                </div>
                <div>
                  <label className="text-[11px] tracking-widest" style={{color:"var(--muted)"}}>BIO</label>
                  <textarea value={form.bio} onChange={e=> setForm({...form, bio:e.target.value})} rows={3} maxLength={500} placeholder="Tell us about yourself..." className="mt-1 w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={{background:"var(--bg)", border:"1px solid var(--border)", color:"var(--text)"}} />
                  <div className="text-[11px] mt-1 text-right" style={{color:"var(--muted)"}}>{form.bio.length}/500</div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving} className="flex-1 rounded-full py-2.5 text-sm font-medium disabled:opacity-50" style={{background:"var(--text)", color:"var(--bg)"}}>{saving ? "Saving..." : "Save changes"}</button>
                <button onClick={()=> { setEditing(false); setForm({ name: profile?.name||"", username: profile?.username||"", email: profile?.email||"", bio: profile?.bio||"" }); setMsg(null); }} className="flex-1 rounded-full py-2.5 text-sm border" style={{borderColor:"var(--border)", color:"var(--text)"}}>Cancel</button>
              </div>
            </div>
          )}

          {/* Personal Info (read-only view) */}
          {!editing && (
            <div className="mt-8 space-y-6">
              <div className="rounded-2xl border overflow-hidden" style={{background:"var(--surface)", borderColor:"var(--border)"}}>
                <div className="px-5 py-4 border-b" style={{borderColor:"var(--border)"}}>
                  <h3 className="text-sm font-medium">Personal Information</h3>
                </div>
                <div className="divide-y" style={{borderColor:"var(--border)"}}>
                  {[
                    ["Name", displayName],
                    ["Username", profile?.username ? `@${profile.username}` : "—"],
                    ["Email", displayEmail],
                    ["Bio", profile?.bio || "—"],
                  ].map(([label, val])=> (
                    <div key={label} className="flex justify-between px-5 py-3.5">
                      <span className="text-sm" style={{color:"var(--muted)"}}>{label}</span>
                      <span className="text-sm text-right max-w-[60%] truncate" style={{color:"var(--text)"}}>{val as string}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border overflow-hidden" style={{background:"var(--surface)", borderColor:"var(--border)"}}>
                <div className="px-5 py-4 border-b" style={{borderColor:"var(--border)"}}>
                  <h3 className="text-sm font-medium">Account</h3>
                </div>
                <div className="divide-y" style={{borderColor:"var(--border)"}}>
                  <div className="flex justify-between px-5 py-3.5">
                    <span className="text-sm" style={{color:"var(--muted)"}}>Plan</span>
                    <span className="text-sm px-2.5 py-1 rounded-full text-xs font-medium" style={{background:"var(--text)", color:"var(--bg)"}}>Free</span>
                  </div>
                  <div className="flex justify-between px-5 py-3.5">
                    <span className="text-sm" style={{color:"var(--muted)"}}>Member since</span>
                    <span className="text-sm" style={{color:"var(--text)"}}>{memberSince}</span>
                  </div>
                  <div className="flex justify-between px-5 py-3.5">
                    <span className="text-sm" style={{color:"var(--muted)"}}>User ID</span>
                    <span className="text-xs font-mono truncate max-w-[60%]" style={{color:"var(--muted)"}}>{profile?.id || "—"}</span>
                  </div>
                </div>
              </div>

              <button onClick={()=> { logout(); router.push("/"); }} className="w-full rounded-full py-3 text-sm font-medium border" style={{borderColor:"var(--border)", color:"var(--text)"}}>Log out</button>
              <div className="text-center space-y-2">
                <Link href="/chat" className="text-xs" style={{color:"var(--muted)"}}>← Back to VISION</Link>
                <div className="text-[11px] tracking-widest" style={{color:"var(--muted)", opacity:0.6}}>Created by Shlok Patel • shlokk.patel</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
