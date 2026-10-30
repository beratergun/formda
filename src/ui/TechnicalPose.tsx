import {
  poseJoints,
  pointAt,
  type Point,
  type Technique,
  type TechnicalPose,
} from '../domain/exercises/technique';

function shape(a: Point, b: Point, w: number, n: number) {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const x = -(b[1] - a[1]) / d,
    y = (b[0] - a[0]) / d;
  return `M${a[0] + x * w},${a[1] + y * w}L${b[0] + x * n},${b[1] + y * n}Q${b[0] + ((b[0] - a[0]) / d) * n},${b[1] + ((b[1] - a[1]) / d) * n} ${b[0] - x * n},${b[1] - y * n}L${a[0] - x * w},${a[1] - y * w}Q${a[0] - ((b[0] - a[0]) / d) * w},${a[1] - ((b[1] - a[1]) / d) * w} ${a[0] + x * w},${a[1] + y * w}Z`;
}
function Limb({
  a,
  b,
  w = 7,
  n = 5,
  color = 'var(--figure-skin)',
}: {
  a: Point;
  b: Point;
  w?: number;
  n?: number;
  color?: string;
}) {
  return (
    <path d={shape(a, b, w, n)} fill={color} stroke="var(--figure-outline)" strokeWidth="1.5" />
  );
}
function Foot({ at, angle = 0 }: { at: Point; angle?: number }) {
  return (
    <g transform={`translate(${at}) rotate(${angle})`}>
      <path
        d="M-8-3Q-1-6 5-1L19 4Q23 6 21 10H-9Z"
        fill="var(--figure-shoe)"
        stroke="var(--figure-outline)"
        strokeWidth="1.5"
      />
      <path d="M-7 8H20" stroke="var(--accent)" strokeWidth="2" />
    </g>
  );
}
function Weight({ at, barbell, vertical }: { at: Point; barbell?: boolean; vertical?: boolean }) {
  return (
    <g
      transform={`translate(${at}) rotate(${vertical ? 90 : 0})`}
      stroke="var(--accent)"
      strokeWidth="2"
      fill="var(--figure-equipment)"
    >
      <path d={barbell ? 'M-27 0H27' : 'M-13 0H13'} strokeWidth="5" />
      {barbell ? (
        <>
          <ellipse rx="9" ry="17" />
          <ellipse rx="3" ry="7" fill="var(--raise)" />
        </>
      ) : (
        <>
          <rect x="-17" y="-9" width="7" height="18" rx="2" />
          <rect x="10" y="-9" width="7" height="18" rx="2" />
        </>
      )}
    </g>
  );
}
export function TechnicalPoseArt({
  technique: t,
  pose: p,
  index,
  exerciseName,
  exerciseId,
}: {
  technique: Technique;
  pose: TechnicalPose;
  index: number;
  exerciseName: string;
  exerciseId: string;
}) {
  const j = poseJoints(p),
    sitting = ['dumbbell', 'press', 'pulldown', 'row'].includes(t.equipment);
  return (
    <svg
      className="technical-pose"
      viewBox="0 0 320 280"
      role="img"
      aria-label={`${exerciseName} · ${t.static ? 'Statik tutuş' : index === 0 ? 'Başlangıç pozu' : 'Bitiş pozu'}`}
    >
      <desc>
        {t.view}. {t.cues[index]}
      </desc>
      <g className="pose-grid" stroke="var(--line)">
        {[64, 128, 192, 256].map((n) => (
          <path key={n} d={`M${n} 24V250M32 ${n}H288`} />
        ))}
      </g>
      <ellipse cx="157" cy="252" rx="108" ry="7" fill="var(--line)" opacity=".45" />
      <path d="M27 250H293" stroke="var(--sub)" strokeWidth="2" opacity=".6" />
      {exerciseId === 'bench-press' && (
        <g stroke="var(--figure-equipment-line)" strokeWidth="7" strokeLinecap="round">
          <path d="M81 197H207M98 201V245M194 201V245" />
          <path d="M89 191H202" stroke="var(--figure-padding)" strokeWidth="12" />
        </g>
      )}
      {sitting && (
        <g stroke="var(--figure-equipment-line)" strokeWidth="6" strokeLinecap="round">
          <path
            d={`M${p.hip[0] - 21} 209H${p.hip[0] + 43}M${p.hip[0] - 10} 212V247M${p.hip[0] + 32} 212V247`}
          />
          {['dumbbell', 'press'].includes(t.equipment) && (
            <path d={`M${p.hip[0] - 18} 112V202`} stroke="var(--figure-padding)" strokeWidth="10" />
          )}
          <path
            d={`M${p.hip[0] - 21} 204H${p.hip[0] + 43}`}
            stroke="var(--figure-padding)"
            strokeWidth="10"
          />
        </g>
      )}
      {t.equipment === 'pulldown' && (
        <g stroke="var(--figure-equipment-line)" fill="none" strokeWidth="5">
          <path d="M255 247V32H151M237 247H280" />
          <circle cx="151" cy="33" r="6" />
          <path d={`M151 39L${j.hand}`} stroke="var(--cyan)" strokeWidth="2" />
          <path d="M158 187H193" stroke="var(--figure-padding)" strokeWidth="9" />
        </g>
      )}
      {t.equipment === 'row' && (
        <g stroke="var(--figure-equipment-line)" fill="none" strokeWidth="5">
          <path d="M274 248V105M250 248H294M181 234L189 218" />
          <circle cx="274" cy="148" r="6" />
          <path d={`M268 148L${j.hand}`} stroke="var(--cyan)" strokeWidth="2" />
        </g>
      )}
      <g opacity=".6" transform={p.backLeg ? undefined : 'translate(-7 -3)'}>
        <Limb a={j.hip} b={j.backKnee} w={10} n={7} color="var(--figure-far)" />
        <Limb a={j.backKnee} b={j.backAnkle} color="var(--figure-far)" />
        <Foot at={j.backAnkle} angle={p.backFootAngle ?? p.footAngle} />
      </g>
      <Limb a={j.hip} b={j.knee} w={11} n={8} color="var(--figure-pants)" />
      <Limb a={j.knee} b={j.ankle} />
      <Foot at={j.ankle} angle={p.footAngle} />
      <path
        d={shape(j.hip, j.shoulder, 12, 17)}
        fill="var(--figure-shirt)"
        stroke="var(--figure-outline)"
        strokeWidth="2"
      />
      <path d={shape(j.hip, pointAt(j.hip, 17, p.torso), 12, 13)} fill="var(--figure-pants)" />
      <Limb a={j.shoulder} b={pointAt(j.shoulder, 10, p.torso)} w={6} />
      <g transform={`translate(${j.head}) rotate(${p.torso + 90})`}>
        <path
          d="M-9-8Q-6-15 3-13Q11-11 11-2L15 2L11 5Q10 14 1 13L-6 9Q-12 3-9-8Z"
          fill="var(--figure-skin)"
          stroke="var(--figure-outline)"
          strokeWidth="1.5"
        />
        <path d="M-9-3Q-14-12-4-15Q9-18 12-8L5-6L-1-10L-7-5Z" fill="var(--figure-pants)" />
        <circle cx="7" r="1.2" fill="var(--figure-outline)" />
      </g>
      <g opacity=".5" transform="translate(-6 -3)">
        <Limb a={j.armOrigin} b={j.elbow} color="var(--figure-far)" />
        <Limb a={j.elbow} b={j.hand} w={5.5} n={4} color="var(--figure-far)" />
      </g>
      <Limb a={j.armOrigin} b={j.elbow} />
      <Limb a={j.elbow} b={j.hand} w={5.5} n={4} />
      <circle
        cx={j.hand[0]}
        cy={j.hand[1]}
        r="5.5"
        fill="var(--figure-skin)"
        stroke="var(--figure-outline)"
        strokeWidth="1.5"
      />
      <circle
        cx={j.armOrigin[0]}
        cy={j.armOrigin[1]}
        r="7"
        fill="var(--figure-shirt)"
        stroke="var(--figure-outline)"
        strokeWidth="1.5"
      />
      {['dumbbell', 'press', 'lunge', 'goblet', 'barbell'].includes(t.equipment) && (
        <Weight
          at={t.equipment === 'goblet' ? [j.hand[0], j.hand[1] + 14] : j.hand}
          barbell={t.equipment === 'barbell'}
          vertical={t.equipment === 'goblet'}
        />
      )}
      {t.equipment === 'pulldown' && (
        <path
          d={`M${j.hand[0] - 27} ${j.hand[1]}H${j.hand[0] + 27}`}
          stroke="var(--accent)"
          strokeWidth="6"
          strokeLinecap="round"
        />
      )}
      {t.equipment === 'row' && (
        <path
          d={`M${j.hand[0]} ${j.hand[1] - 8}V${j.hand[1] + 8}`}
          stroke="var(--accent)"
          strokeWidth="5"
        />
      )}
      {t.arrow && !t.static && (
        <g stroke="var(--cyan)" fill="none" strokeWidth="2.5" strokeLinecap="round">
          <path d={`M${t.arrow[0]}L${t.arrow[1]}`} strokeDasharray="4 5" />
          {[-150, 150].map((a) => {
            const arrow = t.arrow!;
            const angle =
              (Math.atan2(arrow[1][1] - arrow[0][1], arrow[1][0] - arrow[0][0]) * 180) / Math.PI;
            return <path key={a} d={`M${arrow[1]}L${pointAt(arrow[1], 10, angle + a)}`} />;
          })}
        </g>
      )}
    </svg>
  );
}
