import { Fragment, useState } from "react";
import classNames from "classnames";
import { Graph3D } from "../components/Graph3D/Graph3D";
import { GraphEquation3D } from "../components/Graph3D/GraphEquation3D";
import { GraphGrid3D } from "../components/Graph3D/GraphGrid3D";
import { GraphAxis3D } from "../components/Graph3D/GraphAxis3D";
import { GraphBoundingBox3D } from "../components/Graph3D/GraphBoundingBox3D";
import { Shape, Vector2 } from "three";
import { Area } from "../components/Graph3D/display/Area";
import { Axis } from "../types";
import { Menu } from "@headlessui/react";
import { Navigation } from "../components/Navigation";

import {
  Equation,
  Expression,
  Table,
  VectorField,
} from "../components/MathObjects";

const mathObjects = [Equation, Expression, Table, VectorField] as const;

type Item =
  | Equation.ObjectDescription
  | Expression.ObjectDescription
  | Table.ObjectDescription
  | VectorField.ObjectDescription;

type ItemWithId = { id: number; visible: boolean } & Item;

const shape = new Shape([
  new Vector2(0, 0),
  new Vector2(3, 0),
  new Vector2(3, 1),
  new Vector2(1, 1),
  new Vector2(1, 2),
  new Vector2(0, 2),
]);
shape.autoClose = true;

const sliceShape = new Shape([
  new Vector2(-5, -5),
  new Vector2(-5, 5),
  new Vector2(5, 5),
  new Vector2(5, -5),
]);
sliceShape.autoClose = true;

export default function Index() {
  const [items, setItems] = useState<ItemWithId[]>([
    { id: 0, visible: true, ...Equation.defaultProps },
  ]);

  const setItem = (itemId: number, newItem: ItemWithId) => {
    setItems((items) => {
      const index = items.findIndex((item) => item.id === itemId);
      return [...items.slice(0, index), newItem, ...items.slice(index + 1)];
    });
  };

  const insertItem = (item: Item, index = items.length) => {
    setItems((items) => {
      const newItem: ItemWithId = {
        ...item,
        id: Math.max(...items.map((item) => item.id)) + 1,
        visible: true,
      };

      return [...items.slice(0, index + 1), newItem, ...items.slice(index + 1)];
    });
  };

  const deleteItem = (index: number) => {
    setItems((items) => [...items.slice(0, index), ...items.slice(index + 1)]);
  };

  const [variables, setVariables] = useState<[string, number][]>([]);
  const [slices, setSlices] = useState<
    { id: number; axisVar: string; value: number }[]
  >([]);

  return (
    <div className="grid grid-cols-[300px,1fr] grid-rows-[auto,1fr] w-screen h-screen">
      <div className="col-span-full">
        <Navigation width="full" showStartGraphing={false} />
      </div>
      <div className="flex flex-col border-r shadow-lg dark:bg-gray-800 dark:border-0 dark:shadow-none">
        <div className="bg-gray-100 border-b p-2 flex justify-end">
          <div className="relative">
            <Menu>
              <Menu.Button className="p-1 rounded hover:bg-gray-200 active:bg-gray-300">
                <span className="sr-only">Add item</span>
                <span className="not-sr-only">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <line
                      x1={12}
                      y1={2}
                      x2={12}
                      y2={22}
                      className="stroke-gray-700"
                      strokeWidth={3}
                      strokeLinecap="round"
                    />
                    <line
                      x1={2}
                      y1={12}
                      x2={22}
                      y2={12}
                      className="stroke-gray-700"
                      strokeWidth={3}
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </Menu.Button>
              <Menu.Items
                as="div"
                className="absolute z-10 top-full mt-1 right-0 w-48 bg-white shadow-lg rounded-lg p-1 space-y-1"
              >
                {mathObjects.map((object) => (
                  <Menu.Item key={object.spec.name}>
                    {({ active }) => (
                      <button
                        className={classNames(
                          "w-full text-left px-2 py-1 rounded active:bg-gray-200",
                          { "bg-gray-100": active }
                        )}
                        onClick={() => insertItem({ ...object.defaultProps })}
                      >
                        {object.spec.name}
                      </button>
                    )}
                  </Menu.Item>
                ))}
                <div className="border-b" />
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={classNames(
                        "w-full text-left px-2 py-1 rounded active:bg-gray-200",
                        { "bg-gray-100": active }
                      )}
                      onClick={() => {
                        const newName = prompt("Variable letter?");
                        if (
                          newName &&
                          !variables.some(([name]) => name === newName)
                        ) {
                          setVariables((variables) => [
                            ...variables,
                            [newName, 0],
                          ]);
                        }
                      }}
                    >
                      Slider
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={classNames(
                        "w-full text-left px-2 py-1 rounded active:bg-gray-200",
                        { "bg-gray-100": active }
                      )}
                      onClick={() => {
                        const axisVar = prompt("Slice axis (x/y/z)?");
                        if (axisVar) {
                          setSlices((slices) => [
                            ...slices,
                            {
                              id:
                                Math.max(
                                  -1,
                                  ...slices.map((slice) => slice.id)
                                ) + 1,
                              axisVar,
                              value: 0,
                            },
                          ]);
                        }
                      }}
                    >
                      Slice
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Menu>
          </div>
        </div>
        {items.map((item, index) => {
          const object = mathObjects.find(
            (object) => object.spec.name === item.type
          )!;

          const Icon = object.Icon as any;
          const ContentEditor = object.ContentEditor as any;

          return (
            <div
              key={item.id}
              className="relative flex border-b dark:border-gray-900"
            >
              <div className="bg-gray-100 dark:bg-gray-700 dark:border-r dark:border-gray-800 p-2 flex items-center">
                <button
                  className="block"
                  onClick={() => {
                    setItem(item.id, { ...item, visible: !item.visible });
                  }}
                >
                  <div className="not-sr-only w-7 h-7 rounded-full overflow-hidden grid items-stretch justify-items-stretch relative group">
                    {item.visible && <Icon obj={item} />}
                    <div
                      className={classNames(
                        "absolute inset-0 w-full h-full rounded-full",
                        {
                          "hover:bg-gray-700/10": !item.visible,
                          "hover:bg-gray-700/20": item.visible,
                        }
                      )}
                      style={{
                        boxShadow: !item.visible
                          ? "inset 0 0 3px 1px rgba(0, 0, 0, 0.3)"
                          : undefined,
                      }}
                    />
                  </div>
                  <span className="sr-only">Change color</span>
                </button>
              </div>
              <div className="flex-grow grid grid-rows-1 grid-cols-1 justify-items-stretch">
                <ContentEditor
                  obj={item}
                  setObj={(newObj: Item) =>
                    setItem(item.id, { ...item, ...newObj })
                  }
                />
              </div>
              <button
                onClick={() => deleteItem(index)}
                className="absolute top-0 right-0 w-5 h-5 rounded-bl bg-gray-200 dark:bg-gray-600 flex items-center justify-center"
              >
                <span className="sr-only">Delete</span>
                <span className="not-sr-only text-xs text-gray-600 dark:text-gray-300">
                  X
                </span>
              </button>
            </div>
          );
        })}
        <div className="mt-auto space-y-1 mb-2">
          {variables.map(([name, value], index) => (
            <div key={name} className="flex items-center space-x-2 px-2">
              <span>{name}:</span>
              <input
                className="flex-grow"
                type="range"
                min={-5}
                max={5}
                step={0.001}
                value={value}
                onChange={(event) => {
                  const newValue = event.target.valueAsNumber;
                  setVariables((variables) => {
                    const newVariables = [...variables];
                    newVariables[index][1] = newValue;
                    return newVariables;
                  });
                }}
              />
              <span className="w-12">{value}</span>
              <button
                className="bg-gray-100 border rounded px-1 py-px text-sm"
                onClick={() => {
                  setVariables((variables) => {
                    const newVariables = [...variables];
                    newVariables.splice(index, 1);
                    return newVariables;
                  });
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="relative overflow-hidden">
        <Graph3D
          varValues={Object.fromEntries(variables)}
          defaultDimension="2D"
        >
          {({ dimension }) => {
            return (
              <>
                {!items.some((item) => item.type === "Expression") && (
                  <GraphGrid3D normalAxis="z" />
                )}
                <GraphAxis3D axis="x" />
                <GraphAxis3D axis="y" />
                <GraphAxis3D axis="z" />
                <GraphBoundingBox3D />
                {items.map((item) => {
                  const object = mathObjects.find(
                    (object) => object.spec.name === item.type
                  )!;

                  const Output = object.Output as any;

                  return item.visible && <Output obj={item} key={item.id} />;
                })}
                {slices.map((slice) => (
                  <Area
                    key={slice.id}
                    shape={sliceShape}
                    color="black"
                    axes={
                      ["x", "y", "z"].filter(
                        (axis) => axis !== slice.axisVar
                      ) as [Axis, Axis]
                    }
                    normalAxisPosition={slice.value}
                  />
                ))}
              </>
            );
          }}
        </Graph3D>

        {slices.length > 0 && (
          <div className="absolute bottom-0 right-0 flex space-x-4 p-4">
            {slices.map(({ id, axisVar, value }) => (
              <div
                key={id}
                className="bg-gray-900 dark:bg-black p-2 space-y-2 rounded-xl relative"
              >
                <div className="relative w-48 h-48 bg-white rounded overflow-hidden">
                  <button
                    className="bg-gray-800 text-white absolute top-1 right-1 z-10 rounded w-6 h-6 flex items-center justify-center"
                    onClick={() => {
                      setSlices((slices) =>
                        slices.filter((slice) => slice.id !== id)
                      );
                    }}
                  >
                    X
                  </button>
                  <Graph3D
                    defaultDimension="2D"
                    showControls={false}
                    allowPan={false}
                  >
                    {() => {
                      const axes = (["x", "y", "z"] as Axis[]).filter(
                        (axis) => axis !== axisVar
                      );

                      return (
                        <>
                          <GraphAxis3D axis="x" label={axes[0]} />
                          <GraphAxis3D axis="y" label={axes[1]} />
                          <GraphGrid3D />
                          {items.map((item) => (
                            <Fragment key={item.id}>
                              {item.type === "Equation" && (
                                <GraphEquation3D
                                  axes={axes}
                                  equation={item.latex}
                                  color={item.color}
                                  varValues={{
                                    [axisVar]: value,
                                  }}
                                />
                              )}
                            </Fragment>
                          ))}
                        </>
                      );
                    }}
                  </Graph3D>
                </div>
                <div
                  className="text-white flex text-2xl px-2"
                  style={{ fontFamily: "CMU Serif" }}
                >
                  <select
                    className="italic bg-transparent pr-2"
                    value={axisVar}
                    onChange={(event) =>
                      setSlices((slices) =>
                        slices.map((slice) =>
                          slice.id === id
                            ? { ...slice, axisVar: event.target.value }
                            : slice
                        )
                      )
                    }
                  >
                    <option value="x">x</option>
                    <option value="y">y</option>
                    <option value="z">z</option>
                  </select>
                  <span className="mx-2"> = </span>
                  <input
                    className="bg-transparent flex-grow flex-shrink w-0"
                    type="number"
                    value={value}
                    onChange={(event) =>
                      setSlices((slices) =>
                        slices.map((slice) =>
                          slice.id === id
                            ? { ...slice, value: event.target.valueAsNumber }
                            : slice
                        )
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
