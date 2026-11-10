import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  aimPreview,
  BALL_R,
  groupOf,
  playerGroup,
  POCKETS,
  startShot,
  TABLE_H,
  TABLE_W,
  type Ball,
  type BilliardsAction,
  type BilliardsState,
} from '../billiards';
import type { BoardProps } from './boardProps';

const RAIL = 7;
const BALL_COLORS: Record<number, string> = {
  1: '#f5c518', 2: '#1f4fd1', 3: '#d62828', 4: '#6a2c91', 5: '#f77f00', 6: '#13803b', 7: '#7a1f1f', 8: '#111111',
  9: '#f5c518', 10: '#1f4fd1', 11: '#d62828', 12: '#6a2c91', 13: '#f77f00', 14: '#13803b', 15: '#7a1f1f',
};
const STEPS_PER_FRAME = 2;

type Aim = { angle: number; power: number };

function drawTable(ctx: CanvasRenderingContext2D, scale: number, balls: Ball[], aim: Aim | null) {
  const w = (TABLE_W + RAIL * 2) * scale;
  const h = (TABLE_H + RAIL * 2) * scale;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#5b3418';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(0, 0, w, h, 10 * (scale / 3));
  else ctx.rect(0, 0, w, h);
  ctx.fill();
  ctx.save();
  ctx.translate(RAIL * scale, RAIL * scale);
  ctx.scale(scale, scale);
  const cloth = ctx.createRadialGradient(TABLE_W / 2, TABLE_H / 2, 10, TABLE_W / 2, TABLE_H / 2, TABLE_H * 0.7);
  cloth.addColorStop(0, '#1f8a55');
  cloth.addColorStop(1, '#126b3f');
  ctx.fillStyle = cloth;
  ctx.fillRect(0, 0, TABLE_W, TABLE_H);
  // Ligne de casse et mouches.
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, TABLE_H * 0.75);
  ctx.lineTo(TABLE_W, TABLE_H * 0.75);
  ctx.stroke();
  for (const pocket of POCKETS) {
    ctx.fillStyle = '#0b0b0b';
    ctx.beginPath();
    ctx.arc(pocket.x, pocket.y, pocket.r, 0, Math.PI * 2);
    ctx.fill();
  }

  const cue = balls.find((ball) => ball.n === 0 && !ball.in);
  if (aim && cue) {
    const target = aimPreview(balls, aim.angle);
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cue.x, cue.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    ctx.setLineDash([]);
    if (target.ghost) {
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.arc(target.x, target.y, BALL_R, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Queue de billard, reculée selon la force.
    const back = BALL_R + 2 + aim.power * 14;
    const dx = Math.cos(aim.angle);
    const dy = Math.sin(aim.angle);
    ctx.strokeStyle = '#e9cf9f';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cue.x - dx * back, cue.y - dy * back);
    ctx.lineTo(cue.x - dx * (back + 70), cue.y - dy * (back + 70));
    ctx.stroke();
    ctx.strokeStyle = '#3b2412';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cue.x - dx * (back + 50), cue.y - dy * (back + 50));
    ctx.lineTo(cue.x - dx * (back + 70), cue.y - dy * (back + 70));
    ctx.stroke();
  }

  for (const ball of balls) {
    if (ball.in) continue;
    ctx.save();
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
    ctx.clip();
    const stripe = ball.n >= 9;
    ctx.fillStyle = ball.n === 0 || stripe ? '#f8f5ec' : BALL_COLORS[ball.n];
    ctx.fillRect(ball.x - BALL_R, ball.y - BALL_R, BALL_R * 2, BALL_R * 2);
    if (stripe) {
      ctx.fillStyle = BALL_COLORS[ball.n];
      ctx.fillRect(ball.x - BALL_R, ball.y - BALL_R * 0.55, BALL_R * 2, BALL_R * 1.1);
    }
    if (ball.n !== 0 && scale * BALL_R > 6) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_R * 0.48, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.font = `bold ${BALL_R * 0.62}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(ball.n), ball.x, ball.y + 0.08);
    }
    const shine = ctx.createRadialGradient(ball.x - BALL_R * 0.4, ball.y - BALL_R * 0.4, 0, ball.x, ball.y, BALL_R * 1.1);
    shine.addColorStop(0, 'rgba(255,255,255,0.55)');
    shine.addColorStop(0.35, 'rgba(255,255,255,0)');
    shine.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = shine;
    ctx.fillRect(ball.x - BALL_R, ball.y - BALL_R, BALL_R * 2, BALL_R * 2);
    ctx.restore();
  }
  ctx.restore();
}

function BallDot({ n }: { n: number }) {
  return (
    <span
      className="inline-block h-3.5 w-3.5 rounded-full border border-black/20"
      style={{
        background: n >= 9 ? `linear-gradient(#f8f5ec 0 28%, ${BALL_COLORS[n]} 28% 72%, #f8f5ec 72%)` : BALL_COLORS[n],
      }}
    />
  );
}

export function BilliardsBoard({ state, players, me, canAct, onAction, tx }: BoardProps<BilliardsState, BilliardsAction>) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(2);
  const ballsRef = useRef<Ball[]>(state.balls);
  const aimRef = useRef<Aim>({ angle: -Math.PI / 2, power: 0.6 });
  const [power, setPower] = useState(0.6);
  const [animating, setAnimating] = useState(false);
  const shownShot = useRef(state.shotId);
  const frame = useRef<number | undefined>(undefined);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawTable(ctx, scale, ballsRef.current, canAct && !animating ? aimRef.current : null);
  }, [scale, canAct, animating]);

  // Taille du canvas : toute la largeur disponible, sans dépasser ~52 % de la hauteur d’écran (la force et le bouton Tirer restent visibles).
  useEffect(() => {
    const resize = () => {
      const width = wrapRef.current?.clientWidth ?? 300;
      const maxHeight = window.innerHeight * 0.52;
      setScale(Math.max(1.2, Math.min(width / (TABLE_W + RAIL * 2), maxHeight / (TABLE_H + RAIL * 2))));
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round((TABLE_W + RAIL * 2) * scale * dpr);
    canvas.height = Math.round((TABLE_H + RAIL * 2) * scale * dpr);
    redraw();
  }, [scale, redraw]);

  // Nouveau coup reçu : on rejoue la trajectoire, puis on cale les billes sur l'état officiel.
  useEffect(() => {
    if (state.shotId === shownShot.current) {
      ballsRef.current = state.balls;
      redraw();
      return undefined;
    }
    shownShot.current = state.shotId;
    const shot = state.lastShot;
    if (!shot) {
      ballsRef.current = state.balls;
      redraw();
      return undefined;
    }
    const sim = startShot(shot.before, shot.angle, shot.power);
    setAnimating(true);
    let frames = 0;
    const tick = () => {
      let moving = true;
      for (let i = 0; i < STEPS_PER_FRAME && moving; i += 1) moving = sim.step();
      frames += 1;
      ballsRef.current = sim.balls;
      redraw();
      if (moving && frames < 1200) {
        frame.current = requestAnimationFrame(tick);
      } else {
        ballsRef.current = state.balls;
        setAnimating(false);
      }
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      ballsRef.current = state.balls;
      setAnimating(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.shotId]);

  useEffect(() => {
    if (!animating) redraw();
  }, [animating, redraw]);

  const aimAt = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!canAct || animating) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale - RAIL;
    const y = (event.clientY - rect.top) / scale - RAIL;
    const cue = ballsRef.current.find((ball) => ball.n === 0);
    if (!cue) return;
    if (Math.hypot(x - cue.x, y - cue.y) < 0.5) return;
    aimRef.current = { ...aimRef.current, angle: Math.atan2(y - cue.y, x - cue.x) };
    redraw();
  };

  const shoot = () => {
    if (!canAct || animating) return;
    onAction({ type: 'shot', angle: aimRef.current.angle, power: aimRef.current.power });
  };

  const viewer = me ?? state.turn;
  const messageKey = state.message ? (`billiards.${state.message}` as const) : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        {players.map((player, index) => {
          const group = playerGroup(state, index);
          const left = group ? state.balls.filter((ball) => !ball.in && groupOf(ball.n) === group).map((ball) => ball.n) : [];
          return (
            <div
              key={player.id}
              className={`min-w-0 rounded-2xl border px-3 py-2 ${state.turn === index && !state.result ? 'border-amber-300 bg-amber-50' : 'border-stone-200 bg-white'}`}
            >
              <p className="truncate text-xs font-bold text-stone-800">
                {player.name}
                {me !== null && index === viewer ? ` (${tx('play.you')})` : ''}
              </p>
              <p className="mt-0.5 text-[11px] text-stone-500">
                {group ? tx(group === 'solids' ? 'billiards.solids' : 'billiards.stripes') : '—'}
              </p>
              {group && (
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {left.length > 0 ? left.map((n) => <BallDot key={n} n={n} />) : <BallDot n={8} />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {messageKey && !animating && <p className="text-center text-sm font-semibold text-stone-600">{tx(messageKey)}</p>}

      <div ref={wrapRef} className="flex w-full justify-center">
        <canvas
          ref={canvasRef}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            aimAt(event);
          }}
          onPointerMove={(event) => {
            if (event.buttons > 0 || event.pointerType === 'mouse') aimAt(event);
          }}
          className="touch-none rounded-2xl shadow-card"
          style={{ width: (TABLE_W + RAIL * 2) * scale, height: (TABLE_H + RAIL * 2) * scale }}
        />
      </div>

      {canAct && !animating && (
        <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3">
          <label className="flex min-w-0 flex-1 items-center gap-3 text-xs font-semibold text-stone-500">
            {tx('billiards.power')}
            <input
              type="range"
              min={5}
              max={100}
              value={Math.round(power * 100)}
              onChange={(event) => {
                const value = Number(event.target.value) / 100;
                setPower(value);
                aimRef.current = { ...aimRef.current, power: value };
                redraw();
              }}
              className="min-w-0 flex-1 accent-amber-500"
            />
          </label>
          <button type="button" onClick={shoot} className="shrink-0 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-bold text-white">
            {tx('billiards.shoot')}
          </button>
        </div>
      )}
      <p className="text-center text-xs text-stone-400">{canAct ? tx('billiards.aimHint') : tx('billiards.rules')}</p>
    </div>
  );
}
