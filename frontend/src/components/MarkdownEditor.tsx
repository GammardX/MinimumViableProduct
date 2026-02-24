import EasyMDE from 'easymde';
import 'easymde/dist/easymde.min.css';
import { useEffect, useMemo, useState, type MouseEvent } from 'react'; 
import SimpleMDE from 'react-simplemde-editor';
import '../style/md-editor.css';
import hljs from 'highlight.js';
import 'highlight.js/styles/vs.css';
import './utils/languageImports';

interface MarkdownEditorProps {
    initialValue?: string;
    onChange?: (text: string) => void;
    onNavigate?: (target: string, anchor?: string) => void;
    onInstanceReady?: (instance: EasyMDE) => void; 
}

export default function MarkdownEditor({
    initialValue = '',
    onChange,
    onNavigate,
    onInstanceReady 
}: MarkdownEditorProps) {
    const [value, setValue] = useState(initialValue);
    const [editorInstance, setEditorInstance] = useState<EasyMDE | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    const options = useMemo(() => {
        return {
            spellChecker: false,
            placeholder: 'Scrivi qui le tue note in Markdown...',
            autofocus: false,
            status: false,
            sideBySideFullscreen: false,
            renderingConfig: {
                singleLineBreaks: false,
                codeSyntaxHighlighting: true,
                hljs: hljs
            },
            toolbar: [
                'bold',
                'italic',
                'heading',
                {
                    name: "select-chapter",
                    action: (editor: EasyMDE) => {
                        const cm = editor.codemirror;
                        const cursor = cm.getCursor();
                        let startLine = 0;
                        let headingLevel = 0;
                        
                        for (let i = cursor.line; i >= 0; i--) {
                            const match = cm.getLine(i).match(/^(#{1,6})\s/);
                            if (match) {
                                startLine = i;
                                headingLevel = match[1].length;
                                break;
                            }
                        }
                        
                        let endLine = cm.lineCount() - 1;
                        let endChar = cm.getLine(endLine).length;
                        
                        if (headingLevel > 0) {
                            for (let i = startLine + 1; i < cm.lineCount(); i++) {
                                const match = cm.getLine(i).match(/^(#{1,6})\s/);
                                if (match && match[1].length <= headingLevel) {
                                    endLine = i - 1; 
                                    endChar = Math.max(0, cm.getLine(endLine).length);
                                    break;
                                }
                            }
                        }
                        
                        cm.setSelection(
                            { line: startLine, ch: 0 }, 
                            { line: endLine, ch: endChar }
                        );
                        cm.focus(); 
                    },
                    className: "fa fa-bookmark", 
                    title: "Seleziona l'intero capitolo",
                },
                '|',
                'code',
                'quote',
                'unordered-list',
                'ordered-list',
                'table',
                '|',
                'link',
                'image',
                '|',
                'preview',
                'side-by-side'
            ] as any 
        };
    }, []);

    const handleChange = (text: string) => {
        setValue(text);
        if (onChange) onChange(text);
    };

    useEffect(() => {
        if (!editorInstance) return;

        if (onInstanceReady) {
            onInstanceReady(editorInstance);
        }
        
        if (!editorInstance.isSideBySideActive()) {
            EasyMDE.toggleSideBySide(editorInstance);
        }

        setTimeout(() => {
            if (editorInstance.codemirror) {
                editorInstance.codemirror.scrollTo(0, 0);
            }
            const editorAny = editorInstance as any;
            if (editorAny.gui && editorAny.gui.preview) {
                editorAny.gui.preview.scrollTop = 0;
            }
            setIsVisible(true); 
            
        }, 50); 
        
    }, [editorInstance]);

    const handlePreviewClick = (e: MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        const link = target.closest('a'); 
        
        if (link) {
            const href = link.getAttribute('href');
            
            if (href && href.startsWith('#note:')) {
                e.preventDefault(); 
                
                const rawStr = href.replace('#note:', '');
                const parts = rawStr.split('#');
                const noteTarget = parts[0];   
                const anchorTarget = parts[1]; 

                if (onNavigate) {
                    onNavigate(noteTarget, anchorTarget); 
                }
            }
            else if (href && href.startsWith('#')) {
                e.preventDefault(); 
                
                const rawAnchor = href.substring(1); 
                
                const elementId = rawAnchor.toLowerCase().replace(/\s+/g, '');
                
                const element = document.getElementById(rawAnchor) || document.getElementById(elementId);
                
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' }); 
                }
            }
        }
    };

    return (
        <div 
            className={`h-full editor-fade-container ${isVisible ? 'visible' : ''}`} 
            onClick={handlePreviewClick}
        >
            <SimpleMDE
                value={value}
                onChange={handleChange}
                options={options}
                getMdeInstance={setEditorInstance}
                className='h-full'
            />
        </div>
    );
}