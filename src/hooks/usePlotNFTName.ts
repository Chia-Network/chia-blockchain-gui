import { useMemo } from 'react';
import seedrandom from 'seedrandom';
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from 'unique-names-generator';
import type PlotNFTExternal from '../types/PlotNFTExternal';
import type PlotNFT from '../types/PlotNFT';

const uniqueNames: {
  [key: string]: string;
} = {};

function getUniqueName(seed: string, iteration: number = 0): string {
  const computedName = Object.keys(uniqueNames).find((key) => uniqueNames[key] === seed);
  if (computedName) {
    return computedName;
  }

  const generator = seedrandom(iteration ? `${seed}-${iteration}` : seed);

  const uniqueName = uniqueNamesGenerator({
    dictionaries: [colors, animals, adjectives],
    length: 2,
    seed: generator.int32(),
    separator: ' ',
    style: 'capital',
  });

  if (uniqueNames[uniqueName] && uniqueNames[uniqueName] !== seed) {
    return getUniqueName(seed, iteration + 1);
  }

  uniqueNames[uniqueName] = seed;

  return uniqueName;
}

export default function usePlotNFTName(nft: PlotNFT | PlotNFTExternal): string {
  const p2_singleton_puzzle_hash = nft?.pool_state?.p2_singleton_puzzle_hash;
  const name = useMemo(
    () => getUniqueName(p2_singleton_puzzle_hash), 
    [p2_singleton_puzzle_hash],
  );

  return name;
}
