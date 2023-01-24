import { useEffect, useState } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { Canvas } from "./components/Canvas";
import { retriggerableDelay } from "@frank-mayer/magic/Timing";

const defaultCode = [
    'import type { Renderable } from "sumi/hlsl";',
    'import { Scalar, Vector2, Vector3 } from "sumi/hlsl";',
    'import { texCoord } from "sumi"',
    "",
    "const center = new Vector2(0.5, 0.5)",
    "const perc = 0.4",
    "const width = 0.01",
    "",
    "function main(): Renderable {",
    "    if (Math.nearlyEqual(texCoord.green, Math.sin(texCoord.red * 10) * 0.4 + 0.5)) {",
    "        return Vector3.blue",
    "    }",
    "",
    "    const radial = Math.radialGradientExponential(texCoord, center, Scalar.one, Scalar.two)",
    "    if (radial.red > perc) {",
    "        if (radial.red < perc + width) {",
    "            return Vector3.red",
    "        }",
    "",
    "        return Math.lerp(Vector3.purple, Vector3.red, radial.red)",
    "    }",
    "",
    "    return Scalar.black",
    "}",
    "",
].join("\n");

const trimCode = (code: string) =>
    code.replace(/^\s*import\s+.+"[^"]+";?\s*$/gm, "");

const App = () => {
    const [code, setCode] = useState<string>(trimCode(defaultCode));
    const [hlsl, setHlsl] = useState<string>("");
    const [output, setOutput] = useState<string>("");
    const updateOutput = (value: string) => {
        if (output !== value) {
            setOutput(value);
        }
    };

    if (!hlsl) {
        (async () => {
            const resp = await fetch("/types/HLSL.ts");
            const text = await resp.text();
            setHlsl(text);
        })();
    }

    const monaco = useMonaco();

    useEffect(() => {
        if (!monaco) return;
        if (!hlsl) return;

        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.Latest,
            baseUrl: "node_modules",
            allowNonTsExtensions: true,
            moduleResolution:
                monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            noEmit: true,
            typeRoots: ["node_modules/@types"],
        });

        monaco.languages.typescript.typescriptDefaults.addExtraLib(
            hlsl,
            "node_modules/sumi/hlsl.ts"
        );

        monaco.languages.typescript.typescriptDefaults.addExtraLib(
            [
                'import { Vector2 } from "sumi/hlsl";',
                "/** The texture coordinate of the current pixel */",
                "export const texCoord: Vector2;",
            ].join("\n"),
            "node_modules/sumi/index.ts"
        );

        (globalThis as any).monaco = monaco;
    }, [hlsl, monaco]);

    return (
        <main id="app">
            <Editor
                className="editor"
                defaultLanguage="typescript"
                defaultValue={defaultCode}
                theme="vs-dark"
                options={{
                    autoDetectHighContrast: true,
                    autoIndent: "full",
                    accessibilitySupport: "on",
                    tabSize: 4,
                    inlayHints: {
                        enabled: "on",
                    },
                    copyWithSyntaxHighlighting: false,
                    parameterHints: {
                        enabled: true,
                    },
                }}
                onChange={(value) => {
                    return retriggerableDelay(() => {
                        setCode(value ? trimCode(value) : "");
                    }, 2000);
                }}
            />
            <div className="visual">
                <Canvas
                    className="visual__canvas"
                    code={code}
                    setOutput={updateOutput}
                />
            </div>
            <pre className="log">{output}</pre>
        </main>
    );
};

export default App;
