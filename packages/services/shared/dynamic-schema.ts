import { z } from "zod";

type FieldDef = z.ZodTypeAny | (() => z.ZodTypeAny);

type ResolveField<D extends FieldDef> = D extends () => infer R
    ? R extends z.ZodTypeAny
        ? R
        : never
    : D extends z.ZodTypeAny
      ? D
      : never;

type ShapeFromFields<T extends Record<string, FieldDef>> = {
    [K in keyof T]: ResolveField<T[K]>;
};

export function dynamicObject<T extends Record<string, FieldDef>>(
    fields: T,
): z.ZodObject<ShapeFromFields<T>> {
    const shape = {} as { [K in keyof T]: z.ZodTypeAny };

    for (const key of Object.keys(fields) as (keyof T)[]) {
        const def = fields[key];
        shape[key] = (typeof def === "function" ? (def as () => z.ZodTypeAny)() : def) as z.ZodTypeAny;
    }

    return z.object(shape) as z.ZodObject<ShapeFromFields<T>>;
}

export function dynamicEnum<T extends readonly [string, ...string[]]>(values: T) {
    return z.enum(values);
}

export function dynamicArray<T extends z.ZodTypeAny>(itemSchema: T | (() => T)) {
    const schema = typeof itemSchema === "function" ? itemSchema() : itemSchema;
    return z.array(schema);
}
