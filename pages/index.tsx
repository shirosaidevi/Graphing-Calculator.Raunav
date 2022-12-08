import { Fragment, useEffect, useRef, useState } from "react";
import classNames from "classnames";
import useSize from "@react-hook/size";
import { Graph } from "../components/Graph";
import { GraphExpression } from "../components/GraphExpression";
import { GraphEquation } from "../components/GraphEquation";
import { GraphGrid } from "../components/GraphGrid";
import dynamic from "next/dynamic";
import { Graph3D } from "../components/Graph3D/Graph3D";
import { GraphContours3D } from "../components/Graph3D/GraphContours3D";
import { GraphEquation3D } from "../components/Graph3D/GraphEquation3D";
import { GraphExpression3D } from "../components/Graph3D/GraphExpression3D";
import { Box3, DoubleSide, Vector2, Vector3 } from "three";
import { GraphInfiniteGrid3D } from "../components/Graph3D/GraphInfiniteGrid3D";

const MathLiveInput = dynamic(
  () => import("../components/MathLiveInput").then((mod) => mod.MathLiveInput),
  { ssr: false }
);

type Item =
  | {
      type: "equation";
      equation: string;
      color: "red" | "blue";
    }
  | {
      type: "expression";
      expression: string;
      color: "rainbow" | "red" | "blue";
    };

type ItemWithId = { id: number } & Item;

export default function Index() {
  const [items, setItems] = useState<ItemWithId[]>([
    {
      id: 0,
      type: "equation",
      equation: "y=x^2",
      color: "red",
    },
    {
      id: 1,
      type: "equation",
      equation: "x^2+y^2=9",
      color: "blue",
    },
    // { id: 2, type: "expression", expression: "x^2+y^2", color: "rainbow" },
  ]);

  const setItem = (item: ItemWithId, newItem: ItemWithId) => {
    setItems((items) => {
      const index = items.indexOf(item);
      return [...items.slice(0, index), newItem, ...items.slice(index + 1)];
    });
  };

  const setProp = <T extends ItemWithId, PropName extends keyof T>(
    item: T,
    propName: PropName,
    value: T[PropName]
  ) => {
    setItem(item, { ...item, [propName]: value });
  };

  const insertItem = (item: Item, index = items.length) => {
    setItems((items) => {
      const newItem: ItemWithId = {
        ...item,
        id: Math.max(...items.map((item) => item.id)) + 1,
      };

      return [...items.slice(0, index + 1), newItem, ...items.slice(index + 1)];
    });
  };

  const deleteItem = (index: number) => {
    setItems((items) => [...items.slice(0, index), ...items.slice(index + 1)]);
  };

  const graphContainerRef = useRef(null);
  const [width, height] = useSize(graphContainerRef);

  return (
    <div className="grid grid-cols-[300px,1fr] grid-rows-[auto,1fr] w-screen h-screen">
      <div className="flex justify-between items-center col-span-full bg-gray-800 px-4 py-3">
        <h1 className="text-gray-100 font-medium text-lg">
          🍪 Josh's Graphing Calculator
        </h1>
        <span className="text-gray-500">I can't believe it's not Desmos!</span>
      </div>
      <div className="flex flex-col border-r shadow-lg">
        {items.map((item, index) => (
          <Fragment key={item.id}>
            {item.type === "equation" && (
              <EquationInput
                equation={item.equation}
                setEquation={(newEquation) =>
                  setProp(item, "equation", newEquation)
                }
                color={item.color}
                setColor={(newColor) => setProp(item, "color", newColor)}
                deleteSelf={() => deleteItem(index)}
              />
            )}
            {item.type === "expression" && (
              <ExpressionInput
                expression={item.expression}
                setExpression={(newExpression) => {
                  setProp(item, "expression", newExpression);
                }}
                color={item.color}
                setColor={(newColor) => setProp(item, "color", newColor)}
                deleteSelf={() => deleteItem(index)}
              />
            )}
          </Fragment>
        ))}
        <div className="flex mt-4 space-x-2 justify-center">
          <button
            onClick={() =>
              insertItem({
                type: "equation",
                equation: "y=x",
                color: "red",
              })
            }
            disabled={items.length >= 4}
            className="bg-gray-100 border px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add equation
          </button>
          <button
            onClick={() =>
              insertItem({
                type: "expression",
                expression: "x^2+y^2",
                color: "rainbow",
              })
            }
            disabled={items.length >= 4}
            className="bg-gray-100 border px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add expression
          </button>
        </div>
      </div>
      <div
        ref={graphContainerRef}
        className="relative flex items-center justify-center overflow-hidden"
      >
        <Graph3D>
          {/* <GraphContours3D
            flatContours={new Float64Array([0, 0, 1, 1, 2, 0])}
            color="red"
          /> */}
          {/* <GraphInfiniteGrid3D /> */}
          <gridHelper position={[0, 0, 0]} />
          {items.map((item) => (
            <Fragment key={item.id}>
              {item.type === "expression" && (
                <GraphExpression3D expression={item.expression} />
              )}
            </Fragment>
          ))}
          {items.map((item) => (
            <Fragment key={item.id}>
              {item.type === "equation" && (
                <GraphEquation3D equation={item.equation} color={item.color} />
              )}
            </Fragment>
          ))}
          <mesh>
            <cylinderGeometry args={[3, 3, 10, 32, 1, true]} />
            {/* <sphereGeometry args={[3, 32, 32]} /> */}
            {/* <meshNormalMaterial side={DoubleSide} /> */}
            {/* <meshPhysicalMaterial
              color="#2567dd"
              opacity={0.9}
              side={DoubleSide}
              transparent={true}
            /> */}
            <shaderMaterial
              uniforms={{
                divisionScale: { value: 1 },
              }}
              vertexShader={vertexShaderSource}
              fragmentShader={fragmentShaderSource}
              side={DoubleSide}
              transparent={true}
            />
          </mesh>
          {/* <GraphGrid /> */}
        </Graph3D>
      </div>
    </div>
  );
}

const vertexShaderSource = `
  varying vec2 vUv;
  varying vec3 vPos;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vPos = position;
    vNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShaderSource = `
  varying vec2 vUv;
  varying vec3 vPos;
  varying vec3 vNormal;

  uniform vec2 u_vmin;
  uniform vec2 u_vmax;

  uniform float divisionScale;

  #define PI 3.1415926535897932384626433832795

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    float value = pow(abs(cos(PI * vPos.x / divisionScale)), 1000.0) * (1.0 - pow(abs(dot(vNormal, vec3(1.0, 0.0, 0.0))), 10.0))
                + pow(abs(cos(PI * vPos.y / divisionScale)), 1000.0) * (1.0 - pow(abs(dot(vNormal, vec3(0.0, 1.0, 0.0))), 10.0))
                + pow(abs(cos(PI * vPos.z / divisionScale)), 1000.0) * (1.0 - pow(abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 10.0));

    vec3 color = mix(
      vec3(37.0 / 255.0, 100.0 / 255.0, 235.0 / 255.0),
      vec3(29.0 / 255.0, 79.0 / 255.0, 216.0 / 255.0),
      value
    );

    // float fadeOut = smoothstep(4.5, 5.0, length(vPos.y));
    float fadeOut = 0.0;

    gl_FragColor = vec4(color, 0.9 - 0.9 * fadeOut);
  }
`;

interface EquationInputProps {
  equation: string;
  setEquation: (equation: string) => void;
  color: "red" | "blue";
  setColor: (color: "red" | "blue") => void;
  deleteSelf: () => void;
}

function EquationInput({
  equation,
  setEquation,
  color,
  setColor,
  deleteSelf,
}: EquationInputProps) {
  return (
    <div className="relative flex border-b">
      <div className="bg-gray-100 py-4 px-2">
        <button
          onClick={() => setColor(color === "red" ? "blue" : "red")}
          className={classNames("block w-6 h-6 rounded-full", {
            "bg-red-600": color === "red",
            "bg-blue-600": color === "blue",
          })}
        >
          <span className="sr-only">Change color</span>
        </button>
      </div>
      <div className="block w-full flex-grow self-stretch focus-within:outline">
        <MathLiveInput
          latex={equation}
          onChange={(latex) => {
            setEquation(latex);
          }}
          options={{}}
          className="px-3 py-2 outline-none"
          style={
            color === "red"
              ? "--hue: 0; --selection-background-color-focused: rgb(220 38 38 / 0.2); --selection-color-focused: rgb(127 29 29 / 1);"
              : color === "blue"
              ? "--hue: 222; --selection-background-color-focused: rgb(37 99 235 / 0.2); --selection-color-focused: rgb(30 58 138 / 1);"
              : undefined
          }
        />
      </div>
      <button
        onClick={() => deleteSelf()}
        className="absolute top-0 right-0 w-5 h-5 rounded-bl bg-gray-200 flex items-center justify-center"
      >
        <span className="sr-only">Delete</span>
        <span className="not-sr-only text-xs text-gray-600">X</span>
      </button>
    </div>
  );
}

interface ExpressionInputProps {
  expression: string;
  setExpression: (expression: string) => void;
  color: "rainbow" | "red" | "blue";
  setColor: (color: "rainbow" | "red" | "blue") => void;
  deleteSelf: () => void;
}

function ExpressionInput({
  expression,
  setExpression,
  color,
  setColor,
  deleteSelf,
}: ExpressionInputProps) {
  const rainbowHue = useRainbowHue();

  const colorOptions = ["red", "blue", "rainbow"] as const;

  return (
    <div className="relative flex border-b">
      <div className="bg-gray-100 py-4 px-2">
        <button
          onClick={() =>
            setColor(
              colorOptions[
                (colorOptions.indexOf(color) + 1) % colorOptions.length
              ]
            )
          }
          className={classNames("block w-6 h-6 rounded-full", {
            "bg-red-600": color === "red",
            "bg-blue-600": color === "blue",
          })}
          style={{
            backgroundImage:
              color === "rainbow"
                ? `conic-gradient(
                    rgba(255, 0, 0, 1) 0%,
                    rgba(255, 154, 0, 1) 10%,
                    rgba(208, 222, 33, 1) 20%,
                    rgba(79, 220, 74, 1) 30%,
                    rgba(63, 218, 216, 1) 40%,
                    rgba(47, 201, 226, 1) 50%,
                    rgba(28, 127, 238, 1) 60%,
                    rgba(95, 21, 242, 1) 70%,
                    rgba(186, 12, 248, 1) 80%,
                    rgba(251, 7, 217, 1) 90%,
                    rgba(255, 0, 0, 1) 100%
                  )`
                : undefined,
          }}
        >
          <span className="sr-only">Change color</span>
        </button>
      </div>
      <div className="block w-full flex-grow self-stretch focus-within:outline">
        <MathLiveInput
          latex={expression}
          onChange={(latex) => {
            setExpression(latex);
          }}
          options={{}}
          className="px-3 py-2 outline-none"
          style={
            color === "rainbow"
              ? `--hue: ${rainbowHue}; --selection-background-color-focused: hsla(${rainbowHue}, 100%, 50%, 0.2); --selection-color-focused: hsl(${rainbowHue}, 100%, 25%);`
              : color === "red"
              ? "--hue: 0; --selection-background-color-focused: rgb(220 38 38 / 0.2); --selection-color-focused: rgb(127 29 29 / 1);"
              : color === "blue"
              ? "--hue: 222; --selection-background-color-focused: rgb(37 99 235 / 0.2); --selection-color-focused: rgb(30 58 138 / 1);"
              : undefined
          }
        />
      </div>
      <button
        onClick={() => deleteSelf()}
        className="absolute top-0 right-0 w-5 h-5 rounded-bl bg-gray-200 flex items-center justify-center"
      >
        <span className="sr-only">Delete</span>
        <span className="not-sr-only text-xs text-gray-600">X</span>
      </button>
    </div>
  );
}

function useRainbowHue() {
  const [rainbowHue, setRainbowHue] = useState(0);
  useEffect(() => {
    let done = false;

    function updateSelectionColor() {
      if (done) return;
      requestAnimationFrame(updateSelectionColor);

      const t = (Date.now() / 4000) % 1;
      setRainbowHue(t * 360);
    }

    updateSelectionColor();

    return () => {
      done = true;
    };
  }, []);

  return rainbowHue;
}
