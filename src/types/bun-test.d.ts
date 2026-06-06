declare module "bun:test" {
  export function describe(name: string, callback: () => void | Promise<void>): void;
  export function test(name: string, callback: () => void | Promise<void>): void;
  export const expect: {
    <T>(actual: T): {
      toBe(expected: T): void;
      toContain(expected: unknown): void;
      toHaveLength(expected: number): void;
    };
  };
}
