import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { api, API_URL } from './api';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { createResumeDocx, printResumePdf } from './resumeExport';

async function photoResponse(response) {
  if (response.status === 404) return null;
  if (response.ok) return response.blob();
  let message = 'Could not load the profile photo.';
  try {
    const body = await response.json();
    message = body.error || body.message || message;
  } catch {}
  if (response.status === 401) {
    localStorage.removeItem('smarthire_token');
    localStorage.removeItem('smarthire_user');
    window.location.assign('/login?reason=session-expired');
  }
  throw new Error(message);
}

function Landing() {
  return (
    <main className="landing">
      <nav className="landing-nav">
        <Link className="landing-brand" to="/"><span className="brand-symbol">S</span>SmartHire</Link>
        <div className="landing-nav-links"><a href="#platform">Platform</a><a href="#how-it-works">How it works</a></div>
        <div className="nav-actions"><Link className="nav-login" to="/login">Sign in</Link><Link className="nav-register" to="/register">Create account</Link></div>
      </nav>
      <section className="landing-hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" />AI-POWERED RECRUITMENT PLATFORM</p>
          <h1>Where great people and opportunities <span>connect.</span></h1>
          <p className="hero-description">Find roles that fit, strengthen your profile, and help hiring teams move great candidates forward—all in one place.</p>
          <div className="hero-actions"><Link className="primary-button" to="/register">Get started <span aria-hidden="true">→</span></Link><Link className="secondary-button" to="/login">Sign in</Link></div>
          <div className="hero-assurance"><span className="assurance-check">✓</span><span>For candidates and hiring teams</span><i /><span>One place to move forward</span></div>
        </div>
        <div className="landing-preview-wrap match-preview-wrap" aria-label="Illustrative AI job-match preview">
          <div className="preview-orbit orbit-one" /><div className="preview-orbit orbit-two" />
          <div className="landing-preview match-preview">
            <div className="preview-topbar"><div className="preview-brand"><span className="brand-symbol">S</span><strong>SmartHire</strong></div><span className="preview-user">Illustrative match</span></div>
            <div className="preview-content">
              <p className="preview-overline">PROFILE ↔ ROLE COMPARISON</p>
              <div className="match-comparison">
                <article className="match-compare-pane">
                  <span className="match-pane-label">YOUR PROFILE</span>
                  <div className="match-person"><span className="match-person-avatar">A</span><div><strong>Alex Morgan</strong><small>Software developer</small></div></div>
                  <span className="match-pane-subtitle">YOUR SKILLS</span>
                  <div className="preview-skill-tags"><span>Java</span><span>React</span><span>SQL</span></div>
                </article>
                <div className="match-bridge" aria-hidden="true"><span>↔</span></div>
                <article className="match-compare-pane role-pane">
                  <span className="match-pane-label">JOB ROLE</span>
                  <div className="match-person"><span className="preview-company-mark">N</span><div><strong>Full Stack Developer</strong><small>Northstar Studio</small></div></div>
                  <span className="match-pane-subtitle">ROLE SKILLS</span>
                  <div className="preview-skill-tags"><span>Java</span><span>React</span><span>SQL</span><span>Cloud</span></div>
                </article>
              </div>
              <div className="match-preview-summary">
                <div className="match-preview-ring"><div><strong>82%</strong><small>match</small></div></div>
                <div><span>AI MATCH SUMMARY</span><strong>Strong skills alignment</strong><p>Java, React, and SQL appear in both profiles.</p></div>
              </div>
            </div>
          </div>
          <div className="preview-floating-note"><span>✦</span><div><strong>More than a score</strong><small>Understand what makes a match</small></div></div>
        </div>
      </section>
      <section id="platform" className="landing-platform">
        <div className="landing-section-heading"><p className="eyebrow">A BETTER WAY FORWARD</p><h2>Everything you need to make the next move.</h2><p>Useful tools for every step—from getting noticed to finding the right person for the role.</p></div>
        <div className="platform-grid">
          <article className="platform-card"><span className="platform-icon icon-blue">✳</span><h3>Find roles that fit</h3><p>Explore current openings and compare your experience with what a role needs.</p><Link to="/register?role=CANDIDATE">Explore as a candidate <b>→</b></Link></article>
          <article className="platform-card"><span className="platform-icon icon-green">⌕</span><h3>Understand your profile</h3><p>Get structured resume feedback and practical ideas for your next improvement.</p><Link to="/register">Build your profile <b>→</b></Link></article>
          <article className="platform-card"><span className="platform-icon icon-violet">↗</span><h3>Hire with clarity</h3><p>Organize openings, review applicants, and keep each hiring step in one place.</p><Link to="/register?role=RECRUITER">Join as a recruiter <b>→</b></Link></article>
        </div>
      </section>
      <section id="how-it-works" className="landing-steps">
        <div className="landing-section-heading"><p className="eyebrow">SIMPLE BY DESIGN</p><h2>Move from planning to progress.</h2></div>
        <div className="step-grid"><article><span>01</span><div><h3>Create your profile</h3><p>Add your details and experience to get started.</p></div></article><article><span>02</span><div><h3>Use the tools that fit</h3><p>Find roles, review your resume, or manage applicants.</p></div></article><article><span>03</span><div><h3>Take your next step</h3><p>Apply with confidence or move a great candidate forward.</p></div></article></div>
      </section>
      <section className="landing-cta"><div><p className="eyebrow">YOUR NEXT STEP STARTS HERE</p><h2>Ready to make progress?</h2><p>Create your free account and get started with SmartHire.</p></div><Link className="primary-button" to="/register">Create your account <span aria-hidden="true">→</span></Link></section>
      <footer className="landing-footer"><Link className="landing-brand" to="/"><span className="brand-symbol">S</span>SmartHire</Link><span>Make your next move count.</span><Link to="/login">Sign in</Link></footer>
    </main>
  );
}

function Placeholder({ title }) {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>{title}</h1>
        <p>Phase 1 foundation is ready. API and role workflows are being implemented.</p>
        <Link to="/">Back to home</Link>
      </div>
    </main>
  );
}

function RecruiterProfilePage() {
  const user = JSON.parse(localStorage.getItem('smarthire_user') || '{}');
  const [profile, setProfile] = useState({
    name: user.name || '', email: user.email || '', phone: '',
    companyName: '', companyDescription: '', companyWebsite: '', companyLocation: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [notice, setNotice] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const photoInputRef = useRef(null);

  useEffect(() => {
    api('/api/recruiters/profile')
      .then(setProfile)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!profile.photoPath) { setPhotoUrl(''); return; }
    let active = true;
    let objectUrl = '';
    fetch(`${API_URL}/api/recruiters/photo`, { headers: { Authorization: `Bearer ${localStorage.getItem('smarthire_token')}` } })
      .then(photoResponse)
      .then(blob => { if (!blob) { if (active) setPhotoUrl(''); return; } objectUrl = URL.createObjectURL(blob); if (active) setPhotoUrl(objectUrl); })
      .catch(() => { if (active) setPhotoUrl(''); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [profile.photoPath]);

  async function uploadPhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Profile photos must be 5 MB or smaller.'); return; }
    setSaving(true); setError(''); setNotice('');
    try {
      const data = new FormData(); data.append('file', file);
      setProfile(await api('/api/recruiters/photo', { method: 'POST', body: data }));
      setNotice('Profile photo updated.');
    } catch (e) { setError(e.message); }
    finally { setSaving(false); event.target.value = ''; }
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const updatedProfile = await api('/api/recruiters/profile', {
        method: 'PUT',
        body: JSON.stringify(profile)
      });
      setProfile(updatedProfile);
      localStorage.setItem('smarthire_user', JSON.stringify({ ...user, name: updatedProfile.name }));
      setNotice('Company profile saved. Interview invitations will include your company name.');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    localStorage.clear();
    window.location.href = '/';
  }

  return <main className="dashboard recruiter-layout">
    <aside className="dashboard-sidebar">
      <strong className="brand">SmartHire</strong>
      <nav>
        <Link to="/recruiter">Overview</Link>
        <Link to="/recruiter/jobs">Manage jobs</Link>
        <Link to="/recruiter/jobs">Post a job</Link>
        <Link className="active" to="/recruiter/profile">My profile</Link>
        <Link to="/account/password">Change password</Link>
      </nav>
      <div className="sidebar-account"><span>Signed in as</span><strong>{user.name || user.email || 'Recruiter'}</strong><small>Recruiter</small></div>
      <button className="signout-button" onClick={logout}>Sign out</button>
    </aside>
    <section className="dashboard-main recruiter-main">
      <header><div><p>Recruiter workspace</p><h1>My profile</h1></div><div className={`avatar${photoUrl ? ' has-photo' : ''}`}>{photoUrl ? <img src={photoUrl} alt="Recruiter profile" /> : (user.name?.[0] || 'R')}</div></header>
      {error && <div className="notice error-notice" role="alert">{error}</div>}
      {notice && <div className="notice success-notice" role="status">{notice}</div>}
      <form className="panel job-form" onSubmit={saveProfile}>
        <h2>Recruiter and company details</h2>
        {!loading && <div className="profile-photo-card">
          <div className="profile-photo-preview">{photoUrl ? <img src={photoUrl} alt="Recruiter profile" /> : <span>{profile.name?.[0] || user.name?.[0] || 'R'}</span>}</div>
          <div className="profile-photo-copy"><h3>Profile photo</h3><p>Upload a JPEG or PNG image up to 5 MB. It is stored securely in Cloudinary.</p><button type="button" className="secondary-button compact-button" onClick={() => photoInputRef.current?.click()} disabled={saving}>{saving ? 'Uploading…' : profile.photoPath ? 'Change photo' : 'Upload photo'}</button><input ref={photoInputRef} className="profile-photo-input" type="file" accept="image/jpeg,image/png" onChange={uploadPhoto} /></div>
        </div>}
        {loading ? <p className="muted-copy">Loading your company profile…</p> : <>
          <div className="form-grid">
            <label>Your name<input value={profile.name || ''} onChange={e=>setProfile({...profile,name:e.target.value})} required /></label>
            <label>Account email<input value={profile.email || ''} readOnly /></label>
            <label>Phone number<input type="tel" value={profile.phone || ''} onChange={e=>setProfile({...profile,phone:e.target.value})} placeholder="e.g. +91 98765 43210" /></label>
            <label>Company name<input value={profile.companyName || ''} onChange={e=>setProfile({...profile,companyName:e.target.value})} maxLength="150" required /></label>
            <label>Company location<input value={profile.companyLocation || ''} onChange={e=>setProfile({...profile,companyLocation:e.target.value})} /></label>
            <label>Company website<input type="url" value={profile.companyWebsite || ''} onChange={e=>setProfile({...profile,companyWebsite:e.target.value})} placeholder="https://example.com" /></label>
            <label className="full-width">About the company<textarea rows="4" value={profile.companyDescription || ''} onChange={e=>setProfile({...profile,companyDescription:e.target.value})} /></label>
          </div>
          <div className="form-actions"><button className="primary-button compact-button" disabled={saving}>{saving ? 'Saving…' : 'Save company profile'}</button></div>
        </>}
      </form>
    </section>
  </main>;
}

function AuthPage({ mode }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => ({
    name: '',
    email: '',
    password: '',
    companyName: '',
    role: new URLSearchParams(window.location.search).get('role') === 'RECRUITER' ? 'RECRUITER' : 'CANDIDATE'
  }));
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const loginReason = mode === 'login' ? new URLSearchParams(window.location.search).get('reason') : null;
  const loginNotice = loginReason === 'session-expired'
    ? 'Your session expired. Please sign in again.'
    : loginReason === 'role'
      ? 'This account does not have recruiter access. Sign in with a recruiter account.'
      : '';
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 30000);
    try {
      const data = await api(`/api/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(mode === 'register' ? form : { email: form.email, password: form.password }),
        signal: controller.signal
      });
      localStorage.setItem('smarthire_token', data.token);
      localStorage.setItem('smarthire_user', JSON.stringify(data));
      navigate(data.role === 'CANDIDATE' ? '/candidate' : data.role === 'RECRUITER' ? '/recruiter' : '/admin');
    } catch (e) { setError(e.message); } finally {
      window.clearTimeout(timeoutId);
      setBusy(false);
    }
  };
  const isLogin = mode === 'login';
  return <main className="auth-page">
    <Link className="auth-brand landing-brand" to="/"><span className="brand-symbol">S</span>SmartHire</Link>
    <section className="auth-shell">
      <div className="auth-story"><p className="eyebrow">A CLEARER WAY TO MOVE FORWARD</p><h2>{isLogin ? 'Good to have you back.' : 'Make room for what’s next.'}</h2><p>{isLogin ? 'Pick up where you left off and keep your next step in sight.' : 'Create your account to discover opportunities or bring great people into your team.'}</p><div className="auth-story-points"><span><b>✓</b> A profile built around you</span><span><b>✓</b> Helpful tools at every step</span><span><b>✓</b> Candidate and recruiter workspaces</span></div><div className="auth-decoration"><span /><span /><span /></div></div>
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-form-heading"><p className="eyebrow">{isLogin ? 'WELCOME BACK' : 'GET STARTED'}</p><h1>{isLogin ? 'Sign in to SmartHire' : 'Create your account'}</h1><p>{isLogin ? 'Enter your details to access your workspace.' : 'It takes just a moment to set up your workspace.'}</p></div>
        {loginNotice && <p className="notice error-notice" role="status">{loginNotice}</p>}
        {!isLogin && <label>Full name<input autoComplete="name" placeholder="Your name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required /></label>}
        {!isLogin && form.role === 'RECRUITER' && <label>Company name<input autoComplete="organization" placeholder="Your company or organization" value={form.companyName} onChange={e=>setForm({...form,companyName:e.target.value})} maxLength="150" required /></label>}
        <label>Email address<input autoComplete="email" type="email" placeholder="you@example.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required /></label>
        <label>Password<div className="auth-password-field"><input autoComplete={isLogin ? 'current-password' : 'new-password'} type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required /><button type="button" onClick={()=>setShowPassword((visible)=>!visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></div></label>
        {isLogin && <div className="auth-forgot-link"><Link to="/forgot-password">Forgot password?</Link></div>}
        {!isLogin && <fieldset className="auth-role-field"><legend>I'm joining as</legend><div className="auth-role-options">
          <button type="button" className={form.role === 'CANDIDATE' ? 'auth-role-option selected' : 'auth-role-option'} aria-pressed={form.role === 'CANDIDATE'} onClick={()=>setForm({...form,role:'CANDIDATE'})}><span className="auth-role-icon candidate-role-icon">C</span><span><strong>Candidate</strong><small>Find roles and prepare</small></span><i aria-hidden="true">{form.role === 'CANDIDATE' ? '✓' : ''}</i></button>
          <button type="button" className={form.role === 'RECRUITER' ? 'auth-role-option selected' : 'auth-role-option'} aria-pressed={form.role === 'RECRUITER'} onClick={()=>setForm({...form,role:'RECRUITER'})}><span className="auth-role-icon recruiter-role-icon">R</span><span><strong>Recruiter</strong><small>Post jobs and hire</small></span><i aria-hidden="true">{form.role === 'RECRUITER' ? '✓' : ''}</i></button>
        </div></fieldset>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button auth-submit" disabled={busy} aria-busy={busy}>{busy && <span className="auth-submit-spinner" aria-hidden="true" />}{busy ? (isLogin ? 'Signing in…' : 'Creating account…') : isLogin ? 'Sign in' : 'Create account'}{!busy && <span aria-hidden="true">→</span>}</button>
        <p className="auth-switch">{isLogin ? 'New to SmartHire?' : 'Already have an account?'} <Link to={isLogin ? '/register' : '/login'}>{isLogin ? 'Create an account' : 'Sign in'}</Link></p>
      </form>
    </section>
    <footer className="auth-footer"><Link to="/">← Back to SmartHire</Link><span>Your next step, made clearer.</span></footer>
  </main>;
}

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const result = await api('/api/auth/password-reset/request', { method: 'POST', body: JSON.stringify({ email }) });
      setNotice(result.message);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <main className="auth-page"><Link className="auth-brand landing-brand" to="/"><span className="brand-symbol">S</span>SmartHire</Link><form className="auth-card password-card" onSubmit={submit}>
    <p className="eyebrow">ACCOUNT RECOVERY</p><h1>Forgot password?</h1><p>Enter your account email. If email delivery is configured, we’ll send you a short-lived, one-time reset link.</p>
    <label>Email address<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
    {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="notice success-notice" role="status">{notice}</p>}
    <button className="primary-button auth-submit" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button><p className="auth-switch"><Link to="/login">Back to sign in</Link></p>
  </form></main>;
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function submit(event) {
    event.preventDefault(); setError('');
    if (newPassword !== confirmPassword) { setError('New password and confirmation do not match.'); return; }
    setBusy(true);
    try {
      const result = await api('/api/auth/password-reset/confirm', { method: 'POST', body: JSON.stringify({ token, newPassword, confirmPassword }) });
      setNotice(result.message); setTimeout(() => navigate('/login'), 1400);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <main className="auth-page"><Link className="auth-brand landing-brand" to="/"><span className="brand-symbol">S</span>SmartHire</Link><form className="auth-card password-card" onSubmit={submit}>
    <p className="eyebrow">SECURE ACCOUNT</p><h1>Set a new password</h1><p>Use at least 12 characters. This reset link works once and expires after 15 minutes.</p>
    <label>New password<input type="password" autoComplete="new-password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} minLength="12" maxLength="72" required /></label>
    <label>Confirm new password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} minLength="12" maxLength="72" required /></label>
    {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="notice success-notice" role="status">{notice}</p>}
    <button className="primary-button auth-submit" disabled={busy || !token}>{busy ? 'Updating…' : 'Change password'}</button>{!token && <p className="form-error">This reset link is missing. Request a new one from the sign-in page.</p>}
  </form></main>;
}

function ChangePasswordPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('smarthire_user') || 'null');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function submit(event) {
    event.preventDefault(); setError(''); setNotice('');
    if (newPassword !== confirmPassword) { setError('New password and confirmation do not match.'); return; }
    if (newPassword === currentPassword) { setError('Choose a new password different from your current one.'); return; }
    setBusy(true);
    try {
      const result = await api('/api/account/password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword, confirmPassword }) });
      localStorage.setItem('smarthire_token', result.token);
      localStorage.setItem('smarthire_user', JSON.stringify(result));
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setNotice('Password changed. This device stays signed in; other sessions must sign in again.');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  if (!user || !localStorage.getItem('smarthire_token')) return <Navigate to="/login" replace />;
  return <main className="auth-page"><Link className="auth-brand landing-brand" to="/"><span className="brand-symbol">S</span>SmartHire</Link><form className="auth-card password-card" onSubmit={submit}>
    <p className="eyebrow">ACCOUNT SECURITY</p><h1>Change password</h1><p>Verify your current password, then choose a new one with at least 12 characters.</p>
    <label>Current password<input type="password" autoComplete="current-password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} required /></label>
    <label>New password<input type="password" autoComplete="new-password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} minLength="12" maxLength="72" required /></label>
    <label>Confirm new password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} minLength="12" maxLength="72" required /></label>
    {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="notice success-notice" role="status">{notice}</p>}
    <button className="primary-button auth-submit" disabled={busy}>{busy ? 'Updating…' : 'Update password'}</button>
    <p className="auth-switch"><Link to={user.role === 'CANDIDATE' ? '/candidate' : user.role === 'RECRUITER' ? '/recruiter' : '/admin'}>Back to workspace</Link></p>
  </form></main>;
}

function Dashboard({ role }) {
  const user = JSON.parse(localStorage.getItem('smarthire_user') || '{}');
  const [items,setItems] = useState([]);
  const [stats,setStats] = useState({});
  useEffect(() => {
    Promise.all([
      api(role === 'CANDIDATE' ? '/api/jobs' : '/api/admin/users').catch(()=>[]),
      api(`/api/analytics/${role.toLowerCase()}`).catch(()=>({}))
    ]).then(([a,b])=>{setItems(Array.isArray(a)?a:[]);setStats(b);});
  },[role]);
  const logout=()=>{localStorage.clear();window.location.href='/';};
  return <main className="dashboard">
    <aside><strong>SmartHire</strong><nav>
      <span>Dashboard</span>{role==='CANDIDATE'&&<><Link to="/candidate/jobs">Jobs</Link><Link to="/candidate/profile">Profile</Link></>}
      {role==='RECRUITER'&&<><Link to="/recruiter/jobs">Post jobs</Link><Link to="/recruiter/profile">Company</Link></>}
      {role==='ADMIN'&&<Link to="/admin/users">Users</Link>}
    </nav><div className="sidebar-account"><span>Signed in as</span><strong>{user.name || user.email || 'User'}</strong><small>{role}</small></div><button onClick={logout}>Sign out</button></aside>
    <section className="dashboard-main"><header><div><p>Overview</p><h1>{role.charAt(0)+role.slice(1).toLowerCase()} dashboard</h1></div><div className="avatar">{user.name?.[0]||'U'}</div></header>
      <div className="stat-grid">
        {Object.entries(stats).slice(0,4).map(([key,value])=><article key={key}><span>{key.replace(/([A-Z])/g,' $1')}</span><strong>{typeof value==='number'?value:'—'}</strong></article>)}
      </div>
      {role === 'CANDIDATE' && (
        <div className="panel">
          <h2>Available jobs</h2>
          {items.length ? items.map((job) => (
            <div className="job-row" key={job.id}>
              <div>
                <strong>{job.title}</strong>
                <p>{job.location || 'Remote'} · {job.employmentType || 'Full time'}</p>
              </div>
              <button onClick={() => api(`/api/applications?jobId=${job.id}`, { method: 'POST' })
                .then(() => alert('Application submitted'))
                .catch((e) => alert(e.message))}>Apply</button>
            </div>
          )) : <p>No active jobs found.</p>}
        </div>
      )}
    </section>
  </main>;
}

function CandidateWorkspace({ initialView = 'overview' }) {
  const user = JSON.parse(localStorage.getItem('smarthire_user') || '{}');
  const [view, setView] = useState(initialView);
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({});
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeFileName, setResumeFileName] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const photoInputRef = useRef(null);
  const [applyJob, setApplyJob] = useState(null);
  const [applyMethod, setApplyMethod] = useState('WITH_RESUME');
  const [coverLetter, setCoverLetter] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [match, setMatch] = useState(null);
  const [matchHistory, setMatchHistory] = useState([]);
  const [questions, setQuestions] = useState(null);
  const [questionHistory, setQuestionHistory] = useState([]);
  const [improvement, setImprovement] = useState(null);
  const [latexResume, setLatexResume] = useState(null);
  const [latexTemplate, setLatexTemplate] = useState('classic');
  const [improvementHistory, setImprovementHistory] = useState([]);
  const [mockConfig, setMockConfig] = useState({ jobId: '', category: 'Mixed', difficulty: 'Intermediate', totalQuestions: 5, interviewType: 'TEXT' });
  const [mockInterview, setMockInterview] = useState(null);
  const [mockQuestions, setMockQuestions] = useState([]);
  const [mockIndex, setMockIndex] = useState(0);
  const [mockAnswer, setMockAnswer] = useState('');
  const [lastTranscript, setLastTranscript] = useState('');
  const [mockFeedback, setMockFeedback] = useState(null);
  const [mockHistory, setMockHistory] = useState([]);
  const [mockReport, setMockReport] = useState(null);
  const [historyReport, setHistoryReport] = useState(null);
  const [historyReportId, setHistoryReportId] = useState(null);
  const [loadingReportId, setLoadingReportId] = useState(null);
  const [recordingConsent, setRecordingConsent] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const [recordingBlob, setRecordingBlob] = useState(null);
  const [recordingUrl, setRecordingUrl] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const mediaChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);
  const previewRef = useRef(null);
  const historyReportRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => setView(initialView), [initialView]);
  useEffect(() => {
    if (historyReportId) historyReportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [historyReportId, historyReport]);
  useEffect(() => {
    if (initialView === 'history') {
      api('/api/mock-interviews').then(setMockHistory).catch((e) => setError(e.message));
    }
  }, [initialView]);
  useEffect(() => {
    const historyEndpoints = {
      resume: ['/api/ai/resume/analyses', setAnalysisHistory],
      matching: ['/api/ai/job-matches', setMatchHistory],
      questions: ['/api/ai/interview/questions', setQuestionHistory],
      improve: ['/api/ai/resume/improvements', setImprovementHistory]
    };
    const endpoint = historyEndpoints[view];
    if (endpoint) api(endpoint[0]).then(endpoint[1]).catch((e) => setError(e.message));
  }, [view]);
  useEffect(() => {
    if (previewRef.current && mediaStream) previewRef.current.srcObject = mediaStream;
  }, [mediaStream]);
  useEffect(() => {
    if (!recordingBlob) { setRecordingUrl(''); return undefined; }
    const url = URL.createObjectURL(recordingBlob);
    setRecordingUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [recordingBlob]);
  useEffect(() => () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);
  useEffect(() => {
    Promise.all([
      api('/api/candidates/profile'),
      api('/api/jobs'),
      api('/api/applications/my'),
      api('/api/analytics/candidate')
    ]).then(([candidateProfile, availableJobs, myApplications, analytics]) => {
      setProfile(candidateProfile);
      setProfileForm(candidateProfile);
      setResumeFileName(candidateProfile.resumeFileName || '');
      setJobs(availableJobs);
      setApplications(myApplications);
      setStats(analytics);
      setMockConfig((current) => ({ ...current, jobId: availableJobs[0]?.id?.toString() || '' }));
    }).catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (!profile?.photoPath) {
      setProfilePhotoUrl('');
      return undefined;
    }
    let active = true;
    let objectUrl;
    setProfilePhotoUrl('');
    fetch(`${API_URL}/api/candidates/photo`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('smarthire_token')}` }
    })
      .then(photoResponse)
      .then((blob) => {
        if (!blob) {
          if (active) {
            setProfilePhotoUrl('');
            setProfile((current) => current ? { ...current, photoPath: null } : current);
            setProfileForm((current) => ({ ...current, photoPath: null }));
          }
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        if (active) setProfilePhotoUrl(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      })
      .catch(() => { if (active) setProfilePhotoUrl(''); });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [profile?.photoPath]);

  const logout = () => { localStorage.clear(); window.location.href = '/'; };
  const jobOptions = [...jobs].sort((a,b)=>new Date(b.createdAt || 0)-new Date(a.createdAt || 0)).map((job) => <option value={job.id} key={job.id}>{job.title} · {job.companyName || 'Company'}{job.location ? ` · ${job.location}` : ''}</option>);
  const visibleJobs = jobs.filter((job) => `${job.title} ${job.location || ''} ${job.requiredSkills || ''}`
    .toLowerCase().includes(search.toLowerCase()));
  const profileChecklist = [
    ['name', 'Full name', profile?.name],
    ['phone', 'Phone', profile?.phone],
    ['location', 'Location', profile?.location],
    ['education', 'Education', profile?.education],
    ['graduationYear', 'Graduation year', profile?.graduationYear],
    ['skills', 'Skills', profile?.skills],
    ['experience', 'Experience', profile?.experience],
    ['professionalSummary', 'Professional summary', profile?.professionalSummary],
    ['resumePath', 'Resume', profile?.resumePath],
    ['photoPath', 'Profile photo', profile?.photoPath]
  ];
  const completedProfileItems = profileChecklist.filter(([, , value]) => value != null && String(value).trim() !== '');
  const profileCompletion = profile ? Math.round((completedProfileItems.length / profileChecklist.length) * 100) : null;
  const profileNextSteps = profileChecklist.filter(([, , value]) => value == null || String(value).trim() === '').slice(0, 3);

  function showMessage(message) { setNotice(message); setError(''); }
  function showError(reason) { setError(reason); setNotice(''); }

  async function saveProfile(event) {
    event.preventDefault(); setBusy(true);
    try {
      const saved = await api('/api/candidates/profile', { method: 'PUT', body: JSON.stringify(profileForm) });
      setProfile(saved); setProfileForm(saved); showMessage('Profile saved successfully.');
    } catch (e) { showError(e.message); } finally { setBusy(false); }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) { showError('Location is not supported by this browser.'); return; }
    setLocationLoading(true); setError('');
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`);
        const place = response.ok ? await response.json() : null;
        const address = place?.address || {};
        const location = [address.city || address.town || address.village || address.county, address.state, address.country].filter(Boolean).join(', ') || `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
        setProfileForm(current => ({ ...current, location, latitude: coords.latitude, longitude: coords.longitude }));
        showMessage('Current location added. Save your profile to keep it.');
      } catch { showError('Could not find the address for your current location.'); }
      finally { setLocationLoading(false); }
    }, error => {
      setLocationLoading(false);
      showError(error.code === 1 ? 'Allow location access in your browser, then try again.' : 'Could not get your current location.');
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  }

  async function uploadPhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      showError('Choose a JPEG or PNG image.');
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showError('Profile photos must be 5 MB or smaller.');
      event.target.value = '';
      return;
    }
    const data = new FormData();
    data.append('file', file);
    setBusy(true);
    try {
      const updatedProfile = await api('/api/candidates/photo', { method: 'POST', body: data });
      setProfile(updatedProfile);
      setProfileForm((current) => ({ ...current, photoPath: updatedProfile.photoPath }));
      showMessage('Profile photo updated.');
    } catch (e) { showError(e.message); }
    finally { setBusy(false); event.target.value = ''; }
  }

  async function uploadResume(event) {
    event.preventDefault();
    if (!resumeFile) { showError('Choose a PDF resume first.'); return; }
    const data = new FormData(); data.append('file', resumeFile); setBusy(true);
    try {
      const updatedProfile = await api('/api/candidates/resume', { method: 'POST', body: data });
      setProfile(updatedProfile); setProfileForm(updatedProfile); setResumeFile(null); setResumeFileName(updatedProfile.resumeFileName || resumeFile.name);
      setAnalysis(null); setNotice('Resume uploaded. AI is analyzing it now…'); setError('');
      event.target.reset();
      setAnalysisLoading(true);
      const result = await api('/api/ai/resume/analyze', { method: 'POST' });
      setAnalysis(result);
      setAnalysisHistory(await api('/api/ai/resume/analyses'));
      showMessage('Resume uploaded and analyzed successfully.');
    } catch (e) { showError(e.message); } finally { setBusy(false); }
    setAnalysisLoading(false);
  }

  async function analyzeResume() {
    if (analysisLoading) return;
    setBusy(true); setAnalysisLoading(true);
    try {
      const result = await api('/api/ai/resume/analyze', { method: 'POST' });
      setAnalysis(result);
      setAnalysisHistory(await api('/api/ai/resume/analyses'));
      setView('resume');
    } catch (e) { showError(e.message); } finally { setBusy(false); setAnalysisLoading(false); }
  }

  async function submitApplication() {
    if (applyMethod === 'WITH_RESUME' && !profile?.resumePath) {
      showError('Upload your resume first, or choose Apply manually.');
      return;
    }
    setBusy(true);
    try {
      await api('/api/applications/submit', {
        method: 'POST',
        body: JSON.stringify({ jobId: applyJob.id, method: applyMethod, coverLetter })
      });
      setApplications(await api('/api/applications/my'));
      setApplyJob(null); setCoverLetter('');
      showMessage('Your application has been submitted.');
    } catch (e) { showError(e.message); } finally { setBusy(false); }
  }

  async function findMatch(event) {
    event.preventDefault(); setBusy(true);
    try { setMatch(await api(`/api/ai/job-match/${selectedJobId}`, { method: 'POST' })); setMatchHistory(await api('/api/ai/job-matches')); }
    catch (e) { showError(e.message); } finally { setBusy(false); }
  }

  async function generateQuestions(event) {
    event.preventDefault(); setBusy(true);
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams({ jobId: selectedJobId, category: formData.get('category'),
      difficulty: formData.get('difficulty'), count: formData.get('count') });
    try { setQuestions(await api(`/api/ai/interview/generate?${params}`, { method: 'POST' })); setQuestionHistory(await api('/api/ai/interview/questions')); }
    catch (e) { showError(e.message); } finally { setBusy(false); }
  }

  async function improveResume(event) {
    event.preventDefault(); setBusy(true);
    const params = selectedJobId ? `?jobId=${selectedJobId}` : '';
    try { setImprovement(await api(`/api/ai/resume/improve${params}`, { method: 'POST' })); setImprovementHistory(await api('/api/ai/resume/improvements')); }
    catch (e) { showError(e.message); } finally { setBusy(false); }
  }

  async function generateLatexResume() {
    setBusy(true);
    try {
      const params = new URLSearchParams({ template: latexTemplate, ...(selectedJobId ? { jobId: selectedJobId } : {}) });
      setLatexResume(await api(`/api/ai/resume/latex?${params}`, { method: 'POST' }));
    } catch (e) { showError(e.message); }
    finally { setBusy(false); }
  }

  async function startMockInterview(event) {
    event.preventDefault(); setBusy(true);
    let stream = null;
    try {
      if (mockConfig.interviewType !== 'TEXT') {
        if (!recordingConsent) throw new Error('Please confirm recording consent before starting.');
        if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error('This browser does not support audio/video recording.');
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: mockConfig.interviewType === 'VIDEO'
            ? { width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 20, max: 24 } }
            : false
        });
        mediaStreamRef.current = stream;
        setMediaStream(stream);
      }
      const params = new URLSearchParams({ jobId: mockConfig.jobId, category: mockConfig.category,
        difficulty: mockConfig.difficulty, count: mockConfig.totalQuestions });
      const generated = await api(`/api/ai/interview/generate?${params}`, { method: 'POST' });
      const list = Array.isArray(generated.questions) ? generated.questions : [];
      if (list.length !== Number(mockConfig.totalQuestions)) {
        throw new Error(`The interview generator returned ${list.length} of ${mockConfig.totalQuestions} questions. Please try again.`);
      }
      const interview = await api(`/api/mock-interviews?jobId=${mockConfig.jobId}&interviewType=${mockConfig.interviewType}&category=${encodeURIComponent(mockConfig.category)}&difficulty=${encodeURIComponent(mockConfig.difficulty)}&totalQuestions=${mockConfig.totalQuestions}`, { method: 'POST' });
      setMockInterview(interview); setMockQuestions(list); setMockIndex(0); setMockAnswer('');
      setMockFeedback(null); setMockReport(null); setRecordingBlob(null); setLastTranscript('');
    } catch (e) {
      stream?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null; setMediaStream(null);
      showError(e.message);
    } finally { setBusy(false); }
  }

  async function startAnswerRecording() {
    try {
      let stream = mediaStreamRef.current;
      const hasLiveAudio = stream?.getAudioTracks().some((track) => track.readyState === 'live');
      const hasLiveVideo = mockConfig.interviewType !== 'VIDEO' ||
        stream?.getVideoTracks().some((track) => track.readyState === 'live');
      if (!hasLiveAudio || !hasLiveVideo) {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: mockConfig.interviewType === 'VIDEO'
            ? { width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 20, max: 24 } }
            : false
        });
        mediaStreamRef.current = stream;
        setMediaStream(stream);
      }
      mediaChunksRef.current = [];
      const recorderOptions = mockConfig.interviewType === 'VIDEO'
        ? { audioBitsPerSecond: 64000, videoBitsPerSecond: 1000000 }
        : { audioBitsPerSecond: 64000 };
      const recorder = new MediaRecorder(stream, recorderOptions);
      recorder.ondataavailable = (event) => { if (event.data.size) mediaChunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const type = recorder.mimeType || (mockConfig.interviewType === 'VIDEO' ? 'video/webm' : 'audio/webm');
        setRecordingBlob(new Blob(mediaChunksRef.current, { type }));
        setIsRecording(false);
      };
      recorder.onerror = () => { setIsRecording(false); showError('The recording could not be completed.'); };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecordingBlob(null);
      setIsRecording(true);
      setError('');
    } catch (e) {
      showError(e.name === 'NotAllowedError'
        ? 'Allow microphone and camera access in your browser, then try recording again.'
        : e.message);
    }
  }

  function stopAnswerRecording() {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
  }

  async function submitMockAnswer(event) {
    event.preventDefault(); setBusy(true);
    const currentQuestion = mockQuestions[mockIndex];
    try {
      if (isRecording) throw new Error('Stop the recording before submitting your answer.');
      if (mockConfig.interviewType !== 'TEXT' && !recordingBlob) throw new Error('Record and review your answer before submitting it.');
      let response;
      if (mockConfig.interviewType === 'AUDIO') {
        const data = new FormData();
        data.append('file', new File([recordingBlob], 'answer.webm', { type: recordingBlob.type || 'audio/webm' }));
        const params = new URLSearchParams({ question: currentQuestion.question });
        response = await api(`/api/mock-interviews/${mockInterview.id}/responses/audio?${params}`, { method: 'POST', body: data });
      } else {
        if (!mockAnswer.trim()) throw new Error('Write your answer before submitting.');
        const params = new URLSearchParams({ question: currentQuestion.question, textAnswer: mockAnswer });
        response = await api(`/api/mock-interviews/${mockInterview.id}/responses?${params}`, { method: 'POST' });
        if (mockConfig.interviewType === 'VIDEO') {
          const data = new FormData();
          data.append('file', new File([recordingBlob], 'answer.webm', { type: recordingBlob.type || 'video/webm' }));
          await api(`/api/mock-interviews/${mockInterview.id}/upload-video?responseId=${response.id}`, { method: 'POST', body: data });
        }
      }
      setMockFeedback(JSON.parse(response.aiFeedback));
      setLastTranscript(response.transcribedAnswer || '');
      setMockAnswer('');
      setRecordingBlob(null);
      if (mockIndex + 1 >= mockQuestions.length) {
        setMockReport(await api(`/api/mock-interviews/${mockInterview.id}/evaluate`, { method: 'POST' }));
        setMockHistory(await api('/api/mock-interviews'));
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null; setMediaStream(null);
      } else setMockIndex((index) => index + 1);
    } catch (e) { showError(e.message); } finally { setBusy(false); }
  }

  async function loadInterviewHistory() {
    setBusy(true);
    try { setMockHistory(await api('/api/mock-interviews')); setView('history'); }
    catch (e) { showError(e.message); } finally { setBusy(false); }
  }

  async function loadInterviewReport(interviewId) {
    if (historyReportId === interviewId) {
      setHistoryReport(null);
      setHistoryReportId(null);
      return;
    }
    setLoadingReportId(interviewId);
    setError('');
    try {
      const report = await api(`/api/mock-interviews/${interviewId}/report`);
      setHistoryReport(report);
      setHistoryReportId(interviewId);
      if (report.questionsAnswered === 0) {
        setMockHistory((history) => history.map((interview) =>
          interview.id === interviewId ? { ...interview, overallScore: null } : interview));
      }
    } catch (e) { showError(e.message); }
    finally { setLoadingReportId(null); }
  }

  async function deleteInterview(interviewId) {
    if (!window.confirm('Delete this mock interview and its saved recordings?')) return;
    try {
      await api(`/api/mock-interviews/${interviewId}`, { method: 'DELETE' });
      setMockHistory(await api('/api/mock-interviews'));
      setHistoryReport(null);
      setHistoryReportId(null);
      showMessage('Mock interview deleted.');
    } catch (e) { showError(e.message); }
  }

  async function openResume() {
    try {
      const response = await fetch(`${API_URL}/api/candidates/resume`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('smarthire_token')}` }
      });
      if (!response.ok) throw new Error('Could not open the uploaded resume.');
      window.open(URL.createObjectURL(await response.blob()), '_blank', 'noopener');
    } catch (e) { showError(e.message); }
  }

  async function downloadApplicationResume(application) {
    try {
      const response = await fetch(`${API_URL}/api/applications/${application.id}/resume`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('smarthire_token')}` }
      });
      if (!response.ok) throw new Error('Could not download this resume.');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a'); link.href = url; link.download = `${application.candidateName}-resume.pdf`; link.click();
      URL.revokeObjectURL(url);
    } catch (e) { showError(e.message); }
  }

  const menu = [
    ['overview', 'Dashboard'], ['profile', 'My profile'], ['resume', 'Resume & analysis'],
    ['jobs', 'Find jobs'], ['applications', 'My applications'], ['matching', 'AI job matching'],
    ['questions', 'Interview preparation'], ['improve', 'Resume improvement'], ['mock', 'Mock interview']
  ];

  return (
    <main className="dashboard candidate-layout">
      <aside className="dashboard-sidebar">
        <strong className="brand">SmartHire</strong>
        <nav>{menu.map(([key, label]) => <button key={key} className={view === key ? 'active' : ''} onClick={() => { setView(key); setError(''); }}>{label}</button>)}
          <button onClick={loadInterviewHistory}>Interview history</button>
          <Link to="/account/password">Change password</Link>
        </nav>
        <div className="sidebar-account"><span>Signed in as</span><strong>{user.name || user.email || 'Candidate'}</strong><small>Candidate</small></div>
        <button className="signout-button" onClick={logout}>Sign out</button>
      </aside>
      <section className="dashboard-main candidate-main">
        <header><div><p>Candidate workspace</p><h1>{menu.find(([key]) => key === view)?.[1] || 'Interview history'}</h1></div><button type="button" className={`avatar profile-avatar-button${profilePhotoUrl ? ' has-photo' : ''}`} aria-label="Open my profile" title="Open my profile" onClick={()=>setView('profile')}>{profilePhotoUrl ? <img src={profilePhotoUrl} alt={`${profile?.name || 'Candidate'} profile`} /> : (profile?.name?.[0] || user.name?.[0] || 'C')}</button></header>
        {error && <div className="notice error-notice" role="alert">{error}</div>}
        {notice && <div className="notice success-notice" role="status">{notice}</div>}

        {view === 'overview' && <>
          <section className="dashboard-welcome">
            <div><p className="eyebrow">YOUR CAREER SPACE</p><h2>Welcome back, {(profile?.name || user.name || 'Candidate').trim().split(/\s+/)[0]}</h2><p>Keep your profile current and discover roles that fit your next step.</p></div>
            <button className="primary-button compact-button" onClick={() => setView('jobs')}>Explore jobs</button>
          </section>
          <div className="stat-grid">
            <article><span>Applications</span><strong>{stats.jobsApplied ?? applications.length}</strong></article>
            <article><span>Profile strength</span><strong>{profileCompletion == null ? '—' : `${profileCompletion}%`}</strong></article>
            <article><span>Resume status</span><strong className={profile?.resumePath ? 'stat-status-ready' : 'stat-status-needed'}>{profile?.resumePath ? 'Ready' : 'Add resume'}</strong></article>
          </div>
          <div className="candidate-dashboard-grid">
            <div className="candidate-dashboard-primary">
              <section className="panel profile-completion-panel">
                <div className="profile-completion-heading">
                  <div><p className="eyebrow">PROFILE STRENGTH</p><h2>Build a stronger profile</h2><p>Complete these details so employers can better understand your background.</p></div>
                  <strong className="completion-value">{profileCompletion == null ? '—' : `${profileCompletion}%`}</strong>
                </div>
                <div className="profile-progress" role="progressbar" aria-label="Profile completion" aria-valuenow={profileCompletion ?? 0} aria-valuemin="0" aria-valuemax="100">
                  <span style={{ width: `${profileCompletion ?? 0}%` }} />
                </div>
                <div className="profile-progress-caption"><span>{completedProfileItems.length} of {profileChecklist.length} profile sections complete</span><span>{profileNextSteps.length ? `${profileChecklist.length - completedProfileItems.length} to go` : 'All set'}</span></div>
                <div className="profile-next-steps">
                  {profileNextSteps.length ? profileNextSteps.map(([key, label]) => <span key={key}>{label}</span>) : <span className="profile-complete-label">Your profile is complete</span>}
                </div>
                <button className="text-button completion-action" onClick={() => setView('profile')}>{profileNextSteps.length ? 'Complete your profile' : 'Review your profile'}</button>
              </section>
              <section className="panel"><div className="section-heading"><div><h2>Recommended jobs</h2><p className="muted-copy">Explore current openings that could be a good fit.</p></div><button className="text-button" onClick={() => setView('jobs')}>Browse all</button></div>
                {jobs.slice(0, 4).map((job) => <CandidateJobCard key={job.id} job={job} onApply={() => { setApplyJob(job); setApplyMethod(profile?.resumePath ? 'WITH_RESUME' : 'MANUAL'); }} />)}
                {!jobs.length && <p className="empty-state">There are no active jobs at the moment.</p>}
              </section>
            </div>
            <aside className="candidate-dashboard-secondary">
              <section className="panel resume-status-card">
                <p className="eyebrow">{profile?.resumePath ? 'RESUME READY' : 'NEXT STEP'}</p>
                <h2>{profile?.resumePath ? 'Your resume is uploaded' : 'Add your resume'}</h2>
                <p>{profile?.resumePath ? 'Analyze your experience and use your resume when applying.' : 'Upload a PDF to unlock resume analysis and faster applications.'}</p>
                {profile?.resumePath
                  ? <div className="resume-status-actions"><button className="secondary-button compact-button" onClick={openResume}>View resume</button><button className="primary-button compact-button" onClick={analyzeResume} disabled={busy}>{busy ? 'Analyzing…' : 'Analyze'}</button></div>
                  : <button className="primary-button compact-button" onClick={() => setView('resume')}>Upload resume</button>}
              </section>
              <section className="panel quick-actions-panel">
                <h2>Quick actions</h2>
                <button onClick={() => setView('matching')}>Find your job match <span>&gt;</span></button>
                <button onClick={() => setView('questions')}>Practice interview questions <span>&gt;</span></button>
                <button onClick={() => setView('resume')}>Review your resume <span>&gt;</span></button>
              </section>
              <section className="panel"><div className="section-heading"><div><h2>Recent applications</h2><p className="muted-copy">Track your latest activity.</p></div><button className="text-button" onClick={() => setView('applications')}>View all</button></div>
                {applications.slice(0, 3).map((application) => <ApplicationRow application={application} key={application.id} />)}
                {!applications.length && <p className="empty-state">Your submitted applications will appear here.</p>}
              </section>
            </aside>
          </div>
        </>}

        {view === 'profile' && <form className="panel job-form" onSubmit={saveProfile}>
          <h2>Candidate profile</h2>
          <div className="profile-photo-card">
            <div className={`profile-photo-preview${profilePhotoUrl ? ' has-photo' : ''}`}>
              {profilePhotoUrl ? <img src={profilePhotoUrl} alt="Candidate profile" /> : <span>{profile?.name?.[0] || user.name?.[0] || 'C'}</span>}
            </div>
            <div className="profile-photo-copy">
              <h3>Profile photo</h3>
              <p>Upload a clear headshot in JPEG or PNG format. Maximum size: 5 MB.</p>
              <button type="button" className="secondary-button compact-button" onClick={() => photoInputRef.current?.click()} disabled={busy}>{busy ? 'Uploading…' : profile?.photoPath ? 'Change photo' : 'Upload photo'}</button>
              <input ref={photoInputRef} className="profile-photo-input" type="file" accept="image/jpeg,image/png" aria-label="Upload profile photo" onChange={uploadPhoto} />
            </div>
          </div>
          <div className="form-grid">
            <label>Full name<input required value={profileForm.name || ''} onChange={e=>setProfileForm({...profileForm,name:e.target.value})} /></label>
            <label>Email<input value={profileForm.email || ''} disabled /></label>
            <label>Phone<input value={profileForm.phone || ''} onChange={e=>setProfileForm({...profileForm,phone:e.target.value})} /></label>
            <label>Location<input value={profileForm.location || ''} onChange={e=>setProfileForm({...profileForm,location:e.target.value})} />{profileForm.latitude != null && profileForm.longitude != null && <a className="location-map-link" href={`https://www.openstreetmap.org/?mlat=${profileForm.latitude}&mlon=${profileForm.longitude}#map=15/${profileForm.latitude}/${profileForm.longitude}`} target="_blank" rel="noreferrer">View saved pin on map</a>}</label>
            <div className="location-action-field"><span>Location services</span><button type="button" className="secondary-button compact-button" onClick={useCurrentLocation} disabled={locationLoading}>{locationLoading ? 'Finding location…' : 'Use my current location'}</button><small>Your browser asks permission before sharing your location.</small></div>
            <label>Education<input value={profileForm.education || ''} onChange={e=>setProfileForm({...profileForm,education:e.target.value})} /></label>
            <label>Graduation year<input type="number" value={profileForm.graduationYear || ''} onChange={e=>setProfileForm({...profileForm,graduationYear:e.target.value ? Number(e.target.value) : null})} /></label>
            <label className="full-width">Skills<input value={profileForm.skills || ''} onChange={e=>setProfileForm({...profileForm,skills:e.target.value})} placeholder="Java, React, SQL" /></label>
            <label className="full-width">Experience<textarea rows="3" value={profileForm.experience || ''} onChange={e=>setProfileForm({...profileForm,experience:e.target.value})} /></label>
            <label className="full-width">Professional summary<textarea rows="4" value={profileForm.professionalSummary || ''} onChange={e=>setProfileForm({...profileForm,professionalSummary:e.target.value})} /></label>
          </div>
          <div className="form-actions"><button className="primary-button compact-button" disabled={busy}>Save profile</button></div>
        </form>}

        {view === 'resume' && <>
          <section className="panel job-form">
            <h2>Resume</h2>
            <p className="muted-copy">{profile?.resumePath ? 'A resume is saved to your profile. Upload another PDF to replace it.' : 'Upload a PDF resume to use the AI tools and apply with your resume.'}</p>
            <form className="upload-form" onSubmit={uploadResume}>
              <input type="file" accept="application/pdf,.pdf" onChange={e=>setResumeFile(e.target.files?.[0] || null)} />
              <button className="primary-button compact-button" disabled={busy}>{busy ? 'Uploading…' : 'Upload PDF'}</button>
            </form>
            {resumeFile && <p className="resume-file-label">Selected file: <strong>{resumeFile.name}</strong></p>}
            {profile?.resumePath && <p className="resume-file-label">Uploaded file: <strong>{profile.resumeFileName || 'Resume PDF'}</strong></p>}
            {profile?.resumePath && <button className="text-button" onClick={openResume}>View current resume</button>}
          </section>
          <section className="panel">
            <div className="section-heading"><div><h2>AI resume analysis</h2><p className="muted-copy">Get feedback based on the content of your actual resume.</p></div><button className="primary-button compact-button" onClick={analyzeResume} disabled={!profile?.resumePath || analysisLoading}>{analysisLoading ? 'Analyzing…' : analysis ? 'Refresh analysis' : 'Analyze resume'}</button></div>
            {!profile?.resumePath && <p className="empty-state">Upload your PDF to enable resume analysis.</p>}
            {analysis && <ResumeAnalysisDashboard data={analysis} />}
            {!analysis && analysisHistory.length > 0 && <ResumeAnalysisDashboard data={{ resumeQualityScore: analysisHistory[0].resumeScore, technicalSkills: analysisHistory[0].extractedSkills, strengths: analysisHistory[0].strengths, recommendedImprovements: analysisHistory[0].suggestions, weaknesses: analysisHistory[0].weaknesses }} />}
          </section>
        </>}

        {view === 'jobs' && <section className="panel">
          <div className="section-heading"><div><h2>Available jobs</h2><p className="muted-copy">Search current openings and choose how to apply.</p></div></div>
          <input className="search-input" placeholder="Search title, location, or skills" value={search} onChange={e=>setSearch(e.target.value)} />
          {visibleJobs.map((job) => <CandidateJobCard key={job.id} job={job} onApply={() => { setApplyJob(job); setApplyMethod(profile?.resumePath ? 'WITH_RESUME' : 'MANUAL'); }} />)}
          {!visibleJobs.length && <p className="empty-state">No jobs match your search.</p>}
        </section>}

        {view === 'applications' && <section className="panel"><h2>My applications</h2>
          {applications.map((application) => <ApplicationRow application={application} key={application.id} />)}
          {!applications.length && <p className="empty-state">You haven’t applied to any jobs yet.</p>}
        </section>}

        {view === 'matching' && <section className="panel">
          <div className="section-heading"><div><p className="eyebrow">PERSONALIZED FOR YOU</p><h2>Find your best-fit role</h2><p className="muted-copy">Compare your resume with a role and see where you stand.</p></div></div>
          <p className="muted-copy">Showing active company openings available right now, sorted by most recently posted.</p>
          <form className="inline-form" onSubmit={findMatch}><select required value={selectedJobId} onChange={e=>setSelectedJobId(e.target.value)}><option value="">Select a company role</option>{jobOptions}</select><button className="primary-button compact-button" disabled={busy || !profile?.resumePath || !jobs.length}>{busy ? 'Matching…' : 'Find my match'}</button></form>
          <div className="match-company-list">{jobs.slice(0,6).map(job=><article key={job.id}><div><strong>{job.title}</strong><span>{job.companyName || 'Company'}{job.location ? ` · ${job.location}` : ''}</span></div><small>{job.createdAt ? `Posted ${new Date(job.createdAt).toLocaleDateString()}` : job.employmentType || 'Open role'}</small></article>)}</div>
          {!jobs.length && <p className="empty-state">No active company jobs are available yet. Check back after recruiters publish openings.</p>}
          {!profile?.resumePath && <p className="empty-state">Upload a resume before matching with a job.</p>}
          {match && <JobMatchResult data={match} job={jobs.find((job) => String(job.id) === String(selectedJobId))} onApply={() => {
            const job = jobs.find((item) => String(item.id) === String(selectedJobId));
            if (job) { setApplyJob(job); setApplyMethod(profile?.resumePath ? 'WITH_RESUME' : 'MANUAL'); }
          }} />}
          {!!matchHistory.length && <div className="history-section match-history"><h3>Saved job matches</h3>{matchHistory.map((item)=><article className="history-card match-history-card" key={item.id}>
            <div className="match-history-heading"><div><strong>{item.jobTitle}</strong><small>{new Date(item.createdAt).toLocaleString()}</small></div><span>{item.matchScore ?? '—'}% match</span></div>
            <p><b>Matching skills</b></p><SkillTags items={item.matchingSkills} />
            <p><b>Skills to build</b></p><SkillTags items={item.missingSkills} variant="missing" />
          </article>)}</div>}
        </section>}

        {view === 'questions' && <section className="panel">
          <h2>Interview preparation</h2><p className="muted-copy">Generate role-based questions and answer guidance.</p>
          <form className="tool-form" onSubmit={generateQuestions}>
            <label>Job<select name="job" required value={selectedJobId} onChange={e=>setSelectedJobId(e.target.value)}><option value="">Select a job</option>{jobOptions}</select></label>
            <label>Category<select name="category"><option>Mixed</option><option>Technical</option><option>HR</option><option>Behavioral</option></select></label>
            <label>Difficulty<select name="difficulty"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
            <label>Question count<select name="count"><option>5</option><option>10</option><option>15</option><option>20</option></select></label>
            <button className="primary-button compact-button" disabled={busy}>{busy ? 'Generating…' : 'Generate questions'}</button>
          </form>
          {questions && <JsonResult data={questions} />}
          {!!questionHistory.length && <div className="history-section"><h3>Saved practice questions</h3>{questionHistory.slice(0,12).map((item)=><article className="history-card" key={item.id}><strong>{item.question}</strong><small>{item.jobTitle || 'Practice'} · {item.category} · {item.difficulty}</small><p>{item.suggestedAnswer}</p></article>)}</div>}
        </section>}

        {view === 'improve' && <section className="panel">
          <h2>Resume improvement assistant</h2><p className="muted-copy">Review suggested rewrites without changing your original PDF.</p>
          <form className="inline-form" onSubmit={improveResume}><select value={selectedJobId} onChange={e=>setSelectedJobId(e.target.value)}><option value="">General improvement</option>{jobOptions}</select><button className="primary-button compact-button" disabled={busy || !profile?.resumePath}>{busy ? 'Reviewing…' : 'Suggest improvements'}</button></form>
          {!profile?.resumePath && <p className="empty-state">Upload a resume to use the improvement assistant.</p>}
          {improvement && <JsonResult data={improvement} />}
          <div className="latex-builder">
            <h3>Build an editable LaTeX resume</h3>
            <p className="muted-copy">Choose a clean Overleaf-ready layout. AI will place facts from your uploaded resume into the selected style.</p>
            <div className="inline-form"><select aria-label="Resume template" value={latexTemplate} onChange={e=>setLatexTemplate(e.target.value)}><option value="classic">Classic professional</option><option value="modern">Modern single-column</option><option value="compact">Compact ATS one-page</option></select><button type="button" className="primary-button compact-button" disabled={busy || !profile?.resumePath} onClick={generateLatexResume}>{busy ? 'Creating…' : 'Create LaTeX resume'}</button></div>
          </div>
          {latexResume?.latex && <LatexResumeEditor latexResume={latexResume} setLatexResume={setLatexResume} template={latexTemplate} />}
          {!!improvementHistory.length && <div className="history-section"><h3>Previous improvement suggestions</h3>{improvementHistory.slice(0,5).map((item)=><details className="history-card" key={item.id}><summary>{new Date(item.createdAt).toLocaleString()}</summary><h4>Original resume content</h4><pre>{item.originalContent}</pre><h4>Suggested version</h4><pre>{item.improvedContent || 'No formatted suggestions were saved for this older result. Run Suggest improvements again.'}</pre></details>)}</div>}
        </section>}

        {view === 'mock' && <section className="panel">
          <h2>AI mock interview</h2><p className="muted-copy">Practice with text, audio, or video answers. Audio is transcribed locally; video answers use a transcript you type.</p>
          {!mockInterview && <form className="tool-form" onSubmit={startMockInterview}>
            <label>Job<select required value={mockConfig.jobId} onChange={e=>setMockConfig({...mockConfig,jobId:e.target.value})}><option value="">Select a job</option>{jobOptions}</select></label>
            <label>Category<select value={mockConfig.category} onChange={e=>setMockConfig({...mockConfig,category:e.target.value})}><option>Mixed</option><option>Technical</option><option>HR</option><option>Behavioral</option></select></label>
            <label>Difficulty<select value={mockConfig.difficulty} onChange={e=>setMockConfig({...mockConfig,difficulty:e.target.value})}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
            <label>Interview mode<select value={mockConfig.interviewType} onChange={e=>setMockConfig({...mockConfig,interviewType:e.target.value})}><option value="TEXT">Text</option><option value="AUDIO">Audio</option><option value="VIDEO">Video</option></select></label>
            <label>Questions<select value={mockConfig.totalQuestions} onChange={e=>setMockConfig({...mockConfig,totalQuestions:Number(e.target.value)})}><option value="5">5</option><option value="10">10</option></select></label>
            {mockConfig.interviewType !== 'TEXT' && <label className="recording-consent"><input type="checkbox" checked={recordingConsent} onChange={e=>setRecordingConsent(e.target.checked)} /> I consent to record and process my {mockConfig.interviewType.toLowerCase()} answers on this computer.</label>}
            <button className="primary-button compact-button" disabled={busy}>{busy ? 'Preparing…' : 'Start interview'}</button>
          </form>}
          {!mockInterview && busy && <p className="muted-copy" role="status">Generating questions locally can take about a minute. Keep this page open.</p>}
          {!mockInterview && mockConfig.interviewType === 'AUDIO' && <p className="muted-copy">Audio will be transcribed locally. The first transcription may take longer while the speech model loads.</p>}
          {!mockInterview && mockConfig.interviewType === 'VIDEO' && <p className="muted-copy">Video mode requires browser camera and microphone access. You will type a transcript for local AI evaluation.</p>}
          {mockInterview && !mockReport && mockQuestions[mockIndex] && <>
            <p className="muted-copy">Question {mockIndex + 1} of {mockQuestions.length}</p>
            <h3 className="mock-question">{mockQuestions[mockIndex].question}</h3>
            {mockConfig.interviewType === 'VIDEO' && <video className="camera-preview" ref={previewRef} autoPlay muted playsInline />}
            {mockConfig.interviewType !== 'TEXT' && <div className="recording-controls">
              {!isRecording ? <button className="secondary-button compact-button" onClick={startAnswerRecording} disabled={busy}>Start recording</button> : <button className="secondary-button compact-button" onClick={stopAnswerRecording}>Stop recording</button>}
              <span>{isRecording ? 'Recording…' : recordingBlob ? 'Recording ready to review' : 'Not recording'}</span>
            </div>}
            {recordingUrl && (mockConfig.interviewType === 'VIDEO' ? <video className="recording-review" controls src={recordingUrl} /> : <audio className="recording-review" controls src={recordingUrl} />)}
            <form onSubmit={submitMockAnswer}>
              {mockConfig.interviewType !== 'AUDIO' && <textarea className="answer-box" required rows="6" placeholder={mockConfig.interviewType === 'VIDEO' ? 'Write a transcript or summary of your spoken answer for evaluation…' : 'Write your answer here…'} value={mockAnswer} onChange={e=>setMockAnswer(e.target.value)} />}
              {mockConfig.interviewType === 'AUDIO' && <p className="muted-copy">Your recorded answer will be transcribed locally before evaluation.</p>}
              <button className="primary-button compact-button" disabled={busy || isRecording}>{busy ? 'Evaluating…' : 'Submit answer'}</button>
            </form>
            {lastTranscript && <p className="transcript-copy"><strong>Audio transcript:</strong> {lastTranscript}</p>}
            {mockFeedback && <details className="feedback-details"><summary>Feedback on your previous answer</summary><JsonResult data={mockFeedback} /></details>}
          </>}
          {mockReport && <><h3>Interview complete · Score {mockReport.overallScore ?? '—'}/100</h3><JsonResult data={mockReport} /><button className="secondary-button compact-button" onClick={()=>{setMockInterview(null);setMockReport(null);setMockFeedback(null);setLastTranscript('');setRecordingBlob(null);}}>Start another interview</button></>}
        </section>}

        {view === 'history' && <section className="panel"><h2>Mock interview history</h2>
          {mockHistory.map((interview) => <div className="history-interview-item" key={interview.id}>
            <article className="managed-job-row">
              <div><strong>{interview.jobTitle || 'Practice interview'}</strong><p>{interview.category} · {interview.difficulty} · {new Date(interview.createdAt).toLocaleDateString()}</p></div>
              <div className="job-actions">
                <span className="status-pill active-pill">{interview.overallScore == null ? 'In progress' : `${interview.overallScore}/100`}</span>
                <button className="text-button" aria-expanded={historyReportId === interview.id} disabled={loadingReportId === interview.id} onClick={()=>loadInterviewReport(interview.id)}>
                  {loadingReportId === interview.id ? 'Loading…' : historyReportId === interview.id ? 'Hide report' : 'View report'}
                </button>
                <button className="text-button delete-action" onClick={()=>deleteInterview(interview.id)}>Delete</button>
              </div>
            </article>
            {historyReportId === interview.id && historyReport && <section className="history-report-detail" ref={historyReportRef} aria-live="polite">
              <div className="section-heading"><h3>Interview performance report</h3><button className="text-button" onClick={()=>loadInterviewReport(interview.id)}>Close</button></div>
              <div className="report-summary">
                <div><small>Questions answered</small><strong>{historyReport.questionsAnswered} / {historyReport.totalQuestions}</strong></div>
                <div><small>Overall score</small><strong>{historyReport.overallScore == null ? 'Not scored yet' : `${historyReport.overallScore}/100`}</strong></div>
              </div>
              {historyReport.responses.length ? historyReport.responses.map((response, index) => <article className="history-report-answer" key={response.id}>
                <h4>Question {index + 1}</h4><p><strong>{response.question}</strong></p>
                <p><b>Your answer:</b> {response.transcribedAnswer || response.textAnswer || 'No answer saved.'}</p>
                <p><b>Score:</b> {response.aiScore == null ? '—' : `${response.aiScore}/100`}</p>
                {response.aiFeedback && <details><summary>AI feedback</summary><JsonResult data={parseFeedback(response.aiFeedback)} /></details>}
              </article>) : <p className="empty-state">No answers have been submitted yet. Submit at least one answer to generate a report.</p>}
            </section>}
          </div>)}
          {!mockHistory.length && <p className="empty-state">No mock interviews yet. Start one to build your history.</p>}
        </section>}
      </section>

      {applyJob && <div className="modal-backdrop" role="presentation" onClick={(event)=>{if(event.target===event.currentTarget)setApplyJob(null);}}>
        <section className="apply-modal" role="dialog" aria-modal="true" aria-labelledby="apply-title">
          <button className="modal-close" aria-label="Close" onClick={()=>setApplyJob(null)}>×</button>
          <p className="eyebrow">JOB APPLICATION</p><h2 id="apply-title">Apply for {applyJob.title}</h2>
          <p className="muted-copy">Choose how you want to send your application.</p>
          <div className="apply-options">
            <button className={applyMethod==='WITH_RESUME'?'apply-option selected':'apply-option'} onClick={()=>setApplyMethod('WITH_RESUME')}><strong>Apply with resume</strong><span>{profile?.resumePath ? 'Attach your saved PDF resume.' : 'Upload a PDF resume first.'}</span></button>
            <button className={applyMethod==='MANUAL'?'apply-option selected':'apply-option'} onClick={()=>setApplyMethod('MANUAL')}><strong>Apply manually</strong><span>Submit your profile details without attaching a resume.</span></button>
          </div>
          {applyMethod==='MANUAL' && <label className="cover-letter-label">Note to recruiter (optional)<textarea rows="4" value={coverLetter} onChange={e=>setCoverLetter(e.target.value)} placeholder="Introduce yourself or explain your interest in this role." /></label>}
          <div className="form-actions"><button className="primary-button compact-button" disabled={busy || (applyMethod==='WITH_RESUME' && !profile?.resumePath)} onClick={submitApplication}>{busy ? 'Submitting…' : applyMethod==='WITH_RESUME' ? 'Apply with resume' : 'Apply manually'}</button><button className="secondary-button compact-button" onClick={()=>setApplyJob(null)}>Cancel</button></div>
        </section>
      </div>}
    </main>
  );
}

function CandidateJobCard({ job, onApply }) {
  return <article className="candidate-job-card">
    <div className="job-card-main">
      <div className="company-mark" aria-hidden="true">{(job.companyName || 'C').slice(0, 1).toUpperCase()}</div>
      <div className="job-card-content">
        <h3>{job.title}</h3>
        <p>{job.companyName || 'Company'} <span>·</span> {job.location || 'Location not specified'} <span>·</span> {job.employmentType || 'Full time'}</p>
        <SkillTags items={job.requiredSkills} />
      </div>
    </div>
    <button className="primary-button compact-button" onClick={onApply}>Apply</button>
  </article>;
}

function JobMatchResult({ data, job, onApply }) {
  const score = Number(String(data.overallMatchPercentage ?? '').replace('%', ''));
  const displayScore = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : null;
  const recommendations = displayList(data.recommendations);
  return <section className="job-match-result">
    <div className="job-match-banner">
      <div>
        <p className="eyebrow">YOUR RESUME MATCH</p>
        <h3>{job?.title || 'Job compatibility report'}</h3>
        <p>{job ? `${job.companyName || 'Company'} · ${job.location || 'Location not specified'}` : 'A role-by-role look at your experience and skills.'}</p>
      </div>
      {displayScore != null && <div className="match-score-ring" style={{ '--match-score': `${displayScore}%` }}>
        <div><strong>{Math.round(score)}%</strong><span>match</span></div>
      </div>}
    </div>
    <div className="match-skill-grid">
      <article className="match-skill-card">
        <div className="match-card-heading"><div><h4>Skills you match</h4><p>Strengths that align with the role</p></div><span className="match-count">{displayList(data.matchingSkills).length}</span></div>
        <SkillTags items={data.matchingSkills} />
      </article>
      <article className="match-skill-card missing-skill-card">
        <div className="match-card-heading"><div><h4>Skills to build</h4><p>Areas to focus on next</p></div><span className="match-count">{displayList(data.missingSkills).length}</span></div>
        <SkillTags items={data.missingSkills} variant="missing" />
      </article>
    </div>
    <div className="match-details-grid">
      {data.relevantExperience && <article><h4>Relevant experience</h4><p>{displayValue(data.relevantExperience)}</p></article>}
      {data.qualificationCompatibility && <article><h4>Qualifications</h4><p>{displayValue(data.qualificationCompatibility)}</p></article>}
      {data.jobRequirementCompatibility && <article><h4>Role requirements</h4><p>{displayValue(data.jobRequirementCompatibility)}</p></article>}
    </div>
    {!!recommendations.length && <div className="match-recommendations"><h4>Recommended next steps</h4><ul>{recommendations.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></div>}
    {job && <div className="match-action-row"><span>Interested in this role?</span><button className="primary-button compact-button" onClick={onApply}>Apply to this job</button></div>}
  </section>;
}

function SkillTags({ items, variant = 'default' }) {
  const skills = displayList(items);
  if (!skills.length) return <p className="skill-empty">No skills listed</p>;
  return <div className={`skill-tags ${variant === 'missing' ? 'missing' : ''}`}>
    {skills.map((skill, index) => <span key={`${skill}-${index}`}>{skill}</span>)}
  </div>;
}

function displayList(value) {
  if (Array.isArray(value)) return value.map(displayValue).filter(Boolean);
  if (typeof value !== 'string' || !value.trim()) return value == null ? [] : [displayValue(value)];
  const text = value.trim();
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map(displayValue).filter(Boolean);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
  }
  return text.replace(/^\[|\]$/g, '').split(/[,;\n]/)
    .map((item) => item.trim().replace(/^["']|["']$/g, '').trim())
    .filter(Boolean);
}

function displayValue(value) {
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(displayValue).filter(Boolean).join(', ');
  if (typeof value === 'object') return Object.entries(value).map(([key, item]) => `${key}: ${displayValue(item)}`).join(' · ');
  return String(value).trim();
}

function ApplicationRow({ application }) {
  return <article className="application-row"><div><strong>{application.jobTitle}</strong><p>Applied {new Date(application.appliedAt).toLocaleDateString()} · {application.method === 'WITH_RESUME' ? 'Resume attached' : 'Manual application'}</p>
    {application.interviewScheduledAt && <p className="candidate-interview-schedule"><strong>Interview:</strong> {application.interviewScheduledAt.replace('T', ' ')} ({application.interviewTimeZone}) · {application.interviewDetails}</p>}
  </div><span className="status-pill application-status">{application.status?.replace('_', ' ')}</span></article>;
}

function JsonResult({ data, variant }) {
  if (!data) return null;
  const score = variant === 'resume-analysis' && data.resumeQualityScore != null ? Number(data.resumeQualityScore) : NaN;
  const entries = Object.entries(data).filter(([key]) => !(variant === 'resume-analysis' && key === 'resumeQualityScore'));
  return <div className={`json-result${variant === 'resume-analysis' ? ' resume-analysis-result' : ''}`}>
    {Number.isFinite(score) && <article className="result-score-card">
      <div><h3>Resume score</h3><p className="score-caption">Overall resume quality</p></div>
      <div className="score-value"><strong>{score}</strong><span>/100</span></div>
      <div className="score-progress" role="progressbar" aria-label="Resume score" aria-valuenow={score} aria-valuemin="0" aria-valuemax="100">
        <span style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
      </div>
    </article>}
    {entries.map(([key, value]) => (
      <article className={/skills/i.test(key) ? 'result-skills-card' : ''} key={key}>
        <h3>{formatResultLabel(key)}</h3>
        <StructuredResultValue value={value} skillMode={/skills/i.test(key)} />
      </article>
    ))}
  </div>;
}

function ResumeAnalysisDashboard({ data }) {
  if (!data) return null;
  const score = Number(data.atsScore ?? data.resumeQualityScore ?? data.score);
  const validScore = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : null;
  const strengths = data.strengths ?? data.keyStrengths ?? [];
  const improvements = data.recommendedImprovements ?? data.improvements ?? data.weaknesses ?? [];
  return <section className="resume-analysis-dashboard">
    <div className="resume-analysis-hero">
      <div><span className="eyebrow">RESUME HEALTH</span><h3>ATS compatibility</h3><p>Score reflects structure, readability, skills and ATS readiness.</p></div>
      <div className="ats-chart-wrap">
        {validScore == null ? <div className="ats-score-empty">—<small>Run analysis</small></div> : <><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={[{value:validScore},{value:100-validScore}]} dataKey="value" innerRadius="72%" outerRadius="95%" startAngle={90} endAngle={-270} stroke="none"><Cell fill="#3569d4"/><Cell fill="#e7edf7"/></Pie></PieChart></ResponsiveContainer><div className="ats-score-center"><strong>{validScore}</strong><span>/100</span></div></>}
      </div>
    </div>
    <div className="resume-analysis-cards">
      <article><h4>Strengths</h4><StructuredResultValue value={strengths}/></article>
      <article><h4>Improvements</h4><StructuredResultValue value={improvements}/></article>
      <article><h4>Skills found</h4><StructuredResultValue value={data.technicalSkills ?? data.skills} skillMode/></article>
    </div>
  </section>;
}

function LatexResumeEditor({ latexResume, setLatexResume, template }) {
  const [saved, setSaved] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);
  const [exportError, setExportError] = useState('');

  function saveSource() {
    localStorage.setItem('smarthire_latex_resume', JSON.stringify({ template, latex: latexResume.latex, savedAt: new Date().toISOString() }));
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  }

  function savePdf() {
    try {
      printResumePdf(latexResume.latex);
      setExportError('');
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Could not prepare the PDF.');
    }
  }

  async function downloadDocx() {
    setExportingDocx(true);
    setExportError('');
    try {
      const blob = await createResumeDocx(latexResume.latex);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'resume.docx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Could not create the DOCX file.');
    } finally {
      setExportingDocx(false);
    }
  }

  return <section className="latex-result">
    <div className="latex-editor-toolbar"><div><span className="latex-live-dot" /> OVERLEAF STYLE EDITOR <span className="latex-template-tag">{template}</span></div><div className="latex-editor-actions">
      <button type="button" className="secondary-button compact-button" onClick={()=>navigator.clipboard.writeText(latexResume.latex)}>Copy code</button>
      <button type="button" className="secondary-button compact-button" onClick={savePdf}>Save as PDF</button>
      <button type="button" className="secondary-button compact-button" onClick={downloadDocx} disabled={exportingDocx}>{exportingDocx ? 'Creating DOCX…' : 'Download DOCX'}</button>
      <button type="button" className="primary-button compact-button" onClick={saveSource}>{saved ? 'Saved' : 'Save edits'}</button>
      <a className="secondary-button compact-button latex-overleaf-link" href="https://www.overleaf.com/project" target="_blank" rel="noreferrer">Open Overleaf</a>
    </div></div>
    {exportError && <p className="latex-export-error" role="alert">{exportError}</p>}
    <div className="latex-workspace">
      <div className="latex-code-pane"><div className="latex-pane-title"><span>resume.tex</span><span>Editing source</span></div><textarea aria-label="Editable LaTeX source" value={latexResume.latex} onChange={e=>setLatexResume({...latexResume,latex:e.target.value})} spellCheck="false" /></div>
      <div className="latex-preview-pane"><div className="latex-pane-title"><span>PDF &amp; Word export</span><span>Processed in your browser</span></div><div className="latex-preview-message">Save as PDF opens your browser’s print dialog; choose “Save as PDF”. Download DOCX creates an editable Word document. Your resume content is processed locally.</div></div>
    </div>
    {latexResume.improvements && <JsonResult data={{ improvements: latexResume.improvements }} />}
  </section>;
}

function StructuredResultValue({ value, skillMode = false }) {
  const parsed = parseStructuredResult(value);
  if (parsed == null) return <p>Not provided</p>;
  if (Array.isArray(parsed)) {
    if (skillMode && parsed.every((item) => item == null || typeof item !== 'object') &&
        parsed.every((item) => !String(item ?? '').includes(':'))) {
      return <div className="result-skill-tags">{parsed.filter((item) => item != null).map((item, index) => <span key={index}>{String(item)}</span>)}</div>;
    }
    if (skillMode) return <div className="result-skill-groups">
      {parsed.map((item, index) => {
        if (item && typeof item === 'object') return <div className="result-skill-group" key={index}><StructuredResultValue value={item} skillMode /></div>;
        const text = String(item);
        const separator = text.indexOf(':');
        if (separator > 0) return <div className="result-skill-group" key={index}>
          <strong>{text.slice(0, separator).trim()}</strong>
          <SkillTags items={text.slice(separator + 1)} />
        </div>;
        return <span className="result-skill-tag" key={index}>{text}</span>;
      })}
    </div>;
    return <ul className="result-bullet-list">{parsed.map((item, index) => <li key={index}><StructuredResultValue value={item} /></li>)}</ul>;
  }
  if (typeof parsed === 'object') return <div className="result-object-groups">
    {Object.entries(parsed).map(([key, item]) => <div className="result-object-group" key={key}>
      <strong>{formatResultLabel(key)}</strong>
      <StructuredResultValue value={item} skillMode={skillMode} />
    </div>)}
  </div>;
  if (skillMode) return <SkillTags items={parsed} />;
  return <p>{String(parsed)}</p>;
}

function parseStructuredResult(value) {
  if (typeof value !== 'string') return value;
  const text = value.trim();
  if (!(text.startsWith('{') && text.endsWith('}')) && !(text.startsWith('[') && text.endsWith(']'))) return value;
  try { return JSON.parse(text); }
  catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return value;
  }
}

function formatResultLabel(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}

function parseFeedback(feedback) {
  try { return JSON.parse(feedback); }
  catch { return { feedback }; }
}

function displayScreeningItems(value) {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.join(', ');
  } catch {}
  return typeof value === 'string' ? value.trim() : '';
}

function RecruiterWorkspace({ initialView = 'overview' }) {
  const user = JSON.parse(localStorage.getItem('smarthire_user') || '{}');
  const [view, setView] = useState(initialView);
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({});
  const [applications, setApplications] = useState([]);
  const [screeningResults, setScreeningResults] = useState([]);
  const [screeningLoading, setScreeningLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [scheduleApplication, setScheduleApplication] = useState(null);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [selectedApplicantPhotoUrl, setSelectedApplicantPhotoUrl] = useState('');
  const [scheduleForm, setScheduleForm] = useState({ scheduledAt: '', timeZone: '', details: '', message: '' });
  const [scheduling, setScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [notice, setNotice] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState(() => new Set());
  const [deletingJobs, setDeletingJobs] = useState(false);
  const [form, setForm] = useState(emptyJobForm());

  function emptyJobForm() {
    return { title: '', description: '', requiredSkills: '', qualification: 'Any qualification', experience: '0 years',
      location: '', employmentType: 'Full time', salaryRange: 'Not disclosed', applicationDeadline: '' };
  }

  async function loadJobs() {
    const data = await api('/api/jobs/mine');
    setJobs(data);
    setSelectedJobIds((current) => new Set([...current].filter((id) => data.some((job) => job.id === id))));
  }

  function useCurrentJobLocation() {
    if (!navigator.geolocation) { setError('Location is not supported by this browser.'); return; }
    setLocationLoading(true); setError('');
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`);
        const place = response.ok ? await response.json() : null;
        const address = place?.address || {};
        const location = [address.city || address.town || address.village || address.county, address.state, address.country]
          .filter(Boolean).join(', ') || `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
        setForm((current) => ({ ...current, location }));
        setNotice('Current job location added. You can edit it before publishing.');
      } catch { setError('Could not identify your current location. Enter it manually.'); }
      finally { setLocationLoading(false); }
    }, (locationError) => {
      setLocationLoading(false);
      setError(locationError.code === 1 ? 'Allow browser location access, then try again.' : 'Could not get your current location.');
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  }

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  useEffect(() => {
    Promise.all([loadJobs(), api('/api/analytics/recruiter')])
      .then(([, analytics]) => setStats(analytics))
      .catch((e) => setError(e.message));
  }, []);

  async function openApplicants(job) {
    setSelectedJob(job);
    setView('applicants');
    setError('');
    setNotice('');
    setScreeningResults([]);
    try {
      setApplications(await api(`/api/applications/job/${job.id}`));
    } catch (e) {
      setError(e.message);
    }
  }

  function startEdit(job) {
    setEditingId(job.id);
    setForm({
      title: job.title || '', description: job.description || '',
      requiredSkills: job.requiredSkills || '',
      experience: job.experience || '0 years', location: job.location || '',
      employmentType: job.employmentType || 'Full time',
      qualification: job.qualification || 'Any qualification', salaryRange: job.salaryRange || 'Not disclosed', applicationDeadline: job.applicationDeadline || ''
    });
    setShowForm(true);
    setView('jobs');
  }

  async function saveJob(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    try {
      await api(editingId ? `/api/jobs/${editingId}` : '/api/jobs', {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify({ ...form, applicationDeadline: form.applicationDeadline || null })
      });
      setNotice(editingId ? 'Job posting updated.' : 'Job posted successfully.');
      setEditingId(null);
      setForm(emptyJobForm());
      setShowForm(false);
      await loadJobs();
      setStats(await api('/api/analytics/recruiter'));
    } catch (e) {
      setError(e.message);
    }
  }

  async function toggleJob(job) {
    try {
      await api(`/api/jobs/${job.id}/status?active=${!job.active}`, { method: 'PATCH' });
      await loadJobs();
    } catch (e) { setError(e.message); }
  }

  async function downloadApplicantResume(application) {
    try {
      const response = await fetch(`${API_URL}/api/applications/${application.id}/resume`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('smarthire_token')}` }
      });
      if (!response.ok) throw new Error('Could not download this resume.');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a'); link.href = url; link.download = `${application.candidateName}-resume.pdf`; link.click();
      URL.revokeObjectURL(url);
    } catch (e) { setError(e.message); }
  }

  async function openApplicantDetails(application) {
    setSelectedApplicant(application);
    setSelectedApplicantPhotoUrl('');
    if (!application.candidatePhotoAttached) return;
    try {
      const response = await fetch(`${API_URL}/api/applications/${application.id}/candidate-photo`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('smarthire_token')}` }
      });
      if (!response.ok) throw new Error('Could not load the candidate photo.');
      setSelectedApplicantPhotoUrl(URL.createObjectURL(await response.blob()));
    } catch (e) { setError(e.message); }
  }

  function closeApplicantDetails() {
    if (selectedApplicantPhotoUrl) URL.revokeObjectURL(selectedApplicantPhotoUrl);
    setSelectedApplicantPhotoUrl('');
    setSelectedApplicant(null);
  }

  async function deleteJob(job) {
    if (!window.confirm(`Delete "${job.title}"?`)) return;
    setError(''); setNotice('');
    try {
      await api(`/api/jobs/${job.id}`, { method: 'DELETE' });
      setJobs((current) => current.filter((item) => item.id !== job.id));
      setSelectedJobIds((current) => { const next = new Set(current); next.delete(job.id); return next; });
      setNotice('Job posting deleted.');
      setStats(await api('/api/analytics/recruiter'));
    } catch (e) { setError(e.message); }
  }

  function toggleJobSelection(jobId) {
    setSelectedJobIds((current) => {
      const next = new Set(current);
      if (next.has(jobId)) next.delete(jobId); else next.add(jobId);
      return next;
    });
  }

  function selectAllJobs() {
    setSelectedJobIds((current) => current.size === jobs.length ? new Set() : new Set(jobs.map((job) => job.id)));
  }

  async function deleteSelectedJobs() {
    if (!selectedJobIds.size || !window.confirm(`Delete ${selectedJobIds.size} selected job posting${selectedJobIds.size === 1 ? '' : 's'}?`)) return;
    setDeletingJobs(true); setError(''); setNotice('');
    const ids = [...selectedJobIds];
    const results = await Promise.allSettled(ids.map((id) => api(`/api/jobs/${id}`, { method: 'DELETE' })));
    const failed = results.filter((result) => result.status === 'rejected');
    const deletedIds = ids.filter((_, index) => results[index].status === 'fulfilled');
    setJobs((current) => current.filter((job) => !deletedIds.includes(job.id)));
    setSelectedJobIds(new Set());
    if (failed.length) setError(`${failed.length} selected job posting${failed.length === 1 ? '' : 's'} could not be deleted. Refresh and try again.`);
    else setNotice(`${deletedIds.length} job posting${deletedIds.length === 1 ? '' : 's'} deleted successfully.`);
    try { setStats(await api('/api/analytics/recruiter')); } catch {}
    finally { setDeletingJobs(false); }
  }

  async function changeApplicationStatus(applicationId, status) {
    try {
      await api(`/api/applications/${applicationId}/status?status=${status}`, { method: 'PATCH' });
      setApplications(await api(`/api/applications/job/${selectedJob.id}`));
      setError('');
      setWarning('');
      setNotice(status === 'SHORTLISTED' ? 'Candidate shortlisted.' : 'Applicant status updated.');
    } catch (e) { setError(e.message); }
  }

  async function screenApplicants() {
    if (!selectedJob) return;
    setScreeningLoading(true);
    setError('');
    setWarning('');
    setNotice('');
    try {
      const results = await api(`/api/applications/job/${selectedJob.id}/screen`, { method: 'POST' });
      setScreeningResults(results);
      setApplications((current) => current.map((application) => {
        const screening = results.find((result) => result.applicationId === application.id);
        return screening ? { ...application, status: screening.status } : application;
      }));
      const topCandidates = results.filter((result) => result.topRanked);
      const emailFailures = topCandidates.filter((result) => !result.emailSent);
      setNotice(topCandidates.length
        ? `AI screening complete. Automatically shortlisted ${topCandidates.length} top-scoring applicant${topCandidates.length === 1 ? '' : 's'}.`
        : 'AI screening complete. No applicant had enough information to receive a score.');
      setWarning(emailFailures.length
        ? emailFailures[0].emailMessage || 'The top-scoring applicant was shortlisted, but the email could not be sent.'
        : '');
    } catch (e) { setError(e.message); }
    finally { setScreeningLoading(false); }
  }

  function openInterviewScheduler(application) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    setScheduleApplication(application);
    setScheduleForm({
      scheduledAt: application.interviewScheduledAt?.slice(0, 16) || `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}T${String(tomorrow.getHours()).padStart(2, '0')}:${String(tomorrow.getMinutes()).padStart(2, '0')}`,
      timeZone: application.interviewTimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      details: application.interviewDetails || '',
      message: ''
    });
    setScheduleError('');
    setError('');
    setWarning('');
    setNotice('');
  }

  async function submitInterviewSchedule(event) {
    event.preventDefault();
    if (!scheduleApplication) return;
    setScheduling(true);
    setScheduleError('');
    setNotice('');
    try {
      const scheduleResult = await api(`/api/applications/${scheduleApplication.id}/schedule-interview`, {
        method: 'POST',
        body: JSON.stringify(scheduleForm)
      });
      const updatedApplication = scheduleResult.application;
      setApplications((current) => current.map((application) =>
        application.id === updatedApplication.id ? updatedApplication : application));
      setScheduleApplication(null);
      setNotice(scheduleResult.emailSent
        ? `Interview invitation sent to ${updatedApplication.candidateEmail}.`
        : 'Interview schedule saved and candidate shortlisted.');
      setError('');
      setWarning(scheduleResult.emailSent ? '' : scheduleResult.emailMessage);
    } catch (e) { setScheduleError(e.message); }
    finally { setScheduling(false); }
  }

  const logout = () => {
    localStorage.clear();
    window.location.href = '/';
  };
  const screeningByApplicationId = new Map(screeningResults.map((result) => [result.applicationId, result]));
  const rankedApplications = screeningResults.length
    ? [...applications].sort((a, b) => {
        const scoreA = screeningByApplicationId.get(a.id)?.matchScore;
        const scoreB = screeningByApplicationId.get(b.id)?.matchScore;
        return (scoreB ?? -1) - (scoreA ?? -1);
      })
    : applications;

  return (
    <main className="dashboard recruiter-layout">
      <aside className="dashboard-sidebar">
        <strong className="brand">SmartHire</strong>
        <nav>
          <button className={view === 'overview' ? 'active' : ''} onClick={() => setView('overview')}>Overview</button>
          <button className={view === 'jobs' ? 'active' : ''} onClick={() => { setView('jobs'); setShowForm(false); }}>Manage jobs</button>
          <button onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyJobForm()); setView('jobs'); }}>Post a job</button>
          <Link to="/recruiter/profile">My profile</Link>
          <Link to="/account/password">Change password</Link>
        </nav>
        <div className="sidebar-account">
          <span>Signed in as</span>
          <strong>{user.name || user.email || 'Recruiter'}</strong>
          <small>Recruiter</small>
        </div>
        <button className="signout-button" onClick={logout}>Sign out</button>
      </aside>
      <section className="dashboard-main recruiter-main">
        <header>
          <div>
            <p>Recruiter workspace</p>
            <h1>{view === 'applicants' ? `Applicants · ${selectedJob?.title || ''}` : view === 'jobs' ? 'Manage job postings' : 'Overview'}</h1>
          </div>
          <div className="avatar">{user.name?.[0] || 'R'}</div>
        </header>
        {error && <div className="notice error-notice" role="alert">{error}</div>}
        {warning && <div className="notice warning-notice" role="status">{warning}</div>}
        {notice && <div className={`notice ${warning ? 'warning-notice' : 'success-notice'}`} role="status">{notice}</div>}

        {view === 'overview' && <>
          <div className="stat-grid">
            {[
              ['Your job postings', stats.totalJobs ?? 0],
              ['Applications received', stats.totalApplications ?? 0],
              ['Shortlisted', stats.shortlistedCandidates ?? 0],
              ['Rejected', stats.rejectedCandidates ?? 0]
            ].map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}
          </div>
          <section className="panel">
            <div className="section-heading"><h2>Recent job postings</h2><button className="text-button" onClick={() => setView('jobs')}>View all</button></div>
            {jobs.length ? jobs.slice(0, 5).map((job) => (
              <JobRow key={job.id} job={job} onApplicants={openApplicants} onEdit={startEdit} onToggle={toggleJob} onDelete={deleteJob} />
            )) : <p className="empty-state">You haven’t posted any jobs yet. Create your first job posting to get started.</p>}
          </section>
        </>}

        {view === 'jobs' && <>
          <div className="section-heading page-actions">
            <p>Review and update your openings and applicants.</p>
            {!showForm && <button className="primary-button compact-button" onClick={() => { setEditingId(null); setForm(emptyJobForm()); setShowForm(true); }}>+ Post a job</button>}
          </div>
          {showForm && <form className="panel job-form recruiter-posting-form" onSubmit={saveJob}>
            <div className="posting-form-heading"><div><p className="eyebrow">OPENING DETAILS</p><h2>{editingId ? 'Edit job posting' : 'Create a job posting'}</h2><p>Clear fields help candidates find and match with your role.</p></div><span className="posting-form-badge">{editingId ? 'Editing' : 'New opening'}</span></div>
            <div className="form-grid">
              <label>Job title<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Java Full Stack Developer" required /></label>
              <label>Job location<input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="City, state, country or Remote" /></label>
              <div className="location-action-field job-location-action"><span>Live location</span><button type="button" className="secondary-button compact-button" onClick={useCurrentJobLocation} disabled={locationLoading}>{locationLoading ? 'Finding location…' : 'Use my current location'}</button><small>Your browser asks permission before sharing the location.</small></div>
              <label>Employment type<select value={form.employmentType} onChange={e=>setForm({...form,employmentType:e.target.value})}><option>Full time</option><option>Part time</option><option>Contract</option><option>Internship</option><option>Freelance</option></select></label>
              <label>Experience level<input value={form.experience} onChange={e=>setForm({...form,experience:e.target.value})} placeholder="e.g. 2–4 years" /></label>
              <label className="experience-option-field">Experience level<select value={form.experience} onChange={e=>setForm({...form,experience:e.target.value})}><option>0 years</option><option>1 year</option><option>2 years</option><option>3 years</option><option>4 to 6 years</option><option>7+ years</option></select></label>
              <label>Required skills<input value={form.requiredSkills} onChange={e=>setForm({...form,requiredSkills:e.target.value})} placeholder="Java, Spring Boot, SQL" /></label>
              <label>Qualifications<select value={form.qualification} onChange={e=>setForm({...form,qualification:e.target.value})}><option>Any qualification</option><option>10th / High school</option><option>Diploma</option><option>ITI</option><option>BCA</option><option>B.Sc</option><option>B.Tech / BE</option><option>MCA</option><option>M.Tech / ME</option><option>MBA</option><option>Any bachelor’s degree</option><option>Any master’s degree</option></select></label>
              <label>Salary range<select value={form.salaryRange} onChange={e=>setForm({...form,salaryRange:e.target.value})}><option>Not disclosed</option><option>₹2–3 LPA</option><option>₹3–5 LPA</option><option>₹5–8 LPA</option><option>₹8–12 LPA</option><option>₹12–18 LPA</option><option>₹18+ LPA</option><option>Hourly / negotiable</option></select></label>
              <label>Application deadline<input type="date" value={form.applicationDeadline} onChange={e=>setForm({...form,applicationDeadline:e.target.value})} /></label>
              <label className="full-width">Job description<textarea rows="5" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Describe responsibilities, the role, and what candidates will work on." required /></label>
            </div>
            <div className="form-actions">
              <button className="primary-button compact-button" type="submit">{editingId ? 'Save job changes' : 'Publish opening'}</button>
              <button className="secondary-button compact-button" type="button" onClick={()=>{setShowForm(false);setEditingId(null);setForm(emptyJobForm());}}>Cancel</button>
            </div>
          </form>}
          <section className="panel recruiter-job-list">
            <div className="recruiter-job-list-heading"><div><h2>Your postings <span className="count-badge">{jobs.length}</span></h2><p>Select openings to delete multiple postings at once.</p></div>{jobs.length > 0 && <div className="bulk-job-actions"><select className="bulk-job-picker" multiple value={[...selectedJobIds].map(String)} onChange={event => setSelectedJobIds(new Set([...event.target.selectedOptions].map((option) => Number(option.value))))} aria-label="Select job postings to delete">{jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}</select><button type="button" className="secondary-button compact-button" onClick={selectAllJobs}>{selectedJobIds.size === jobs.length ? 'Clear selection' : 'Select all'}</button><button type="button" className="danger-button compact-button" disabled={!selectedJobIds.size || deletingJobs} onClick={deleteSelectedJobs}>{deletingJobs ? 'Deleting…' : `Delete selected${selectedJobIds.size ? ` (${selectedJobIds.size})` : ''}`}</button></div>}</div>
            {jobs.length ? jobs.map((job) => <JobRow key={job.id} job={job} onApplicants={openApplicants} onEdit={startEdit} onToggle={toggleJob} onDelete={deleteJob} />) : <p className="empty-state">No job postings yet. Use “Post a job” to add your first opening.</p>}
          </section>
        </>}

        {view === 'applicants' && <section className="panel">
          <div className="section-heading applicant-screening-heading">
            <div><h2>Applicants <span className="count-badge">{applications.length}</span></h2><p className="muted-copy">AI screening automatically shortlists and emails the highest-scoring applicant(s); HR can schedule interview times afterward.</p></div>
            <div className="applicant-screening-actions">
              <button className="primary-button compact-button" disabled={!applications.length || screeningLoading} onClick={screenApplicants}>{screeningLoading ? 'Screening resumes…' : screeningResults.length ? 'Run screening again' : 'Screen, shortlist & email top match'}</button>
              <button className="text-button" onClick={()=>setView('jobs')}>Back to jobs</button>
            </div>
          </div>
          {screeningResults.length > 0 && <p className="screening-advisory">AI scores are recommendations, not hiring decisions. Applicants with unreadable resumes or insufficient profile details are flagged for manual review.</p>}
          {applications.length ? <div className="applicant-list">{rankedApplications.map((application) => {
            const screening = screeningByApplicationId.get(application.id);
            return (
            <article className="applicant-row" key={application.id}>
              <div className="applicant-details"><strong>{application.candidateName}</strong><p>{application.candidateEmail}</p><small>{application.candidateSkills || 'No skills listed'} · Applied {new Date(application.appliedAt).toLocaleDateString()}</small><p className="application-note">{application.method === 'WITH_RESUME' ? 'Applied with resume' : 'Applied manually'}{application.coverLetter ? ` · ${application.coverLetter}` : ''}</p>
                {screening && <div className="applicant-screening-result">
                  <strong>{screening.matchScore == null ? 'Match score unavailable' : `${screening.matchScore}% job match`}</strong>
                  <span>Based on: {screening.screeningBasis}</span>
                  <span><b>Matched skills:</b> {displayScreeningItems(screening.matchingSkills) || 'No matching required skills identified'}</span>
                  <span><b>Missing skills:</b> {displayScreeningItems(screening.missingSkills) || 'No missing required skills identified'}</span>
                  {screening.recommendations && <span><b>Recommendation:</b> {screening.recommendations}</span>}
                  {screening.topRanked && <span className="top-ranked-notice"><b>Top score:</b> {screening.emailSent ? 'shortlisted email sent' : `shortlisted; ${screening.emailMessage || 'email not sent'}`}</span>}
                </div>}
                {application.interviewScheduledAt && <p className="scheduled-interview-note"><strong>Interview scheduled</strong><span>{application.interviewScheduledAt.replace('T', ' ')} ({application.interviewTimeZone})</span><span>{application.interviewDetails}</span></p>}
              </div>
              <div className="applicant-controls">
                <button className="text-button" onClick={()=>openApplicantDetails(application)}>View profile</button>
                {application.resumeAttached && <button className="text-button" onClick={()=>downloadApplicantResume(application)}>Download resume</button>}
                {screening?.matchScore != null && application.status !== 'SHORTLISTED' && <button className="text-button" onClick={()=>changeApplicationStatus(application.id,'SHORTLISTED')}>Shortlist</button>}
                <select aria-label={`Status for ${application.candidateName}`} value={application.status} onChange={e=>changeApplicationStatus(application.id,e.target.value)}>
                  <option value="APPLIED">Applied</option><option value="UNDER_REVIEW">Under review</option><option value="SHORTLISTED">Shortlisted</option><option value="REJECTED">Rejected</option><option value="SELECTED">Selected</option>
                </select>
                {application.status === 'SHORTLISTED' && <button className="text-button schedule-interview-action" onClick={()=>openInterviewScheduler(application)}>{application.interviewScheduledAt ? 'Reschedule & send email' : 'Schedule interview'}</button>}
              </div>
            </article>
          );})}</div> : <p className="empty-state">No applications received for this job yet.</p>}
        </section>}
      </section>
      {scheduleApplication && <div className="modal-backdrop" role="presentation" onClick={(event)=>{if(event.target===event.currentTarget && !scheduling)setScheduleApplication(null);}}>
        <form className="apply-modal interview-schedule-modal" role="dialog" aria-modal="true" aria-labelledby="schedule-interview-title" onSubmit={submitInterviewSchedule}>
          <button type="button" className="modal-close" aria-label="Close" disabled={scheduling} onClick={()=>setScheduleApplication(null)}>×</button>
          <p className="eyebrow">SHORTLISTED CANDIDATE</p>
          <h2 id="schedule-interview-title">{scheduleApplication.interviewScheduledAt ? 'Reschedule interview' : 'Schedule an interview'}</h2>
          <p className="muted-copy">This saves the interview details and shortlists the candidate. If SMTP is configured, an invitation will also be emailed to <strong>{scheduleApplication.candidateEmail}</strong>.</p>
          {scheduleError && <p className="notice error-notice schedule-error" role="alert">{scheduleError}</p>}
          <label className="schedule-form-field">Date and time<input type="datetime-local" value={scheduleForm.scheduledAt} onChange={e=>setScheduleForm({...scheduleForm,scheduledAt:e.target.value})} required /></label>
          <label className="schedule-form-field">Time zone<input value={scheduleForm.timeZone} onChange={e=>setScheduleForm({...scheduleForm,timeZone:e.target.value})} placeholder="e.g. Asia/Kolkata" required /></label>
          <label className="schedule-form-field">Meeting location or link<textarea rows="2" value={scheduleForm.details} onChange={e=>setScheduleForm({...scheduleForm,details:e.target.value})} placeholder="Office address, video meeting link, or phone details" maxLength="1000" required /></label>
          <label className="schedule-form-field">Message to candidate <span className="optional-label">Optional</span><textarea rows="3" value={scheduleForm.message} onChange={e=>setScheduleForm({...scheduleForm,message:e.target.value})} placeholder="Add any preparation details or a note" maxLength="2000" /></label>
          <div className="form-actions"><button className="primary-button compact-button" disabled={scheduling}>{scheduling ? 'Sending invitation…' : 'Send interview invitation'}</button><button type="button" className="secondary-button compact-button" disabled={scheduling} onClick={()=>setScheduleApplication(null)}>Cancel</button></div>
        </form>
      </div>}
      {selectedApplicant && <div className="modal-backdrop" role="presentation" onClick={(event)=>{if(event.target===event.currentTarget)closeApplicantDetails();}}>
        <section className="apply-modal applicant-profile-modal" role="dialog" aria-modal="true" aria-labelledby="candidate-profile-title">
          <button type="button" className="modal-close" aria-label="Close" onClick={closeApplicantDetails}>×</button>
          <p className="eyebrow">CANDIDATE PROFILE</p>
          <div className="candidate-profile-heading"><div className="profile-photo-preview">{selectedApplicantPhotoUrl ? <img src={selectedApplicantPhotoUrl} alt={`${selectedApplicant.candidateName} profile`} /> : <span>{selectedApplicant.candidateName?.[0] || 'C'}</span>}</div><div><h2 id="candidate-profile-title">{selectedApplicant.candidateName}</h2><p>{selectedApplicant.candidateEmail}</p></div></div>
          <div className="candidate-profile-details">
            <p><b>Phone:</b> {selectedApplicant.candidatePhone || 'Not provided'}</p><p><b>Location:</b> {selectedApplicant.candidateLocation || 'Not provided'}</p><p><b>Education:</b> {selectedApplicant.candidateEducation || 'Not provided'}</p><p><b>Skills:</b> {selectedApplicant.candidateSkills || 'Not provided'}</p><p><b>Experience:</b> {selectedApplicant.candidateExperience || 'Not provided'}</p><p><b>Professional summary:</b> {selectedApplicant.candidateProfessionalSummary || 'Not provided'}</p>
          </div>
          <div className="form-actions">{selectedApplicant.resumeAttached && <button className="secondary-button compact-button" onClick={()=>downloadApplicantResume(selectedApplicant)}>Download resume</button>}<button className="primary-button compact-button" onClick={closeApplicantDetails}>Close</button></div>
        </section>
      </div>}
    </main>
  );
}

function JobRow({ job, selected = false, onSelect, onApplicants, onEdit, onToggle, onDelete }) {
  return (
    <article className={`managed-job-row${selected ? ' selected' : ''}`}>
      {onSelect && <label className="job-select-control"><input type="checkbox" checked={selected} onChange={() => onSelect(job.id)} aria-label={`Select ${job.title}`} /><span>Select</span></label>}
      <div className="managed-job-info">
        <strong>{job.title}</strong>
        <p>{job.location || 'Location not specified'} · {job.employmentType || 'Employment type not specified'} · {job.experience || 'Experience not specified'}</p>
        <span className={job.active ? 'status-pill active-pill' : 'status-pill inactive-pill'}>{job.active ? 'Active' : 'Inactive'}</span>
      </div>
      <div className="job-actions">
        <button className="text-button" onClick={() => onApplicants(job)}>Applicants</button>
        <button className="text-button" onClick={() => onEdit(job)}>Edit</button>
        <button className="text-button" onClick={() => onToggle(job)}>{job.active ? 'Deactivate' : 'Activate'}</button>
        <button className="text-button delete-action" onClick={() => onDelete(job)}>Delete</button>
      </div>
    </article>
  );
}

function Protected({ role, children }) {
  const user=JSON.parse(localStorage.getItem('smarthire_user')||'null');
  if(!localStorage.getItem('smarthire_token')||!user) return <Navigate to="/login" replace />;
  return user.role===role?children:<Navigate to="/login?reason=role" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/account/password" element={<ChangePasswordPage />} />
        <Route path="/candidate" element={
          <Protected role="CANDIDATE"><CandidateWorkspace /></Protected>
        } />
        <Route path="/candidate/jobs" element={
          <Protected role="CANDIDATE"><CandidateWorkspace initialView="jobs" /></Protected>
        } />
        <Route path="/candidate/profile" element={<Protected role="CANDIDATE"><CandidateWorkspace initialView="profile" /></Protected>} />
        <Route path="/candidate/resume" element={<Protected role="CANDIDATE"><CandidateWorkspace initialView="resume" /></Protected>} />
        <Route path="/candidate/applications" element={<Protected role="CANDIDATE"><CandidateWorkspace initialView="applications" /></Protected>} />
        <Route path="/candidate/ai/job-matching" element={<Protected role="CANDIDATE"><CandidateWorkspace initialView="matching" /></Protected>} />
        <Route path="/candidate/interview-prep" element={<Protected role="CANDIDATE"><CandidateWorkspace initialView="questions" /></Protected>} />
        <Route path="/candidate/resume-improvement" element={<Protected role="CANDIDATE"><CandidateWorkspace initialView="improve" /></Protected>} />
        <Route path="/candidate/mock-interviews" element={<Protected role="CANDIDATE"><CandidateWorkspace initialView="mock" /></Protected>} />
        <Route path="/candidate/interview-history" element={<Protected role="CANDIDATE"><CandidateWorkspace initialView="history" /></Protected>} />
        <Route path="/recruiter" element={
          <Protected role="RECRUITER"><RecruiterWorkspace /></Protected>
        } />
        <Route path="/recruiter/jobs" element={
          <Protected role="RECRUITER"><RecruiterWorkspace initialView="jobs" /></Protected>
        } />
        <Route path="/recruiter/applicants" element={
          <Protected role="RECRUITER"><RecruiterWorkspace initialView="jobs" /></Protected>
        } />
        <Route path="/recruiter/profile" element={<Protected role="RECRUITER"><RecruiterProfilePage /></Protected>} />
        <Route path="/admin" element={
          <Protected role="ADMIN"><Dashboard role="ADMIN" /></Protected>
        } />
        <Route path="/admin/users" element={
          <Protected role="ADMIN"><Dashboard role="ADMIN" /></Protected>
        } />
        <Route path="*" element={<Placeholder title="Page not found" />} />
      </Routes>
    </BrowserRouter>
  );
}
