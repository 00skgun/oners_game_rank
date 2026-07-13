import Link from "next/link";

export default function Home() {
  return <main>
    <section className="hero">
      <div className="wrap">
        <div className="eyebrow">2026 ESPORTS COMPETITION</div>
        <h1>ONERS CUP</h1>
        <p className="sub">FC Online과 League of Legends 대회 순위 및 경기 결과</p>
      </div>
    </section>

    <section className="wrap section">
      <h2>대회 종목</h2>
      <div className="grid">
        <Link className="card" href="/fc-online">
          <div className="eyebrow">FC ONLINE</div>
          <h3>조별예선 · 토너먼트</h3>
          <p className="muted">A–D조 각 조 상위 2명이 8강에 진출합니다.</p>
        </Link>

        <Link className="card" href="/lol">
          <div className="eyebrow">LEAGUE OF LEGENDS</div>
          <h3>4팀 풀리그</h3>
          <p className="muted">각 팀이 한 경기씩 치른 뒤 1·2위는 결승, 3·4위는 순위 결정전을 진행합니다.</p>
        </Link>
      </div>
    </section>
  </main>;
}
