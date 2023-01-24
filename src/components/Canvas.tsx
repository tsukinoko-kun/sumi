import { useRef, useEffect } from "react";
import { Scalar, Vector2, Vector3 } from "../../public/types/HLSL";
import { Logger } from "../utils/Logger";
import { transpile } from "typescript";
import type { Constructor } from "../utils/Constructor";

type Props = {
    className?: string;
    code: string;
    setOutput: (output: string) => void;
};

type RenferFunction = (
    texCoord: Vector2,
    Scalar: Constructor<Scalar>,
    Vector2: Constructor<Vector2>,
    Vector3: Constructor<Vector3>
) => { render: () => string };

const renderSize = 512;

export const Canvas = (props: Props) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const log = new Logger();
        try {
            const canvas = canvasRef.current;
            if (!canvas) {
                log.error("No canvas");
                return;
            }

            const context = canvas.getContext("2d");
            if (!context) {
                log.error("No canvas context");
                return;
            }

            log.log("Compiling shader...");

            let renderFunction: RenferFunction = () => ({
                render: () => "#000",
            });

            try {
                renderFunction = new Function(
                    "texCoord",
                    "Scalar",
                    "Vector2",
                    "Vector3",
                    "Vector4",
                    transpile(props.code + "\nreturn main();")
                ) as RenferFunction;
            } catch (err: any) {
                log.error("Shader compilation failed");
                if ("message" in err) {
                    log.error((err as Error).message);
                } else if ("toString" in err) {
                    log.error((err as any).toString());
                }
                return;
            }
            log.log("Shader compiled successfully");

            context.clearRect(0, 0, renderSize, renderSize);

            for (let x = 0; x < renderSize; x++) {
                for (let y = 0; y < renderSize; y++) {
                    const texCoord = new Vector2(
                        x / renderSize,
                        y / renderSize
                    );

                    try {
                        context.fillStyle = renderFunction(
                            texCoord,
                            Scalar,
                            Vector2,
                            Vector3
                        ).render();
                    } catch (e) {
                        context.fillStyle = "#000000";
                    }
                    context.fillRect(x, y, 1, 1);
                }
            }

            log.log(
                `Rendered ${context.canvas.width}x${context.canvas.height} pixels`
            );
        } finally {
            props.setOutput(log.toString());
        }
    }, [canvasRef, props.code, props.setOutput]);

    return (
        <canvas
            className={props.className}
            ref={canvasRef}
            width={renderSize}
            height={renderSize}
        />
    );
};
