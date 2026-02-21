declare global {
    interface Window {
        showOpenFilePicker?: (options?: any) => Promise<any>;
        showSaveFilePicker?: (options?: any) => Promise<any>;
    }
}

export const fileService = {
    async importFile(): Promise<{ title: string; content: string } | null> {
        if (typeof window.showOpenFilePicker === 'function') {
            try {
                const [fileHandle] = await window.showOpenFilePicker({
                    types: [{
                        description: 'Markdown Files',
                        accept: { 'text/markdown': ['.md'], 'text/plain': ['.txt'] }
                    }],
                    multiple: false
                });
                
                const file = await fileHandle.getFile();
                const content = await file.text();
                return { title: file.name.replace(/\.[^/.]+$/, ''), content };

            } catch (err: any) {
                if (err.name === 'AbortError') return null;

                console.warn('API Moderna fallita o bloccata, passo al metodo classico...', err);
            }
        }

        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.md,.txt';
            input.style.display = 'none'; 

            input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        const content = evt.target?.result as string;
                        const title = file.name.replace(/\.[^/.]+$/, '');
                        resolve({ title, content });
                    };
                    reader.readAsText(file);
                } else {
                    resolve(null);
                }
            };

            document.body.appendChild(input);
            input.click();
            
            setTimeout(() => {
                document.body.removeChild(input);
            }, 1000);
        });
    },

    async exportFile(title: string, content: string) {
        const filename = `${title.trim() || 'nota'}.md`;

        if (typeof window.showSaveFilePicker === 'function') {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: 'Markdown File',
                        accept: { 'text/markdown': ['.md'] }
                    }]
                });
                const writable = await handle.createWritable();
                await writable.write(content);
                await writable.close();
                return; 

            } catch (err: any) {
                if (err.name === 'AbortError') return; 
                console.warn('API Salvataggio moderna fallita, passo al metodo classico...', err);
            }
        }

        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click(); 
        
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    }
};