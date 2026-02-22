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
            ] as const
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