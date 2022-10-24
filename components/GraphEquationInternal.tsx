import { BoxedExpression } from "@cortex-js/compute-engine";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Box, Point } from "../lib";
import { GraphContext } from "./Graph";
import { GraphContours } from "./GraphContours";

import { Remote, wrap } from "comlink";

import { ComputeEngine } from "@cortex-js/compute-engine";
import { API } from "../workers/graphEquation.worker";
const ce = new ComputeEngine();

interface GraphEquationProps {
  equation: string;
  color: "red" | "blue";
}

export function GraphEquation({ equation, color }: GraphEquationProps) {
  const { graphWindow } = useContext(GraphContext)!;

  const mathJSON = useMemo(() => ce.parse(equation), [equation]);
  let contours = useContoursForEquation(mathJSON, graphWindow, 7n, 4n);

  return <GraphContours contours={contours} color={color} />;
}

const api: Remote<API> = wrap(
  new Worker(new URL("../workers/graphEquation.worker.ts", import.meta.url))
);

function useContoursForEquation(
  equation: BoxedExpression,
  desiredWindow: Box,
  depth = 7n,
  searchDepth = 3n
) {
  const busy = useRef(false);
  const queued = useRef<{
    equation: BoxedExpression;
    desiredWindow: Box;
    depth: bigint;
    searchDepth: bigint;
  } | null>(null);
  const [contours, setContours] = useState<Point[][]>([]);

  useEffect(() => {
    if (busy.current) {
      queued.current = { equation, desiredWindow, depth, searchDepth };
      return;
    }

    async function performWork(
      equation: BoxedExpression,
      desiredWindow: Box,
      depth: bigint,
      searchDepth: bigint
    ) {
      try {
        const regions = getOptimalRegions(desiredWindow);
        const getContours = api.graphAllRegionsToContours(
          JSON.stringify(equation),
          regions,
          depth,
          searchDepth
        );
        const timeout = new Promise<Point[][]>((resolve) =>
          setTimeout(() => resolve([]), 1000)
        );
        const contours = await Promise.race([getContours, timeout]);
        setContours(contours);
      } catch (err) {
        console.error(err);
        setContours([]);
      } finally {
        if (queued.current) {
          await performWork(
            queued.current.equation,
            queued.current.desiredWindow,
            queued.current.depth,
            queued.current.searchDepth
          );
        }
      }
    }

    busy.current = true;
    performWork(equation, desiredWindow, depth, searchDepth).then(() => {
      busy.current = false;
    });
  }, [busy, desiredWindow, equation, depth, searchDepth]);

  return contours;
}

function getOptimalRegions(coverWindow: Box) {
  const maxDim = Math.max(
    coverWindow.maxX - coverWindow.minX,
    coverWindow.maxY - coverWindow.minY
  );
  const scale = Math.ceil(Math.log2(maxDim)) - 1;
  const minX = Math.floor(coverWindow.minX / 2 ** scale);
  const maxX = Math.ceil(coverWindow.maxX / 2 ** scale);
  const minY = Math.floor(coverWindow.minY / 2 ** scale);
  const maxY = Math.ceil(coverWindow.maxY / 2 ** scale);

  let regions = [];
  for (let x = minX; x < maxX; x++) {
    for (let y = minY; y < maxY; y++) {
      regions.push([scale, x, y]);
    }
  }
  return regions;
}