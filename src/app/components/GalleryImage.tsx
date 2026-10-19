'use client';

import Image from 'next/image';

function shouldSkipOptimization(src: string) {
    return src.startsWith('data:') || src.startsWith('blob:') || src.includes('localhost:8000') || src.includes('127.0.0.1:8000');
}

function IncomingImage({ src, alt, priority, sizes }: { src: string; alt: string; priority: boolean; sizes: string }) {
    return (
        <Image
            unoptimized={shouldSkipOptimization(src)} fill draggable={false} priority={priority} sizes={sizes}
            src={src} alt={alt}
            className="absolute inset-0 h-full w-full object-cover"
        />
    );
}

export function GalleryImage({ src, previewSrc, alt, className = '', priority = false, sizes = '100vw' }: { src: string; previewSrc?: string; alt: string; className?: string; priority?: boolean; sizes?: string }) {
    return (
        <div className={`relative w-full h-full overflow-hidden bg-slate-100 dark:bg-slate-800 ${className}`}>
            {previewSrc && (
                <Image
                    unoptimized fill draggable={false} sizes={sizes}
                    src={previewSrc} alt="" aria-hidden="true"
                    className="absolute inset-0 h-full w-full scale-105 object-cover blur-md"
                />
            )}
            <IncomingImage key={src} src={src} alt={alt} priority={priority} sizes={sizes} />
        </div>
    );
}
