'use client';

import Image from 'next/image';
import { useState } from 'react';

function shouldSkipOptimization(src: string) {
    return src.startsWith('data:') || src.startsWith('blob:') || src.includes('localhost:8000') || src.includes('127.0.0.1:8000');
}

function IncomingImage({ src, alt, priority, sizes }: { src: string; alt: string; priority: boolean; sizes: string }) {
    const [loaded, setLoaded] = useState(false);

    return (
        <Image
            unoptimized={shouldSkipOptimization(src)} fill draggable={false} priority={priority} sizes={sizes}
            src={src} alt={alt}
            onLoad={() => setLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover ${loaded ? 'gallery-image-enter' : 'opacity-0'}`}
        />
    );
}

export function GalleryImage({ src, alt, className = '', priority = false, sizes = '100vw' }: { src: string; alt: string; className?: string; priority?: boolean; sizes?: string }) {
    return (
        <div className={`relative w-full h-full overflow-hidden ${className}`}>
            <IncomingImage key={src} src={src} alt={alt} priority={priority} sizes={sizes} />
        </div>
    );
}
