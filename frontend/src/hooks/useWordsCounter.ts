// --- FUNZIONI UTILITY ---

export const getPreviewStats = (markdown: string) => {
    if (!markdown) return { words: 0, chars: 0 };

    const plainText = markdown
        .replace(/#+\s/g, '')
        .replace(/(\*\*|__)(.*?)\1/g, '$2')
        .replace(/(\*|_)(.*?)\1/g, '$2')
        .replace(/~~(.*?)~~/g, '$1')
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/`{1,3}([^`]+)`{1,3}/g, '$1')
        .replace(/^\s*[>\-\*\+]\s+/gm, '')
        .replace(/^\s*\d+\.\s+/gm, '');

    const chars = plainText.length;
    const words = plainText.trim().split(/\s+/).filter(w => w.length > 0).length;

    return { words, chars };
};
