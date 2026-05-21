import React, { memo, useMemo, useEffect, useRef, useState } from 'react';
import { List, Hash } from 'lucide-react';

interface Heading {
    level: number;
    text: string;
    id: string;
}

interface MarkdownTOCProps {
    content: string;
}

function extractHeadings(content: string): Heading[] {
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    const headings: Heading[] = [];
    let match: RegExpExecArray | null;

    while ((match = headingRegex.exec(content)) !== null) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = text
            .toLowerCase()
            .replace(/<[^>]*>/g, '')
            .replace(/[^\w一-鿿㐀-䶿豈-﫿-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        headings.push({ level, text, id });
    }

    return headings;
}

export const MarkdownTOC: React.FC<MarkdownTOCProps> = memo(({ content }) => {
    const headings = useMemo(() => extractHeadings(content), [content]);
    const [activeId, setActiveId] = useState<string>('');
    const containerRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        // 查找包含 markdown-preview 的元素（需要等到渲染后）
        const timer = setTimeout(() => {
            containerRef.current = document.getElementById('markdown-preview');
        }, 200);
        return () => clearTimeout(timer);
    }, []);

    // IntersectionObserver 高亮当前可见标题
    useEffect(() => {
        if (!containerRef.current || headings.length === 0) return;

        const headingElements = headings
            .map(h => document.getElementById(h.id))
            .filter(Boolean) as HTMLElement[];

        if (headingElements.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                }
            },
            { rootMargin: '-60px 0px -80% 0px', threshold: 0 }
        );

        headingElements.forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, [headings, content]);

    const handleClick = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveId(id);
        }
    };

    if (headings.length === 0) {
        return (
            <div className="w-56 flex-shrink-0 border-r border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-gray-400 mb-3">
                    <List size={16} />
                    <span className="text-xs font-medium">目录</span>
                </div>
                <p className="text-xs text-gray-400">无标题</p>
            </div>
        );
    }

    return (
        <div className="w-56 flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col h-full">
            {/* TOC Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
                <List size={16} className="text-blue-500" />
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">目录</span>
                <span className="text-xs text-gray-400 ml-auto">{headings.length}</span>
            </div>

            {/* TOC Items */}
            <nav className="flex-1 overflow-y-auto py-2">
                {headings.map((h, i) => (
                    <button
                        key={i}
                        onClick={() => handleClick(h.id)}
                        className={`
                            w-full text-left px-4 py-1.5 text-xs transition-colors truncate block
                            hover:bg-blue-50 hover:text-blue-600
                            ${activeId === h.id
                                ? 'bg-blue-50 text-blue-600 font-medium border-r-2 border-blue-500'
                                : 'text-gray-600 border-r-2 border-transparent'
                            }
                        `}
                        style={{ paddingLeft: `${12 + (h.level - 1) * 14}px` }}
                        title={h.text}
                    >
                        <span className="inline-flex items-center gap-1.5">
                            <Hash size={10} className="flex-shrink-0 opacity-40" />
                            {h.text}
                        </span>
                    </button>
                ))}
            </nav>
        </div>
    );
}, (prevProps, nextProps) => {
    return prevProps.content === nextProps.content;
});