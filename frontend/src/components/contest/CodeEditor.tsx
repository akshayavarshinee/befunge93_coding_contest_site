import { useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { motion } from 'framer-motion';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

const CodeEditor = ({ value, onChange, readOnly = false }: CodeEditorProps) => {
  const editorRef = useRef<any>(null);

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full rounded-lg overflow-hidden border border-border/50 bg-[#0d0d0d]"
    >
      <div className="flex items-center justify-between px-4 py-2 bg-secondary/30 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            {/* <div className="w-3 h-3 rounded-full bg-destructive/80" />
            <div className="w-3 h-3 rounded-full bg-warning-amber/80" />
            <div className="w-3 h-3 rounded-full bg-terminal-green/80" /> */}
            <img src="../../favicon.ico" alt="Terminal" className="w-4 h-4" />
          </div>
          <span className="text-sm font-mono text-muted-foreground ml-2">befunge-93</span>
        </div>
        <span className="text-xs text-muted-foreground font-mono">80×25 grid</span>
      </div>
      <Editor
        height="calc(100% - 40px)"
        defaultLanguage="plaintext"
        theme="vs-dark"
        value={value}
        onChange={(val) => onChange(val || '')}
        onMount={handleEditorMount}
        options={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 14,
          lineHeight: 20,
          padding: { top: 16, bottom: 16 },
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'off',
          readOnly,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          renderLineHighlight: 'gutter',
          renderWhitespace: 'boundary',
          bracketPairColorization: { enabled: false },
          lineNumbers: 'on',
          lineDecorationsWidth: 10,
          folding: false,
          glyphMargin: false,
          automaticLayout: true,
        }}
      />
    </motion.div>
  );
};

export default CodeEditor;
