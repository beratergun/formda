import { useState } from 'react';
import { Button } from './index';
import type { Exercise } from '../domain/types';
type Pose = {
  head: [number, number];
  body: string;
  arms: string;
  legs: string;
  apparatus?: string;
};
function pose(exercise: Exercise, end: boolean): Pose {
  const id = exercise.id,
    type = exercise.svgKey;
  if (/push-up/.test(id))
    return {
      head: [154, end ? 74 : 44],
      body: end ? 'M141 77L78 83' : 'M141 47L78 63',
      arms: end ? 'M137 77L151 85 139 101' : 'M137 49L137 101',
      legs: end ? 'M78 83L29 98' : 'M78 63L29 98',
      apparatus: 'M15 104H185',
    };
  if (
    /bench|incline-press|dumbbell-incline|floor-press|skull-crusher|pullover/.test(id) &&
    !id.includes('dip')
  )
    return {
      head: [48, 73],
      body: 'M61 77L115 77',
      arms: end ? 'M75 76L75 26M87 76L87 26' : 'M75 76L95 81 99 54M87 76L65 81 61 54',
      legs: 'M115 77L143 78 155 101',
      apparatus: 'M30 88H137M42 88V104M127 88V104',
    };
  if (id.includes('dip'))
    return {
      head: [112, end ? 21 : 38],
      body: end ? 'M112 34L114 67' : 'M112 51L114 82',
      arms: end ? 'M112 40L86 66 86 94' : 'M112 57L80 72 86 94',
      legs: end ? 'M114 67L149 80 164 101' : 'M114 82L149 87 164 101',
      apparatus: 'M63 94H99M72 94V105',
    };
  if (id.includes('pull-up'))
    return {
      head: [100, end ? 23 : 44],
      body: end ? 'M100 36V69' : 'M100 57V85',
      arms: end
        ? 'M100 42L75 49 65 10M100 42L125 49 135 10'
        : 'M100 60L73 30 65 10M100 60L127 30 135 10',
      legs: end ? 'M100 69L81 85 75 100M100 69L119 85 125 100' : 'M100 85L82 102M100 85L118 102',
      apparatus: 'M42 9H159M44 9V105M157 9V105',
    };
  if (id.includes('pulldown') || id === 'straight-arm-pull')
    return {
      head: [101, 30],
      body: 'M101 43V75',
      arms: end
        ? 'M101 49L76 60 64 45M101 49L126 60 138 45'
        : 'M101 49L75 25 66 12M101 49L127 25 136 12',
      legs: 'M101 75L75 80 64 101M101 75L128 80 138 101',
      apparatus: 'M49 9H153M153 9V104M80 84H130',
    };
  if (/lateral-raise|front-raise|cable-lateral|cable-front|fly|pec-deck|band-pull-apart/.test(id))
    return {
      head: [101, 19],
      body: 'M101 32V69',
      arms: end
        ? 'M101 40L70 43 38 42M101 40L132 43 164 42'
        : 'M101 40L80 63 75 88M101 40L122 63 127 88',
      legs: 'M101 69L81 101M101 69L121 101',
    };
  if (/calf/.test(id) && type !== 'mobility')
    return {
      head: [101, end ? 14 : 21],
      body: end ? 'M101 27V65' : 'M101 34V72',
      arms: end ? 'M101 35L81 62M101 35L121 62' : 'M101 42L81 69M101 42L121 69',
      legs: end
        ? 'M101 65L86 94 79 101M101 65L116 94 123 101'
        : 'M101 72L85 101 73 101M101 72L117 101 129 101',
    };
  if (/hip-abduction|hip-adduction|cable-abduction|clamshell/.test(id))
    return {
      head: [101, 20],
      body: 'M101 33V70',
      arms: 'M101 41L80 70M101 41L122 70',
      legs: end
        ? 'M101 70L64 81 45 101M101 70L138 81 157 101'
        : 'M101 70L92 82 89 101M101 70L110 82 113 101',
      apparatus: 'M80 77H124M89 77V104M115 77V104',
    };
  if (
    /dead-bug|heel-tap|hollow|crunch/.test(id) &&
    id !== 'machine-crunch' &&
    id !== 'cable-crunch'
  )
    return {
      head: [151, 80],
      body: 'M138 84H85',
      arms: end ? 'M129 84L154 54' : 'M129 84L117 49',
      legs: end ? 'M85 84L49 77 23 89M85 84L67 51 48 54' : 'M85 84L69 52 44 52M85 84L100 53 120 53',
      apparatus: 'M16 100H180',
    };
  if (type === 'swim')
    return {
      head: [140, 48],
      body: 'M126 52H76',
      arms: end
        ? 'M118 52L104 72 75 72M118 52L139 25 160 27'
        : 'M118 52L145 55 167 50M118 52L103 28 78 30',
      legs: end ? 'M76 52L48 42 24 48M76 52L48 64 24 58' : 'M76 52L48 56 24 48M76 52L48 48 24 56',
      apparatus: 'M12 90Q30 82 48 90T84 90T120 90T156 90T184 90',
    };
  if (id.includes('bridge') || id.includes('hip-thrust'))
    return {
      head: [149, 72],
      body: end ? 'M136 76L93 50' : 'M136 76L93 78',
      arms: 'M133 78L150 93',
      legs: end ? 'M93 50L62 62 46 95' : 'M93 78L62 62 46 95',
      apparatus: 'M12 98H180',
    };
  if (type === 'core' || id.includes('plank') || id === 'bird-dog')
    return {
      head: [147, 47],
      body: 'M134 49L83 60',
      arms: end ? 'M132 51L150 24 174 24M132 51L139 92' : 'M132 51L139 92M132 51L112 91',
      legs: end ? 'M83 60L49 58 20 53M83 60L66 91 42 94' : 'M83 60L57 77 38 94M83 60L68 94 45 95',
      apparatus: 'M12 99H180',
    };
  if (id.includes('leg-press'))
    return {
      head: [150, 32],
      body: 'M141 45L121 70',
      arms: 'M137 49L145 71 153 69',
      legs: end ? 'M121 70L82 67 40 40' : 'M121 70L97 44 67 55',
      apparatus: 'M127 92L164 33M115 91H158M26 25L47 54',
    };
  if (id.includes('leg-curl') || id === 'leg-extension')
    return {
      head: [112, 25],
      body: 'M108 38L105 69',
      arms: 'M108 45L124 67',
      legs: end ? 'M105 69L70 69 43 52' : 'M105 69L70 69 67 95',
      apparatus: 'M90 77H125M125 77V96M125 77V40',
    };
  if (type === 'squat')
    return end
      ? {
          head: [111, 35],
          body: 'M105 48L90 69',
          arms: 'M106 48L134 57 150 47',
          legs: 'M90 69L122 78 108 99M90 69L67 83 53 99',
        }
      : {
          head: [96, 18],
          body: 'M96 31V66',
          arms: 'M96 38L119 55 140 48',
          legs: 'M96 66L80 98M96 66L112 98',
        };
  if (type === 'hinge')
    return end
      ? {
          head: [94, 18],
          body: 'M94 31V66',
          arms: 'M94 38L76 72M94 38L112 72',
          legs: 'M94 66L78 99M94 66L110 99',
        }
      : {
          head: [133, 39],
          body: 'M120 43L86 66',
          arms: 'M118 48L111 85M118 48L137 83',
          legs: 'M86 66L64 83 67 99M86 66L110 83 109 99',
        };
  if (type === 'pull')
    return {
      head: [109, 22],
      body: 'M106 35L99 70',
      arms: end
        ? 'M106 40L124 59 113 41M106 40L85 59 95 41'
        : 'M106 40L141 30 161 25M106 40L76 31 52 25',
      legs: 'M99 70L78 78 67 99M99 70L125 78 132 99',
      apparatus: 'M165 12V96M165 12H45M94 78H126M121 78V99',
    };
  if (type === 'press') {
    const overhead = id.includes('shoulder') || id.includes('arnold') || id.includes('landmine');
    return {
      head: [96, 21],
      body: 'M96 34V70',
      arms: end
        ? overhead
          ? 'M96 39L73 19 73 5M96 39L119 19 119 5'
          : 'M96 39L128 38 158 37M96 39L65 38 35 37'
        : 'M96 39L73 56 65 31M96 39L119 56 127 31',
      legs: 'M96 70L73 77 66 99M96 70L119 77 127 99',
      apparatus: exercise.equipment === 'makine' ? 'M86 32V78H125M119 78V99' : undefined,
    };
  }
  if (type === 'isolation')
    return {
      head: [99, 19],
      body: 'M99 32V68',
      arms: end
        ? 'M99 39L79 64 76 41M99 39L119 64 122 41'
        : 'M99 39L79 64 72 88M99 39L119 64 126 88',
      legs: 'M99 68L81 99M99 68L117 99',
    };
  return {
    head: [100, 20],
    body: end ? 'M100 33L90 66' : 'M100 33V66',
    arms: end ? 'M100 40L77 61M100 40L124 23' : 'M100 40L77 23M100 40L124 61',
    legs: end
      ? 'M90 66L67 87 45 89M90 66L118 78 121 99'
      : 'M100 66L77 78 75 99M100 66L126 87 148 89',
    apparatus: type === 'cardio' ? 'M17 101H178' : undefined,
  };
}
export function MovementFrames({ exercise }: { exercise: Exercise }) {
  const [loop, setLoop] = useState(false);
  return (
    <div className="stack">
      <Button variant="quiet" aria-pressed={loop} onClick={() => setLoop(!loop)}>
        {loop ? 'İki pozu yan yana göster' : 'Poz döngüsünü göster'}
      </Button>
      <div className={`movement-frames ${loop ? 'is-loop' : ''}`}>
        {[false, true].map((end) => {
          const p = pose(exercise, end);
          return (
            <figure key={String(end)}>
              <svg
                viewBox="0 0 200 115"
                role="img"
                aria-label={`${exercise.name} · ${end ? 'Bitiş' : 'Başlangıç'} pozu`}
              >
                <path d="M10 104H190" stroke="var(--line)" strokeWidth="2" />
                {p.apparatus && (
                  <path
                    d={p.apparatus}
                    fill="none"
                    stroke="var(--sub)"
                    strokeWidth="3"
                    opacity=".65"
                  />
                )}
                <g
                  stroke="var(--accent)"
                  fill="none"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx={p.head[0]} cy={p.head[1]} r="10" fill="var(--accent-soft)" />
                  <path d={p.body} />
                  <path d={p.arms} />
                  <path d={p.legs} />
                </g>
              </svg>
              <figcaption>{end ? '2 · Bitiş' : '1 · Başlangıç'}</figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
