import { useState, useEffect, useCallback } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API = "http://localhost:8000";

// ─── API HELPERS ─────────────────────────────────────────────────────────────
const api = {
  async call(method, path, body, token) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || "Request failed");
    return data;
  },
  async formPost(path, fields) {
    const body = new URLSearchParams(fields);
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || "Login failed");
    return data;
  },
};

// ─── ICONS ───────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 18, stroke = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const Icons = {
  check: "M20 6L9 17l-5-5",
  plus: "M12 5v14M5 12h14",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  edit: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  google: "M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  eyeOff: "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22",
  circle: "M12 2a10 10 0 100 20A10 10 0 0012 2z",
  x: "M18 6L6 18M6 6l12 12",
};

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink:    #0f0e0d;
    --ink2:   #3a3835;
    --ink3:   #7a7570;
    --paper:  #faf8f4;
    --paper2: #f0ece4;
    --paper3: #e5dfd5;
    --accent: #c4773b;
    --accent2:#e8a96a;
    --danger: #c0392b;
    --success:#2d7a4f;
    --radius: 12px;
    --shadow: 0 2px 12px rgba(15,14,13,.08);
    --shadow-lg: 0 8px 32px rgba(15,14,13,.14);
    --font-display: 'DM Serif Display', Georgia, serif;
    --font-body: 'DM Sans', sans-serif;
    --trans: all .18s cubic-bezier(.4,0,.2,1);
  }

  body { font-family: var(--font-body); background: var(--paper); color: var(--ink); -webkit-font-smoothing: antialiased; }

  .app { min-height: 100vh; display: flex; flex-direction: column; }

  /* ── AUTH SCREEN ── */
  .auth-wrap {
    min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr;
  }
  .auth-panel {
    background: var(--ink); color: var(--paper); padding: 60px;
    display: flex; flex-direction: column; justify-content: space-between;
    position: relative; overflow: hidden;
  }
  .auth-panel::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse at 20% 80%, #c4773b22 0%, transparent 60%),
                radial-gradient(ellipse at 80% 20%, #c4773b11 0%, transparent 50%);
  }
  .auth-brand { position: relative; }
  .auth-brand-name {
    font-family: var(--font-display); font-size: 2.8rem;
    line-height: 1.1; letter-spacing: -.02em; color: var(--paper);
  }
  .auth-brand-name em { color: var(--accent2); font-style: italic; }
  .auth-tagline { margin-top: 12px; color: var(--ink3); font-size: .9rem; font-weight: 300; letter-spacing: .04em; }
  .auth-decor { position: relative; display: flex; flex-direction: column; gap: 10px; }
  .auth-decor-item {
    display: flex; align-items: center; gap: 10px;
    color: var(--paper3); font-size: .85rem; font-weight: 300;
  }
  .auth-decor-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }

  .auth-form-side {
    padding: 60px; display: flex; align-items: center; justify-content: center;
    background: var(--paper);
  }
  .auth-box { width: 100%; max-width: 380px; }
  .auth-tabs { display: flex; gap: 0; margin-bottom: 32px; border-bottom: 1.5px solid var(--paper3); }
  .auth-tab {
    padding: 10px 20px 12px; font-family: var(--font-body); font-size: .9rem;
    font-weight: 500; cursor: pointer; border: none; background: none;
    color: var(--ink3); border-bottom: 2.5px solid transparent; margin-bottom: -1.5px;
    transition: var(--trans);
  }
  .auth-tab.active { color: var(--ink); border-bottom-color: var(--accent); }

  .field { margin-bottom: 16px; }
  .field label { display: block; font-size: .8rem; font-weight: 500; color: var(--ink2); margin-bottom: 6px; letter-spacing: .03em; text-transform: uppercase; }
  .field-wrap { position: relative; }
  .field input {
    width: 100%; padding: 11px 14px; border: 1.5px solid var(--paper3);
    border-radius: 8px; font-family: var(--font-body); font-size: .95rem;
    background: var(--paper); color: var(--ink); outline: none;
    transition: var(--trans);
  }
  .field input:focus { border-color: var(--accent); background: #fff; }
  .field input.has-toggle { padding-right: 42px; }
  .eye-btn {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: var(--ink3); padding: 2px;
    display: flex; align-items: center;
  }

  .btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 11px 20px; border-radius: 8px; font-family: var(--font-body);
    font-size: .9rem; font-weight: 500; cursor: pointer; border: none;
    transition: var(--trans); width: 100%;
  }
  .btn-primary { background: var(--ink); color: var(--paper); }
  .btn-primary:hover { background: var(--ink2); }
  .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
  .btn-google {
    background: var(--paper2); color: var(--ink); border: 1.5px solid var(--paper3);
    margin-top: 12px;
  }
  .btn-google:hover { background: var(--paper3); }
  .btn-ghost { background: transparent; color: var(--ink2); border: 1.5px solid var(--paper3); }
  .btn-ghost:hover { background: var(--paper2); }
  .btn-danger { background: var(--danger); color: #fff; }
  .btn-sm { padding: 7px 12px; font-size: .82rem; width: auto; }
  .btn-icon { padding: 7px; width: auto; border-radius: 7px; }

  .divider { display: flex; align-items: center; gap: 12px; margin: 16px 0; color: var(--ink3); font-size: .8rem; }
  .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--paper3); }

  .google-icon { width: 16px; height: 16px; }

  .err-msg { background: #fdf0ef; border: 1px solid #f5c6c2; border-radius: 8px; padding: 10px 14px; font-size: .85rem; color: var(--danger); margin-bottom: 16px; }
  .ok-msg  { background: #edf7f1; border: 1px solid #b6dfc6; border-radius: 8px; padding: 10px 14px; font-size: .85rem; color: var(--success); margin-bottom: 16px; }

  /* ── HEADER ── */
  .header {
    background: var(--ink); color: var(--paper);
    padding: 0 32px; height: 60px;
    display: flex; align-items: center; justify-content: space-between;
    position: sticky; top: 0; z-index: 100;
  }
  .header-brand { font-family: var(--font-display); font-size: 1.3rem; letter-spacing: -.01em; }
  .header-brand em { color: var(--accent2); font-style: italic; }
  .header-right { display: flex; align-items: center; gap: 10px; }
  .header-user { font-size: .8rem; color: var(--ink3); font-weight: 300; }
  .logout-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 12px; border-radius: 7px; background: none;
    border: 1px solid #3a3835; color: var(--paper3); font-size: .82rem;
    font-family: var(--font-body); cursor: pointer; transition: var(--trans);
  }
  .logout-btn:hover { background: #1e1c1a; color: var(--paper); }

  /* ── MAIN LAYOUT ── */
  .main { flex: 1; max-width: 780px; margin: 0 auto; width: 100%; padding: 40px 24px; }

  /* ── STATS BAR ── */
  .stats { display: flex; gap: 16px; margin-bottom: 32px; }
  .stat-card {
    flex: 1; background: var(--paper); border: 1.5px solid var(--paper3);
    border-radius: var(--radius); padding: 16px 20px;
    box-shadow: var(--shadow);
  }
  .stat-num { font-family: var(--font-display); font-size: 1.8rem; color: var(--ink); line-height: 1; }
  .stat-label { font-size: .75rem; color: var(--ink3); margin-top: 4px; text-transform: uppercase; letter-spacing: .05em; }
  .stat-card.accent { background: var(--accent); border-color: var(--accent); }
  .stat-card.accent .stat-num, .stat-card.accent .stat-label { color: #fff; }

  /* ── ADD FORM ── */
  .add-form {
    background: var(--paper); border: 1.5px solid var(--paper3);
    border-radius: var(--radius); padding: 20px 24px; margin-bottom: 28px;
    box-shadow: var(--shadow);
  }
  .add-form-title { font-family: var(--font-display); font-size: 1.05rem; margin-bottom: 14px; color: var(--ink2); }
  .add-row { display: flex; gap: 10px; }
  .add-input {
    flex: 1; padding: 10px 14px; border: 1.5px solid var(--paper3);
    border-radius: 8px; font-family: var(--font-body); font-size: .92rem;
    background: var(--paper); color: var(--ink); outline: none;
    transition: var(--trans);
  }
  .add-input:focus { border-color: var(--accent); background: #fff; }
  .add-desc { margin-top: 10px; }
  .add-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 10px 18px; background: var(--accent); color: #fff;
    border: none; border-radius: 8px; font-family: var(--font-body);
    font-size: .9rem; font-weight: 500; cursor: pointer; transition: var(--trans);
    white-space: nowrap;
  }
  .add-btn:hover { background: #b3692e; }
  .add-btn:disabled { opacity: .5; cursor: not-allowed; }

  /* ── FILTERS ── */
  .filters { display: flex; gap: 8px; margin-bottom: 20px; }
  .filter-btn {
    padding: 6px 14px; border-radius: 20px; font-size: .8rem; font-weight: 500;
    cursor: pointer; border: 1.5px solid var(--paper3); background: var(--paper);
    color: var(--ink3); font-family: var(--font-body); transition: var(--trans);
  }
  .filter-btn.active { background: var(--ink); color: var(--paper); border-color: var(--ink); }

  /* ── TODO LIST ── */
  .todo-list { display: flex; flex-direction: column; gap: 10px; }
  .todo-empty {
    text-align: center; padding: 56px 24px; color: var(--ink3);
    border: 1.5px dashed var(--paper3); border-radius: var(--radius);
  }
  .todo-empty-icon { font-size: 2rem; margin-bottom: 8px; opacity: .4; }
  .todo-empty-text { font-size: .9rem; }

  .todo-card {
    background: var(--paper); border: 1.5px solid var(--paper3);
    border-radius: var(--radius); padding: 16px 20px;
    display: flex; align-items: flex-start; gap: 14px;
    box-shadow: var(--shadow); transition: var(--trans);
    animation: slideIn .2s ease;
  }
  .todo-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-1px); }
  .todo-card.done { opacity: .6; }
  @keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

  .todo-check {
    width: 22px; height: 22px; border-radius: 6px; border: 2px solid var(--paper3);
    flex-shrink: 0; cursor: pointer; display: flex; align-items: center;
    justify-content: center; transition: var(--trans); margin-top: 1px;
    background: var(--paper);
  }
  .todo-check.checked { background: var(--success); border-color: var(--success); color: #fff; }
  .todo-check:hover { border-color: var(--accent); }

  .todo-body { flex: 1; min-width: 0; }
  .todo-title {
    font-size: .95rem; font-weight: 500; color: var(--ink);
    transition: var(--trans); word-break: break-word;
  }
  .todo-card.done .todo-title { text-decoration: line-through; color: var(--ink3); }
  .todo-desc { font-size: .82rem; color: var(--ink3); margin-top: 3px; font-weight: 300; }
  .todo-date { font-size: .75rem; color: var(--paper3); margin-top: 6px; }

  .todo-actions { display: flex; gap: 6px; flex-shrink: 0; }
  .action-btn {
    width: 32px; height: 32px; border-radius: 7px; border: 1.5px solid var(--paper3);
    background: var(--paper); color: var(--ink3); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: var(--trans);
  }
  .action-btn:hover { background: var(--paper2); color: var(--ink); border-color: var(--ink3); }
  .action-btn.del:hover { background: #fdf0ef; color: var(--danger); border-color: #f5c6c2; }

  /* ── EDIT MODAL ── */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(15,14,13,.5);
    display: flex; align-items: center; justify-content: center;
    z-index: 200; backdrop-filter: blur(2px);
    animation: fadeIn .15s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .modal {
    background: var(--paper); border-radius: 16px; padding: 28px;
    width: 100%; max-width: 440px; box-shadow: var(--shadow-lg);
    animation: popIn .2s cubic-bezier(.34,1.56,.64,1);
  }
  @keyframes popIn { from { opacity: 0; transform: scale(.94); } to { opacity: 1; transform: scale(1); } }
  .modal-title { font-family: var(--font-display); font-size: 1.2rem; margin-bottom: 20px; }
  .modal-actions { display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end; }

  /* ── LOADING ── */
  .spinner {
    width: 18px; height: 18px; border: 2px solid currentColor;
    border-top-color: transparent; border-radius: 50%;
    animation: spin .6s linear infinite; display: inline-block;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .loading-screen {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: var(--paper);
  }

  @media (max-width: 640px) {
    .auth-wrap { grid-template-columns: 1fr; }
    .auth-panel { display: none; }
    .auth-form-side { padding: 32px 20px; }
    .stats { flex-wrap: wrap; }
    .stat-card { min-width: calc(50% - 8px); }
    .main { padding: 24px 16px; }
    .header { padding: 0 16px; }
    .add-row { flex-direction: column; }
  }
`;

// ─── GOOGLE ICON SVG ─────────────────────────────────────────────────────────
const GoogleSVG = () => (
  <svg className="google-icon" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
  </svg>
);

// ─── AUTH SCREEN ─────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setErr(""); setOk("");
    setLoading(true);
    try {
      if (tab === "register") {
        await api.call("POST", "/auth/register", {
          email: form.email, username: form.username, password: form.password,
        });
        setOk("Account created! You can now log in.");
        setTab("login");
        setForm((f) => ({ ...f, password: "" }));
      } else {
        const data = await api.formPost("/auth/login", {
          username: form.username, password: form.password,
        });
        onLogin(data.access_token, form.username);
      }
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setLoading(false);
    }
  }

  function googleLogin() {
    window.location.href = `${API}/auth/google`;
  }

  return (
    <div className="auth-wrap">
      <div className="auth-panel">
        <div className="auth-brand">
          <div className="auth-brand-name">Do<em>it</em></div>
          <div className="auth-tagline">Your tasks. Your pace. No noise.</div>
        </div>
        <div className="auth-decor">
          {["Secure JWT authentication", "Google OAuth2 sign-in", "Your todos stay private", "Full CRUD on every task"].map((t) => (
            <div className="auth-decor-item" key={t}>
              <div className="auth-decor-dot" />
              {t}
            </div>
          ))}
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-box">
          <div className="auth-tabs">
            <button className={`auth-tab${tab === "login" ? " active" : ""}`} onClick={() => { setTab("login"); setErr(""); setOk(""); }}>Sign in</button>
            <button className={`auth-tab${tab === "register" ? " active" : ""}`} onClick={() => { setTab("register"); setErr(""); setOk(""); }}>Create account</button>
          </div>

          {err && <div className="err-msg">{err}</div>}
          {ok  && <div className="ok-msg">{ok}</div>}

          <form onSubmit={submit}>
            {tab === "register" && (
              <div className="field">
                <label>Email</label>
                <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" required />
              </div>
            )}
            <div className="field">
              <label>Username</label>
              <input type="text" value={form.username} onChange={set("username")} placeholder="yourname" required />
            </div>
            <div className="field">
              <label>Password</label>
              <div className="field-wrap">
                <input className="has-toggle" type={showPass ? "text" : "password"} value={form.password} onChange={set("password")} placeholder="••••••••" required />
                <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                  <Icon d={showPass ? Icons.eyeOff : Icons.eye} size={16} />
                </button>
              </div>
            </div>
            <button className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : (tab === "login" ? "Sign in" : "Create account")}
            </button>
          </form>

          <div className="divider">or</div>
          <button className="btn btn-google" onClick={googleLogin}>
            <GoogleSVG /> Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── EDIT MODAL ──────────────────────────────────────────────────────────────
function EditModal({ todo, onSave, onClose }) {
  const [form, setForm] = useState({ title: todo.title, description: todo.description || "" });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setLoading(true);
    await onSave(form);
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Edit task</div>
        <form onSubmit={save}>
          <div className="field">
            <label>Title</label>
            <input value={form.title} onChange={set("title")} required />
          </div>
          <div className="field">
            <label>Description</label>
            <input value={form.description} onChange={set("description")} placeholder="Optional note..." />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary btn-sm" style={{width:"auto"}} disabled={loading}>
              {loading ? <span className="spinner" /> : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── TODO CARD ───────────────────────────────────────────────────────────────
function TodoCard({ todo, onToggle, onDelete, onEdit }) {
  const date = new Date(todo.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <div className={`todo-card${todo.completed ? " done" : ""}`}>
      <div
        className={`todo-check${todo.completed ? " checked" : ""}`}
        onClick={() => onToggle(todo)}
        title={todo.completed ? "Mark incomplete" : "Mark complete"}
      >
        {todo.completed && <Icon d={Icons.check} size={13} stroke={2.5} />}
      </div>
      <div className="todo-body">
        <div className="todo-title">{todo.title}</div>
        {todo.description && <div className="todo-desc">{todo.description}</div>}
        <div className="todo-date">{date}</div>
      </div>
      <div className="todo-actions">
        <button className="action-btn" title="Edit" onClick={() => onEdit(todo)}><Icon d={Icons.edit} size={15} /></button>
        <button className="action-btn del" title="Delete" onClick={() => onDelete(todo.id)}><Icon d={Icons.trash} size={15} /></button>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
function Dashboard({ token, username, onLogout }) {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState("all");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const call = useCallback((m, p, b) => api.call(m, p, b, token), [token]);

  useEffect(() => {
    call("GET", "/todos/").then(setTodos).finally(() => setLoading(false));
  }, [call]);

  async function addTodo(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const t = await call("POST", "/todos/", { title: newTitle.trim(), description: newDesc.trim() || null });
      setTodos((prev) => [t, ...prev]);
      setNewTitle(""); setNewDesc("");
    } finally { setAdding(false); }
  }

  async function toggleTodo(todo) {
    const updated = await call("PUT", `/todos/${todo.id}`, { completed: !todo.completed });
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? updated : t)));
  }

  async function deleteTodo(id) {
    await call("DELETE", `/todos/${id}`);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  async function saveEdit(form) {
    const updated = await call("PUT", `/todos/${editing.id}`, form);
    setTodos((prev) => prev.map((t) => (t.id === editing.id ? updated : t)));
    setEditing(null);
  }

  async function logout() {
    try { await call("POST", "/auth/logout"); } catch (_) {}
    onLogout();
  }

  const filtered = todos.filter((t) =>
    filter === "active" ? !t.completed : filter === "done" ? t.completed : true
  );
  const total = todos.length;
  const done = todos.filter((t) => t.completed).length;
  const active = total - done;

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">Do<em>it</em></div>
        <div className="header-right">
          <span className="header-user">{username}</span>
          <button className="logout-btn" onClick={logout}>
            <Icon d={Icons.logout} size={14} /> Sign out
          </button>
        </div>
      </header>

      <main className="main">
        <div className="stats">
          <div className="stat-card accent">
            <div className="stat-num">{active}</div>
            <div className="stat-label">Active</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{done}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{total}</div>
            <div className="stat-label">Total</div>
          </div>
        </div>

        <div className="add-form">
          <div className="add-form-title">Add a task</div>
          <form onSubmit={addTodo}>
            <div className="add-row">
              <input className="add-input" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="What needs to be done?" />
              <button className="add-btn" disabled={adding || !newTitle.trim()}>
                {adding ? <span className="spinner" /> : <><Icon d={Icons.plus} size={16} />Add</>}
              </button>
            </div>
            <div className="add-desc">
              <input className="add-input" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description (optional)" style={{marginTop:10}} />
            </div>
          </form>
        </div>

        <div className="filters">
          {["all","active","done"].map((f) => (
            <button key={f} className={`filter-btn${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "all" && total > 0 && ` (${total})`}
              {f === "active" && active > 0 && ` (${active})`}
              {f === "done" && done > 0 && ` (${done})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{textAlign:"center",padding:"40px",color:"var(--ink3)"}}>
            <span className="spinner" style={{width:24,height:24}} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="todo-empty">
            <div className="todo-empty-icon">○</div>
            <div className="todo-empty-text">
              {filter === "done" ? "Nothing completed yet" : filter === "active" ? "All caught up!" : "Add your first task above"}
            </div>
          </div>
        ) : (
          <div className="todo-list">
            {filtered.map((t) => (
              <TodoCard key={t.id} todo={t} onToggle={toggleTodo} onDelete={deleteTodo} onEdit={setEditing} />
            ))}
          </div>
        )}
      </main>

      {editing && <EditModal todo={editing} onSave={saveEdit} onClose={() => setEditing(null)} />}
    </div>
  );
}

// ─── ROOT ────────────────────────────────────────────────────────────────────
export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("todo_token") || "");
  const [username, setUsername] = useState(() => localStorage.getItem("todo_user") || "");
  const [ready, setReady] = useState(false);

  // Handle Google OAuth2 callback — token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("access_token");
    if (t) {
      localStorage.setItem("todo_token", t);
      localStorage.setItem("todo_user", "user");
      setToken(t); setUsername("user");
      window.history.replaceState({}, "", "/");
    }
    setReady(true);
  }, []);

  function onLogin(t, u) {
    localStorage.setItem("todo_token", t);
    localStorage.setItem("todo_user", u);
    setToken(t); setUsername(u);
  }

  function onLogout() {
    localStorage.removeItem("todo_token");
    localStorage.removeItem("todo_user");
    setToken(""); setUsername("");
  }

  if (!ready) return <div className="loading-screen"><span className="spinner" style={{width:28,height:28}} /></div>;

  return (
    <>
      <style>{styles}</style>
      {token ? (
        <Dashboard token={token} username={username} onLogout={onLogout} />
      ) : (
        <AuthScreen onLogin={onLogin} />
      )}
    </>
  );
}