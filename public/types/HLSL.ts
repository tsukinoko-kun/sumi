import { Constructor } from "../../src/utils/Constructor";

declare global {
    interface Math {
        /**
         * Linearly interpolates between a and b by t.
         */
        lerp(a: number, b: number, t: number): number;
        /**
         * Linearly interpolates between a and b by t.
         */
        lerp<V extends Renderable>(a: V, b: V, t: number): V;

        /**
         * Inverse linearly interpolates between a and b by t.
         *
         * @returns The value t such that lerp(a, b, t) = v.
         */
        inverseLerp(a: number, b: number, v: number): number;
        /**
         * Inverse linearly interpolates between a and b by t.
         *
         * @returns The value t such that lerp(a, b, t) = v.
         */
        inverseLerp<V extends Renderable>(a: V, b: V, v: V): number;

        /**
         * Clamps a value between a minimum and maximum value.
         */
        clamp(x: number, min: number, max: number): number;
        /**
         * Clamps a value between a minimum and maximum value.
         */
        clamp<V extends Renderable>(x: V, min: V, max: V): V;

        /**
         * Remaps a value from one range to another.
         * @param iMin The minimum value of the input range.
         * @param iMax The maximum value of the input range.
         * @param oMin The minimum value of the output range.
         * @param oMax The maximum value of the output range.
         * @param v The value to remap. This value must be between iMin and iMax.
         * @returns The remapped value.
         * @throws {Error} If v is not between iMin and iMax.
         */
        remap(
            iMin: number,
            iMax: number,
            oMin: number,
            oMax: number,
            v: number
        ): number;
        /**
         * Remaps a value from one range to another.
         * @param iMin The minimum value of the input range.
         * @param iMax The maximum value of the input range.
         * @param oMin The minimum value of the output range.
         * @param oMax The maximum value of the output range.
         * @param v The value to remap. This value must be between iMin and iMax.
         * @returns The remapped value.
         * @throws {Error} If v is not between iMin and iMax.
         */
        remap<V>(iMin: V, iMax: V, oMin: V, oMax: V, v: V): V;

        radialGradientExponential(
            uv: Vector2,
            centerPosition: Vector2,
            radius: Scalar,
            density: Scalar
        ): Scalar;

        nearlyEqual(a: number, b: number, epsilon?: number): boolean;
    }
}

Math.lerp = (<T extends number | Renderable>(a: T, b: T, t: number): T => {
    if (typeof a === "number" && typeof b === "number") {
        return (a + (b - a) * t) as T;
    } else if (
        typeof a == "object" &&
        "dimensions" in a &&
        typeof b == "object" &&
        "dimensions" in b
    ) {
        const Type = (
            a.dimensions > b.dimensions ? a.constructor : b.constructor
        ) as Constructor<T>;

        const values = new Array<number>(a.dimensions);
        for (let i = 0; i < a.dimensions; i++) {
            values[i] = Math.lerp(
                a.values[i] ?? defaultValueFor(i),
                b.values[i] ?? defaultValueFor(i),
                t
            );
        }
        return new Type(...values) as T;
    }

    throw new Error("Invalid arguments for Math.lerp");
}) as typeof Math.lerp;

Math.inverseLerp = (<T extends Renderable | number>(
    a: T,
    b: T,
    v: T
): number => {
    if (
        typeof a === "number" &&
        typeof b === "number" &&
        typeof v === "number"
    ) {
        return (v - a) / (b - a);
    } else if (
        typeof a == "object" &&
        "dimensions" in a &&
        typeof b == "object" &&
        "dimensions" in b &&
        typeof v == "object" &&
        "dimensions" in v
    ) {
        const maxDimension = Math.max(a.dimensions, b.dimensions, v.dimensions);
        let sum = 0;
        switch (maxDimension) {
            case 4:
                sum += Math.inverseLerp(a.alpha, b.alpha, v.alpha);
            case 3:
                sum += Math.inverseLerp(a.blue, b.blue, v.blue);
            case 2:
                sum += Math.inverseLerp(a.green, b.green, v.green);
            case 1:
                sum += Math.inverseLerp(a.red, b.red, v.red);
        }
        return sum / maxDimension;
    }
    throw new Error("Invalid arguments for Math.inverseLerp");
}) as typeof Math.inverseLerp;

Math.clamp = (<T extends Renderable | number>(x: T, min: T, max: T): T => {
    if (
        typeof x === "number" &&
        typeof min === "number" &&
        typeof max === "number"
    ) {
        return Math.min(Math.max(x, min), max) as T;
    } else if (
        typeof x == "object" &&
        "dimensions" in x &&
        typeof min == "object" &&
        "dimensions" in min &&
        typeof max == "object" &&
        "dimensions" in max
    ) {
        const Type = (
            x.dimensions > min.dimensions ? x.constructor : min.constructor
        ) as Constructor<T>;

        const values = new Array<number>(x.dimensions);
        for (let i = 0; i < x.dimensions; i++) {
            values[i] = Math.clamp(
                x.values[i] ?? defaultValueFor(i),
                min.values[i] ?? defaultValueFor(i),
                max.values[i]
            );
        }
        return new Type(...values);
    } else {
        throw new Error("Invalid arguments for Math.clamp");
    }
}) as typeof Math.clamp;

Math.radialGradientExponential = (
    uv: Vector2,
    centerPosition: Vector2,
    radius: Scalar,
    density: Scalar
): Scalar => {
    const distance = uv.distance(centerPosition).red;
    const value = Math.exp(-distance * density.red);

    return new Scalar(value);
};

Math.nearlyEqual = (a: number, b: number, epsilon = 0.1): boolean => {
    return Math.abs(a - b) < epsilon;
};

export abstract class Renderable {
    abstract get values(): Array<number>;
    abstract get red(): number;
    abstract get green(): number;
    abstract get blue(): number;
    abstract get alpha(): number;

    abstract get dimensions(): number;

    render(): string {
        const r = Math.clamp(this.red, 0, 1) * 255;
        const g = Math.clamp(this.green, 0, 1) * 255;
        const b = Math.clamp(this.blue, 0, 1) * 255;
        return `rgb(${r}, ${g}, ${b})`;
    }
}

/**
 * A scalar value, represented as a grayscale color.
 *
 * ```TypeScript
 * const s = new Scalar(0.5);
 * s.render(); // "#808080"
 * ```
 */
export class Scalar extends Renderable {
    readonly values: [number];
    readonly dimensions = 1;

    get red() {
        return this.values[0];
    }

    get green() {
        return this.values[0];
    }

    get blue() {
        return this.values[0];
    }

    get alpha() {
        return defaultValueFor(3);
    }

    constructor(scalar: number) {
        super();
        this.values = [scalar];
    }

    static minusOne: Scalar = new Scalar(-1);
    static one = new Scalar(1);
    static zero = new Scalar(0);
    static half = new Scalar(0.5);
    static quarter = new Scalar(0.25);
    static threeQuarters = new Scalar(0.75);
    static two = new Scalar(2);
    static three = new Scalar(3);
    static four = new Scalar(4);
    static five = new Scalar(5);

    static white = new Scalar(1);
    static black = new Scalar(0);
    static gray = new Scalar(0.5);
    static darkGray = new Scalar(0.25);
    static lightGray = new Scalar(0.75);

    /**
     * Multiply this scalar by another {@link Renderable}.
     */
    multiply<V extends Renderable>(other: V): V {
        const Type = other.constructor as Constructor<V>;
        const values = new Array<number>(other.dimensions);
        for (let i = 0; i < other.dimensions; i++) {
            values[i] = this.values[0] * other.values[i];
        }
        return new Type(...values) as V;
    }

    /**
     * Add this scalar to another {@link Renderable}.
     */
    add<V extends Renderable>(other: V): V {
        const Type = other.constructor as Constructor<V>;
        const values = new Array<number>(other.dimensions);
        for (let i = 0; i < other.dimensions; i++) {
            values[i] = this.values[0] + other.values[i];
        }
        return new Type(...values) as V;
    }

    /**
     * Subtract this scalar from another {@link Renderable}.
     */
    subtract<V extends Renderable>(other: V): V {
        const Type = other.constructor as Constructor<V>;
        const values = new Array<number>(other.dimensions);
        for (let i = 0; i < other.dimensions; i++) {
            values[i] = this.values[0] - other.values[i];
        }
        return new Type(...values) as V;
    }

    /**
     * Divide this scalar by another {@link Renderable}.
     */
    divide<V extends Renderable>(other: V): V {
        const Type = other.constructor as Constructor<V>;
        const values = new Array<number>(other.dimensions);
        for (let i = 0; i < other.dimensions; i++) {
            if (other.values[i] === 0) {
                values[i] = 0;
            } else {
                values[i] = this.values[0] / other.values[i];
            }
        }
        return new Type(...values) as V;
    }

    /**
     * Compute the distance between this and another {@link Scalar}.
     */
    distance(other: Scalar): Scalar {
        return new Scalar(Math.abs(this.values[0] - other.values[0]));
    }
}

/**
 * A 2D vector, represented as a color.
 * The red channel represents the x component, and the green channel represents the y component.
 * The blue channel is always 0.
 * The alpha channel is always 1.
 * ```TypeScript
 * const v = new Vector2(0.25, 0.75);
 * v.render(); // "#40b000"
 * ```
 */
export class Vector2 extends Renderable {
    readonly values: [number, number];
    readonly dimensions = 2;

    get red() {
        return this.values[0];
    }

    get green() {
        return this.values[1];
    }

    get blue() {
        return defaultValueFor(2);
    }

    get alpha() {
        return defaultValueFor(3);
    }

    constructor(r: number, g: number) {
        super();
        this.values = [r, g];
    }

    /**
     * Multiply this vector by a {@link Scalar}.
     */
    multiply(other: Scalar): Vector2;
    /**
     * Multiply this vector by another {@link Vector2}.
     */
    multiply(other: Vector2): Vector2;
    multiply(other: Renderable): Renderable {
        switch (other.dimensions) {
            case 1:
            case 2:
                return new Vector2(
                    this.red * other.red,
                    this.green * other.green
                ) as Renderable;
            default:
                throw new Error("Invalid arguments for Vector2.multiply");
        }
    }

    /**
     * Add this vector to a {@link Scalar}.
     */
    add(other: Scalar): Vector2;
    /**
     * Add this vector to another {@link Vector2}.
     */
    add(other: Vector2): Vector2;
    add(other: Renderable): Renderable {
        switch (other.dimensions) {
            case 1:
            case 2:
                return new Vector2(
                    this.red + other.red,
                    this.green + other.green
                ) as Renderable;
            default:
                throw new Error("Invalid arguments for Vector2.add");
        }
    }

    /**
     * Subtract this vector from a {@link Scalar}.
     */
    subtract(other: Scalar): Vector2;
    /**
     * Subtract this vector from another {@link Vector2}.
     */
    subtract(other: Vector2): Vector2;
    subtract(other: Renderable): Renderable {
        switch (other.dimensions) {
            case 1:
            case 2:
                return new Vector2(
                    this.red - other.red,
                    this.green - other.green
                ) as Renderable;
            default:
                throw new Error("Invalid arguments for Vector2.subtract");
        }
    }

    /**
     * Divide this vector by a {@link Scalar}.
     */
    divide(other: Scalar): Vector2;
    /**
     * Divide this vector by another {@link Vector2}.
     */
    divide(other: Vector2): Vector2;
    divide(other: Renderable): Renderable {
        switch (other.dimensions) {
            case 1:
            case 2:
                return new Vector2(
                    this.red / other.red,
                    this.green / other.green
                ) as Renderable;
            default:
                throw new Error("Invalid arguments for Vector2.divide");
        }
    }

    /**
     * Compute the distance between this and another {@link Vector2}.
     */
    distance(other: Vector2): Scalar {
        return new Scalar(
            Math.sqrt(
                Math.pow(this.red - other.red, 2) +
                    Math.pow(this.green - other.green, 2)
            )
        );
    }

    /**
     * Compute the dot product of this and another {@link Vector2}.
     */
    dot(other: Vector2): Scalar {
        return new Scalar(this.red * other.red + this.green * other.green);
    }

    /**
     * Compute the cross product of this and another {@link Vector2}.
     */
    cross(other: Vector2): Scalar {
        return new Scalar(this.red * other.green - this.green * other.red);
    }

    /**
     * Compute the length of this vector.
     */
    length(): Scalar {
        return new Scalar(
            Math.sqrt(Math.pow(this.red, 2) + Math.pow(this.green, 2))
        );
    }
}

/**
 * A 3D vector, represented as a color.
 * The red channel represents the x component, the green channel represents the y component, and the blue channel represents the z component.
 * The alpha channel is always 1.
 * ```TypeScript
 * const v = new Vector3(0.25, 0.75, 0.5);
 * v.render(); // "#40b080"
 * ```
 */
export class Vector3 extends Renderable {
    readonly values: [number, number, number];
    readonly dimensions = 3;

    get red() {
        return this.values[0];
    }

    get green() {
        return this.values[1];
    }

    get blue() {
        return this.values[2];
    }

    get alpha() {
        return defaultValueFor(3);
    }

    constructor(r: number, g: number, b: number) {
        super();
        this.values = [r, g, b];
    }

    static white = new Vector3(1, 1, 1);
    static black = new Vector3(0, 0, 0);
    static red = new Vector3(1, 0, 0);
    static green = new Vector3(0, 1, 0);
    static blue = new Vector3(0, 0, 1);
    static yellow = new Vector3(1, 1, 0);
    static cyan = new Vector3(0, 1, 1);
    static magenta = new Vector3(1, 0, 1);
    static gray = new Vector3(0.5, 0.5, 0.5);
    static lightGray = new Vector3(0.75, 0.75, 0.75);
    static darkGray = new Vector3(0.25, 0.25, 0.25);
    static orange = new Vector3(1, 0.5, 0);
    static purple = new Vector3(0.5, 0, 0.5);
    static brown = new Vector3(0.5, 0.25, 0);
    static pink = new Vector3(1, 0.75, 0.75);

    /**
     * Create a {@link Vector3} from a hex color string.
     * @example `Vector3.fromHex("#ff0000")` is equivalent to `Vector3.red`.
     */
    static fromHex(color: string): Vector3 {
        const match = color.match(
            /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i
        );

        if (match) {
            return new Vector3(
                parseInt(match[1], 16) / 255,
                parseInt(match[2], 16) / 255,
                parseInt(match[3], 16) / 255
            );
        }

        throw new Error("Invalid color string");
    }

    /**
     * Multiply this vector by a {@link Scalar}.
     */
    multiply(other: Scalar): Vector3;
    /**
     * Multiply this vector by another {@link Vector3}.
     */
    multiply(other: Vector3): Vector3;
    multiply(other: Renderable): Renderable {
        switch (other.dimensions) {
            case 1:
            case 3:
                return new Vector3(
                    this.red * other.red,
                    this.green * other.green,
                    this.blue * other.blue
                ) as Renderable;
            default:
                throw new Error("Invalid arguments for Vector3.multiply");
        }
    }

    /**
     * Add this vector to a {@link Scalar}.
     */
    add(other: Scalar): Vector3;
    /**
     * Add this vector to another {@link Vector3}.
     */
    add(other: Vector3): Vector3;
    add(other: Renderable): Renderable {
        switch (other.dimensions) {
            case 1:
            case 3:
                return new Vector3(
                    this.red + other.red,
                    this.green + other.green,
                    this.blue + other.blue
                ) as Renderable;
            default:
                throw new Error("Invalid arguments for Vector3.add");
        }
    }

    /**
     * Subtract this vector from a {@link Scalar}.
     */
    subtract(other: Scalar): Vector3;
    /**
     * Subtract this vector from another {@link Vector3}.
     */
    subtract(other: Vector3): Vector3;
    subtract(other: Renderable): Renderable {
        switch (other.dimensions) {
            case 1:
            case 3:
                return new Vector3(
                    this.red - other.red,
                    this.green - other.green,
                    this.blue - other.blue
                ) as Renderable;
            default:
                throw new Error("Invalid arguments for Vector3.subtract");
        }
    }

    /**
     * Divide this vector by a {@link Scalar}.
     */
    divide(other: Scalar): Vector3;
    /**
     * Divide this vector by another {@link Vector3}.
     */
    divide(other: Vector3): Vector3;
    divide(other: Renderable): Renderable {
        switch (other.dimensions) {
            case 1:
            case 3:
                return new Vector3(
                    this.red / other.red,
                    this.green / other.green,
                    this.blue / other.blue
                ) as Renderable;
            default:
                throw new Error("Invalid arguments for Vector3.divide");
        }
    }

    /**
     * Compute the distance between this vector and another {@link Vector3}.
     */
    distance(other: Vector3): Scalar {
        return this.subtract(other).length();
    }

    /**
     * Compute the dot product of this vector and another {@link Vector3}.
     */
    dot(other: Vector3): Scalar {
        return new Scalar(
            this.red * other.red +
                this.green * other.green +
                this.blue * other.blue
        );
    }

    /**
     * Compute the cross product of this vector and another {@link Vector3}.
     */
    cross(other: Vector3): Vector3 {
        return new Vector3(
            this.green * other.blue - this.blue * other.green,
            this.blue * other.red - this.red * other.blue,
            this.red * other.green - this.green * other.red
        );
    }

    /**
     * Compute the length of this vector.
     */
    length(): Scalar {
        return new Scalar(Math.sqrt(this.lengthSquared().red));
    }

    /**
     * Compute the squared length of this vector.
     * This is faster than {@link Vector3.length} because it avoids a square root operation.
     */
    lengthSquared(): Scalar {
        return new Scalar(
            this.red * this.red +
                this.green * this.green +
                this.blue * this.blue
        );
    }
}

// /**
//  * A 4D vector, represented as a color.
//  * The red channel represents the x component, the green channel represents the y component, the blue channel represents the z component, and the alpha channel represents the w component.
//  * ```TypeScript
//  * const v = new Vector4(0.25, 0.75, 0.5, 0.25);
//  * v.render(); // "#40b08040"
//  * ```
//  */
// export class Vector4 extends Renderable {
//     readonly values: [number, number, number, number];
//     readonly dimensions = 4;

//     get red() {
//         return this.values[0];
//     }

//     get green() {
//         return this.values[1];
//     }

//     get blue() {
//         return this.values[2];
//     }

//     get alpha() {
//         return this.values[3];
//     }

//     constructor(r: number, g: number, b: number, a: number) {
//         super();
//         this.values = [r, g, b, a];
//     }

//     static white = new Vector4(1, 1, 1, 1);
//     static black = new Vector4(0, 0, 0, 1);
//     static red = new Vector4(1, 0, 0, 1);
//     static green = new Vector4(0, 1, 0, 1);
//     static blue = new Vector4(0, 0, 1, 1);
//     static yellow = new Vector4(1, 1, 0, 1);
//     static cyan = new Vector4(0, 1, 1, 1);
//     static magenta = new Vector4(1, 0, 1, 1);
//     static gray = new Vector4(0.5, 0.5, 0.5, 1);
//     static lightGray = new Vector4(0.75, 0.75, 0.75, 1);
//     static darkGray = new Vector4(0.25, 0.25, 0.25, 1);
//     static orange = new Vector4(1, 0.5, 0, 1);
//     static purple = new Vector4(0.5, 0, 0.5, 1);
//     static brown = new Vector4(0.5, 0.25, 0, 1);
//     static pink = new Vector4(1, 0.75, 0.75, 1);

//     static fromHex(color: string): Vector4 {
//         const match = color.match(
//             /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i
//         );

//         if (match) {
//             return new Vector4(
//                 parseInt(match[1], 16) / 255,
//                 parseInt(match[2], 16) / 255,
//                 parseInt(match[3], 16) / 255,
//                 parseInt(match[4], 16) / 255
//             );
//         }

//         throw new Error("Invalid color string");
//     }

//     /**
//      * Multiply this vector by a {@link Scalar}.
//      */
//     multiply(other: Scalar): Vector4;
//     /**
//      * Multiply this vector by another {@link Vector4}.
//      */
//     multiply(other: Vector4): Vector4;
//     multiply(other: Renderable): Renderable {
//         switch (other.dimensions) {
//             case 1:
//             case 4:
//                 return new Vector4(
//                     this.red * other.red,
//                     this.green * other.green,
//                     this.blue * other.blue,
//                     this.alpha * other.alpha
//                 ) as Renderable;
//             default:
//                 throw new Error("Invalid arguments for Vector4.multiply");
//         }
//     }

//     /**
//      * Add this vector to a {@link Scalar}.
//      */
//     add(other: Scalar): Vector4;
//     /**
//      * Add this vector to another {@link Vector4}.
//      */
//     add(other: Vector4): Vector4;
//     add(other: Renderable): Renderable {
//         switch (other.dimensions) {
//             case 1:
//             case 4:
//                 return new Vector4(
//                     this.red + other.red,
//                     this.green + other.green,
//                     this.blue + other.blue,
//                     this.alpha + other.alpha
//                 ) as Renderable;
//             default:
//                 throw new Error("Invalid arguments for Vector4.add");
//         }
//     }

//     /**
//      * Subtract this vector from a {@link Scalar}.
//      */
//     subtract(other: Scalar): Vector4;
//     /**
//      * Subtract this vector from another {@link Vector4}.
//      */
//     subtract(other: Vector4): Vector4;
//     subtract(other: Renderable): Renderable {
//         switch (other.dimensions) {
//             case 1:
//             case 4:
//                 return new Vector4(
//                     this.red - other.red,
//                     this.green - other.green,
//                     this.blue - other.blue,
//                     this.alpha - other.alpha
//                 ) as Renderable;
//             default:
//                 throw new Error("Invalid arguments for Vector4.subtract");
//         }
//     }

//     /**
//      * Divide this vector by a {@link Scalar}.
//      */
//     divide(other: Scalar): Vector4;
//     /**
//      * Divide this vector by another {@link Vector4}.
//      */
//     divide(other: Vector4): Vector4;
//     divide(other: Renderable): Renderable {
//         switch (other.dimensions) {
//             case 1:
//             case 4:
//                 return new Vector4(
//                     this.red / other.red,
//                     this.green / other.green,
//                     this.blue / other.blue,
//                     this.alpha / other.alpha
//                 ) as Renderable;
//             default:
//                 throw new Error("Invalid arguments for Vector4.divide");
//         }
//     }
// }

const defaultValueFor = (index: number): number => {
    switch (index) {
        case 0:
        case 1:
        case 2:
            return 0;
        case 3:
            return 1;
        default:
            throw new Error(`Invalid dimension index "${index}"`);
    }
};
