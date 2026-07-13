'use client';

import { createClient, type User } from '@supabase/supabase-js';
import { FormEvent, useEffect, useMemo, useState } from 'react';

export default function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase() ?? '';
  const supabase = useMemo(() => url && key ? createClient(url, key) : null, [url, key]);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return setMessage('Supabase 환경변수가 설정되지 않았습니다.');
    setBusy(true);
    setMessage('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage('이메일 또는 비밀번호를 확인해 주세요.');
    else if (data.user.email?.toLowerCase() !== adminEmail) {
      await supabase.auth.signOut();
      setMessage('관리자 계정만 로그인할 수 있습니다.');
    } else setMessage('로그인되었습니다.');
    setBusy(false);
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setMessage('로그아웃되었습니다.');
  }

  const isAdmin = user?.email?.toLowerCase() === adminEmail;

  return <main className="wrap section">
    <div className="eyebrow">ADMIN</div>
    <h1>관리자</h1>
    <p className="sub">Supabase에 등록된 관리자 계정으로 로그인합니다.</p>
    {message && <p className="card">{message}</p>}
    <div className="grid">
      {isAdmin ? <section className="card">
        <h2>로그인 정보</h2>
        <p>{user.email}</p>
        <button className="btn" onClick={signOut}>로그아웃</button>
      </section> : <section className="card">
        <h2>로그인</h2>
        <form className="admin-form" onSubmit={signIn}>
          <label>이메일<input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} autoComplete="email" /></label>
          <label>비밀번호<input type="password" required minLength={6} value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="current-password" /></label>
          <button className="btn" disabled={busy}>{busy?'확인 중...':'로그인'}</button>
        </form>
      </section>}
      <section className="card">
        <h2>데이터 관리</h2>
        <p className="muted">경기 입력·수정 폼은 다음 단계에서 Supabase 테이블과 연결합니다.</p>
      </section>
    </div>
  </main>;
}
