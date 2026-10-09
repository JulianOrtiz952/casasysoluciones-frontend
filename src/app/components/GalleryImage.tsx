'use client';

import Image from 'next/image';
import { useState } from 'react';

function IncomingImage({ src, alt }: { src: string; alt: string }) {
    const [loaded, setLoaded] = useState(false);

    return (
        <Image
            unoptimized width={800} height={600} draggable={false}
            src={src} alt={alt}
            onLoad={() => setLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover ${loaded ? 'gallery-image-enter' : 'opacity-0'}`}
        />
    );
}

export function GalleryImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
    const [images, setImages] = useState<{ current: string; previous: string | null }>({ current: src, previous: null });
    if (images.current !== src) {
        setImages({ current: src, previous: images.current });
    }

    return (
        <div className={`relative w-full h-full overflow-hidden ${className}`}>
            {images.previous && (
                <Image
                    unoptimized width={800} height={600} draggable={false}
                    src={images.previous} alt="" aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover"
                />
            )}
            <IncomingImage key={src} src={src} alt={alt} />
        </div>
    );
}
