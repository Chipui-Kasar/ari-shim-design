'use client';

import { Walls } from '@/components/scene/Walls';
import { Floor } from '@/components/scene/Floor';
import { Ceiling } from '@/components/scene/Ceiling';
import { Entrance } from '@/components/scene/Entrance';

/** Shell of the pharmacy: floor, ceiling, left/right/back walls and the glass front. */
export function Room() {
  return (
    <group>
      <Floor />
      <Walls />
      <Ceiling />
      <Entrance />
    </group>
  );
}
