import React from 'react';

const Section: React.FC<{id: string, title: string, children: React.ReactNode, className?: string}> = ({id, title, children, className=""}) => (
    <section id={id} className={`py-16 sm:py-24 ${className}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-gray-100 dark:text-white" style={{ fontFamily: "'Lilita One', sans-serif" }}>
                {title}
            </h2>
            {children}
        </div>
    </section>
);

export default Section;