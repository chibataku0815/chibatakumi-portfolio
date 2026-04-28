declare module "*.css";

declare module "bun:test" {
  type TestCallback = () => void | Promise<void>;

  export const describe: (name: string, callback: TestCallback) => void;
  export const test: (name: string, callback: TestCallback) => void;
  export const expect: (actual: unknown) => {
    not: {
      toBeNull: () => void;
    };
    toBe: (expected: unknown) => void;
    toBeCloseTo: (expected: number, precision?: number) => void;
    toBeNull: () => void;
  };
}
