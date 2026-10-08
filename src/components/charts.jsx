import { CUR, addMonth, mName, mShort } from '../lib/dates.js';
import { inr, inrC } from '../lib/format.js';
import { monthItems, stats, tier } from '../lib/calc.js';
import { niceMax, ticks } from '../lib/chart.js';
import { useChart } from './useChart.js';

const GRID = '#E3E7E0';

function Grid({ P, W, TN, yOf, valueAt }) {
  return Array.from({ length: TN + 1 }, (_, i) => {
    const v = valueAt(i);
    const yy = yOf(v);
    return (
      <g key={i}>
        <line x1={P.l} x2={W - P.r} y1={yy} y2={yy} stroke={GRID} strokeWidth="1" />
        <text className="axis" x={P.l - 6} y={yy + 3.5} textAnchor="end">{inrC(v)}</text>
      </g>
    );
  });
}

function Bar({ x, y, w, h, fill, op, round }) {
  if (h <= 0) return null;
  if (!round) return <rect x={x} y={y} width={w} height={h} fill={fill} opacity={op} />;
  const r = Math.min(4, h, w / 2);
  return <path d={`M${x} ${y + h}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h}Z`} fill={fill} opacity={op} />;
}

const TipBox = ({ tip }) => (
  <div className="tip" hidden={!tip} style={tip ? { left: tip.left, top: tip.top } : undefined}>{tip && tip.content}</div>
);

/** Last 6 months: spent (+ projected for the current month) vs budget. Tap a bar to jump to that month. */
export function SixMonthChart({ data, month, onPickMonth }) {
  const { boxRef, svgRef, W, tip, track, hide } = useChart();
  const H = 210;
  const P = { l: 42, r: 8, t: 12, b: 44 };
  const ks = [];
  for (let i = 5; i >= 0; i--) {
    const k = addMonth(month, -i);
    if (k >= data.settings.startMonth && k <= CUR) ks.push(k);
  }
  const ss = ks.map((k) => stats(data, k));
  const ymax = niceMax(Math.max(...ss.map((s) => Math.max(s.isCur ? s.projected : s.spent, s.budget))) * 1.05);
  const iw = W - P.l - P.r;
  const ih = H - P.t - P.b;
  const band = iw / Math.max(ks.length, 1);
  const bw = Math.min(40, band * 0.46);
  const y = (v) => P.t + ih - (v / ymax) * ih;
  const idx = (x) => {
    const i = Math.floor((x - P.l) / band);
    return i >= 0 && i < ss.length ? i : -1;
  };
  const getTip = (x) => {
    const i = idx(x);
    if (i < 0) return null;
    const s = ss[i];
    return {
      x: P.l + band * i + band / 2,
      y: y(Math.max(s.isCur ? s.projected : s.spent, s.budget)) - 6,
      content: (
        <>
          <b>{mName(s.k)}</b><br />Kharcha {inr(s.spent)}
          {s.isCur && <><br />Anumaan {inr(s.projected)}</>}
          <br />Budget {inr(s.budget)}<br />Bachat {inr(s.isCur ? s.projSaved : s.saved)} · Health {Math.round(s.health * 100)}
        </>
      ),
    };
  };
  const move = track(getTip);
  const TN = ticks(ymax);
  return (
    <div className="chartbox" ref={boxRef}>
      <div className="ttl">
        <span>Pichle 6 mahine</span>
        <span className="legend">
          <span><i style={{ background: 'var(--s1)' }}></i>Kharcha</span>
          <span><i style={{ background: '#A9C8F0' }}></i>Anumaan</span>
          <span><i className="dash"></i>Budget</span>
        </span>
      </div>
      <TipBox tip={tip} />
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width={W} height={H} onPointerMove={move} onPointerDown={move} onPointerLeave={hide}
        onClick={(ev) => {
          const i = idx(ev.clientX - svgRef.current.getBoundingClientRect().left);
          if (i >= 0 && ss[i].k !== month) onPickMonth(ss[i].k);
        }}>
        <Grid P={P} W={W} TN={TN} yOf={y} valueAt={(i) => (ymax * i) / TN} />
        {ss.map((s, i) => {
          const cx = P.l + band * i + band / 2;
          const x = cx - bw / 2;
          const sel = s.k === month;
          const op = sel ? 1 : 0.62;
          const ys = y(s.spent);
          const base = y(0);
          const yb = y(s.budget);
          const T = tier(s.health);
          return (
            <g key={s.k}>
              {s.isCur && s.projected > s.spent ? (
                <>
                  <Bar x={x} y={y(s.projected)} w={bw} h={Math.max(0, ys - y(s.projected) - 2)} fill="#A9C8F0" op={op} round />
                  <Bar x={x} y={ys} w={bw} h={base - ys} fill="var(--s1)" op={op} />
                </>
              ) : (
                <Bar x={x} y={ys} w={bw} h={base - ys} fill="var(--s1)" op={op} round />
              )}
              <line x1={cx - band * 0.42} x2={cx + band * 0.42} y1={yb} y2={yb} stroke="#78827B" strokeWidth="1.5" strokeDasharray="4 3" />
              <text className="axis" x={cx} y={H - P.b + 15} textAnchor="middle" style={{ fontWeight: sel ? 800 : 500, fill: sel ? 'var(--ink)' : 'var(--muted)' }}>{mShort(s.k)}</text>
              <circle cx={cx - 11} cy={H - P.b + 29} r="4" fill={T.c} />
              <text className="axis" x={cx - 4} y={H - P.b + 32.5} style={{ fill: 'var(--ink2)' }}>{Math.round(s.health * 100)}</text>
            </g>
          );
        })}
        <line x1={P.l} x2={W - P.r} y1={y(0)} y2={y(0)} stroke="#C9CFC8" />
        <rect x={P.l} y="0" width={iw} height={H} fill="transparent" style={{ cursor: 'pointer' }} />
      </svg>
    </div>
  );
}

/** Cumulative spend through the month, with the projected tail for the current month. */
export function DailyChart({ data, s }) {
  const { boxRef, svgRef, W, tip, track, hide } = useChart();
  const H = 200;
  const P = { l: 42, r: 12, t: 14, b: 24 };
  const perDay = new Array(s.D + 1).fill(0);
  monthItems(data, s.k).filter((i) => i.t === 'e').forEach((i) => (perDay[+i.d.slice(8)] += i.a));
  const act = [0];
  for (let d = 1; d <= s.dayNow; d++) act[d] = act[d - 1] + perDay[d];
  const proj = [];
  if (s.isCur) {
    proj[s.dayNow] = act[s.dayNow];
    const rec = {};
    data.settings.recurring.forEach((r) => {
      const d = Math.min(r.day, s.D);
      if (d > s.dayNow) rec[d] = (rec[d] || 0) + r.a;
    });
    for (let d = s.dayNow + 1; d <= s.D; d++) proj[d] = proj[d - 1] + s.pace + (rec[d] || 0);
  }
  const ymax = niceMax(Math.max(s.budget, act[s.dayNow], proj[s.D] || 0) * 1.06);
  const iw = W - P.l - P.r;
  const ih = H - P.t - P.b;
  const x = (d) => P.l + ((d - 1) / (s.D - 1)) * iw;
  const y = (v) => P.t + ih - (v / ymax) * ih;
  const yb = y(s.budget);
  const TN = ticks(ymax);
  let pa = 'M' + x(1) + ' ' + y(act[1]);
  for (let d = 2; d <= s.dayNow; d++) pa += 'L' + x(d) + ' ' + y(act[d]);
  let pp = '';
  if (s.isCur && s.D > s.dayNow) {
    pp = 'M' + x(s.dayNow) + ' ' + y(proj[s.dayNow]);
    for (let d = s.dayNow + 1; d <= s.D; d++) pp += 'L' + x(d) + ' ' + y(proj[d]);
  }
  const getTip = (px) => {
    const d = Math.round(((px - P.l) / iw) * (s.D - 1)) + 1;
    if (d < 1 || d > s.D) return null;
    const isA = d <= s.dayNow;
    const v = isA ? act[d] : proj[d];
    if (v == null) return null;
    return { x: x(d), y: y(v) - 8, cross: x(d), content: <><b>{d} {mShort(s.k)}</b><br />{isA ? 'Ab tak ' : 'Anumaan '}{inr(v)}</> };
  };
  const move = track(getTip);
  return (
    <div className="chartbox" ref={boxRef}>
      <div className="ttl">
        <span>Mahine ka total kharcha, din-ba-din</span>
        <span className="legend">
          <span><i style={{ background: 'var(--s1)' }}></i>Asli</span>
          {s.isCur && <span><i className="dash" style={{ borderTopColor: 'var(--s1)' }}></i>Anumaan</span>}
          <span><i className="dash"></i>Budget</span>
        </span>
      </div>
      <TipBox tip={tip} />
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width={W} height={H} onPointerMove={move} onPointerDown={move} onPointerLeave={hide}>
        <Grid P={P} W={W} TN={TN} yOf={y} valueAt={(i) => (ymax * i) / TN} />
        {[1, 8, 15, 22, s.D].map((d) => <text key={d} className="axis" x={x(d)} y={H - 6} textAnchor="middle">{d}</text>)}
        <line x1={P.l} x2={W - P.r} y1={yb} y2={yb} stroke="#78827B" strokeWidth="1.5" strokeDasharray="5 4" />
        <text className="axis" x={P.l + 4} y={yb - 5} style={{ fill: 'var(--ink2)', fontWeight: 700 }}>Budget {inrC(s.budget)}</text>
        <path d={`${pa}L${x(s.dayNow)} ${y(0)}L${x(1)} ${y(0)}Z`} fill="var(--s1)" opacity=".1" />
        <path d={pa} fill="none" stroke="var(--s1)" strokeWidth="2.2" strokeLinejoin="round" />
        {pp && (
          <>
            <path d={pp} fill="none" stroke="var(--s1)" strokeWidth="2" strokeDasharray="5 4" opacity=".75" />
            <circle cx={x(s.D)} cy={y(proj[s.D])} r="4" fill="#fff" stroke="var(--s1)" strokeWidth="2" />
          </>
        )}
        <circle cx={x(s.dayNow)} cy={y(act[s.dayNow])} r="4.5" fill="var(--s1)" stroke="#fff" strokeWidth="2" />
        <line x1={tip ? tip.cross : 0} x2={tip ? tip.cross : 0} y1={P.t} y2={H - P.b} stroke="#78827B" strokeWidth="1" opacity={tip ? 0.5 : 0} />
      </svg>
    </div>
  );
}

/** Cumulative 12-month savings at the current pace vs the goal line. */
export function SavingsChart({ series, goal }) {
  const { boxRef, svgRef, W, tip, track, hide } = useChart();
  const H = 190;
  const P = { l: 46, r: 14, t: 14, b: 24 };
  const goals = series.map((_, i) => goal * (i + 1));
  const lo = Math.min(0, ...series);
  const hi = niceMax(Math.max(...series, ...goals) * 1.05);
  const iw = W - P.l - P.r;
  const ih = H - P.t - P.b;
  const x = (i) => P.l + (i / 11) * iw;
  const y = (v) => P.t + ih - ((v - lo) / (hi - lo)) * ih;
  const TN = ticks(hi);
  const path = (arr) => arr.map((v, i) => (i ? 'L' : 'M') + x(i) + ' ' + y(v)).join('');
  const ps = path(series);
  const floor = y(Math.max(lo, 0));
  const getTip = (px) => {
    const i = Math.round(((px - P.l) / iw) * 11);
    if (i < 0 || i > 11) return null;
    return { x: x(i), y: Math.min(y(series[i]), y(goals[i])) - 8, content: <><b>{mName(addMonth(CUR, i))} tak</b><br />Bachat ~{inr(series[i])}<br />Goal {inr(goals[i])}</> };
  };
  const move = track(getTip);
  return (
    <div className="chartbox" ref={boxRef}>
      <div className="ttl">
        <span>Agle 12 mahine: total bachat</span>
        <span className="legend">
          <span><i style={{ background: 'var(--s3)' }}></i>Is pace pe</span>
          <span><i className="dash"></i>Goal ({inrC(goal)}/mahina)</span>
        </span>
      </div>
      <TipBox tip={tip} />
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width={W} height={H} onPointerMove={move} onPointerDown={move} onPointerLeave={hide}>
        <Grid P={P} W={W} TN={TN} yOf={y} valueAt={(i) => lo + ((hi - lo) * i) / TN} />
        {[0, 3, 6, 9, 11].map((i) => <text key={i} className="axis" x={x(i)} y={H - 6} textAnchor="middle">{mShort(addMonth(CUR, i))}</text>)}
        <path d={path(goals)} fill="none" stroke="#78827B" strokeWidth="1.6" strokeDasharray="5 4" />
        <path d={`${ps}L${x(11)} ${floor}L${x(0)} ${floor}Z`} fill="var(--s3)" opacity=".12" />
        <path d={ps} fill="none" stroke="var(--s3)" strokeWidth="2.2" strokeLinejoin="round" />
        <circle cx={x(11)} cy={y(series[11])} r="4.5" fill="var(--s3)" stroke="#fff" strokeWidth="2" />
      </svg>
    </div>
  );
}
